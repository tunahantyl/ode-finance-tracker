import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Pencil, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Input, Select } from '@/ui/Input';
import { SkeletonRows } from '@/ui/Skeleton';
import { EmptyState } from '@/ui/EmptyState';
import { Confirm } from '@/ui/Confirm';
import { TransactionRow } from '@/components/TransactionRow';
import { TransactionFormModal } from '@/components/TransactionFormModal';
import {
  useAccounts,
  useCategories,
  useDeleteTransaction,
  useTransactions,
} from '@/lib/queries';
import { fmtCurrency, daysAgoISO, todayISO, fmtDate } from '@/lib/format';
import type { Transaction } from '@/types';
import { extractApiError } from '@/lib/api';

export default function TransactionsPage() {
  const [filters, setFilters] = useState({
    from: daysAgoISO(29),
    to: todayISO(),
    type: '' as '' | 'income' | 'expense',
    accountId: '',
    categoryId: '',
    search: '',
  });

  const accounts = useAccounts();
  const cats = useCategories();
  const list = useTransactions({
    from: filters.from,
    to: filters.to,
    type: filters.type || undefined,
    accountId: filters.accountId || undefined,
    categoryId: filters.categoryId || undefined,
    search: filters.search || undefined,
    limit: 100,
  });
  const del = useDeleteTransaction();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [confirming, setConfirming] = useState<Transaction | null>(null);

  // Group by date
  const grouped = useMemo(() => {
    if (!list.data) return [];
    const map = new Map<string, Transaction[]>();
    for (const tx of list.data.items) {
      const k = String(tx.transactionDate).slice(0, 10);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(tx);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [list.data]);

  const totals = useMemo(() => {
    if (!list.data)
      return { income: 0, expense: 0, count: 0 };
    let income = 0;
    let expense = 0;
    for (const t of list.data.items) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, count: list.data.items.length };
  }, [list.data]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">İşlemler</h1>
          <p className="text-sm text-muted">Tüm gelir ve gider hareketleriniz.</p>
        </div>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          Yeni İşlem
        </Button>
      </header>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-2 mb-4 text-sm font-medium text-ink/80">
          <Filter className="h-4 w-4" /> Filtreler
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <Input
            label="Başlangıç"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
          <Input
            label="Bitiş"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
          <Select
            label="Tür"
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: e.target.value as typeof filters.type }))
            }
          >
            <option value="">Tümü</option>
            <option value="income">Gelir</option>
            <option value="expense">Gider</option>
          </Select>
          <Select
            label="Hesap"
            value={filters.accountId}
            onChange={(e) => setFilters((f) => ({ ...f, accountId: e.target.value }))}
          >
            <option value="">Tümü</option>
            {accounts.data?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select
            label="Kategori"
            value={filters.categoryId}
            onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">Tümü</option>
            {cats.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink/80">Açıklama Ara</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Ara..."
                className="input-base pl-8"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        <SmallStat label="Gelir" value={fmtCurrency(totals.income)} className="text-positive" />
        <SmallStat label="Gider" value={fmtCurrency(totals.expense)} className="text-negative" />
        <SmallStat label="Net" value={fmtCurrency(totals.income - totals.expense)} />
      </div>

      {/* List */}
      <Card>
        {list.isLoading ? (
          <SkeletonRows rows={8} />
        ) : grouped.length === 0 ? (
          <EmptyState
            title="Sonuç bulunamadı"
            description="Filtrelerinizi değiştirin veya yeni bir işlem ekleyin."
          />
        ) : (
          <ul className="space-y-5">
            {grouped.map(([date, items]) => (
              <li key={date}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">
                  {fmtDate(date)}
                </p>
                <ul className="space-y-1">
                  {items.map((tx) => (
                    <li key={tx.id} className="group flex items-center gap-1">
                      <div className="flex-1">
                        <TransactionRow
                          tx={tx}
                          onClick={() => {
                            setEditing(tx);
                            setOpenForm(true);
                          }}
                        />
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition pr-1">
                        <button
                          className="p-2 rounded-md text-muted hover:text-ink hover:bg-ink/[0.04]"
                          onClick={() => {
                            setEditing(tx);
                            setOpenForm(true);
                          }}
                          aria-label="Düzenle"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-2 rounded-md text-muted hover:text-negative hover:bg-negative/5"
                          onClick={() => setConfirming(tx)}
                          aria-label="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <TransactionFormModal
        open={openForm}
        initial={editing}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
      />

      <Confirm
        open={!!confirming}
        title="İşlem silinsin mi?"
        message="Bu işlem kalıcı olarak silinecek ve hesabın bakiyesi otomatik güncellenecek."
        loading={del.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={async () => {
          if (!confirming) return;
          try {
            await del.mutateAsync(confirming.id);
            toast.success('İşlem silindi.');
            setConfirming(null);
          } catch (e) {
            toast.error(extractApiError(e).message);
          }
        }}
      />
    </div>
  );
}

function SmallStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-2 text-lg font-semibold tabular-nums ${className ?? 'text-ink'}`}>{value}</p>
    </div>
  );
}
