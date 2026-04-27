import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryShare } from '@/types';
import { fmtCurrency } from '@/lib/format';

interface Props {
  items: CategoryShare[];
  total: number;
}

interface DonutTooltipPayload {
  name?: string;
  value?: number;
  payload?: { name?: string; value?: number; color?: string };
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: DonutTooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = item.name ?? item.payload?.name ?? '';
  const value = (item.value ?? item.payload?.value ?? 0) as number;
  const color = item.payload?.color ?? '#0F172A';
  return (
    <div className="rounded-lg bg-ink text-white px-3 py-2 text-xs shadow-lg pointer-events-none">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ background: color }}
        />
        <span className="font-medium">{name}</span>
      </div>
      <div className="mt-0.5 tabular-nums opacity-90">{fmtCurrency(value)}</div>
    </div>
  );
}

export function CategoryDonut({ items, total }: Props) {
  if (!items.length || total === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] sm:h-[260px]">
        <p className="text-sm text-muted">Bu dönem için harcama kaydı yok.</p>
      </div>
    );
  }

  const data = items.map((it) => ({ name: it.name, value: it.total, color: it.color }));

  return (
    <div className="donut-host">
      <div className="donut-grid">
        <div className="donut-canvas relative h-[220px] sm:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={1}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                cursor={{ fill: 'transparent' }}
                wrapperStyle={{ outline: 'none', zIndex: 50 }}
                content={<DonutTooltip />}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-muted">Toplam Gider</p>
            <p className="text-base sm:text-lg font-semibold text-ink tabular-nums">
              {fmtCurrency(total)}
            </p>
          </div>
        </div>

        <ul className="donut-legend space-y-2 pr-1">
          {items.slice(0, 8).map((it) => (
            <li
              key={it.categoryId ?? it.name}
              className="flex items-center gap-2.5 text-sm"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: it.color }}
              />
              <span className="text-ink truncate flex-1 min-w-0">{it.name}</span>
              <span className="text-[11px] text-muted tabular-nums shrink-0 tracking-tight">
                %{it.percentage.toFixed(1)}
              </span>
              <span className="font-medium text-ink tabular-nums shrink-0 text-right">
                {fmtCurrency(it.total)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
