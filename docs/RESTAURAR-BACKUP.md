# Copias de seguridad de datos — Select Control

## Qué se guarda y cada cuánto
- **Automático:** el día **1 de cada mes** un robot de GitHub Actions
  (`.github/workflows/backup-mensual.yml`) hace una copia de todos los datos.
- **Qué copia:** el esquema `public` de la base de Supabase, es decir TODOS los
  datos del negocio: cargos, establecimientos, trabajadores, servicios,
  asignaciones y usuarios de la app.
- **Dónde se guardan:** en la rama **`backups`** de este repositorio
  (`select-control/app-select-gestion-`). Cada mes deja un archivo
  `backups/select-control-AAAA-MM.sql.gz` y actualiza `backups/latest.sql.gz`
  (el más reciente). Se conservan los **últimos 12 meses**.
- Al estar en GitHub, están **fuera de Supabase**: si se pierde algo en la app,
  el backup sigue a salvo.

## Lanzar una copia a mano (sin esperar al día 1)
GitHub → repo `app-select-gestion-` → pestaña **Actions** →
"Backup mensual de datos" → botón **Run workflow**.

## Cómo restaurar (recuperar los datos)
> ⚠️ Restaurar SOBRESCRIBE los datos actuales del esquema `public`
> (borra y vuelve a crear las tablas con el contenido del backup).
> Hazlo solo si de verdad quieres volver a ese punto.

1. Descarga el backup que quieras de la rama `backups`
   (por ejemplo `backups/latest.sql.gz`).
2. Descomprímelo:
   ```bash
   gunzip -k latest.sql.gz      # deja latest.sql
   ```
3. Cárgalo en la base con la cadena de conexión "Session pooler" de Supabase:
   ```bash
   psql "postgresql://...session-pooler..." -f latest.sql
   ```
   El archivo ya incluye los `DROP ... IF EXISTS` y `CREATE`, así que deja la
   base tal cual estaba en la fecha del backup.

## Secreto necesario (una sola vez)
El robot necesita el secreto de repositorio **`SUPABASE_DB_URL`** con la cadena
de conexión **Session pooler** de Supabase
(Dashboard → Project Settings → Database → Connection string → Session pooler).
Se define en: repo → Settings → Secrets and variables → Actions →
New repository secret.
