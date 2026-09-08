#!/bin/sh
# Renova todos os certificados Let's Encrypt compartilhados (volume
# zap-agenda_certbot_conf, usado pelos dois repositórios/domínios nessa
# VPS) e recarrega o nginx compartilhado. Extra: o Poste.io (gr_mail) não
# lê certificado do disco do certbot como o nginx faz — ele espera os
# arquivos copiados manualmente pra dentro de /data/ssl/ (server.crt/
# ca.crt/server.key) e só os recarrega reiniciando o container. Por isso,
# só quando o certificado de mail.grcartuchos.com.br realmente muda
# (comparando antes/depois do renew) é que copiamos de novo e reiniciamos
# o gr_mail — pra não reiniciar o servidor de email todo dia à toa.
set -eu

CERT_FILE=/var/lib/docker/volumes/zap-agenda_certbot_conf/_data/live/mail.grcartuchos.com.br/cert.pem
BEFORE=$(md5sum "$CERT_FILE" 2>/dev/null | cut -d' ' -f1)

docker run --rm \
  -v zap-agenda_certbot_www:/var/www/certbot \
  -v zap-agenda_certbot_conf:/etc/letsencrypt \
  certbot/certbot renew --quiet

docker exec zap_nginx nginx -s reload

AFTER=$(md5sum "$CERT_FILE" 2>/dev/null | cut -d' ' -f1)
if [ "$BEFORE" != "$AFTER" ]; then
  echo "$(date -Iseconds) mail.grcartuchos.com.br cert renewed, updating Poste.io"
  docker run --rm \
    -v zap-agenda_certbot_conf:/etc/letsencrypt:ro \
    -v gr-cartuchos-site_gr_mail_data:/data \
    alpine sh -c "
      cp /etc/letsencrypt/live/mail.grcartuchos.com.br/cert.pem /data/ssl/server.crt &&
      cp /etc/letsencrypt/live/mail.grcartuchos.com.br/chain.pem /data/ssl/ca.crt &&
      cp /etc/letsencrypt/live/mail.grcartuchos.com.br/privkey.pem /data/ssl/server.key &&
      chown mail:mail /data/ssl/server.crt /data/ssl/ca.crt /data/ssl/server.key &&
      chmod 644 /data/ssl/server.crt /data/ssl/ca.crt &&
      chmod 600 /data/ssl/server.key
    "
  docker restart gr_mail
fi
