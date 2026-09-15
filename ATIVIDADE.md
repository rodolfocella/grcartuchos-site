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
(livre) — 2026-09-15, continuação: **mais um bug real de UX achado pelo dono.**
Versão em produção: `1.1.16`.

- Print real (não cache antigo — confirmei checando o JS ao vivo antes de
  mexer) mostrando: depois de já ter trocado mensagens no chat e clicar em
  "Quero um orçamento de locação", o histórico de conversa continuava
  visível ocupando quase todo o painel, e o formulário (título "Orçament...")
  ficava espremido lá embaixo, só dando pra ver o campo "Seu nome". Causa:
  `#gr-chat-messages` nunca era escondido ao abrir um formulário, só
  `quickActions`. Corrigido: `leadOpen`/`contactOpen` agora escondem as
  mensagens também, e `resetToChat()` (botão voltar, envio com sucesso,
  fechar o balão) volta a mostrá-las.
- Commit `1113ff2`. Backup em
  `/root/backups/siteatende-20260915T0551Z-claude-hide-messages/`.

(livre) — 2026-09-15, continuação: **regra de roteamento para WhatsApp e mais
dois fatos do negócio.** Versão em produção: `1.1.15`.

- O dono pediu: cliente que já tem impressora alugada e liga com problema/
  chamado técnico não deve ser levado ao formulário do chat — deve ir direto
  pro WhatsApp comercial (11) 99200-6743, que é o canal de suporte de quem já
  é cliente. Adicionei isso como regra 12 do system prompt (exceção explícita
  à regra 10, que só manda pro formulário). Também vim a saber que o balcão da
  loja faz impressão avulsa e vende cartucho — para essas duas coisas o
  cliente precisa ir até a loja ou ligar no WhatsApp, então isso entrou na
  base factual.
- Testado ao vivo contra o endpoint `/chat` antes do commit: pergunta de
  "já sou cliente, impressora alugada, quero abrir chamado" → respondeu
  certo, mandou pro WhatsApp sem tentar coletar dado nenhum. Pergunta de
  impressão avulsa/venda de cartucho → respondeu certo, mandou pra loja ou
  pro WhatsApp. Uma terceira pergunta de controle (não-cliente querendo
  comprar cartucho) confirmou que o fluxo normal do formulário continua
  intacto.
- Commit `90e0b6a`. Backup em
  `/root/backups/siteatende-20260915T05*-claude-whatsapp-rule/`.

(livre) — 2026-09-15, continuação: **dois bugs reais achados pelo dono ao
testar, mais a base factual da loja.** Versão em produção: `1.1.14`.

- Ao abrir qualquer formulário (orçamento ou o novo de contato), não tinha
  como voltar pro chat — nem "Voltar", nem fechar e reabrir o balão. Agora
  os dois formulários têm um "←" no cabeçalho, e fechar o balão também
  volta pro chat sozinho.
- Testei o agente com perguntas reais de cliente: acertou serviços, marcas,
  preço (como referência), recusou marca/serviço que não fazem (sem
  inventar) — só achei que ele "chutou" os dias da semana da loja quando
  perguntado. O dono confirmou os dias e adicionei à base factual, junto
  com horário (seg-sex, 9h-18h), endereço, telefone fixo e o que funciona
  na loja física (suporte remoto, despacho por motoboy, balcão com venda
  de insumos e manutenção presencial Epson). Testado de novo depois: o
  agente parou de inventar e passou a responder certo.
- Commit `d19f8a7`. Backups em
  `/root/backups/siteatende-20260915T051*-claude-*`.

(livre) — 2026-09-15: **segundo fluxo "Falar com um atendente" no
`siteatende`, mais um bug real corrigido no processo.** Versão em
produção: `1.1.8`.

- Novo botão, separado do "Quero um orçamento de locação" (que continua
  idêntico). Pergunta o canal preferido — WhatsApp, e-mail ou ligação — e
  só mostra/exige o campo daquele canal (telefone, e-mail, ou telefone +
  melhor horário). Mesmo endpoint (`POST /lead`, campo `type`), mesmo
  destino `janaine@grcartuchos.com.br`, mesmo limite de tentativas e
  honeypot do formulário de orçamento. Testado ao vivo pelos 3 canais e
  confirmado: o e-mail de teste chegou de verdade na caixa da Janaine
  (`lmtp(janaine@grcartuchos.com.br): stored mail into mailbox 'INBOX'`
  no log do `gr_mail`, às 01:57 UTC) — pode apagar, está marcado como
  TESTE.
- **Bug real e já existente antes de eu mexer** (confirmado por captura de
  tela do site como estava, e por print que o dono mandou do celular): o
  balão do chat abria sozinho, por cima do conteúdo, em toda visita, e o
  X não fechava de verdade. Causa: `#gr-chat-panel { display:flex }` é
  uma regra por ID que vence a regra padrão do navegador para o atributo
  `hidden` — então esconder o painel nunca teve efeito visual algum, só
  no atributo. Corrigido com `#gr-chat-panel[hidden] { display:none }`,
  mesmo padrão já usado nos outros elementos do widget. Confirmado ao
  vivo: fechado por padrão, e o X fecha de verdade.
- Commits: `c3b7562` (1.1.6 da Codex, só posto no git agora),
  `43ca840` (o novo fluxo), `64b2520` (a correção do painel). Backups em
  `/root/backups/siteatende-20260915T0455Z-claude/` e
  `siteatende-20260915T0502Z-claude-panelfix/`.
- `wp-cli` tinha sumido do container `gr_wordpress` (perdido numa
  recriação, como o README já avisava) — reinstalado a partir da cópia
  salva em `/root/backups/gr-rename-20260913T0238Z/wp-cli.phar`.

(livre) — tela administrativa adicionada ao plugin do assistente da GR Cartuchos para selecionar o provedor LLM e o modelo correspondente; o endpoint usa a configuração salva sem editar código. Padrão validado: Groq + `openai/gpt-oss-20b`. Também corrigido o fallback do chat causado por um header `X-WP-Nonce` vazio que gerava HTTP 403 no navegador. Leads agora são enviados para `janaine@grcartuchos.com.br`; remetente técnico permanece `rodolfo@grcartuchos.com.br`.

(livre) — última coisa feita: backup diário completo da VPS ficou
pronto e testado ponta a ponta, mas por pedido do dono o agendamento
automático foi DESATIVADO no mesmo dia (removido o cron na VPS e
descarregado o LaunchAgent no Mac) — os dois scripts continuam
intactos e funcionando, só não rodam mais sozinhos. Em vez disso,
criado `~/VPS-Backups/run-backup-now.sh` no Mac do dono: um único
comando (`bash ~/VPS-Backups/run-backup-now.sh`) que gera o backup na
VPS e já puxa pro Mac, para rodar sob demanda quando o dono avisar.
VPS gera `/root/backups/vps-full-backup.tar.gz` (6,4GB) +
`/root/db-dumps/all-databases.sql` (411MB); Mac sempre sobrescreve a
cópia local anterior (mesmo comportamento do snapshot semanal da
Hostinger). Detalhes técnicos e descoberta do bug do rsync antigo do
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
(livre) — 2026-09-14: retomada do `siteatende` concluída e publicada como
versão `1.1.5`. O plugin normal foi consolidado no repositório; recebeu base
factual editável, memória das oito últimas mensagens, respostas sem Markdown,
limites de tamanho/frequência, honeypot e escape das configurações exibidas.
Groq + `openai/gpt-oss-20b` foi validado em produção com perguntas sobre
serviços e preço; OpenAI e Gemini continuam implementados, mas estão sem chave
no servidor e isso agora aparece no painel sem revelar valores. Layout do chat
e formulário conferido em 1440×900 e 390×568 após limpar o cache do WP Rocket.
Backups para rollback: `/root/backups/siteatende-20260914-codex-{113,114,115}`.
Somente arquivos do plugin da GR foram publicados; nenhum container, banco,
nginx, PDV, coletor ou serviço do Atende Zap Brasil foi alterado.
