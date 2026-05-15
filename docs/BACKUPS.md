# Protocolo de Backups — PostgreSQL

Este documento describe cómo se hacen, rotan, verifican y restauran las copias de seguridad de la base de datos del proyecto.

## Resumen

- **Estrategia**: dump lógico (`pg_dump`) ejecutado por un contenedor sidecar dentro del propio `docker-compose`.
- **Frecuencia**: una copia diaria automática.
- **Retención**: 7 diarias + 4 semanales + 6 mensuales (≈ 17 dumps activos).
- **Ubicación**: `./backups/{daily,weekly,monthly}/*.sql.gz` en el host (NAS).
- **Off-site**: no, los dumps viven en el NAS donde corre el stack.
- **Restore**: manual mediante `scripts/db-restore.sh`.

## Arquitectura

```
┌──────────────────────────┐       ┌───────────────────────────────┐
│ postgres                 │◀──────│ postgres-backup (sidecar)     │
│  - Datos: postgres_data  │  pg_  │  - Imagen: prodrigestivill/   │
│    (volumen Docker)      │  dump │    postgres-backup-local:16   │
└──────────────────────────┘       │  - SCHEDULE: @daily           │
                                   │  - Output: /backups (bind)    │
                                   └──────────────┬────────────────┘
                                                  │
                                                  ▼
                                       ./backups/ (host / NAS)
                                       ├── daily/
                                       ├── weekly/
                                       └── monthly/
```

El sidecar usa `pg_dump` en formato plano comprimido con gzip (`*.sql.gz`). La rotación se hace dentro del propio contenedor según los `BACKUP_KEEP_*`.

## Configuración

Definida en `docker-compose.yml` → servicio `postgres-backup`:

| Variable | Valor | Significado |
|----------|-------|-------------|
| `SCHEDULE` | `@daily` | Cron simplificado, una vez al día (~ 00:00 hora del contenedor). |
| `BACKUP_KEEP_DAYS` | `7` | Diarias retenidas. |
| `BACKUP_KEEP_WEEKS` | `4` | Semanales retenidas (la última de cada semana). |
| `BACKUP_KEEP_MONTHS` | `6` | Mensuales retenidas (la última de cada mes). |
| `BACKUP_DIR` | `/backups` | Montado a `./backups` en el host. |
| `POSTGRES_EXTRA_OPTS` | `--clean --if-exists --quote-all-identifiers` | El dump incluye `DROP ... IF EXISTS` antes de cada `CREATE`. |
| `TZ` | `Europe/Madrid` | Zona horaria para los timestamps de los archivos. |

> Si necesitás otra frecuencia (por ejemplo cada 6h) cambiá `SCHEDULE` a una expresión cron (`0 */6 * * *`).

## Operación diaria (automático)

No requiere acción humana. El sidecar corre con `restart: unless-stopped`, así que arranca y se reanuda solo. Cada día genera un archivo del tipo:

```
./backups/daily/madame_ardent-20260516-000000.sql.gz
```

Los archivos antiguos se eliminan automáticamente según la política de retención.

## Verificación periódica

**Una vez al mes** conviene verificar que los dumps son sanos. Hay dos chequeos rápidos:

1. **Integridad del gzip** (no requiere restaurar nada):
   ```bash
   gzip -t ./backups/daily/*.sql.gz && echo "OK"
   ```

2. **Listado de dumps disponibles**:
   ```bash
   ./scripts/db-restore.sh --list
   ```

3. **Restore de prueba** (recomendado trimestralmente) en una base secundaria:
   ```bash
   # Crear una BD efímera y restaurar el último dump diario sobre ella
   docker exec madame-ardent-postgres createdb -U "$POSTGRES_USER" madame_ardent_test
   gunzip -c "$(ls -1t ./backups/daily/*.sql.gz | head -n1)" \
     | docker exec -i madame-ardent-postgres \
         psql -U "$POSTGRES_USER" -d madame_ardent_test --set ON_ERROR_STOP=1
   docker exec madame-ardent-postgres dropdb -U "$POSTGRES_USER" madame_ardent_test
   ```
   Si esto termina sin errores, el dump es restaurable.

## Restore (manual)

El script `scripts/db-restore.sh` envuelve el proceso. Es destructivo: dropea y recrea cada objeto que el dump declara.

### Opciones

```bash
# Restaurar el dump diario más reciente
./scripts/db-restore.sh --latest

# Restaurar la última copia semanal o mensual
./scripts/db-restore.sh --latest weekly
./scripts/db-restore.sh --latest monthly

# Restaurar un archivo específico
./scripts/db-restore.sh ./backups/daily/madame_ardent-20260510-000000.sql.gz

# Listar dumps disponibles
./scripts/db-restore.sh --list
```

### Pasos que ejecuta

1. Carga `.env` y valida que `POSTGRES_USER` / `POSTGRES_DB` existen.
2. Verifica que el contenedor `madame-ardent-postgres` está corriendo.
3. Pide confirmación escribiendo el nombre de la base (evita restores accidentales).
4. Hace `gunzip -c <dump> | docker exec -i ... psql --single-transaction`.
5. Avisa de reiniciar el servicio web para que Prisma se reconecte.

### Procedimiento recomendado (incidente real)

1. **Parar el servicio web** para que no escriba mientras restauramos:
   ```bash
   docker compose stop web
   ```
2. **Restaurar** el dump deseado:
   ```bash
   ./scripts/db-restore.sh --latest
   ```
3. **Levantar el servicio web** de nuevo:
   ```bash
   docker compose start web
   ```
4. **Comprobar** acceso al dashboard y a `/api/forms`. Si algo va mal, los dumps anteriores siguen en `./backups/`.

## Migración a otro NAS / servidor

El estado completo de los backups vive en `./backups/`. Para migrar:

1. Copiar `./backups/` al nuevo host (`rsync -a`).
2. Levantar el stack en el nuevo host con `.env` equivalente.
3. Ejecutar `./scripts/db-restore.sh --latest` para hidratar la base nueva.

## Limitaciones conocidas

- **No es off-site**: si el NAS muere físicamente, se pierden los backups. Si en el futuro hace falta off-site, se puede añadir un `rclone sync ./backups remote:bucket` programado con cron.
- **Dump lógico, no PITR**: no hay recuperación a un punto exacto en el tiempo (granularidad = un día). Para PITR haría falta archivado WAL (pgBackRest o similar), que es overkill para este proyecto.
- **El sidecar duerme cuando el stack está parado**: si el host está apagado durante días, esos días no tendrán dump.

## Archivos relevantes

- `docker-compose.yml` — servicio `postgres-backup`.
- `scripts/db-restore.sh` — script de restauración.
- `.gitignore` — `/backups` está ignorado (no se commitea).
- `docs/BACKUPS.md` — este documento.
