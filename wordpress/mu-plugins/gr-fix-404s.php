<?php
/**
 * Corrige URLs quebradas reais, encontradas via análise do GA4 + logs do
 * nginx em 2026-09-16 (28 dias, 23 visualizações na página "Não
 * encontrada" - a 2ª página mais vista do site inteiro).
 *
 * 1. Slug antigo com erro de acentuação (i em vez de u): a página
 *    "Aluguel de Impressoras em Gopoúva" tinha o slug
 *    aluguel-de-impressoras-gopoiva-guarulhos - corrigido pro certo,
 *    isso aqui só redireciona quem ainda usa/tem indexado o antigo.
 * 2. Página de produto (Ricoh MP 305SPF) que nunca existiu neste
 *    WordPress (nem em rascunho/lixeira) - redireciona pra categoria
 *    de multifuncionais mono, o mais próximo do que a pessoa procurava.
 * 3. /sistema/consultaimpressoras.php - ferramenta legada do sistema
 *    antigo (HostGator), nunca migrada de propósito, mas ainda recebe
 *    tráfego real (15 acessos/28 dias) - redireciona pra home em vez de
 *    404 seco.
 * 4. Bug de JavaScript (provavelmente do widget de carrinho no menu)
 *    gera links de produto/carrinho terminando em "/null" - pega
 *    QUALQUER URL nesse formato (atual ou futura, enquanto o bug de JS
 *    raiz não é achado e corrigido) e redireciona pra mesma URL sem o
 *    sufixo quebrado.
 */

add_action('template_redirect', function () {
    if (is_admin()) {
        return;
    }

    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $path = parse_url($uri, PHP_URL_PATH);
    if ($path === null) {
        return;
    }

    // Regra 4: sufixo "/null" ou "/null/" quebrado, gerado por bug de JS.
    if (preg_match('#/null/?$#', $path)) {
        $clean = preg_replace('#/null/?$#', '/', $path);
        wp_safe_redirect(home_url($clean), 301);
        exit;
    }

    // Regras 1-3: mapa direto de URL antiga -> nova.
    $redirects = array(
        '/aluguel-de-impressoras-gopoiva-guarulhos/' => '/aluguel-de-impressoras-gopouva-guarulhos/',
        '/impressora-multifuncional-laser-monocromatica-ricoh-mp-305spf/' => '/locacao-de-impressoras-multifuncionais-monocromatica/',
        '/sistema/consultaimpressoras.php' => '/',
    );

    if (isset($redirects[$path])) {
        wp_safe_redirect(home_url($redirects[$path]), 301);
        exit;
    }
});
