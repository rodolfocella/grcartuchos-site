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
(livre) — última coisa feita: backup diário completo da VPS pronto e
testado ponta a ponta. VPS gera `/root/backups/vps-full-backup.tar.gz`
(6,4GB) + `/root/db-dumps/all-databases.sql` (411MB) todo dia às 2h via
`/etc/cron.d/gr-full-vps-backup` (não mexi em nenhum cron já existente,
só adicionei um novo). O Mac do dono puxa isso às 9h via LaunchAgent +
rsync, sempre sobrescrevendo a cópia local anterior (mesmo
comportamento do snapshot semanal da Hostinger, só que diário e fora
da VPS). Detalhes técnicos e descoberta do bug do rsync antigo do
macOS no CLAUDE.md.

Antes disso: trocada a lista estática de 105 bairros
na home (antes do rodapé) por um campo de busca com autocomplete
(digita e filtra em tempo real, sem backend, mesmos 105 links reais
reaproveitados). Testado ao vivo: busca funciona, navegação por
teclado, mobile responsivo.

Antes disso: levado o padrão de hero premium (badge, checklist, stats,
card de preço R$69+R$0,05/pág, CTA gradiente) + Offer no schema.org
pras 82 páginas dos lotes 1-9 (todas confirmadas, ao vivo). Com isso,
103 das páginas de bairro (82+21) têm o mesmo padrão visual premium e
preço visível. Só faltam as 4 páginas não-padrão + Ponte Rasa/Vila
Sônia (que já têm hero próprio diferente) e os 3 hubs (tipo de página
diferente) — de propósito fora desse padrão.

Antes disso: modernização da home completa. Fiz um
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
