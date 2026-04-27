import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Input, Select } from '@/ui/Input';
import { Modal } from '@/ui/Modal';
import { Confirm } from '@/ui/Confirm';
import { SkeletonRows } from '@/ui/Skeleton';
import { EmptyState } from '@/ui/EmptyState';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/lib/queries';
import type { Category, EntryType } from '@/types';
import { extractApiError } from '@/lib/api';

const COLORS = [
  '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#6366F1', '#F97316', '#64748B',
  '#22C55E', '#06B6D4', '#84CC16', '#A855F7', '#0EA5E9',
];

const schema = z.object({
  name: z.string().min(1, 'Ad gerekli.').max(60),
  type: z.enum(['income', 'expense']),
  color: z.string(),
});
type FormData = z.infer<typeof schema>;

export default function CategoriesPage() {
  const [type, setType] = useState<EntryType>('expense');
  const cats = useCategories(type);
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const del = useDeleteCategory();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirming, setConfirming] = useState<Category | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink">Kategoriler</h1>
          <p className="text-sm text-muted">
            Gelir ve giderlerinizi düzenli tutmak için kategorileri yönetin.
          </p>
        </div>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="w-full sm:w-auto justify-center"
        >
          Yeni Kategori
        </Button>
      </header>

      <div className="inline-flex p-1 rounded-lg bg-ink/[0.04]">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={
              'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
              (type === t ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink')
            }
          >
            {t === 'expense' ? 'Gider' : 'Gelir'}
          </button>
        ))}
      </div>

      <Card>
        {cats.isLoading ? (
          <SkeletonRows rows={6} />
        ) : cats.data?.length ? (
          <ul className="divide-y divide-line">
            {cats.data.map((c) => (
              <li
                key={c.id}
                className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ background: c.color }}
                >
                  <Tag className="h-3.5 w-3.5" />
                </div>
                <p className="flex-1 min-w-0 text-sm font-medium text-ink truncate">{c.name}</p>
                <div className="flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition shrink-0">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setOpen(true);
                    }}
                    className="p-2 rounded-md text-muted hover:bg-ink/[0.04] hover:text-ink"
                    aria-label="Düzenle"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirming(c)}
                    className="p-2 rounded-md text-muted hover:bg-negative/10 hover:text-negative"
                    aria-label="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Kategori yok"
            description="Yeni bir kategori ekleyin."
            action={<Button onClick={() => setOpen(true)}>Yeni Kategori</Button>}
          />
        )}
      </Card>

      <CategoryFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        editing={editing}
        defaultType={type}
        onSubmit={async (data) => {
          try {
            if (editing) {
              await update.mutateAsync({ id: editing.id, ...data });
              toast.success('Kategori güncellendi.');
            } else {
              await create.mutateAsync(data);
              toast.success('Kategori eklendi.');
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
        title="Kategori silinsin mi?"
        message="Bu kategoriye bağlı işlemlerin kategorisi 'Kategorisiz' olarak güncellenecek."
        loading={del.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={async () => {
          if (!confirming) return;
          try {
            await del.mutateAsync(confirming.id);
            toast.success('Kategori silindi.');
            setConfirming(null);
          } catch (e) {
            toast.error(extractApiError(e).message);
          }
        }}
      />
    </div>
  );
}

function CategoryFormModal({
  open,
  onClose,
  editing,
  defaultType,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  editing: Category | null;
  defaultType: EntryType;
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
    defaultValues: { name: '', type: defaultType, color: '#64748B' },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: editing?.name ?? '',
      type: editing?.type ?? defaultType,
      color: editing?.color ?? '#64748B',
    });
  }, [open, editing, defaultType, reset]);

  const color = watch('color');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button form="cat-form" type="submit" loading={isSubmitting}>
            {editing ? 'Güncelle' : 'Kaydet'}
          </Button>
        </>
      }
    >
      <form id="cat-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Kategori Adı"
          placeholder="Örn. Market"
          {...register('name')}
          error={errors.name?.message}
        />
        <Select label="Tür" {...register('type')}>
          <option value="expense">Gider</option>
          <option value="income">Gelir</option>
        </Select>
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
