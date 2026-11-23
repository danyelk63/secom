import { Chart } from 'chart.js/auto';

/** Colores del póster, iguales a los tokens de styles.scss. */
export const COLORS = {
  cyan: '#4fd8ff',
  blue: '#3d8bff',
  lavender: '#8f9bff',
  pass: '#4fd8ff',
  fail: '#ff7a90',
  warn: '#ffc857',
  muted: '#9fb3d9',
  grid: 'rgba(79, 140, 255, 0.15)',
} as const;

/** Agrega transparencia a un color hex (#rrggbb). */
export const withAlpha = (hex: string, alpha: number): string =>
  hex + Math.round(alpha * 255).toString(16).padStart(2, '0');

let applied = false;

/** Estilo global de Chart.js; se aplica una sola vez. */
export function applyChartTheme(): void {
  if (applied) return;
  applied = true;
  Chart.defaults.color = COLORS.muted;
  Chart.defaults.borderColor = COLORS.grid;
  Chart.defaults.font.family = "'Space Mono', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  if (Chart.defaults.animation) Chart.defaults.animation.duration = 250;
}
