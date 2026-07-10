# Copias de seguridad de datos — Select Control

## Qué se guarda y cada cuánto
- **Automático:** el día **1 de cada mes** un robot de GitHub Actions
  (`.github/workflows/backup-mensual.yml`) hace una copia de todos los datos
  usando la API de Supabase.
- **Qué copia:** todas las tablas del negocio: `cargos`, `establecimientos`,
  `trabajadores`, `servicios`, `asignaciones` y `usuarios_app`.
- **Dónde se guardan:** en la rama **`backups`** de este repositorio
  (`select-control/app-select-gestion-`). Cada mes deja:
  - `backups/select-control-AAAA-MM.json.gz` — los datos de ese mes,
  - `backups/latest.json.gz` — el más reciente,
  - `backups/esquema.sql` — el esquema de la base (para recrear las tablas).
  Se conservan los **últimos 12 meses**.
- Al estar en GitHub, están **fuera de Supabase**: si se pierde algo en la app,
  el backup sigue a salvo.

## Lanzar una copia a mano (sin esperar al día 1)
GitHub → repo `app-select-gestion-` → pestaña **Actions** →
"Backup mensual de datos" → **Run workflow**.

## Cómo restaurar (recuperar los datos)
> ⚠️ Restaurar **borra** los datos actuales de esas tablas y los sustituye por
> los del backup. Hazlo solo si de verdad quieres volver a ese punto.

1. Descarga de la rama `backups` el archivo que quieras (p. ej. `latest.json.gz`).
2. Si las tablas ya no existen (pérdida total), recréalas primero cargando
   `esquema.sql` en Supabase (SQL Editor → pegar y ejecutar).
3. Vuelca los datos con el script incluido:
   ```bash
   SUPABASE_SECRET_KEY="sb_secret_..." \
     node scripts/restaurar-datos.mjs latest.json.gz --confirmar
   ```
   - Sin `--confirmar` hace un **simulacro** (te dice qué haría, sin tocar nada).
   - Borra e inserta respetando el orden de dependencias entre tablas.
   - `usuarios_app` depende de las cuentas de acceso (`auth.users`); si también
     se perdieron esas, hay que recrear los usuarios desde la página `/usuarios`.

## Clave necesaria (una sola vez)
El robot necesita el secreto de repositorio **`SUPABASE_SECRET_KEY`** con la
clave **secreta** (`sb_secret_...`) de la API de Supabase
(Dashboard → Project Settings → API keys).
Se define en: repo → Settings → Secrets and variables → Actions →
New repository secret.
