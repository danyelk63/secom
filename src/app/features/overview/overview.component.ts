import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { fmtDate, fmtPct, fmtShortDate } from '../../core/format';
import { SecomData } from '../../core/models';
import { COLORS, withAlpha } from '../../core/theme';
import { ChartComponent, ChartConfig } from '../../shared/chart/chart.component';

interface Week { start: Date; total: number; failures: number; }

@Component({
  selector: 'app-overview',
  imports: [ChartComponent],
  templateUrl: './overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewComponent {
  readonly data = input.required<SecomData>();

  readonly kpis = computed(() => {
    const d = this.data();
    return [
      { label: 'Unidades', value: d.total.toLocaleString('es-CO') },
      { label: 'Fallos', value: String(d.failures) },
      { label: 'Tasa de fallos p̂', value: fmtPct(d.pHat) },
      { label: 'Sensores', value: String(d.nFeatures) },
      { label: 'Periodo', value: `${fmtDate(d.units[0].date)} – ${fmtDate(d.units[d.total - 1].date)}`, small: true },
    ];
  });

  private readonly weeks = computed<Week[]>(() => {
    const map = new Map<number, Week>();
    for (const u of this.data().units) {
      const start = new Date(u.date);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // lunes
      const key = start.getTime();
      const w = map.get(key) ?? { start, total: 0, failures: 0 };
      w.total++;
      w.failures += u.fail;
      map.set(key, w);
    }
    return [...map.values()];
  });

  readonly weeklyChart = computed<ChartConfig>(() => {
    const wk = this.weeks();
    return {
      type: 'bar',
      data: {
        labels: wk.map(w => fmtShortDate(w.start)),
        datasets: [
          { type: 'bar', label: 'Pasan', data: wk.map(w => w.total - w.failures), backgroundColor: withAlpha(COLORS.blue, 0.7), stack: 'u', yAxisID: 'y' },
          { type: 'bar', label: 'Fallan', data: wk.map(w => w.failures), backgroundColor: COLORS.fail, stack: 'u', yAxisID: 'y' },
          { type: 'line', label: 'Tasa de fallos (%)', data: wk.map(w => +((100 * w.failures) / w.total).toFixed(2)), borderColor: COLORS.cyan, backgroundColor: COLORS.cyan, tension: 0.3, pointRadius: 3, yAxisID: 'y2' },
        ],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { stacked: true },
          y: { stacked: true, title: { display: true, text: 'unidades' } },
          y2: { position: 'right', min: 0, grid: { display: false }, title: { display: true, text: '% fallos' } },
        },
      },
    };
  });
}
