import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fmtNum, fmtPct, fmtProb } from '../../core/format';
import { SecomData } from '../../core/models';
import { binomRange, normalApproxRange, normalConditionsHold } from '../../core/stats';

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
  imports: [FormsModule],
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
        const relError = r.exact > 0 ? Math.abs(r.exact - r.withCC) / r.exact : NaN;
        return { ...r, np: n * p, nq: n * (1 - p), ok: normalConditionsHold(n, p), relError };
      });
  });
}
