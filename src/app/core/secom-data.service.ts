import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SecomData, SecomRaw, Unit } from './models';

/** Carga el JSON preprocesado de SECOM una sola vez y lo expone como signal. */
@Injectable({ providedIn: 'root' })
export class SecomDataService {
  private readonly http = inject(HttpClient);

  /** `undefined` mientras carga. */
  readonly data = toSignal(this.http.get<SecomRaw>('data/secom.json').pipe(map(prepare)));
}

function prepare(raw: SecomRaw): SecomData {
  const units: Unit[] = raw.units
    .map((u, index) => ({ index, fail: u.fail, date: new Date(u.t) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const failures = units.reduce((s, u) => s + u.fail, 0);
  return {
    units,
    failByIndex: raw.units.map(u => u.fail),
    total: units.length,
    failures,
    pHat: failures / units.length,
    nFeatures: raw.nFeatures,
    stats: raw.stats,
    top: raw.top,
    values: raw.values,
  };
}
