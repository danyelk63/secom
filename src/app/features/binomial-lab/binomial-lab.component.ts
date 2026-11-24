import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fmtNum, fmtProb } from '../../core/format';
import { SecomData } from '../../core/models';
import { binomPmf, binomRange, normalApproxRange, normPdf } from '../../core/stats';
import { COLORS, withAlpha } from '../../core/theme';
import { ChartComponent, ChartConfig } from '../../shared/chart/chart.component';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

type EventKind = 'le' | 'ge' | 'eq' | 'between';

@Component({
  selector: 'app-binomial-lab',
  imports: [FormsModule, ChartComponent, StatCardComponent],
  templateUrl: './binomial-lab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BinomialLabComponent {
  readonly data = input.required<SecomData>();

  readonly n = signal(100);
  /** Arranca con la p̂ observada en SECOM; el usuario puede moverla. */
  readonly p = linkedSignal(() => +this.data().pHat.toFixed(3));
  readonly kind = signal<EventKind>('le');
  readonly a = signal(3);
  readonly k = signal(8);
  readonly continuity = signal(true);

  protected readonly fmtNum = fmtNum;
  protected readonly fmtProb = fmtProb;

  useSecomP(): void {
    this.p.set(+this.data().pHat.toFixed(3));
  }

  readonly mu = computed(() => this.n() * this.p());
  readonly sigma = computed(() => Math.sqrt(this.n() * this.p() * (1 - this.p())));

  /** Rango de k que muestra la gráfica (μ ± 5σ, acotado a [0, n]). */
  readonly range = computed(() => {
    const n = this.n(), mu = this.mu(), sd = this.sigma();
    let x0 = Math.max(0, Math.floor(mu - 5 * sd) - 1);
    let x1 = Math.min(n, Math.ceil(mu + 5 * sd) + 1);
    if (x1 - x0 < 12) { x0 = Math.max(0, x0 - 6); x1 = Math.min(n, x1 + 6); }
    return { x0, x1 };
  });

  /** Límite de los sliders de k y a: el máximo de la gráfica, cambia con n y p. */
  readonly kMax = computed(() => this.range().x1);
  readonly kClamped = computed(() => Math.min(this.k(), this.kMax()));
  readonly aClamped = computed(() => Math.min(this.a(), this.kMax()));

  private readonly pmf = computed(() => binomPmf(this.n(), this.p()));

  readonly event = computed(() => {
    const k = this.kClamped();
    const a = this.aClamped();
    switch (this.kind()) {
      case 'le': return { lo: -Infinity, hi: k, label: `P(X ≤ ${k})` };
      case 'ge': return { lo: k, hi: Infinity, label: `P(X ≥ ${k})` };
      case 'eq': return { lo: k, hi: k, label: `P(X = ${k})` };
      default: {
        const lo = Math.min(a, k);
        const hi = Math.max(a, k);
        return { lo, hi, label: `P(${lo} ≤ X ≤ ${hi})` };
      }
    }
  });

  readonly result = computed(() => {
    const n = this.n(), p = this.p();
    const { lo, hi } = this.event();
    const exact = binomRange(n, p, lo, hi, this.pmf());
    const withCC = normalApproxRange(n, p, lo, hi, true);
    const withoutCC = normalApproxRange(n, p, lo, hi, false);
    const approx = this.continuity() ? withCC : withoutCC;
    const other = this.continuity() ? withoutCC : withCC;
    return { exact, approx, other };
  });

  readonly conditions = computed(() => {
    const n = this.n(), p = this.p();
    return {
      np: n * p,
      nq: n * (1 - p),
      okNp: n * p >= 5,
      okNq: n * (1 - p) >= 5,
      minN: Math.ceil(5 / Math.min(p, 1 - p)),
    };
  });

  readonly chart = computed<ChartConfig>(() => {
    const mu = this.mu(), sd = this.sigma(), pmf = this.pmf();
    const { lo, hi } = this.event();
    const { x0, x1 } = this.range();

    const bars: { x: number; y: number }[] = [];
    const colors: string[] = [];
    for (let k = x0; k <= x1; k++) {
      bars.push({ x: k, y: pmf[k] });
      colors.push(k >= lo && k <= hi ? COLORS.cyan : withAlpha(COLORS.lavender, 0.45));
    }
    const curve: { x: number; y: number }[] = [];
    if (sd > 0) {
      for (let i = 0; i <= 240; i++) {
        const x = x0 - 0.5 + ((x1 - x0 + 1) * i) / 240;
        curve.push({ x, y: normPdf(x, mu, sd) });
      }
    }
    return {
      type: 'bar',
      data: {
        datasets: [
          { type: 'bar', label: 'Binomial P(X = k)', data: bars, backgroundColor: colors, barPercentage: 1, categoryPercentage: 0.92, order: 2 },
          { type: 'line', label: 'Normal N(np, np(1−p))', data: curve, borderColor: COLORS.cyan, borderWidth: 2.5, pointRadius: 0, tension: 0.2, order: 1 },
        ],
      },
      options: {
        parsing: false,
        scales: {
          x: { type: 'linear', min: x0 - 0.5, max: x1 + 0.5, ticks: { precision: 0 }, title: { display: true, text: 'k = unidades falladas en el lote' } },
          y: { beginAtZero: true, title: { display: true, text: 'probabilidad' } },
        },
        plugins: { tooltip: { callbacks: { label: (c: { dataset: { label?: string }; parsed: { y: number } }) => `${c.dataset.label}: ${fmtProb(c.parsed.y)}` } } },
      },
    };
  });
}
