/** Estructura de public/data/secom.json (generado por scripts/build-data.mjs). */
export interface SecomRaw {
  source: string;
  nFeatures: number;
  units: RawUnit[];
  stats: SensorStat[];
  /** Ids de los sensores con mayor |d de Cohen| entre unidades que pasan y que fallan. */
  top: number[];
  /** Valores de los sensores de `top`, en el orden original de las unidades. */
  values: Record<string, (number | null)[]>;
}

export interface RawUnit {
  fail: 0 | 1;
  /** Fecha ISO local, p. ej. 2008-07-19T11:55:00 */
  t: string;
}

export interface SensorStat {
  id: number;
  missing: number;
  mean: number | null;
  sd: number | null;
  min: number | null;
  max: number | null;
  meanPass: number | null;
  meanFail: number | null;
  d: number | null;
  constant: boolean;
}

export interface Unit {
  /** Posición en el archivo original (para cruzar con `values`). */
  index: number;
  fail: 0 | 1;
  date: Date;
}

/** Datos listos para usar en la interfaz. */
export interface SecomData {
  /** Unidades ordenadas cronológicamente. */
  units: Unit[];
  /** Etiqueta de fallo en el orden original del archivo. */
  failByIndex: (0 | 1)[];
  total: number;
  failures: number;
  pHat: number;
  nFeatures: number;
  stats: SensorStat[];
  top: number[];
  values: Record<string, (number | null)[]>;
}

export type Alternative = 'gt' | 'lt' | 'ne';
