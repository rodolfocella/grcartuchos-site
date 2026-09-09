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
(livre) — última coisa feita: análise dos concorrentes JS Sistema e
Star Cópias (nosso SEO on-page já está à frente dos dois — eles têm
bugs reais: JS sem H1, Star sem schema.org nenhum e duas tags <title>
na mesma página). Com base nisso, adicionei nas 21 páginas "distantes":
card de preço visível no hero (R$69/mês + R$0,05/página, confirmado
pelo dono) + Offer no schema.org (mesmo padrão já usado na página
flagship de Guarulhos). Também fiz upgrade visual do hero (gradientes,
formas decorativas, stats tipo glass) inspirado no site da Simpress.
Esse mesmo padrão (preço + Offer + visual novo) ainda não foi levado
pras outras ~89 páginas já reescritas — oportunidade pendente.
Auditoria original das 113 páginas doorway está com todo item
resolvido. Retrofit pendente: uma 2ª frase-modelo duplicada nunca
tratada nos lotes 1-9. Ver CLAUDE.md.

## Codex
(livre)
