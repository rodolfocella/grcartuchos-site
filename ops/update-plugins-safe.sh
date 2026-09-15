#!/bin/sh
# Roda uma vez por dia (via /etc/cron.d/gr-plugin-auto-update) e faz duas
# coisas com os plugins do WordPress que têm atualização disponível:
# - Atualiza sozinho os que só mudam o número de patch (major.minor
#   igual, ex: 4.1.6 -> 4.1.7) -- o nível mais seguro de update, já que
#   costuma ser só correção de bug, sem funcionalidade nova.
# - Deixa de fora (só lista no e-mail, não aplica nada) qualquer mudança
#   de versão maior ou menor (ex: 3.14.1 -> 4.2.3, ou 11.0.1 -> 11.1.0)
#   -- é onde mudança que quebra o site costuma acontecer, e esse
#   projeto não tem staging pra testar antes. Fica pra revisão manual.
# Depois de atualizar, confere se a home ainda responde 200 e avisa em
# destaque no e-mail se não responder. O próprio wp-cli já coloca o site
# em modo de manutenção durante o update de cada plugin, então o momento
# da troca de arquivos já é coberto por ele.
set -eu

CONTAINER=gr_wordpress
TO=rodolfo@grcartuchos.com.br
SITE_URL=https://grcartuchos.com.br/
LOG_PREFIX="$(date -Iseconds)"
TMP_BODY=/tmp/gr-plugin-update-body.txt
TMP_PHP=/tmp/gr-plugin-update-mail.php

majmin() {
  printf '%s\n' "$1" | awk -F. '{print $1"."$2}'
}

CSV=$(docker exec "$CONTAINER" wp --allow-root plugin list --update=available --format=csv 2>&1 | awk '/^PHP: /{exit} {print}')
LINE_COUNT=$(printf '%s\n' "$CSV" | grep -c . || true)

if [ "$LINE_COUNT" -le 1 ]; then
  echo "$LOG_PREFIX nenhuma atualização de plugin pendente"
  exit 0
fi

AUTO_SLUGS=""
AUTO_LINES=""
REVIEW_LINES=""

OLDIFS=$IFS
IFS='
'
first=1
for line in $CSV; do
  if [ "$first" -eq 1 ]; then
    first=0
    continue
  fi
  name=$(printf '%s' "$line" | cut -d, -f1)
  version=$(printf '%s' "$line" | cut -d, -f4)
  update_version=$(printf '%s' "$line" | cut -d, -f5)
  if [ "$(majmin "$version")" = "$(majmin "$update_version")" ]; then
    AUTO_SLUGS="$AUTO_SLUGS $name"
    AUTO_LINES="$AUTO_LINES
- $name: $version -> $update_version"
  else
    REVIEW_LINES="$REVIEW_LINES
- $name: $version -> $update_version"
  fi
done
IFS=$OLDIFS

UPDATE_RESULT=""
if [ -n "$AUTO_SLUGS" ]; then
  echo "$LOG_PREFIX atualizando automaticamente:$AUTO_SLUGS"
  # || true: um plugin falhar não pode derrubar o script antes do e-mail
  # sair -- set -e mataria o script aqui e a checagem/aviso nunca rodaria.
  UPDATE_RESULT=$(docker exec "$CONTAINER" wp --allow-root plugin update $AUTO_SLUGS --format=json 2>&1 | awk '/^PHP: /{exit} {print}') || true
  echo "$UPDATE_RESULT"
fi

HEALTH_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$SITE_URL" || echo "000")
echo "$LOG_PREFIX health check: HTTP $HEALTH_CODE"

{
  echo "Atualização diária de plugins - grcartuchos.com.br"
  echo ""
  if [ "$HEALTH_CODE" != "200" ]; then
    echo "ATENÇÃO: a home do site respondeu HTTP $HEALTH_CODE depois da checagem/atualização. Verifique o site AGORA."
    echo ""
  fi
  if [ -n "$AUTO_SLUGS" ]; then
    echo "Atualizados automaticamente (mudança só de patch, versão principal e secundária iguais):"
    printf '%s\n' "$AUTO_LINES"
    echo ""
    echo "Resultado do wp-cli:"
    printf '%s\n' "$UPDATE_RESULT"
    echo ""
  fi
  if [ -n "$REVIEW_LINES" ]; then
    echo "Precisam de revisão manual (mudança de versão principal ou secundária, não atualizado sozinho):"
    printf '%s\n' "$REVIEW_LINES"
    echo ""
  fi
  echo "Aplique as de revisão manual pelo wp-admin ou wp-cli quando revisar."
} > "$TMP_BODY"

cat > "$TMP_PHP" <<'PHP'
<?php
$to = $args[0];
$body = file_get_contents($args[1]);
wp_mail($to, 'Atualização diária de plugins - GR Cartuchos', $body);
echo "mail queued\n";
PHP

docker cp "$TMP_BODY" "$CONTAINER":/tmp/gr-plugin-update-body.txt
docker cp "$TMP_PHP" "$CONTAINER":/tmp/gr-plugin-update-mail.php
docker exec "$CONTAINER" wp --allow-root eval-file /tmp/gr-plugin-update-mail.php "$TO" /tmp/gr-plugin-update-body.txt 2>&1 | awk '/^PHP: /{exit} {print}'
docker exec "$CONTAINER" rm -f /tmp/gr-plugin-update-body.txt /tmp/gr-plugin-update-mail.php
rm -f "$TMP_BODY" "$TMP_PHP"
