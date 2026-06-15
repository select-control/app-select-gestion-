#!/bin/bash
# Lanzador de la app SELECT Control en modo estable (produccion).
# Lo usa el servicio de macOS (LaunchAgent) para mantenerla siempre encendida.
cd /Users/adrifueyo/Sites/select-control-app || exit 1
export PATH="/usr/local/bin:$PATH"
export PORT=3000
exec /usr/local/bin/npm run start
