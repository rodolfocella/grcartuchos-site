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
- **DNS já cortado e HTTPS real no ar.** `grcartuchos.com.br` responde 200
  em `https://` com certificado Let's Encrypt válido (`www` redireciona pro
  domínio principal); `api.grcartuchos.com.br` também tem certificado
  próprio para a API dos coletores (ver seção "Coletores" abaixo).

## Corte de DNS (concluído em 2026-09-07)

O domínio estava registrado no Registro.br com nameservers apontando pra
Cloudflare (`hadlee.ns.cloudflare.com`, `shane.ns.cloudflare.com`) — sem
login conhecido dessa conta Cloudflare. Em vez de tentar recuperar acesso à
Cloudflare **ou** cadastrar o domínio numa conta de terceiro (a ideia
original de usar o DNS da Hostinger foi abandonada por exigir cadastrar o
domínio lá antes — a API retorna `404 Domain not found` pra qualquer domínio
que não esteja na conta), o caminho usado foi mais simples: trocar os
nameservers para os do **próprio Registro.br** (`d.sec.dns.br` /
`f.sec.dns.br`), que já suporta editar a zona DNS diretamente no painel do
domínio, sem precisar de nenhum provedor terceiro.

**Registros recriados na zona do Registro.br** (o inventário original foi
levantado via `dig`, domínio público, sem precisar de acesso à Cloudflare):

| Tipo | Nome | Valor | Observação |
|---|---|---|---|
| A | `grcartuchos.com.br` | `82.25.76.130` (VPS) | Site migrado pra cá |
| A | `www.grcartuchos.com.br` | `82.25.76.130` | Redireciona pro domínio principal |
| A | `api.grcartuchos.com.br` | `82.25.76.130` | API dos coletores (`/contador`) |
| A | `mail.grcartuchos.com.br` | `162.241.203.10` (HostGator) | Servidor de e-mail, não migrado |
| A | `pdv.grcartuchos.com.br` | `162.241.203.10` (HostGator) | Sistema legado, não migrado |
| A | `www.pdv.grcartuchos.com.br` | `162.241.203.10` (HostGator) | idem |
| MX | `grcartuchos.com.br` | `1 mail.grcartuchos.com.br.` | Mantido igual |
| TXT | `grcartuchos.com.br` (SPF) | `v=spf1 a mx include:websitewelcome.com ~all` | Mantido igual |
| TXT | `default._domainkey` (DKIM) | (chave RSA, ver zona) | **Foi esquecido na primeira leva e faltou** — causou um período sem DKIM até ser notado e recriado com o valor exato copiado da Cloudflare antes da troca. Se o DNS de um domínio for cortado de novo no futuro, DKIM é fácil de esquecer porque não aparece em nenhum lugar óbvio (não é A/MX) — sempre conferir explicitamente com `dig TXT default._domainkey.<dominio>` antes e depois do corte. |

**Ainda não recriados** (existiam apontando pra HostGator via Cloudflare,
baixo risco mas afetam conveniência): `autodiscover`, `autoconfig`,
`webmail`, `cpanel`, `ftp` — todos deveriam apontar para `162.241.203.10`
(mesmo IP do `mail`/`pdv`) se forem recriados.
