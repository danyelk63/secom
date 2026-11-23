// Preprocesa los archivos crudos de SECOM (UCI) y genera public/data/secom.json
// Uso (desde secom-web/): npm run data
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "data");          // carpeta con los archivos crudos de UCI
const outDir = join(here, "..", "public", "data");
const TOP_SENSORS = 16;

// --- Etiquetas y fechas ---------------------------------------------------
const labelLines = readFileSync(join(root, "secom_labels.data"), "utf8").trim().split(/\r?\n/);
const units = labelLines.map((line, i) => {
  const m = line.match(/^(-?1)\s+"(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})"/);
  if (!m) throw new Error(`Línea de etiqueta inválida ${i + 1}: ${line}`);
  const [, lab, dd, mm, yyyy, hh, mi, ss] = m;
  return { fail: lab === "1" ? 1 : 0, t: `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}` };
});

// --- Mediciones de sensores ----------------------------------------------
const rows = readFileSync(join(root, "secom.data"), "utf8").trim().split(/\r?\n/)
  .map(r => r.trim().split(/\s+/).map(v => (v === "NaN" ? null : Number(v))));
if (rows.length !== units.length) throw new Error("secom.data y secom_labels.data no coinciden");
const nFeat = rows[0].length;

const stats = [];
for (let j = 0; j < nFeat; j++) {
  const all = [], pass = [], fail = [];
  for (let i = 0; i < rows.length; i++) {
    const v = rows[i][j];
    if (v === null) continue;
    all.push(v);
    (units[i].fail ? fail : pass).push(v);
  }
  const mean = a => a.reduce((s, x) => s + x, 0) / (a.length || 1);
  const sd = (a, m) => Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(a.length - 1, 1));
  const m = mean(all), s = sd(all, m), mp = mean(pass), mf = mean(fail);
  const sp = sd(pass, mp), sf = sd(fail, mf);
  const pooled = Math.sqrt(((pass.length - 1) * sp ** 2 + (fail.length - 1) * sf ** 2) / Math.max(pass.length + fail.length - 2, 1));
  const d = pooled > 0 ? (mf - mp) / pooled : 0; // d de Cohen fallo vs pasa
  const r = x => (Number.isFinite(x) ? +x.toPrecision(6) : null);
  stats.push({
    id: j + 1,
    missing: rows.length - all.length,
    mean: r(m), sd: r(s),
    min: all.length ? r(Math.min(...all)) : null,
    max: all.length ? r(Math.max(...all)) : null,
    meanPass: r(mp), meanFail: r(mf),
    d: r(d),
    constant: s === 0,
  });
}

// Sensores con mayor diferencia entre unidades que pasan y que fallan
const top = stats
  .filter(s => !s.constant && s.missing < rows.length * 0.2)
  .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
  .slice(0, TOP_SENSORS)
  .map(s => s.id);
const values = Object.fromEntries(top.map(id => [id, rows.map(r => r[id - 1])]));

const out = {
  source: "UCI Machine Learning Repository — SECOM (id 179)",
  nFeatures: nFeat,
  units,
  stats,
  top,
  values,
};
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "secom.json"), JSON.stringify(out));
const fails = units.filter(u => u.fail).length;
console.log(`OK: ${units.length} unidades, ${fails} fallos, ${nFeat} sensores, top=${top.join(",")}`);
