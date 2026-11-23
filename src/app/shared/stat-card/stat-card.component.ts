import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Tarjeta pequeña con una etiqueta y un valor. */
@Component({
  selector: 'app-stat',
  template: `
    <div class="label">{{ label() }}</div>
    <div class="value">{{ value() }}</div>
  `,
  styles: `
    :host {
      display: block;
      background: rgba(5, 11, 28, 0.55);
      border: 1px solid var(--border-soft);
      border-radius: 12px;
      padding: 10px 12px;
      font-family: var(--mono);
    }
    .label { font-size: 0.72rem; color: var(--muted); }
    .value { font-size: 1.1rem; font-weight: 700; overflow-wrap: anywhere; }
    :host(.highlight) .value { color: var(--cyan); }
  `,
  host: { '[class.highlight]': 'highlight()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly highlight = input(false, { transform: booleanAttribute });
}
