import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryShare } from '@/types';
import { fmtCurrency } from '@/lib/format';

interface Props {
  items: CategoryShare[];
  total: number;
}

export function CategoryDonut({ items, total }: Props) {
  if (!items.length || total === 0) {
    return (
      <div className="flex items-center justify-center h-[260px]">
        <p className="text-sm text-muted">Bu dönem için harcama kaydı yok.</p>
      </div>
    );
  }

  const data = items.map((it) => ({ name: it.name, value: it.total, color: it.color }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[260px,1fr] gap-6 items-center">
      <div className="relative h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={64}
              outerRadius={96}
              paddingAngle={1}
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                background: '#0F172A',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 12,
                padding: '6px 10px',
              }}
              formatter={(v: number) => fmtCurrency(v)}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-muted">Toplam Gider</p>
          <p className="text-lg font-semibold text-ink tabular-nums">{fmtCurrency(total)}</p>
        </div>
      </div>
      <ul className="space-y-2.5 max-h-[240px] overflow-auto pr-1">
        {items.slice(0, 8).map((it) => (
          <li key={it.categoryId ?? it.name} className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: it.color }}
            />
            <span className="text-sm text-ink truncate flex-1">{it.name}</span>
            <span className="text-xs text-muted tabular-nums">%{it.percentage.toFixed(1)}</span>
            <span className="text-sm font-medium text-ink tabular-nums w-24 text-right">
              {fmtCurrency(it.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
