import {
  ChangeDetectionStrategy, Component, ElementRef, effect, input, OnDestroy, untracked, viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { applyChartTheme } from '../../core/theme';

/** Configuración de Chart.js; `any` en los genéricos permite gráficas mixtas (barras + líneas). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChartConfig = ChartConfiguration<any, any, any>;

/**
 * Envoltura de Chart.js: crea la gráfica una vez y, cuando cambia `config`,
 * actualiza datos y opciones sin recrearla (así se anima la transición).
 */
@Component({
  selector: 'app-chart',
  template: `<canvas #canvas></canvas>`,
  styles: `
    :host { display: block; position: relative; height: var(--chart-h, 300px); }
    @media (max-width: 600px) { :host { height: 260px; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnDestroy {
  readonly config = input.required<ChartConfig>();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    applyChartTheme();
    effect(() => {
      const cfg = this.config();
      const canvas = this.canvas().nativeElement;
      untracked(() => {
        if (!this.chart) {
          this.chart = new Chart(canvas, cfg);
          return;
        }
        this.chart.data = cfg.data;
        this.chart.options = cfg.options ?? {};
        this.chart.update();
      });
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
