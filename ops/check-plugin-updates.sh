#!/bin/sh
# Roda `wp plugin list --update=available` uma vez por dia (instalado via
# /etc/cron.d/gr-plugin-update-check) e manda e-mail pro dono só quando há
# alguma atualização de plugin pendente -- não aplica nada sozinho, só
# avisa pra decisão manual. Reaproveita o wp_mail() já configurado no
# WordPress (mesmo relay SMTP usado pelos leads do siteatende), então não
# depende de nenhum utilitário de e-mail extra no host.
set -eu

CONTAINER=gr_wordpress
TO=rodolfo@grcartuchos.com.br
TMP_BODY=/tmp/gr-plugin-update-body.txt
TMP_PHP=/tmp/gr-plugin-update-mail.php

# O wp-cli desse container escreve um aviso de depreciação (do Elementor)
# direto no stdout, em várias linhas, sem um jeito simples de suprimir --
# a tabela real sempre termina antes da primeira linha "PHP: ...".
OUTPUT=$(docker exec "$CONTAINER" wp --allow-root plugin list --update=available --format=table 2>&1 | awk '/^PHP: /{exit} {print}')
LINE_COUNT=$(printf '%s\n' "$OUTPUT" | grep -c .)

if [ "$LINE_COUNT" -le 1 ]; then
  echo "$(date -Iseconds) nenhuma atualização de plugin pendente"
  exit 0
fi

echo "$(date -Iseconds) atualizações pendentes:"
printf '%s\n' "$OUTPUT"

printf 'Plugins do WordPress com atualização disponível em grcartuchos.com.br:\n\n%s\n\nAplique manualmente pelo wp-admin ou via wp-cli quando revisar.\n' "$OUTPUT" > "$TMP_BODY"

cat > "$TMP_PHP" <<'PHP'
<?php
$to = $args[0];
$body = file_get_contents($args[1]);
wp_mail($to, 'Atualizações de plugin disponíveis - GR Cartuchos', $body);
echo "mail queued\n";
PHP

docker cp "$TMP_BODY" "$CONTAINER":/tmp/gr-plugin-update-body.txt
docker cp "$TMP_PHP" "$CONTAINER":/tmp/gr-plugin-update-mail.php
docker exec "$CONTAINER" wp --allow-root eval-file /tmp/gr-plugin-update-mail.php "$TO" /tmp/gr-plugin-update-body.txt 2>&1 | awk '/^PHP: /{exit} {print}'
docker exec "$CONTAINER" rm -f /tmp/gr-plugin-update-body.txt /tmp/gr-plugin-update-mail.php
rm -f "$TMP_BODY" "$TMP_PHP"
