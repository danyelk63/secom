import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fmtNum, fmtPct, fmtSensor } from '../../core/format';
import { SecomData, SensorStat } from '../../core/models';
import { COLORS, withAlpha } from '../../core/theme';
import { ChartComponent, ChartConfig } from '../../shared/chart/chart.component';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

type SortKey = keyof Omit<SensorStat, 'constant'>;

const BINS = 24;

@Component({
  selector: 'app-sensors',
  imports: [FormsModule, ChartComponent, StatCardComponent],
  templateUrl: './sensors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SensorsComponent {
  readonly data = input.required<SecomData>();

  readonly selected = linkedSignal(() => this.data().top[0]);
  readonly search = signal<number | null>(null);
  readonly hideConstant = signal(true);
  readonly sortKey = signal<SortKey>('d');
  readonly sortDir = signal<1 | -1>(-1);

  protected readonly fmtNum = fmtNum;
  protected readonly fmtPct = fmtPct;
  protected readonly fmtSensor = fmtSensor;
  protected readonly columns: { key: SortKey; label: string }[] = [
    { key: 'id', label: '#' },
    { key: 'missing', label: 'Faltantes' },
    { key: 'mean', label: 'Media' },
    { key: 'sd', label: 'Desv.' },
    { key: 'min', label: 'Mín' },
    { key: 'max', label: 'Máx' },
    { key: 'meanPass', label: 'Media pasa' },
    { key: 'meanFail', label: 'Media falla' },
    { key: 'd', label: 'd Cohen' },
  ];
  protected readonly valueColumns = this.columns.slice(2);

  private readonly statById = computed(() => new Map(this.data().stats.map(s => [s.id, s])));

  readonly topOptions = computed(() =>
    this.data().top.map(id => ({ id, label: `Sensor ${id} · d = ${fmtNum(this.statById().get(id)?.d, 2)}` })),
  );

  readonly selectedStat = computed(() => this.statById().get(this.selected())!);

  readonly histogram = computed<ChartConfig>(() => {
    const d = this.data();
    const values = d.values[this.selected()];
    const points = values
      .map((v, i) => ({ v, fail: d.failByIndex[i] }))
      .filter((p): p is { v: number; fail: 0 | 1 } => p.v !== null);
    // Se recortan los percentiles 1 y 99 para que un valor extremo no aplaste el histograma
    const sorted = points.map(p => p.v).sort((a, b) => a - b);
    const lo = sorted[Math.floor(sorted.length * 0.01)];
    const hi = sorted[Math.ceil(sorted.length * 0.99) - 1];
    const width = (hi - lo) / BINS || 1;
    const pass = new Array<number>(BINS).fill(0);
    const fail = new Array<number>(BINS).fill(0);
    for (const p of points) {
      const b = Math.min(BINS - 1, Math.max(0, Math.floor((p.v - lo) / width)));
      (p.fail ? fail : pass)[b]++;
    }
    const nPass = pass.reduce((a, b) => a + b, 0) || 1;
    const nFail = fail.reduce((a, b) => a + b, 0) || 1;
    return {
      type: 'bar',
      data: {
        labels: pass.map((_, b) => (lo + width * (b + 0.5)).toPrecision(4)),
        datasets: [
          { label: 'Pasan', data: pass.map(c => (100 * c) / nPass), backgroundColor: withAlpha(COLORS.pass, 0.65) },
          { label: 'Fallan', data: fail.map(c => (100 * c) / nFail), backgroundColor: withAlpha(COLORS.fail, 0.75) },
        ],
      },
      options: {
        scales: {
          x: { title: { display: true, text: 'valor medido' } },
          y: { title: { display: true, text: '% del grupo' } },
        },
      },
    };
  });

  readonly tableRows = computed(() => {
    const q = this.search();
    const hide = this.hideConstant();
    const key = this.sortKey();
    const dir = this.sortDir();
    const value = (s: SensorStat) => (key === 'd' ? Math.abs(s.d ?? 0) : (s[key] ?? -Infinity));
    return this.data()
      .stats.filter(s => (!hide || !s.constant) && (!q || s.id === q))
      .sort((a, b) => (value(a) - value(b)) * dir);
  });

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) this.sortDir.update(d => (d === 1 ? -1 : 1));
    else {
      this.sortKey.set(key);
      this.sortDir.set(-1);
    }
  }
}
