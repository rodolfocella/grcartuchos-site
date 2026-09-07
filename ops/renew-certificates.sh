#!/bin/sh
set -eu

docker run --rm \
  -v zap-agenda_certbot_www:/var/www/certbot \
  -v zap-agenda_certbot_conf:/etc/letsencrypt \
  certbot/certbot renew --quiet

docker exec zap_nginx nginx -s reload
