/**
 * Funciones estadísticas puras (sin dependencias).
 * Convención para intervalos: lo = -Infinity o hi = Infinity indican colas abiertas,
 * p. ej. P(X ≤ k) = range(-Infinity, k) y P(X ≥ k) = range(k, Infinity).
 */
import { Alternative } from './models';

const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** ln Γ(x) — aproximación de Lanczos. */
export function lgamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = 0.99999999999980993;
  const t = x + 7.5;
  for (let i = 0; i < 8; i++) a += LANCZOS[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Vector completo P(X = k), k = 0..n, para X ~ Bin(n, p). */
export function binomPmf(n: number, p: number): number[] {
  const out = new Array<number>(n + 1).fill(0);
  if (p <= 0) { out[0] = 1; return out; }
  if (p >= 1) { out[n] = 1; return out; }
  const c = lgamma(n + 1);
  const lp = Math.log(p);
  const lq = Math.log1p(-p);
  for (let k = 0; k <= n; k++) {
    out[k] = Math.exp(c - lgamma(k + 1) - lgamma(n - k + 1) + k * lp + (n - k) * lq);
  }
  return out;
}

/** P(lo ≤ X ≤ hi) exacta. Se puede pasar la fmp ya calculada para no repetirla. */
export function binomRange(n: number, p: number, lo: number, hi: number, pmf = binomPmf(n, p)): number {
  const a = Math.max(0, Math.ceil(lo));
  const b = Math.min(n, Math.floor(hi));
  let s = 0;
  for (let k = a; k <= b; k++) s += pmf[k];
  return Math.min(1, s);
}

/** erfc con error relativo < 1.2e-7 en todo el dominio (Numerical Recipes). */
export function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
    t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}

export const normCdf = (x: number, mu = 0, sd = 1): number => 0.5 * erfc(-(x - mu) / (sd * Math.SQRT2));

export const normPdf = (x: number, mu = 0, sd = 1): number =>
  Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));

/** Cuantil de la normal estándar (algoritmo de Acklam). */
export function normInv(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) return -normInv(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** P(lo ≤ X ≤ hi) aproximada con N(np, np(1−p)), con o sin corrección por continuidad. */
export function normalApproxRange(n: number, p: number, lo: number, hi: number, continuity = true): number {
  const mu = n * p;
  const sd = Math.sqrt(n * p * (1 - p));
  if (sd === 0) return mu >= lo && mu <= hi ? 1 : 0;
  const h = continuity ? 0.5 : 0;
  const up = hi === Infinity ? 1 : normCdf(hi + h, mu, sd);
  const dn = lo === -Infinity ? 0 : normCdf(lo - h, mu, sd);
  return Math.max(0, up - dn);
}

/** Valor p de un estadístico z según la hipótesis alternativa. */
export function zPValue(z: number, alt: Alternative): number {
  if (alt === 'gt') return 1 - normCdf(z);
  if (alt === 'lt') return normCdf(z);
  return 2 * (1 - normCdf(Math.abs(z)));
}

/** Valor crítico positivo de z para α y la alternativa dada. */
export const zCritical = (alpha: number, alt: Alternative): number =>
  normInv(1 - (alt === 'ne' ? alpha / 2 : alpha));

/** ¿n·p ≥ 5 y n·(1−p) ≥ 5? */
export const normalConditionsHold = (n: number, p: number): boolean => n * p >= 5 && n * (1 - p) >= 5;
