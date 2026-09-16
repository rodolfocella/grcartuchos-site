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
EM ANDAMENTO (2026-09-16): **página dedicada `/contato`**, a pedido do
dono, reaproveitando o mesmo endpoint `POST /wp-json/siteatende/v1/lead`
(`type: "contato"`) que o widget de chat já usa no fluxo "Falar com um
atendente" — sem tocar no plugin `siteatende` nem no widget existente,
só uma página nova que chama o mesmo endpoint.

(livre) — 2026-09-15, continuação: **e-mail de "novo pedido" do
WooCommerce agora avisa a Janaine.** O dono pediu que toda venda gere
aviso por e-mail pra `janaine@grcartuchos.com.br`. O WooCommerce já tem
esse e-mail nativo ("New order"), só que ia pro e-mail pessoal do dono
(`rodolfocella@gmail.com`, o `admin_email` do site) — troquei o
destinatário configurado (`woocommerce_new_order_settings['recipient']`,
**não** a option solta `woocommerce_email_recipient_new_order`, que o
WooCommerce não lê de verdade — essa é só um resquício/opção não usada).

- **Achado real no processo**: coloquei `janaine@grcartuchos.com.br` e
  `rodolfocella@gmail.com` juntos no mesmo campo (separado por vírgula)
  numa primeira tentativa — e o e-mail parou de chegar pros DOIS. Causa:
  esse servidor de e-mail (relay interno usado pelo `wp_mail()`, mesmo
  usado pelos leads do siteatende) só entrega pra caixa hospedada aqui
  (`@grcartuchos.com.br`) — não é um relay de saída de verdade pra
  provedor externo tipo Gmail. Quando um destinatário externo está no
  mesmo envio que um interno, a rejeição do externo derruba o e-mail
  inteiro, os dois ficam sem receber. Corrigido deixando só
  `janaine@grcartuchos.com.br` no campo.
- Testado de ponta a ponta 4 vezes com pedido real (criado e depois
  apagado via `wc_create_order()`/`WC_Order::delete(true)`, todos
  marcados "TESTE" no nome): a versão final entregou de verdade — achei
  os 2 e-mails de teste na pasta `cur/` do Maildir da Janaine (não
  `new/` — o cliente de e-mail dela deve estar sincronizando na hora).
  Marcados como teste, ela pode apagar.
- **Vale saber pra qualquer notificação futura por e-mail nesse site**:
  esse relay não alcança e-mail externo (Gmail, Outlook, etc.) — só
  endereços `@grcartuchos.com.br`. Um destinatário externo misturado
  com um interno no mesmo envio derruba os dois.

(livre) — 2026-09-15, continuação: **ícone de carrinho + Minha conta
reais no header, e achado real via GA4.** O dono liberou acesso de
leitura do GA4 no Site Kit (precisou conceder permissão adicional pelo
painel — acesso programático via `wp eval`/REST continua bloqueado por
algum motivo não identificado, mas o dono consegue ver os relatórios no
`wp-admin` normalmente e colar aqui).

- Relatório real de "Conteúdo principal" (28 dias, 128 sessões) mostrou
  **0% de taxa de "adicionar ao carrinho"** mesmo com a loja já
  conectada e produtos com bom engajamento onde aparecem (ex:
  `/toner-para-impressora/`: 75% engajamento, 2min26s de sessão média).
  Causa provável: não existia ícone de carrinho nenhum no site, só um
  link de texto "Comprar na loja" escondido num submenu.
- Um achado inicial ("página quebrada recebendo tráfego real",
  `/sistema/consultaimpressoras.php`) foi checado e **descartado**: só 2
  acessos nos logs dos últimos 30 dias, ambos parecendo teste (um
  provavelmente meu). Registrando aqui pra não reaparecer como "achado"
  numa sessão futura sem essa checagem de novo.
- Também identificado (não é um bug, é esperado): os números de sessão
  curta/pouco engajamento de hoje estão contaminados pelas várias
  limpezas de cache que fiz hoje mesmo (confirmei: a mesma página caiu
  de 20s pra 71ms de carregamento entre duas tentativas seguidas, cache
  frio vs quente). Recomendei esperar a métrica de páginas com saída
  rápida se estabilizar por uns dias antes de agir em cima dela.
- **Corrigido o achado sólido**: adicionado link "Carrinho" (com
  contador ao vivo via AJAX) + "Minha conta" no header sitewide
  (`elementor_library` post 522 — conteúdo de página, editado direto no
  banco, não versionado neste repo). Primeira versão colocou os dois
  como um bloco `.h-actions` separado (pra não ficarem escondidos no
  celular, já que `.h-side`, onde ficam selo do Google e botão de
  WhatsApp, some inteiro abaixo de 980px); o dono pediu pra ficarem
  dentro do próprio menu principal em vez disso, e a versão final é
  assim: dois `<li>` novos no final do `<ul>` do menu, com a mesma
  classe `.h-link` de todo link do menu — mais simples e resolve o
  problema do celular de graça, já que a gaveta mobile já mostra todo
  `.h-link` normalmente.
- **Incidente real no meio do caminho, causado por mim**: a primeira
  tentativa salvou o header via `wp eval-file` sem `--user=1`, e o
  WordPress descartou a tag `<style>` inteira do conteúdo salvo (mesmo
  bug já documentado no CLAUDE.md horas antes, por mim mesmo, numa
  sessão anterior no mesmo dia — só não apliquei o próprio aviso dessa
  vez). Resultado: CSS e comentário interno do header apareceram como
  texto puro pro dono, visível em produção (ele mandou print). Corrigido
  em duas etapas: (1) restaurado o backup pré-edição com `--user=1` +
  `wp_set_current_user(1)` de verdade, confirmando `<style>` intacto
  antes de seguir; (2) refeita a adição do carrinho/conta do jeito
  pedido (menu, não bloco separado), com a mesma autenticação e uma
  verificação explícita pós-save (tag `<style>` e os dois links
  presentes) antes de considerar concluído. Backup do estado limpo em
  `/root/backups/header-cart-20260915T1409Z/elementor_data_522.json`.
- `wordpress/mu-plugins/gr-header-cart.php` (novo, commit `4872791`,
  comentário atualizado no commit seguinte pra refletir a posição final
  como itens de menu): garante que o script `wc-cart-fragments` carregue
  em toda página (por padrão só carrega perto de loja/conta) e registra
  o fragmento do seletor `.h-cart-count` pra atualizar sozinho via AJAX.
  Testado com um POST real em `?wc-ajax=add_to_cart` (duas vezes, antes
  e depois da mudança de layout): devolveu o fragmento certo nas duas.
- **Gotcha novo, documentado no CLAUDE.md**: `wp post meta get <id>
  _elementor_data` (o jeito usado a sessão inteira até agora pra ler/
  fazer backup desse tipo de conteúdo) **não devolve o valor bruto** —
  o wp-cli normaliza/re-escapa o JSON pra exibição (achei 36238 bytes
  via `wp post meta get`, contra 36387 bytes reais via `get_post_meta()`
  direto em PHP). Pra edição por string-splice (a técnica segura já
  estabelecida hoje) isso importa: usei `wp eval`/`file_put_contents`
  pra pegar o valor cru de verdade antes de editar, não `wp post meta
  get`. Backup de verdade em
  `/root/backups/header-cart-20260915T1409Z/elementor_data_522.json`.

(livre) — 2026-09-15, continuação: **eventos do widget de chat mandados
pro Google Analytics.** O dono pediu pra usar o Site Kit/GA4 (já ativo,
`G-52G3G063PQ`) pra acompanhar interação com o balão. Versão em produção:
`1.1.17`.

- `chat_widget_open` (abriu o balão), `chat_form_started` (abriu
  formulário de orçamento ou contato) e `chat_message_sent` (mandou a
  primeira mensagem, uma vez por sessão) — engajamento, não conversão.
- `generate_lead` (nome recomendado do GA4) só no envio bem-sucedido de
  cada formulário, com `lead_type` diferenciando orçamento de contato —
  esse sim é o evento de conversão real. Decidido não marcar toda
  interação como "lead" (inflaria/mentiria a métrica) — separei
  engajamento de conversão de propósito.
- `trackEvent()` só chama `gtag` se ele existir, pra não quebrar o widget
  se um bloqueador de anúncio remover o Analytics.
- Ainda falta (não fiz, é passo manual no painel do GA4): marcar
  `generate_lead` como "evento-chave"/conversão no Admin do GA4, pra
  aparecer nos relatórios de conversão. Avisar o dono.
- Commit `a362223`. Backup em
  `/root/backups/siteatende-20260915T13*-claude-ga4/`.

(livre) — 2026-09-15, continuação: **a checagem diária virou atualização
automática, filtrada por risco.** O dono pediu pra passar a atualizar de
verdade, não só avisar. Trocado `check-plugin-updates.sh` por
`update-plugins-safe.sh` (mesmo horário, `/etc/cron.d/gr-plugin-auto-update`):
- Atualiza sozinho só quando é mudança de patch (major.minor da versão
  igual, ex: 4.1.6 → 4.1.7). Qualquer salto de versão maior ou menor
  (ex: WooCommerce 11.0.1 → 11.1.0, Elementor Pro 3.14.1 → 4.2.3) fica só
  no e-mail — esse projeto não tem staging, então update grande direto em
  produção é risco demais pra automatizar sem revisão.
- Depois de atualizar, confere se a home responde 200 e avisa em destaque
  no e-mail se não responder.
- Testado ao vivo, de verdade, em produção (o dono topou o risco dessa
  primeira rodada): 9 plugins atualizados com sucesso (cookie-law-info,
  elementskit-lite, essential-addons-for-elementor-lite,
  google-listings-and-ads, royal-elementor-addons, astra-sites,
  templately, wordfence, insert-headers-and-footers), 4 de risco maior
  deixados de fora (astra-addon, elementor-pro, jetpack, woocommerce),
  site respondeu 200 antes e depois (home, `/shop/`,
  `/toner-para-impressora/`), e-mail chegou.
- Commit `c785a38`.

(livre) — 2026-09-15: **cron diário de checagem de atualização de plugin do
WordPress.** O dono pediu um `/loop` pra isso; expliquei que rotina na
nuvem do Claude não alcança a VPS via SSH (só repositório git + conector
do claude.ai), então virou um cron de verdade na VPS em vez de qualquer
coisa ligada a sessão de IA — mais confiável e não depende de nenhuma
sessão ficar aberta.

- `ops/check-plugin-updates.sh` roda `wp plugin list --update=available`
  dentro do `gr_wordpress` e só manda e-mail (via `wp_mail`, mesmo relay
  SMTP dos leads do siteatende) quando tem algo pendente — não aplica
  nada sozinho. Instalado em `/etc/cron.d/gr-plugin-update-check`, `0 11
  * * *` (08h São Paulo). Confirmei que não existia nada parecido antes de
  instalar (checei `/etc/cron.d/` e `crontab -l` primeiro).
- Testado manualmente antes de instalar o cron: achou 13 plugins
  desatualizados agora mesmo (astra-addon, elementor-pro, jetpack,
  woocommerce, wordfence, etc.) e o e-mail chegou de verdade — confirmei
  olhando o arquivo novo no Maildir do `gr_mail`, não só o retorno de
  `wp_mail()` (o `docker logs gr_mail` não mostra esse tipo de entrega,
  não é confiável pra esse tipo de checagem).
- Commit `1cd73a1`.

(livre) — 2026-09-15: **loja WooCommerce ligada ao resto do site**, a pedido
do dono depois de eu conferir e achar que os 38 produtos publicados
(toners, tintas Epson, planos de aluguel) tinham checkout de verdade
funcionando (Mercado Pago: Pix, cartão, boleto) mas nenhuma forma de um
visitante chegar neles navegando — sem página de loja configurada, sem
link em menu nenhum.

- Achado importante logo de cara: o header do site (não é um menu WP
  normal — é um mega menu inteiro escrito à mão num widget HTML do
  template sitewide `elementor_library` post 522, "logo novo", comentário
  interno chamado "HEADER GR CARTUCHOS - VERSÃO 2026") **já tinha um link
  "Comprar na loja" apontando pra `/shop/`**, e até links diretos pra 2
  produtos específicos — só que `/shop/` nunca existiu. Em vez de editar
  esse mega menu (grande, feito por outra sessão, risco maior), criei a
  página em `/shop/` (mesmo slug que o link já esperava) e apontei
  `woocommerce_shop_page_id` pra ela — o link que já existia passou a
  funcionar sem tocar no header.
- Embutido `[products category="..."]` como uma seção nova (só acrescentada,
  nada reestruturado) nas 3 páginas de conteúdo relacionado: toner (26
  produtos), recarga de cartucho → tinta Epson (10 produtos), locação de
  impressoras → os 2 planos de aluguel.
- **Dois bugs reais achados e corrigidos no processo, os dois relevantes pra
  qualquer edição futura de `_elementor_data` neste site:**
  1. Meu primeiro método (decodificar o `_elementor_data` inteiro com
     `json_decode(..., true)` e regravar com `wp_json_encode()`) corrompeu
     silenciosamente TODO `{}` (objeto vazio) da página inteira pra `[]`
     (lista vazia) — PHP não distingue as duas coisas depois de decodificar
     como array associativo. O Elementor descarta em silêncio qualquer
     elemento cujo `settings` vire lista em vez de objeto. Troquei pra uma
     técnica de "colar string": nunca decodificar o documento inteiro, só
     achar o `]` final e inserir `,<novo elemento>` antes dele — preserva
     byte a byte tudo que já existia.
  2. Mesmo com o dado certo salvo, o conteúdo novo não aparecia ao vivo —
     nem limpando o WP Rocket (`rocket_clean_domain()`). Causa: o Elementor
     mantém um cache próprio de renderização/CSS, separado do WP Rocket, que
     só `\Elementor\Plugin::$instance->files_manager->clear_cache()` limpa.
     Necessário rodar os dois depois de qualquer escrita direta em
     `_elementor_data` por fora do editor.
- Verificado ao vivo com fetch/curl (não screenshot): grade de produtos de
  verdade renderizando (preço, botão comprar) nas 3 páginas + `/shop/`,
  nenhum shortcode aparecendo como texto literal, título e tamanho de cada
  página consistentes com conteúdo antigo intacto.
- Backups das 3 páginas antes da edição (dado original, sem corrupção) em
  `/root/backups/woocommerce-embed-20260915T1132Z/`.

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
