# Aproximación normal a la binomial — SECOM

Aplicación Angular para explorar los datos de fallos de SECOM (UCI, dataset 179) y la aproximación normal a la binomial.

**En vivo:** https://secom-theta.vercel.app (se despliega en Vercel con cada push a `main`).

## Requisitos

- Node 22.12 o superior (Angular 20)

## Correr en local

```
npm install
npm start          # http://localhost:4200
```

## Datos

Los archivos crudos de UCI (`secom.data`, `secom_labels.data`, `secom.names`) están en `data/`.
`npm run data` los preprocesa y genera `public/data/secom.json`, que es lo que carga la app.
No hay backend ni base de datos: los datos son estáticos.

## Estructura (`src/app`)

```
core/
  models.ts              tipos de los datos
  stats.ts               binomial exacta, normal, corrección por continuidad, pruebas z
  format.ts              formato de números y fechas (es-CO)
  theme.ts               colores del póster y estilo de Chart.js
  secom-data.service.ts  carga el JSON y lo expone como signal
shared/
  chart/                 componente envoltorio de Chart.js + gráfica de prueba z
  stat-card/             tarjeta etiqueta/valor
features/
  overview/              indicadores y fallos por semana
  binomial-lab/          laboratorio interactivo binomial vs normal
  results-table/         tabla por tamaño de lote y error de la aproximación
  sampling/              lotes muestreados de los datos reales
  hypothesis-one/        H₀: p = p₀
  hypothesis-two/        H₀: p₁ = p₂ (primer vs segundo periodo)
  sensors/               explorador de los 590 sensores
```

## Publicar

`npm run build` genera un sitio estático en `dist/secom-web/browser`, que se puede subir a GitHub Pages, Netlify o Vercel.
