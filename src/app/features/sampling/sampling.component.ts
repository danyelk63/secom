import { ChangeDetectionStrategy, Component, computed, effect, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fmtNum, fmtProb } from '../../core/format';
import { SecomData } from '../../core/models';
import { binomPmf, normalApproxRange } from '../../core/stats';
import { COLORS, withAlpha } from '../../core/theme';
import { ChartComponent, ChartConfig } from '../../shared/chart/chart.component';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

interface SimulationResult {
  n: number;
  lots: number;
  /** counts[k] = número de lotes con k fallos */
  counts: number[];
  mean: number;
  variance: number;
}

@Component({
  selector: 'app-sampling',
  imports: [FormsModule, ChartComponent, StatCardComponent],
  templateUrl: './sampling.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SamplingComponent {
  readonly data = input.required<SecomData>();

  readonly lotSize = signal(100);
  readonly lots = signal(2000);
  readonly result = signal<SimulationResult | null>(null);

  protected readonly fmtNum = fmtNum;
  protected readonly fmtProb = fmtProb;

  constructor() {
    // Primera simulación al recibir los datos
    effect(() => {
      this.data();
      untracked(() => this.simulate());
    });
  }

  /** Toma `lots` lotes de tamaño n sin reemplazo de las unidades reales y cuenta los fallos. */
  simulate(): void {
    const d = this.data();
    const N = d.total;
    const n = Math.max(1, Math.min(N, Math.round(this.lotSize() || 100)));
    const M = Math.max(10, Math.min(20000, Math.round(this.lots() || 2000)));
    this.lotSize.set(n);
    this.lots.set(M);

    const fails = Int8Array.from(d.units, u => u.fail);
    const idx = Int32Array.from({ length: N }, (_, i) => i);
    const counts = new Array<number>(n + 1).fill(0);
    let sum = 0;
    let sumSq = 0;
    for (let m = 0; m < M; m++) {
      let f = 0;
      for (let j = 0; j < n; j++) { // Fisher–Yates parcial
        const r = j + Math.floor(Math.random() * (N - j));
        const t = idx[j]; idx[j] = idx[r]; idx[r] = t;
        f += fails[idx[j]];
      }
      counts[f]++;
      sum += f;
      sumSq += f * f;
    }
    const mean = sum / M;
    this.result.set({ n, lots: M, counts, mean, variance: (sumSq - M * mean * mean) / (M - 1) });
  }

  readonly summary = computed(() => {
    const r = this.result();
    if (!r) return null;
    const p = this.data().pHat;
    const threshold = Math.floor(0.05 * r.n) + 1;
    let above = 0;
    for (let k = threshold; k <= r.n; k++) above += r.counts[k];
    return {
      threshold,
      theoMean: r.n * p,
      theoVar: r.n * p * (1 - p),
      empirical: above / r.lots,
      normal: normalApproxRange(r.n, p, threshold, Infinity, true),
    };
  });

  readonly chart = computed<ChartConfig | null>(() => {
    const r = this.result();
    if (!r) return null;
    const pmf = binomPmf(r.n, this.data().pHat);
    let x1 = r.n;
    while (x1 > 0 && r.counts[x1] === 0 && pmf[x1] < 1e-4) x1--;
    let x0 = 0;
    while (x0 < x1 && r.counts[x0] === 0 && pmf[x0] < 1e-4) x0++;
    const bars = [];
    const line = [];
    for (let k = x0; k <= x1; k++) {
      bars.push({ x: k, y: r.counts[k] / r.lots });
      line.push({ x: k, y: pmf[k] });
    }
    return {
      type: 'bar',
      data: {
        datasets: [
          { type: 'bar', label: 'Frecuencia relativa en lotes reales', data: bars, backgroundColor: withAlpha(COLORS.lavender, 0.6), barPercentage: 1, categoryPercentage: 0.92, order: 2 },
          { type: 'line', label: 'Binomial teórica', data: line, borderColor: COLORS.cyan, backgroundColor: COLORS.cyan, pointRadius: 2.5, borderWidth: 2, order: 1 },
        ],
      },
      options: {
        parsing: false,
        scales: {
          x: { type: 'linear', min: x0 - 0.5, max: x1 + 0.5, ticks: { precision: 0 }, title: { display: true, text: 'fallos en el lote' } },
          y: { beginAtZero: true, title: { display: true, text: 'proporción de lotes' } },
        },
      },
    };
  });
}
