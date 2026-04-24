import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Input, Select, Textarea } from '@/ui/Input';
import { useAccounts, useCategories, useCreateTransaction, useUpdateTransaction } from '@/lib/queries';
import { todayISO } from '@/lib/format';
import { extractApiError } from '@/lib/api';
import type { Transaction } from '@/types';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Tutar 0\'dan büyük olmalı.'),
  accountId: z.string().min(1, 'Hesap seçin.'),
  categoryId: z.string().nullable().optional(),
  transactionDate: z.string().min(1, 'Tarih girin.'),
  description: z.string().max(200).optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Transaction | null;
}

export function TransactionFormModal({ open, onClose, initial }: Props) {
  const isEdit = !!initial;
  const accounts = useAccounts();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      amount: undefined as unknown as number,
      accountId: '',
      categoryId: '',
      transactionDate: todayISO(),
      description: '',
    },
  });

  const type = watch('type');
  const cats = useCategories(type);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        type: initial.type,
        amount: initial.amount,
        accountId: initial.accountId,
        categoryId: initial.categoryId ?? '',
        transactionDate: initial.transactionDate.slice(0, 10),
        description: initial.description ?? '',
      });
    } else {
      reset({
        type: 'expense',
        amount: undefined as unknown as number,
        accountId: accounts.data?.[0]?.id ?? '',
        categoryId: '',
        transactionDate: todayISO(),
        description: '',
      });
    }
  }, [open, initial, accounts.data, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        categoryId: data.categoryId || null,
        description: data.description || null,
      };
      if (isEdit && initial) {
        await update.mutateAsync({ id: initial.id, ...payload });
        toast.success('İşlem güncellendi.');
      } else {
        await create.mutateAsync(payload);
        toast.success('İşlem eklendi.');
      }
      onClose();
    } catch (e) {
      toast.error(extractApiError(e).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'İşlemi Düzenle' : 'Yeni İşlem'}
      description={isEdit ? undefined : 'Gelir veya gider girişinizi kaydedin.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button form="tx-form" type="submit" loading={isSubmitting}>
            {isEdit ? 'Güncelle' : 'Kaydet'}
          </Button>
        </>
      }
    >
      <form id="tx-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-ink/[0.04]">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValue('type', t, { shouldValidate: true })}
              className={
                'rounded-md py-2 text-sm font-medium transition ' +
                (type === t ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink')
              }
            >
              {t === 'expense' ? 'Gider' : 'Gelir'}
            </button>
          ))}
        </div>

        <Input
          label="Tutar"
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0,00"
          {...register('amount')}
          error={errors.amount?.message}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Hesap" {...register('accountId')} error={errors.accountId?.message}>
            <option value="">Seçiniz</option>
            {accounts.data?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select label="Kategori" {...register('categoryId')} error={errors.categoryId?.message}>
            <option value="">Kategorisiz</option>
            {cats.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Tarih"
          type="date"
          {...register('transactionDate')}
          error={errors.transactionDate?.message}
        />

        <Textarea label="Açıklama (opsiyonel)" rows={2} {...register('description')} />
      </form>
    </Modal>
  );
}
