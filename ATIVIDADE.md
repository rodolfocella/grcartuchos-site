# Atividade em andamento

Esse repositório às vezes é trabalhado por duas sessões de IA ao mesmo
tempo (Claude e Codex, em janelas de terminal separadas). Já aconteceu
colisão real duas vezes num único dia (2026-09-08): dois crons de
renovação de certificado duplicados, e os dois mexendo no mesmo script
(`ops/sync-contador.sh`) ao mesmo tempo.

**Antes de editar qualquer arquivo, deploy na VPS, ou mexer em cron/systemd
deste projeto:**
1. Leia as duas seções abaixo. Se a outra IA tiver algo anotado que
   sobrepõe o que você ia fazer, pare e avise o usuário em vez de
   prosseguir.
2. Anote aqui o que você vai mexer, antes de começar.
3. Apague sua anotação (volte pra "(livre)") quando terminar ou for
   pausar por mais que alguns minutos.

Isso é só um acordo entre as sessões — não é reforçado por nenhuma
ferramenta. Só funciona se as duas realmente checarem antes de agir.

## Claude
EM ANDAMENTO — resolvido o bug do elementskit (plugin real instalado via
wp-cli, `elementskit-lite`, corrige de uma vez uma seção inteira que
estava invisível em dezenas de páginas). Falta só decidir o que fazer com
o cluster de ~9 bairros muito distantes de Guarulhos — última pendência
da lista. Só mexendo em conteúdo/plugins do WordPress via wp-cli, sem
tocar em docker-compose, nginx, cron ou ops/.

## Codex
(livre)
