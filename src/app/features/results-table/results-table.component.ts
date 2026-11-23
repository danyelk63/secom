import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fmtNum, fmtPct, fmtProb } from '../../core/format';
import { SecomData } from '../../core/models';
import { binomRange, normalApproxRange, normalConditionsHold } from '../../core/stats';
import { COLORS } from '../../core/theme';
import { ChartComponent, ChartConfig } from '../../shared/chart/chart.component';

interface Row {
  n: number;
  /** Primer valor que supera la meta: X > meta·n ⇔ X ≥ threshold */
  threshold: number;
  exact: number;
  withCC: number;
  withoutCC: number;
}

@Component({
  selector: 'app-results-table',
  imports: [FormsModule, ChartComponent],
  templateUrl: './results-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsTableComponent {
  readonly data = input.required<SecomData>();

  readonly sizesText = signal('20, 50, 75, 100, 200, 500');
  /** Meta de fallos en porcentaje. */
  readonly goalPct = signal(5);

  protected readonly fmtNum = fmtNum;
  protected readonly fmtProb = fmtProb;
  protected readonly fmtPct = fmtPct;

  private readonly goal = computed(() => Math.min(0.5, Math.max(0.001, (this.goalPct() || 5) / 100)));

  private row(n: number): Row {
    const p = this.data().pHat;
    const threshold = Math.floor(this.goal() * n) + 1;
    return {
      n,
      threshold,
      exact: binomRange(n, p, threshold, n),
      withCC: normalApproxRange(n, p, threshold, Infinity, true),
      withoutCC: normalApproxRange(n, p, threshold, Infinity, false),
    };
  }

  readonly rows = computed(() => {
    const p = this.data().pHat;
    return this.sizesText()
      .split(/[,;\s]+/)
      .map(Number)
      .filter(v => Number.isInteger(v) && v > 0 && v <= 5000)
      .map(n => {
        const r = this.row(n);
        const error = Math.abs(r.exact - r.withCC);
        return { ...r, np: n * p, nq: n * (1 - p), ok: normalConditionsHold(n, p), error, relError: r.exact > 0 ? error / r.exact : NaN };
      });
  });

  readonly errorChart = computed<ChartConfig>(() => {
    const withCC: { x: number; y: number }[] = [];
    const withoutCC: { x: number; y: number }[] = [];
    let yMax = 0;
    for (let n = 5; n <= 400; n++) {
      const r = this.row(n);
      const a = Math.abs(r.exact - r.withCC);
      const b = Math.abs(r.exact - r.withoutCC);
      withCC.push({ x: n, y: a });
      withoutCC.push({ x: n, y: b });
      yMax = Math.max(yMax, a, b);
    }
    const nMin = 5 / this.data().pHat;
    return {
      type: 'line',
      data: {
        datasets: [
          { label: 'Error con corrección', data: withCC, borderColor: COLORS.cyan, pointRadius: 0, borderWidth: 2 },
          { label: 'Error sin corrección', data: withoutCC, borderColor: COLORS.fail, pointRadius: 0, borderWidth: 1.5, borderDash: [5, 4] },
          { label: `np = 5 (n ≈ ${Math.ceil(nMin)})`, data: [{ x: nMin, y: 0 }, { x: nMin, y: yMax }], borderColor: COLORS.warn, pointRadius: 0, borderWidth: 1.5, borderDash: [2, 3] },
        ],
      },
      options: {
        parsing: false,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
          x: { type: 'linear', title: { display: true, text: 'tamaño del lote n' } },
          y: { beginAtZero: true, title: { display: true, text: '|P exacta − P normal|' } },
        },
      },
    };
  });
}
