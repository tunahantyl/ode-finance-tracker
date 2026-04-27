import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimelinePoint } from '@/types';
import { fmtCurrency, fmtDateShort } from '@/lib/format';

export function TimelineChart({ data }: { data: TimelinePoint[] }) {
  if (!data.length) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-muted">
        Bu dönem için veri yok.
      </div>
    );
  }
  return (
    <div className="h-[220px] sm:h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => fmtDateShort(v)}
            tick={{ fontSize: 11, fill: '#64748B' }}
            stroke="#E5E7EB"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748B' }}
            stroke="#E5E7EB"
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            cursor={{ stroke: '#CBD5E1', strokeDasharray: '3 3' }}
            contentStyle={{
              background: '#0F172A',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 12,
              padding: '8px 10px',
            }}
            formatter={(v: number, name) => [fmtCurrency(v), name === 'income' ? 'Gelir' : 'Gider']}
            labelFormatter={(l) => fmtDateShort(String(l))}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#incFill)"
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#EF4444"
            strokeWidth={2}
            fill="url(#expFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
