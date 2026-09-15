<?php
/**
 * O header sitewide (elementor_library post 522) ganhou um ícone de
 * carrinho + "Minha conta" reais -- antes não existia nenhum ícone de
 * carrinho de verdade, só um link de texto "Comprar na loja" escondido
 * num submenu, e o GA4 confirmou que ninguém estava adicionando produto
 * ao carrinho (0% de 128 sessões). Esse mu-plugin faz o contador do
 * carrinho (".h-cart-count", no header) funcionar de verdade:
 *
 * 1. Garante que o wc-cart-fragments carregue em toda página -- por
 *    padrão o WooCommerce só carrega ele perto de página de loja/conta,
 *    mas o header (com o ícone) aparece em toda página do site.
 * 2. Registra o fragmento do contador customizado, pra ele atualizar
 *    sozinho via AJAX sempre que alguém adiciona um produto ao carrinho,
 *    sem precisar recarregar a página.
 */

add_action('wp_enqueue_scripts', function () {
    if (!is_admin() && function_exists('WC')) {
        wp_enqueue_script('wc-cart-fragments');
    }
}, 20);

add_filter('woocommerce_add_to_cart_fragments', function ($fragments) {
    $count = (function_exists('WC') && WC()->cart) ? WC()->cart->get_cart_contents_count() : 0;
    $style = $count > 0 ? '' : ' style="display:none"';
    $fragments['.h-cart-count'] = '<span class="h-cart-count"' . $style . '>' . esc_html($count) . '</span>';
    return $fragments;
});
