import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Wallet, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardHeader } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Input, Select } from '@/ui/Input';
import { Modal } from '@/ui/Modal';
import { Confirm } from '@/ui/Confirm';
import { SkeletonRows } from '@/ui/Skeleton';
import { EmptyState } from '@/ui/EmptyState';
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useRecalculateAccount,
  useUpdateAccount,
} from '@/lib/queries';
import { fmtCurrency } from '@/lib/format';
import type { Account, AccountType } from '@/types';
import { extractApiError } from '@/lib/api';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'cash', label: 'Nakit' },
  { value: 'bank', label: 'Banka Hesabı' },
  { value: 'card', label: 'Kredi Kartı' },
  { value: 'savings', label: 'Birikim' },
  { value: 'other', label: 'Diğer' },
];

const COLORS = ['#0F172A', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

const schema = z.object({
  name: z.string().min(1, 'Ad gerekli.').max(80),
  type: z.enum(['cash', 'bank', 'card', 'savings', 'other']),
  initialBalance: z.coerce.number().finite(),
  color: z.string(),
});
type FormData = z.infer<typeof schema>;

export default function AccountsPage() {
  const accounts = useAccounts();
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const del = useDeleteAccount();
  const recalc = useRecalculateAccount();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [confirming, setConfirming] = useState<Account | null>(null);

  const total = accounts.data?.reduce((s, a) => s + (a.isArchived ? 0 : a.currentBalance), 0) ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Hesaplar</h1>
          <p className="text-sm text-muted">Nakit, banka ve kart hesaplarınızı yönetin.</p>
        </div>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Yeni Hesap
        </Button>
      </header>

      <Card>
        <CardHeader title="Toplam Bakiye" subtitle="Tüm aktif hesaplar" />
        <p className="text-3xl font-semibold text-ink tabular-nums">{fmtCurrency(total)}</p>
      </Card>

      {accounts.isLoading ? (
        <SkeletonRows rows={4} />
      ) : accounts.data?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.data.map((a) => (
            <div key={a.id} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ background: a.color }}
                  >
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{a.name}</p>
                    <p className="text-xs text-muted">
                      {ACCOUNT_TYPES.find((t) => t.value === a.type)?.label}
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <button
                    title="Yeniden hesapla"
                    onClick={async () => {
                      try {
                        await recalc.mutateAsync(a.id);
                        toast.success('Bakiye yeniden hesaplandı.');
                      } catch (e) {
                        toast.error(extractApiError(e).message);
                      }
                    }}
                    className="p-1.5 rounded-md text-muted hover:bg-ink/[0.04] hover:text-ink"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    title="Düzenle"
                    onClick={() => {
                      setEditing(a);
                      setOpen(true);
                    }}
                    className="p-1.5 rounded-md text-muted hover:bg-ink/[0.04] hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    title="Sil"
                    onClick={() => setConfirming(a)}
                    className="p-1.5 rounded-md text-muted hover:bg-negative/10 hover:text-negative"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-line">
                <p className="text-xs text-muted">Mevcut Bakiye</p>
                <p
                  className={
                    'text-xl font-semibold tabular-nums ' +
                    (a.currentBalance < 0 ? 'text-negative' : 'text-ink')
                  }
                >
                  {fmtCurrency(a.currentBalance, a.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="Hesap yok"
            description="İlk hesabınızı ekleyerek başlayın."
            action={<Button onClick={() => setOpen(true)}>Yeni Hesap</Button>}
          />
        </Card>
      )}

      <AccountFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSubmit={async (data) => {
          try {
            if (editing) {
              await update.mutateAsync({
                id: editing.id,
                name: data.name,
                type: data.type,
                color: data.color,
              });
              toast.success('Hesap güncellendi.');
            } else {
              await create.mutateAsync(data);
              toast.success('Hesap eklendi.');
            }
            setOpen(false);
            setEditing(null);
          } catch (e) {
            toast.error(extractApiError(e).message);
          }
        }}
      />

      <Confirm
        open={!!confirming}
        title="Hesap silinsin mi?"
        message="Bu hesaba bağlı işlemler varsa silme işlemi reddedilecektir."
        loading={del.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={async () => {
          if (!confirming) return;
          try {
            await del.mutateAsync(confirming.id);
            toast.success('Hesap silindi.');
            setConfirming(null);
          } catch (e) {
            toast.error(extractApiError(e).message);
          }
        }}
      />
    </div>
  );
}

function AccountFormModal({
  open,
  onClose,
  editing,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  editing: Account | null;
  onSubmit: (data: FormData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: 'cash',
      initialBalance: 0,
      color: '#0F172A',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: editing?.name ?? '',
      type: editing?.type ?? 'cash',
      initialBalance: editing?.initialBalance ?? 0,
      color: editing?.color ?? '#0F172A',
    });
  }, [open, editing, reset]);

  const color = watch('color');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Hesabı Düzenle' : 'Yeni Hesap'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button form="acc-form" type="submit" loading={isSubmitting}>
            {editing ? 'Güncelle' : 'Kaydet'}
          </Button>
        </>
      }
    >
      <form id="acc-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Hesap Adı"
          placeholder="Örn. Ziraat Vadesiz"
          {...register('name')}
          error={errors.name?.message}
        />
        <Select label="Hesap Türü" {...register('type')}>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        {!editing && (
          <Input
            label="Açılış Bakiyesi"
            type="number"
            step="0.01"
            {...register('initialBalance')}
            error={errors.initialBalance?.message}
            hint="Hesabın mevcut bakiyesi (sonradan değişmeyecek başlangıç değeri)."
          />
        )}
        <div>
          <label className="block text-sm font-medium text-ink/80 mb-1.5">Renk</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValue('color', c, { shouldValidate: true })}
                className={
                  'h-7 w-7 rounded-full transition ' +
                  (color === c ? 'ring-2 ring-offset-2 ring-ink/30' : '')
                }
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
