import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fmtDate, fmtNum, fmtPct, fmtProb } from '../../core/format';
import { SecomData } from '../../core/models';
import { zCritical, zPValue } from '../../core/stats';
import { ChartComponent } from '../../shared/chart/chart.component';
import { zTestChart } from '../../shared/chart/z-test-chart';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

/** H₀: p₁ = p₂ (bilateral), prueba z para dos proporciones separando por fecha. */
@Component({
  selector: 'app-hypothesis-two',
  imports: [FormsModule, ChartComponent, StatCardComponent],
  templateUrl: './hypothesis-two.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HypothesisTwoComponent {
  readonly data = input.required<SecomData>();

  /** Índice (en orden cronológico) de la primera unidad del periodo 2. Mínimo 50 unidades por grupo. */
  readonly cut = linkedSignal(() => Math.floor(this.data().total / 2));
  readonly alpha = signal(0.05);

  protected readonly fmtNum = fmtNum;
  protected readonly fmtProb = fmtProb;
  protected readonly fmtPct = fmtPct;
  protected readonly fmtDate = fmtDate;
  protected readonly minGroup = 50;

  resetCut(): void {
    this.cut.set(Math.floor(this.data().total / 2));
  }

  readonly test = computed(() => {
    const { units, total, failures } = this.data();
    const cut = Math.min(total - this.minGroup, Math.max(this.minGroup, this.cut()));
    const n1 = cut, n2 = total - cut;
    let x1 = 0;
    for (let i = 0; i < cut; i++) x1 += units[i].fail;
    const x2 = failures - x1;
    const p1 = x1 / n1, p2 = x2 / n2, pooled = failures / total;
    const z = (p1 - p2) / Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
    const pValue = zPValue(z, 'ne');
    return {
      n1, n2, x1, x2, p1, p2, pooled, z, pValue,
      zc: zCritical(this.alpha(), 'ne'),
      lastOfFirst: units[cut - 1].date,
      firstOfSecond: units[cut].date,
      reject: pValue < this.alpha(),
    };
  });

  readonly chart = computed(() => zTestChart(this.test().z, this.test().zc, 'ne'));
}
