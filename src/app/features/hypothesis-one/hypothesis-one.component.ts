import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fmtNum, fmtProb } from '../../core/format';
import { Alternative, SecomData } from '../../core/models';
import { binomPmf, binomRange, normInv, zCritical, zPValue } from '../../core/stats';
import { ChartComponent } from '../../shared/chart/chart.component';
import { zTestChart } from '../../shared/chart/z-test-chart';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

/** H₀: p = p₀ contra una alternativa, con la prueba z para una proporción. */
@Component({
  selector: 'app-hypothesis-one',
  imports: [FormsModule, ChartComponent, StatCardComponent],
  templateUrl: './hypothesis-one.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HypothesisOneComponent {
  readonly data = input.required<SecomData>();

  readonly p0Input = signal(0.05);
  readonly alt = signal<Alternative>('gt');
  readonly alpha = signal(0.05);

  protected readonly fmtNum = fmtNum;
  protected readonly fmtProb = fmtProb;
  protected readonly symbol: Record<Alternative, string> = { gt: '>', lt: '<', ne: '≠' };

  readonly p0 = computed(() => Math.min(0.999, Math.max(0.001, this.p0Input() || 0.05)));

  readonly test = computed(() => {
    const { total: n, failures: x, pHat } = this.data();
    const p0 = this.p0(), alt = this.alt(), alpha = this.alpha();
    const z = (pHat - p0) / Math.sqrt((p0 * (1 - p0)) / n);
    const pValue = zPValue(z, alt);
    const zc = zCritical(alpha, alt);

    // Valor p exacto con la binomial bajo H₀
    const pmf = binomPmf(n, p0);
    const upper = binomRange(n, p0, x, n, pmf);
    const lower = binomRange(n, p0, 0, x, pmf);
    const pExact = alt === 'gt' ? upper : alt === 'lt' ? lower : Math.min(1, 2 * Math.min(upper, lower));

    const se = Math.sqrt((pHat * (1 - pHat)) / n);
    const zi = normInv(1 - alpha / 2);
    return {
      n, x, pHat, z, zc, pValue, pExact,
      critical: alt === 'ne' ? `±${fmtNum(zc, 3)}` : fmtNum(alt === 'lt' ? -zc : zc, 3),
      ci: [pHat - zi * se, pHat + zi * se] as const,
      reject: pValue < alpha,
    };
  });

  readonly chart = computed(() => zTestChart(this.test().z, this.test().zc, this.alt()));
}
