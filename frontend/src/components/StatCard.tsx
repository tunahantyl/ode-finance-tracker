import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: 'up' | 'down' | 'flat';
  icon?: ReactNode;
  accent?: string;
}

export function StatCard({ label, value, hint, trend, icon, accent }: Props) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted truncate">{label}</p>
        {icon && (
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-ink/70 shrink-0"
            style={{ background: accent ? `${accent}14` : '#0F172A0F' }}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="mt-2 sm:mt-3 text-xl sm:text-2xl font-semibold text-ink leading-tight tabular-nums break-words">
        {value}
      </p>
      {hint && (
        <p
          className={cn(
            'mt-1 text-xs truncate',
            trend === 'up' && 'text-positive',
            trend === 'down' && 'text-negative',
            !trend && 'text-muted'
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
