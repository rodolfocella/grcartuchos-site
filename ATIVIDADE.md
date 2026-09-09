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
(livre) — última coisa feita: modernização da home completa. Fiz um
tour visual das ~29 seções (a maioria já estava ótima) e achei/corrigi
3 problemas reais: bug de markdown (`**texto**` aparecendo literal em
vez de negrito, em 2 widgets) e 2 seções datadas ("Multifuncional
Laser Monocromática" e "Tome um café") sem badge/card/CTA, agora no
mesmo padrão visual do resto da home. Antes disso: corrigido o schema
duplicado (LocalBusiness+aggregateRating em `d5df1fe`, conteúdo visível
preservado) e um H1 duplicado. Análise dos concorrentes JS
Sistema/Star Cópias + upgrade visual (preço, Offer, hero premium) nas
21 páginas "distantes" ainda não foi levado pras outras ~89 páginas já
reescritas — oportunidade pendente. Auditoria original das 113 páginas
doorway está com todo item resolvido. Retrofit pendente: uma 2ª
frase-modelo duplicada nunca tratada nos lotes 1-9.

**Também achei (não relacionado ao conteúdo do site): o servidor
sofreu um OOM kill real (~13:22 UTC) que matou o MySQL e o Apache por
falta de memória — sem swap configurado. Site se recuperou sozinho,
nada perdido, mas é um risco real de estabilidade que vale o Codex ou
o dono resolver (adicionar swap é a correção mais simples). Ver seção
"Real VPS outage" no CLAUDE.md.**

Ver CLAUDE.md.

## Codex
(livre)
