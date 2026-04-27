import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet } from 'lucide-react';
import { Card, CardHeader } from '@/ui/Card';
import { StatCard } from '@/components/StatCard';
import { CategoryDonut } from '@/components/CategoryDonut';
import { TimelineChart } from '@/components/TimelineChart';
import { TransactionRow } from '@/components/TransactionRow';
import { TransactionFormModal } from '@/components/TransactionFormModal';
import { Button } from '@/ui/Button';
import { SkeletonRows, SkeletonStat, Skeleton } from '@/ui/Skeleton';
import { EmptyState } from '@/ui/EmptyState';
import {
  useByCategory,
  useRecentTransactions,
  useSummary,
  useTimeline,
} from '@/lib/queries';
import { useAuth } from '@/context/AuthContext';
import { fmtCurrency, daysAgoISO, todayISO } from '@/lib/format';

const RANGES = [
  { id: '7', label: '7 Gün', days: 6 },
  { id: '30', label: '30 Gün', days: 29 },
  { id: '90', label: '90 Gün', days: 89 },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const [rangeId, setRangeId] = useState<(typeof RANGES)[number]['id']>('30');
  const [openForm, setOpenForm] = useState(false);

  const range = useMemo(() => {
    const r = RANGES.find((x) => x.id === rangeId)!;
    return { from: daysAgoISO(r.days), to: todayISO() };
  }, [rangeId]);

  const summary = useSummary(range);
  const byCat = useByCategory({ ...range, type: 'expense' });
  const timeline = useTimeline({ ...range, granularity: rangeId === '90' ? 'day' : 'day' });
  const recent = useRecentTransactions(8);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return 'İyi geceler';
    if (h < 12) return 'Günaydın';
    if (h < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{greeting},</p>
          <h1 className="mt-0.5 text-xl sm:text-2xl font-semibold text-ink">
            {user?.fullName?.split(' ')[0] ?? 'Hoş geldiniz'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-lg bg-ink/[0.04]">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRangeId(r.id)}
                className={
                  'rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-medium transition ' +
                  (rangeId === r.id
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-muted hover:text-ink')
                }
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setOpenForm(true)}
            className="ml-auto sm:ml-0"
          >
            Yeni İşlem
          </Button>
        </div>
      </header>

      {/* Stats */}
      {summary.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
      ) : summary.data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Toplam Bakiye"
            value={fmtCurrency(summary.data.totalBalance)}
            hint={`${summary.data.activeAccounts} aktif hesap`}
            icon={<Wallet className="h-4 w-4" />}
          />
          <StatCard
            label="Gelir"
            value={fmtCurrency(summary.data.income)}
            hint={`Son ${RANGES.find((r) => r.id === rangeId)?.label}`}
            trend="up"
            icon={<ArrowDownLeft className="h-4 w-4 text-positive" />}
            accent="#10B981"
          />
          <StatCard
            label="Gider"
            value={fmtCurrency(summary.data.expense)}
            hint={`${summary.data.transactionCount} işlem`}
            trend="down"
            icon={<ArrowUpRight className="h-4 w-4 text-negative" />}
            accent="#EF4444"
          />
          <StatCard
            label="Net"
            value={fmtCurrency(summary.data.net)}
            hint={summary.data.net >= 0 ? 'Pozitif denge' : 'Negatif denge'}
            trend={summary.data.net >= 0 ? 'up' : 'down'}
          />
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Gelir & Gider Akışı" subtitle="Seçili tarih aralığındaki günlük dağılım" />
          {timeline.isLoading ? <Skeleton className="h-[260px]" /> : <TimelineChart data={timeline.data?.items ?? []} />}
        </Card>

        <Card>
          <CardHeader title="Harcama Dağılımı" subtitle="Kategoriye göre" />
          {byCat.isLoading ? (
            <SkeletonRows rows={6} />
          ) : (
            <CategoryDonut items={byCat.data?.items ?? []} total={byCat.data?.grandTotal ?? 0} />
          )}
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader
          title="Son İşlemler"
          subtitle="En son kaydedilen işlemler"
          action={
            <Link to="/transactions" className="text-sm font-medium text-ink hover:underline">
              Tümünü gör →
            </Link>
          }
        />
        {recent.isLoading ? (
          <SkeletonRows rows={6} />
        ) : recent.data?.length ? (
          <ul className="space-y-1">
            {recent.data.map((tx) => (
              <li key={tx.id}>
                <TransactionRow tx={tx} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Henüz işlem yok"
            description="İlk gelir veya gider girişinizi yapın."
            action={<Button onClick={() => setOpenForm(true)}>Yeni İşlem</Button>}
          />
        )}
      </Card>

      <TransactionFormModal open={openForm} onClose={() => setOpenForm(false)} />
    </div>
  );
}
