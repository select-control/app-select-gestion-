#!/usr/bin/env bash
# ==========================================================================
# Copia de seguridad de los DATOS de Select Control (Supabase / Postgres).
# --------------------------------------------------------------------------
# Vuelca el esquema `public` completo (cargos, establecimientos, trabajadores,
# servicios, asignaciones, usuarios_app) a un .sql comprimido, con DROP+CREATE
# e INSERTs, de modo que sea RESTAURABLE tal cual con psql.
#
# Uso:
#   SUPABASE_DB_URL="postgresql://..." OUT_DIR=./backups ./scripts/backup-datos.sh
#
# SUPABASE_DB_URL = cadena de conexion "Session pooler" de Supabase:
#   Dashboard > Project Settings > Database > Connection string > Session pooler
#   (la de puerto 5432, compatible con pg_dump y con IPv4).
#
# Requiere pg_dump 17 (lo instala el workflow de GitHub Actions).
# ==========================================================================
set -euo pipefail

: "${SUPABASE_DB_URL:?Falta la variable SUPABASE_DB_URL (cadena de conexion de Supabase)}"
OUT_DIR="${OUT_DIR:-backups}"
MAX_BACKUPS="${MAX_BACKUPS:-12}"   # cuantos backups mensuales conservar

mkdir -p "$OUT_DIR"
MES="$(date -u +%Y-%m)"
ARCHIVO="$OUT_DIR/select-control-$MES.sql"

echo "==> Volcando datos (esquema public) a $ARCHIVO.gz"
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --no-owner --no-privileges \
  --clean --if-exists \
  --file="$ARCHIVO"

gzip -f "$ARCHIVO"
cp "$ARCHIVO.gz" "$OUT_DIR/latest.sql.gz"

# Verificacion minima: el dump tiene que contener tablas de verdad.
if ! zgrep -q "CREATE TABLE" "$ARCHIVO.gz"; then
  echo "ERROR: el dump no contiene ninguna tabla. Se aborta sin guardar." >&2
  exit 1
fi

# Retencion: conservar solo los ultimos MAX_BACKUPS mensuales.
# (head -n -N necesita GNU coreutils; presente en los runners de GitHub Actions.)
ls -1 "$OUT_DIR"/select-control-*.sql.gz 2>/dev/null \
  | sort | head -n "-$MAX_BACKUPS" | xargs -r rm -f

echo "OK: backup listo -> $ARCHIVO.gz ($(du -h "$ARCHIVO.gz" | cut -f1))"
