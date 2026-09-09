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
EM ANDAMENTO — dono confirmou que o Codex não está trabalhando no site
hoje, então vou modernizar a home (autorizado explicitamente a mexer
no que antes tinha deixado pendente: o widget de hero em progresso
`304f147` e o `aggregateRating` duplicado ainda vivo em `d5df1fe`).
Antes disso já tinha: corrigido um H1 duplicado na home ("Tome um
café"), e feito análise dos concorrentes JS Sistema/Star Cópias +
upgrade visual (card de preço, Offer no schema, hero premium) nas 21
páginas "distantes". Esse mesmo padrão de preço/Offer/visual ainda não
foi levado pras outras ~89 páginas já reescritas. Auditoria original
das 113 páginas doorway está com todo item resolvido. Retrofit
pendente: uma 2ª frase-modelo duplicada nunca tratada nos lotes 1-9.

**Também achei hoje (não relacionado ao site): o servidor sofreu um
OOM kill real (~13:22 UTC) que matou o MySQL e o Apache por falta de
memória — sem swap configurado. Site se recuperou sozinho, nada
perdido, mas é um risco real de estabilidade que vale o Codex ou o
dono resolver (adicionar swap é a correção mais simples).**

Ver CLAUDE.md.

## Codex
(livre)
