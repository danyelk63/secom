const LOCALE = 'es-CO';

/** Número con `digits` decimales en formato colombiano (coma decimal). */
export const fmtNum = (x: number | null | undefined, digits = 4): string =>
  x === null || x === undefined || !Number.isFinite(x)
    ? '—'
    : x.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Probabilidad: notación científica si es muy pequeña. */
export function fmtProb(x: number): string {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  if (Math.abs(x) < 1e-4) return x.toExponential(2).replace('.', ',');
  return fmtNum(x, 4);
}

export const fmtPct = (x: number, digits = 2): string => `${fmtNum(x * 100, digits)} %`;

export const fmtDate = (d: Date): string =>
  d.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });

export const fmtShortDate = (d: Date): string => d.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' });

/** Valor de sensor: escala variable, así que se adapta la notación. */
export function fmtSensor(v: number | null): string {
  if (v === null) return '—';
  if (v !== 0 && (Math.abs(v) >= 1e5 || Math.abs(v) < 1e-3)) return v.toExponential(2);
  return fmtNum(v, Math.abs(v) >= 100 ? 1 : 3);
}
