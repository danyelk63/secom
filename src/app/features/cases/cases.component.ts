import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fmtNum, fmtProb } from '../../core/format';
import { SecomData } from '../../core/models';
import { binomPmf, binomRange, normalApproxRange, normPdf } from '../../core/stats';
import { COLORS, withAlpha } from '../../core/theme';
import { ChartComponent, ChartConfig } from '../../shared/chart/chart.component';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

interface CaseDef {
  id: string;
  lo: number;
  hi: number;
  label: string;
  hypothesis: string;
}

/** Dos eventos concretos con su hipótesis, resueltos con la binomial exacta y la normal. */
@Component({
  selector: 'app-cases',
  imports: [FormsModule, ChartComponent, StatCardComponent],
  templateUrl: './cases.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesComponent {
  readonly data = input.required<SecomData>();

  readonly nInput = signal(100);
  readonly n = computed(() => Math.min(500, Math.max(10, Math.round(this.nInput() || 100))));

  protected readonly fmtNum = fmtNum;
  protected readonly fmtProb = fmtProb;

  private readonly defs: CaseDef[] = [
    {
      id: 'cero',
      lo: 0,
      hi: 0,
      label: 'P(X = 0)',
      hypothesis:
        'Es casi imposible que un lote salga sin ninguna unidad fallada. Como 0 está en el extremo izquierdo ' +
        'de la distribución, se espera que la normal no aproxime bien este valor.',
    },
    {
      id: 'centro',
      lo: 5,
      hi: 8,
      label: 'P(5 ≤ X ≤ 8)',
      hypothesis:
        'Lo más probable es que un lote tenga entre 5 y 8 unidades falladas, porque ese intervalo rodea a la ' +
        'media np. Cerca del centro se espera que la normal aproxime bien a la binomial.',
    },
  ];

  readonly cases = computed(() => {
    const n = this.n(), p = this.data().pHat;
    const mu = n * p, sd = Math.sqrt(n * p * (1 - p));
    const pmf = binomPmf(n, p);
    return this.defs.map(d => {
      const exact = binomRange(n, p, d.lo, d.hi, pmf);
      const approx = normalApproxRange(n, p, d.lo, d.hi, true);
      const zLo = (d.lo - 0.5 - mu) / sd;
      const zHi = (d.hi + 0.5 - mu) / sd;
      const diff = Math.abs(exact - approx);
      const ratio = exact > 0 ? approx / exact : NaN;
      const good = exact > 0 && diff / exact < 0.05;
      return { ...d, exact, approx, zLo, zHi, diff, ratio, good, chart: this.chart(n, mu, sd, pmf, d.lo, d.hi) };
    });
  });

  readonly params = computed(() => {
    const n = this.n(), p = this.data().pHat;
    return { n, p, mu: n * p, sd: Math.sqrt(n * p * (1 - p)), np: n * p, nq: n * (1 - p) };
  });

  private chart(n: number, mu: number, sd: number, pmf: number[], lo: number, hi: number): ChartConfig {
    let x0 = Math.max(0, Math.floor(mu - 5 * sd) - 1);
    let x1 = Math.min(n, Math.ceil(mu + 5 * sd) + 1);
    if (x1 - x0 < 12) { x0 = Math.max(0, x0 - 6); x1 = Math.min(n, x1 + 6); }
    x0 = Math.min(x0, lo);
    x1 = Math.max(x1, Math.min(n, hi));

    const bars: { x: number; y: number }[] = [];
    const colors: string[] = [];
    for (let k = x0; k <= x1; k++) {
      bars.push({ x: k, y: pmf[k] });
      colors.push(k >= lo && k <= hi ? COLORS.cyan : withAlpha(COLORS.lavender, 0.45));
    }
    const curve: { x: number; y: number }[] = [];
    if (sd > 0) {
      for (let i = 0; i <= 200; i++) {
        const x = x0 - 0.5 + ((x1 - x0 + 1) * i) / 200;
        curve.push({ x, y: normPdf(x, mu, sd) });
      }
    }
    return {
      type: 'bar',
      data: {
        datasets: [
          { type: 'bar', label: 'Binomial', data: bars, backgroundColor: colors, barPercentage: 1, categoryPercentage: 0.92, order: 2 },
          { type: 'line', label: 'Normal', data: curve, borderColor: COLORS.cyan, borderWidth: 2, pointRadius: 0, tension: 0.2, order: 1 },
        ],
      },
      options: {
        parsing: false,
        scales: {
          x: { type: 'linear', min: x0 - 0.5, max: x1 + 0.5, ticks: { precision: 0 }, title: { display: true, text: 'k' } },
          y: { beginAtZero: true },
        },
        plugins: { tooltip: { callbacks: { label: (c: { dataset: { label?: string }; parsed: { y: number } }) => `${c.dataset.label}: ${fmtProb(c.parsed.y)}` } } },
      },
    };
  }
}
