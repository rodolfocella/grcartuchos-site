# Site institucional da GR Cartuchos

WordPress (WooCommerce + Elementor) do site institucional da **GR Cartuchos e
Suprimentos de Informática LTDA** (`grcartuchos.com.br`), migrado da
hospedagem compartilhada na HostGator para um container Docker na mesma VPS
onde roda o Zap Agenda/ZapAtende, em 2026-09-07.

Este é um repositório separado porque o site institucional é um produto
independente do SaaS (Zap Agenda/ZapAtende) — só compartilha a mesma VPS por
economia de infraestrutura, não faz parte do mesmo produto.

> Nota: no GitHub este repositório se chama `grcartuchos-site` (sem hífen
> entre "gr" e "cartuchos"), mas o diretório local e o caminho na VPS
> (`/root/gr-cartuchos-site`, já referenciado no bind mount do nginx e nos
> comentários deste repositório) usam hífen. É só uma inconsistência de
> nome, não afeta nada — não vale a pena renomear agora e ter que redigitar
> o caminho em produção.

## O que NÃO foi migrado

- `pdv.grcartuchos.com.br` — sistema à parte, com seu próprio docroot na
  HostGator, continua lá por enquanto (migração futura, separada desta).
- Pastas legadas dentro do docroot antigo do site (`sistema/`,
  `painel_cliente/`, `parceiros/`, `cela/`, `ricoh/`, `scaner/`, `toner/`) —
  confirmadas como não utilizadas, não foram trazidas para cá.

## Como isso roda na VPS

Este `docker-compose.yml` sobe **apenas** o WordPress e o MySQL dele
(`zap_wordpress`, `zap_mysql`). Ele depende de dois recursos que já existem
na VPS por terem sido criados originalmente pelo repositório `zap-agenda`
(por isso os volumes/rede aqui são declarados como `external`, referenciando
os nomes exatos que o Compose do zap-agenda gerou:
`zap-agenda_zap_wp_data`, `zap-agenda_zap_mysql_data`,
`zap-agenda_zap_net`):

1. **A rede Docker** `zap-agenda_zap_net` — é nela que o nginx compartilhado
   (`zap_nginx`, definido no repositório `zap-agenda`) alcança
   `zap_wordpress:80` pelo nome do serviço.
2. **O nginx compartilhado em si** — só existe um nginx expondo as portas
   80/443 na VPS (o do `zap-agenda`), então o bloco de servidor deste site
   ([nginx/grcartuchos.conf](nginx/grcartuchos.conf)) precisa ser
   alcançável por aquele container. Isso é feito com um bind mount no
   `docker-compose.yml` do zap-agenda apontando para o caminho onde este
   repositório está clonado na VPS, por exemplo:
   ```yaml
   # trecho do serviço zap_nginx, no repositório zap-agenda
   volumes:
     - /root/gr-cartuchos-site/nginx:/etc/nginx/sites:ro
   ```
   e um `include /etc/nginx/sites/*.conf;` dentro do `http {}` do
   `nginx/nginx.conf` do zap-agenda.

### Deploy / atualização

```bash
cd /root/gr-cartuchos-site
git pull
docker compose --env-file .env up -d
```

Depois de qualquer mudança em `nginx/grcartuchos.conf`, recarregar o nginx
compartilhado (no repositório zap-agenda):

```bash
docker exec zap_nginx nginx -s reload
```

### Acesso ao banco com phpMyAdmin

O phpMyAdmin escuta somente em `127.0.0.1:8083` na VPS e não fica exposto
publicamente. Abra um túnel a partir da sua máquina:

```bash
ssh -N -L 8083:127.0.0.1:8083 root@82.25.76.130
```

Enquanto esse terminal estiver aberto, acesse `http://127.0.0.1:8083` no
navegador. Entre com `MYSQL_USER` e `MYSQL_PASSWORD` definidos no `.env` da
VPS. O usuário root também funciona com `MYSQL_ROOT_PASSWORD`, mas prefira o
usuário restrito da aplicação para operações rotineiras.

### PDV legado

O PDV roda no serviço `pdv`, inicialmente restrito a `127.0.0.1:8084` para
teste por túnel SSH. O diretório `pdv/` e os dumps de banco não pertencem ao
Git porque contêm credenciais e dados de clientes. Enquanto a validação não
terminar, o DNS de `pdv.grcartuchos.com.br` continua apontando para a
HostGator; a cópia da VPS não recebe tráfego real.

As credenciais de banco usadas pelo PHP ficam exclusivamente nas variáveis
`PDV_DB_USER` e `PDV_DB_PASSWORD` do `.env` da VPS. `db_env.php` fornece
esses valores ao legado via `getenv()`; não adicione senhas diretamente aos
arquivos PHP nem volte a preencher `empresas.db_pass` na base matriz.

### Editor de arquivos pelo navegador

O serviço `code-server` oferece um VS Code web com acesso gravável somente a
`site-wordpress/` e `pdv/`. Ele escuta em `127.0.0.1:8085` na VPS e exige a
senha `CODE_SERVER_PASSWORD` do `.env`. Abra por túnel SSH:

```bash
ssh -N -L 8085:127.0.0.1:8085 root@82.25.76.130
```

Depois acesse `http://127.0.0.1:8085`. O socket do Docker, o `.env` e os dumps
de banco não são montados no editor.

## Estado atual (2026-09-07)

- wp-content (2GB) e banco de dados (380MB, prefixo de tabela `wpga_`) já
  importados e funcionando no container.
- `php-overrides.ini` sobe o `memory_limit` do PHP para 512M — o padrão de
  128M não é suficiente pro WooCommerce/Elementor.
- Nginx só em HTTP puro (`listen 80`) — **ainda sem DNS real apontando pra
  VPS**, então sem certificado TLS ainda. Verificado funcionando via
  `curl --resolve grcartuchos.com.br:80:<IP-da-VPS> http://grcartuchos.com.br/`
  e visualmente via `agent-browser` com `--host-resolver-rules`, sem tocar
  em DNS real.

## Corte de DNS pendente

O domínio está registrado no Registro.br com nameservers apontando pra
Cloudflare (`hadlee.ns.cloudflare.com`, `shane.ns.cloudflare.com`) — sem
login conhecido dessa conta Cloudflare. Decisão tomada: trocar os
nameservers do domínio para os da Hostinger no Registro.br, em vez de tentar
recuperar o acesso à Cloudflare.

**Pré-requisito**: o domínio `grcartuchos.com.br` ainda não está cadastrado
na conta Hostinger (checado via API — só `atendezapbrasil.com.br` aparece no
portfólio). Precisa ser adicionado pelo hPanel (login) antes de qualquer
registro poder ser criado lá.

**Inventário de DNS atual** (consultado via `dig`, domínio público, sem
precisar de acesso à Cloudflare), pra recriar na zona da Hostinger antes de
migrar os nameservers — importante não perder e-mail no meio do caminho:

| Tipo | Nome | Valor atual | O que fazer na Hostinger |
|---|---|---|---|
| A | `@` | 172.67.195.54 / 104.21.90.47 (proxy Cloudflare) | Trocar para o IP da VPS do Zap Agenda (site migrado pra cá) |
| A | `www` | idem | Trocar para o IP da VPS, igual ao `@` |
| A | `mail` | 162.241.203.10 (real, HostGator) | Manter apontando pro mesmo IP da HostGator |
| A | `pdv` | proxy Cloudflare (origem real provavelmente 162.241.203.7, mesmo servidor do cPanel) | Manter apontando pra HostGator — confirmar IP exato com o suporte antes de trocar, já que é o sistema em uso |
| A | `cpanel`, `webmail`, `autodiscover`, `autoconfig`, `ftp` | proxy Cloudflare | Manter apontando pra HostGator (mesmo IP real do `mail`/`pdv`) |
| MX | `@` | `mail.grcartuchos.com.br`, prioridade 1 | Manter igual |
| TXT | `@` (SPF) | `v=spf1 a mx include:websitewelcome.com ~all` | Manter igual |
| TXT | `default._domainkey` (DKIM) | ver valor real via `dig TXT default._domainkey.grcartuchos.com.br` | Manter igual, copiar o valor exato |

Depois desses registros recriados e confirmados na zona Hostinger, aí sim
trocar os nameservers no Registro.br. Fazer isso fora de ordem (trocar NS
antes de recriar os registros) derruba o e-mail da empresa até alguém notar
e corrigir.
