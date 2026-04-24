import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { Transaction } from '@/types';
import { fmtCurrency, fmtDateShort } from '@/lib/format';

interface Props {
  tx: Transaction;
  onClick?: () => void;
}

export function TransactionRow({ tx, onClick }: Props) {
  const isIncome = tx.type === 'income';
  const color = tx.category?.color ?? (isIncome ? '#10B981' : '#64748B');

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-ink/[0.03] text-left transition"
    >
      <div
        className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center"
        style={{ background: `${color}1A`, color }}
      >
        {isIncome ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">
          {tx.description || tx.category?.name || (isIncome ? 'Gelir' : 'Gider')}
        </p>
        <p className="text-xs text-muted truncate">
          {tx.category?.name ?? 'Kategorisiz'} · {tx.account.name}
        </p>
      </div>
      <div className="text-right">
        <p
          className={
            isIncome
              ? 'text-sm font-semibold text-positive tabular-nums'
              : 'text-sm font-semibold text-ink tabular-nums'
          }
        >
          {isIncome ? '+' : '−'}
          {fmtCurrency(tx.amount).replace(/^[+-]/, '')}
        </p>
        <p className="text-xs text-muted">{fmtDateShort(tx.transactionDate)}</p>
      </div>
    </button>
  );
}
