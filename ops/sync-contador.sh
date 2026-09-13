#!/usr/bin/env bash
set -Eeuo pipefail

# Sincronizacao temporaria HostGator -> VPS para a tabela contador.
#
# A HostGator continua recebendo dados dos coletores antigos. Durante a troca
# gradual para a API da VPS, este script importa somente linhas ausentes ou
# cuja data na origem seja mais recente. Assim, um coletor novo que ja gravou
# diretamente na VPS nao tem seu dado sobrescrito por uma copia antiga.

ENV_FILE="${SYNC_ENV_FILE:-/root/.config/gr-contador-sync.env}"
MYSQL_CONTAINER="${MYSQL_CONTAINER:-gr_mysql}"
DEST_DB="${DEST_DB:-sistem84_impressoras}"
LOCK_FILE="${LOCK_FILE:-/var/lock/gr-contador-sync.lock}"

if [[ ! -r "$ENV_FILE" ]]; then
  echo "ERRO: arquivo de configuracao nao encontrado ou sem legivel: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${SOURCE_DB_HOST:?SOURCE_DB_HOST nao definido}"
: "${SOURCE_DB_USER:?SOURCE_DB_USER nao definido}"
: "${SOURCE_DB_PASSWORD:?SOURCE_DB_PASSWORD nao definido}"
: "${SOURCE_DB_NAME:?SOURCE_DB_NAME nao definido}"
SOURCE_DB_PORT="${SOURCE_DB_PORT:-3306}"
SOURCE_DB_SSL_MODE="${SOURCE_DB_SSL_MODE:-DISABLED}"

for identifier in "$MYSQL_CONTAINER" "$DEST_DB" "$SOURCE_DB_NAME"; do
  if [[ ! "$identifier" =~ ^[A-Za-z0-9_.-]+$ ]]; then
    echo "ERRO: identificador invalido na configuracao" >&2
    exit 1
  fi
done
if [[ ! "$SOURCE_DB_PORT" =~ ^[0-9]+$ ]]; then
  echo "ERRO: SOURCE_DB_PORT invalida" >&2
  exit 1
fi

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "$(date --iso-8601=seconds) sincronizacao ja esta em execucao"
  exit 0
fi

TMP_DIR="$(mktemp -d /tmp/gr-contador-sync.XXXXXX)"
RAW_DUMP="$TMP_DIR/contador.sql"
STAGE_DUMP="$TMP_DIR/contador-stage.sql"

dest_mysql() {
  docker exec -i \
    -e SYNC_DEST_DB="$DEST_DB" \
    "$MYSQL_CONTAINER" \
    sh -lc 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --init-command="SET SESSION sql_mode=\"\"" --batch --skip-column-names -uroot "$SYNC_DEST_DB"'
}

cleanup() {
  printf 'DROP TABLE IF EXISTS `contador_sync_stage`;\n' | dest_mysql >/dev/null 2>&1 || true
  rm -f "$RAW_DUMP" "$STAGE_DUMP"
  rmdir "$TMP_DIR" 2>/dev/null || true
}
trap cleanup EXIT

SOURCE_META="$(
  docker exec \
    -e MYSQL_PWD="$SOURCE_DB_PASSWORD" \
    "$MYSQL_CONTAINER" \
    mysql \
      --ssl-mode="$SOURCE_DB_SSL_MODE" \
      --connect-timeout=20 \
      --batch --skip-column-names \
      -h"$SOURCE_DB_HOST" -P"$SOURCE_DB_PORT" -u"$SOURCE_DB_USER" \
      "$SOURCE_DB_NAME" \
      -e 'SELECT COUNT(*), COALESCE(DATE_FORMAT(MAX(data), "%Y-%m-%d %H:%i:%s.%f"), "") FROM contador;'
)"

IFS=$'\t' read -r SOURCE_COUNT SOURCE_LATEST <<<"$SOURCE_META"
if [[ ! "$SOURCE_COUNT" =~ ^[0-9]+$ ]] || (( SOURCE_COUNT == 0 )); then
  echo "ERRO: a origem retornou uma quantidade invalida de linhas" >&2
  exit 1
fi

docker exec \
  -e MYSQL_PWD="$SOURCE_DB_PASSWORD" \
  "$MYSQL_CONTAINER" \
  mysqldump \
    --ssl-mode="$SOURCE_DB_SSL_MODE" \
    --single-transaction --quick \
    --no-create-info --skip-triggers --skip-lock-tables --skip-add-locks \
    --column-statistics=0 --no-tablespaces \
    -h"$SOURCE_DB_HOST" -P"$SOURCE_DB_PORT" -u"$SOURCE_DB_USER" \
    "$SOURCE_DB_NAME" contador >"$RAW_DUMP"

if ! grep -q 'INSERT INTO `contador`' "$RAW_DUMP"; then
  echo "ERRO: dump da origem nao contem dados da tabela contador" >&2
  exit 1
fi

sed 's/INSERT INTO `contador`/INSERT INTO `contador_sync_stage`/g' "$RAW_DUMP" >"$STAGE_DUMP"

printf '%s\n' \
  'DROP TABLE IF EXISTS `contador_sync_stage`;' \
  'CREATE TABLE `contador_sync_stage` LIKE `contador`;' | dest_mysql

dest_mysql <"$STAGE_DUMP"

STAGE_COUNT="$(printf 'SELECT COUNT(*) FROM `contador_sync_stage`;\n' | dest_mysql)"
if [[ "$STAGE_COUNT" != "$SOURCE_COUNT" ]]; then
  echo "ERRO: validacao falhou (origem=$SOURCE_COUNT, temporaria=$STAGE_COUNT)" >&2
  exit 1
fi

MERGE_RESULT="$(dest_mysql <<'SQL'
START TRANSACTION;

UPDATE `contador` AS d
JOIN `contador_sync_stage` AS s ON s.id = d.id
SET
  d.cliente = s.cliente,
  d.data = s.data,
  d.cont = s.cont,
  d.impressora = s.impressora,
  d.ip = s.ip,
  d.toner = s.toner,
  d.cilindro = s.cilindro,
  d.maquina = s.maquina,
  d.preto = s.preto,
  d.color = s.color,
  d.formato_a3 = s.formato_a3
WHERE s.data > d.data;
SET @linhas_atualizadas = ROW_COUNT();

INSERT INTO `contador`
  (`id`, `cliente`, `data`, `cont`, `impressora`, `ip`, `toner`, `cilindro`, `maquina`, `preto`, `color`, `formato_a3`)
SELECT
  s.id, s.cliente, s.data, s.cont, s.impressora, s.ip, s.toner, s.cilindro, s.maquina, s.preto, s.color, s.formato_a3
FROM `contador_sync_stage` AS s
LEFT JOIN `contador` AS d ON d.id = s.id
WHERE d.id IS NULL;
SET @linhas_inseridas = ROW_COUNT();

COMMIT;

SELECT
  @linhas_atualizadas,
  @linhas_inseridas,
  COUNT(*),
  COALESCE(DATE_FORMAT(MAX(data), '%Y-%m-%d %H:%i:%s.%f'), '')
FROM `contador`;
SQL
)"

IFS=$'\t' read -r UPDATED INSERTED DEST_COUNT DEST_LATEST <<<"$MERGE_RESULT"
echo "$(date --iso-8601=seconds) OK origem=$SOURCE_COUNT ultima_origem='$SOURCE_LATEST' atualizadas=$UPDATED inseridas=$INSERTED destino=$DEST_COUNT ultima_destino='$DEST_LATEST'"
