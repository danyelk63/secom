import { Alternative } from '../../core/models';
import { normPdf } from '../../core/stats';
import { COLORS, withAlpha } from '../../core/theme';
import { ChartConfig } from './chart.component';

/** Curva N(0,1) con la región de rechazo sombreada y una línea en el z observado. */
export function zTestChart(z: number, zc: number, alt: Alternative): ChartConfig {
  const lim = Math.max(4, Math.abs(z) + 0.8);
  const rejects = (x: number) => (alt === 'gt' ? x >= zc : alt === 'lt' ? x <= -zc : Math.abs(x) >= zc);
  const curve: { x: number; y: number }[] = [];
  const region: { x: number; y: number | null }[] = [];
  for (let i = 0; i <= 400; i++) {
    const x = -lim + (2 * lim * i) / 400;
    const y = normPdf(x);
    curve.push({ x, y });
    region.push({ x, y: rejects(x) ? y : null });
  }
  return {
    type: 'line',
    data: {
      datasets: [
        { label: 'Región de rechazo', data: region, borderWidth: 0, pointRadius: 0, fill: 'origin', backgroundColor: withAlpha(COLORS.fail, 0.45) },
        { label: 'N(0, 1)', data: curve, borderColor: COLORS.cyan, borderWidth: 2, pointRadius: 0 },
        { label: 'z observado', data: [{ x: z, y: 0 }, { x: z, y: 0.42 }], borderColor: COLORS.warn, borderWidth: 2.5, pointRadius: 0 },
      ],
    },
    options: {
      parsing: false,
      scales: {
        x: { type: 'linear', min: -lim, max: lim, title: { display: true, text: 'z' } },
        y: { beginAtZero: true, display: false },
      },
      plugins: { tooltip: { enabled: false } },
    },
  };
}
