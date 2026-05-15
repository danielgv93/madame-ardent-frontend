#!/usr/bin/env bash
#
# Restore a PostgreSQL backup produced by the `postgres-backup` sidecar.
#
# Usage:
#   scripts/db-restore.sh <path-to-dump.sql.gz>
#   scripts/db-restore.sh --latest [daily|weekly|monthly]   # default: daily
#   scripts/db-restore.sh --list                            # list available dumps
#
# The script:
#   1. Verifies the dump exists and is readable.
#   2. Asks for explicit confirmation (target DB is destructive).
#   3. Streams the gzip'd SQL into `psql` inside the postgres container.
#   4. Uses --single-transaction so a failed restore rolls back cleanly.
#
# Requires:
#   - docker compose stack up (at least the `postgres` service).
#   - .env with POSTGRES_USER / POSTGRES_DB defined.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUPS_DIR="${ROOT_DIR}/backups"
CONTAINER="madame-ardent-postgres"

if [[ ! -f "${ROOT_DIR}/.env" ]]; then
    echo "ERROR: .env not found at ${ROOT_DIR}/.env" >&2
    exit 1
fi
# shellcheck disable=SC1091
set -a; . "${ROOT_DIR}/.env"; set +a

: "${POSTGRES_USER:?POSTGRES_USER must be set in .env}"
: "${POSTGRES_DB:?POSTGRES_DB must be set in .env}"

list_dumps() {
    for tier in daily weekly monthly; do
        local dir="${BACKUPS_DIR}/${tier}"
        [[ -d "${dir}" ]] || continue
        echo "── ${tier} ──"
        ls -1t "${dir}"/*.sql.gz 2>/dev/null || echo "  (empty)"
    done
}

latest_dump() {
    local tier="${1:-daily}"
    local dir="${BACKUPS_DIR}/${tier}"
    [[ -d "${dir}" ]] || { echo "ERROR: no ${tier} backups directory" >&2; exit 1; }
    ls -1t "${dir}"/*.sql.gz 2>/dev/null | head -n1
}

case "${1:-}" in
    "")
        echo "Usage: $0 <dump.sql.gz> | --latest [daily|weekly|monthly] | --list" >&2
        exit 1
        ;;
    --list)
        list_dumps
        exit 0
        ;;
    --latest)
        DUMP="$(latest_dump "${2:-daily}")"
        [[ -n "${DUMP}" ]] || { echo "ERROR: no dumps found" >&2; exit 1; }
        ;;
    *)
        DUMP="$1"
        ;;
esac

if [[ ! -f "${DUMP}" ]]; then
    echo "ERROR: dump file not found: ${DUMP}" >&2
    exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "ERROR: container '${CONTAINER}' is not running. Start it with: docker compose up -d postgres" >&2
    exit 1
fi

echo "About to restore:"
echo "  Dump:      ${DUMP}"
echo "  Container: ${CONTAINER}"
echo "  Database:  ${POSTGRES_DB} (user: ${POSTGRES_USER})"
echo ""
echo "This will DROP and recreate every object present in the dump."
read -r -p "Type the database name to confirm: " CONFIRM
if [[ "${CONFIRM}" != "${POSTGRES_DB}" ]]; then
    echo "Aborted." >&2
    exit 1
fi

echo "→ Restoring..."
gunzip -c "${DUMP}" | docker exec -i "${CONTAINER}" \
    psql --single-transaction --set ON_ERROR_STOP=1 \
         -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

echo "✓ Restore completed."
echo "Reminder: restart the web service so Prisma reconnects:"
echo "  docker compose restart web"
