// ==========================================================================
// Copia de seguridad de los DATOS de Select Control (Supabase, via API REST).
// --------------------------------------------------------------------------
// Lee TODAS las filas de cada tabla del negocio usando la clave SECRETA de
// Supabase (bypassa RLS) y las guarda en un unico JSON comprimido. Junto con
// el esquema (esquema.sql) permite recuperar los datos si se pierde algo.
//
// Uso:
//   SUPABASE_SECRET_KEY="sb_secret_..." node scripts/backup-datos.mjs
//
// Variables:
//   SUPABASE_SECRET_KEY  (obligatoria) clave secreta de la API de Supabase.
//   SUPABASE_URL         (opcional)    por defecto el proyecto de Select Control.
//   OUT_DIR              (opcional)    carpeta destino (por defecto "backups").
//   MAX_BACKUPS          (opcional)    meses a conservar (por defecto 12).
//
// No usa dependencias externas: fetch nativo de Node 18+.
// ==========================================================================
import { writeFileSync, mkdirSync, copyFileSync, readdirSync, unlinkSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const URL_BASE = process.env.SUPABASE_URL || "https://voytaxbvwdwxhedhjkbo.supabase.co";
const KEY = process.env.SUPABASE_SECRET_KEY;
const OUT_DIR = process.env.OUT_DIR || "backups";
const MAX_BACKUPS = Number(process.env.MAX_BACKUPS || 12);

// Orden de dependencias (padres antes que hijos). Se usa igual al restaurar.
const TABLAS = [
  "cargos",
  "establecimientos",
  "trabajadores",
  "servicios",
  "asignaciones",
  "usuarios_app",
];

if (!KEY) {
  console.error("ERROR: falta la variable SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const cabeceras = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// Descarga TODAS las filas de una tabla, paginando de 1000 en 1000.
async function descargarTabla(tabla) {
  const filas = [];
  const paso = 1000;
  for (let desde = 0; ; desde += paso) {
    const hasta = desde + paso - 1;
    const res = await fetch(`${URL_BASE}/rest/v1/${tabla}?select=*`, {
      headers: { ...cabeceras, Range: `${desde}-${hasta}`, "Range-Unit": "items" },
    });
    if (!res.ok) {
      throw new Error(`Tabla ${tabla}: HTTP ${res.status} ${await res.text()}`);
    }
    const lote = await res.json();
    filas.push(...lote);
    if (lote.length < paso) break;
  }
  return filas;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const generado = new Date().toISOString();
  const datos = {};
  const resumen = [];

  for (const t of TABLAS) {
    const filas = await descargarTabla(t);
    datos[t] = filas;
    resumen.push(`${t}: ${filas.length}`);
    console.log(`  ${t}: ${filas.length} filas`);
  }

  const total = Object.values(datos).reduce((n, f) => n + f.length, 0);
  if (total === 0) {
    console.error("ERROR: 0 filas en todas las tablas. Se aborta (posible fallo de clave/URL).");
    process.exit(1);
  }

  const contenido = {
    generado_utc: generado,
    url: URL_BASE,
    orden_tablas: TABLAS,
    resumen: Object.fromEntries(TABLAS.map((t) => [t, datos[t].length])),
    tablas: datos,
  };

  const mes = generado.slice(0, 7); // AAAA-MM
  const nombre = `select-control-${mes}.json.gz`;
  const gz = gzipSync(Buffer.from(JSON.stringify(contenido, null, 2)));
  writeFileSync(join(OUT_DIR, nombre), gz);
  writeFileSync(join(OUT_DIR, "latest.json.gz"), gz);

  // Guardar tambien el esquema junto a los datos (backup autocontenido).
  if (existsSync("supabase-schema.sql")) {
    copyFileSync("supabase-schema.sql", join(OUT_DIR, "esquema.sql"));
  }

  // Retencion: conservar solo los ultimos MAX_BACKUPS mensuales.
  const mensuales = readdirSync(OUT_DIR)
    .filter((f) => /^select-control-\d{4}-\d{2}\.json\.gz$/.test(f))
    .sort();
  for (const viejo of mensuales.slice(0, Math.max(0, mensuales.length - MAX_BACKUPS))) {
    unlinkSync(join(OUT_DIR, viejo));
  }

  console.log(`OK: backup guardado -> ${OUT_DIR}/${nombre} (${resumen.join(", ")}) · ${(gz.length / 1024).toFixed(1)} KB`);
}

main().catch((e) => {
  console.error("FALLO el backup:", e.message);
  process.exit(1);
});
