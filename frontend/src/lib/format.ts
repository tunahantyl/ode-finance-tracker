export const fmtCurrency = (
  v: number,
  currency = 'TRY',
  opts: Intl.NumberFormatOptions = {}
) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    ...opts,
  }).format(Number.isFinite(v) ? v : 0);

export const fmtNumber = (v: number) =>
  new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v);

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));

export const fmtDateShort = (iso: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(iso));

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
