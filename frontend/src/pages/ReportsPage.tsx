import { useMemo, useState } from 'react';
import { Card, CardHeader } from '@/ui/Card';
import { CategoryDonut } from '@/components/CategoryDonut';
import { TimelineChart } from '@/components/TimelineChart';
import { Skeleton, SkeletonRows } from '@/ui/Skeleton';
import { useByCategory, useTimeline } from '@/lib/queries';
import { Input } from '@/ui/Input';
import { daysAgoISO, todayISO } from '@/lib/format';
import type { EntryType } from '@/types';

export default function ReportsPage() {
  const [from, setFrom] = useState(daysAgoISO(89));
  const [to, setTo] = useState(todayISO());
  const [type, setType] = useState<EntryType>('expense');
  const [granularity, setGranularity] = useState<'day' | 'month'>('day');

  const range = useMemo(() => ({ from, to }), [from, to]);
  const cat = useByCategory({ ...range, type });
  const tl = useTimeline({ ...range, granularity });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl sm:text-2xl font-semibold text-ink">Raporlar</h1>
        <p className="text-sm text-muted">Tarih aralığına göre detaylı analiz.</p>
      </header>

      <Card>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            label="Başlangıç"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input label="Bitiş" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink/80">Tür (Kategori Dağılımı)</label>
            <div className="inline-flex p-1 rounded-lg bg-ink/[0.04] w-full">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={
                    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                    (type === t ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink')
                  }
                >
                  {t === 'expense' ? 'Gider' : 'Gelir'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink/80">Granülerlik (Akış)</label>
            <div className="inline-flex p-1 rounded-lg bg-ink/[0.04] w-full">
              {(['day', 'month'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={
                    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                    (granularity === g ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink')
                  }
                >
                  {g === 'day' ? 'Günlük' : 'Aylık'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Gelir & Gider Akışı" subtitle={`${from} → ${to}`} />
        {tl.isLoading ? <Skeleton className="h-[260px]" /> : <TimelineChart data={tl.data?.items ?? []} />}
      </Card>

      <Card>
        <CardHeader
          title={type === 'expense' ? 'Harcama Dağılımı' : 'Gelir Dağılımı'}
          subtitle="Kategoriye göre"
        />
        {cat.isLoading ? (
          <SkeletonRows rows={6} />
        ) : (
          <CategoryDonut items={cat.data?.items ?? []} total={cat.data?.grandTotal ?? 0} />
        )}
      </Card>
    </div>
  );
}
