// ==========================================================================
// Restaurar los DATOS de Select Control desde un backup (.json.gz) a Supabase.
// --------------------------------------------------------------------------
// ⚠️  BORRA los datos actuales de cada tabla y los reemplaza por los del backup.
//     Usalo solo para recuperar tras una perdida de datos.
//
// Uso:
//   SUPABASE_SECRET_KEY="sb_secret_..." \
//     node scripts/restaurar-datos.mjs backups/latest.json.gz --confirmar
//
// Sin --confirmar solo muestra lo que haria (simulacro).
// ==========================================================================
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const URL_BASE = process.env.SUPABASE_URL || "https://voytaxbvwdwxhedhjkbo.supabase.co";
const KEY = process.env.SUPABASE_SECRET_KEY;
const ARCHIVO = process.argv[2];
const CONFIRMAR = process.argv.includes("--confirmar");

if (!KEY) { console.error("ERROR: falta SUPABASE_SECRET_KEY."); process.exit(1); }
if (!ARCHIVO) { console.error("ERROR: indica el archivo de backup (.json o .json.gz)."); process.exit(1); }

const cabeceras = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const bruto = readFileSync(ARCHIVO);
const texto = ARCHIVO.endsWith(".gz") ? gunzipSync(bruto).toString() : bruto.toString();
const backup = JSON.parse(texto);
const orden = backup.orden_tablas || Object.keys(backup.tablas);

console.log(`Backup del ${backup.generado_utc} · destino ${URL_BASE}`);
for (const t of orden) console.log(`  ${t}: ${backup.tablas[t]?.length ?? 0} filas`);

if (!CONFIRMAR) {
  console.log("\nSIMULACRO (no se ha tocado nada). Anade --confirmar para restaurar de verdad.");
  process.exit(0);
}

async function borrarTodo(tabla) {
  // PostgREST exige un filtro para borrar; id=not.is.null cubre todas las filas.
  const res = await fetch(`${URL_BASE}/rest/v1/${tabla}?id=not.is.null`, {
    method: "DELETE",
    headers: { ...cabeceras, Prefer: "return=minimal" },
  });
  if (!res.ok) throw new Error(`DELETE ${tabla}: HTTP ${res.status} ${await res.text()}`);
}

async function insertar(tabla, filas) {
  const LOTE = 500;
  for (let i = 0; i < filas.length; i += LOTE) {
    const trozo = filas.slice(i, i + LOTE);
    const res = await fetch(`${URL_BASE}/rest/v1/${tabla}`, {
      method: "POST",
      headers: { ...cabeceras, Prefer: "return=minimal" },
      body: JSON.stringify(trozo),
    });
    if (!res.ok) throw new Error(`POST ${tabla}: HTTP ${res.status} ${await res.text()}`);
  }
}

async function main() {
  // Borrar en orden inverso (hijos antes que padres).
  for (const t of [...orden].reverse()) {
    await borrarTodo(t);
    console.log(`  vaciada ${t}`);
  }
  // Insertar en orden de dependencias (padres antes que hijos).
  for (const t of orden) {
    const filas = backup.tablas[t] || [];
    if (filas.length) await insertar(t, filas);
    console.log(`  restaurada ${t}: ${filas.length} filas`);
  }
  console.log("OK: restauracion completada.");
}

main().catch((e) => { console.error("FALLO la restauracion:", e.message); process.exit(1); });
