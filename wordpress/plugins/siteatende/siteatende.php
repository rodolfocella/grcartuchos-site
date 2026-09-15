<?php
/**
 * Plugin Name: siteAtende
 * Description: Widget de atendimento para sites com LLM, texto configurável e formulário de lead.
 * Version: 1.1.7
 * Author: siteAtende
 */

if (!defined('ABSPATH')) {
    exit;
}

define('SITEATENDE_VERSION', '1.1.7');

function siteatende_models()
{
    return array(
        'groq' => array(
            'label' => 'Groq',
            'models' => array('openai/gpt-oss-20b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'),
        ),
        'openai' => array(
            'label' => 'OpenAI',
            'models' => array('gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4o'),
        ),
        'gemini' => array(
            'label' => 'Google Gemini',
            'models' => array('gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'),
        ),
    );
}

function siteatende_get_default_config()
{
    return array(
        'provider' => 'groq',
        'model' => 'openai/gpt-oss-20b',
        'site_name' => 'GR Cartuchos',
        'bot_name' => 'GR Cartuchos',
        'lead_email' => 'janaine@grcartuchos.com.br',
        'logo_url' => 'https://grcartuchos.com.br/wp-content/uploads/2023/08/logo.png.webp',
        'greeting_text' => 'Oi! 👋 Quer saber sobre impressoras, suprimentos ou como começar? Pergunta aí',
        'intro_message' => 'Olá! Como posso ajudar com impressoras, suprimentos e suporte da GR Cartuchos?',
        'lead_button_text' => 'Quero um orçamento de locação',
        'lead_submit_text' => 'Enviar para a equipe comercial',
        'contact_button_text' => 'Falar com um atendente',
        'contact_submit_text' => 'Enviar para a equipe',
        'chat_placeholder' => 'Digite sua mensagem...',
        'success_message' => 'Formulário enviado com sucesso! Nossa equipe entrará em contato em breve.',
        'business_context' => "A GR Cartuchos atua desde 2006 em Guarulhos, São Paulo capital e Grande São Paulo.\n"
            . "Serviços divulgados: locação e outsourcing de impressoras e multifuncionais; gestão e monitoramento do parque; manutenção e suporte técnico; toner, cartuchos, tintas e recargas; assistência técnica Epson; suporte remoto de TI.\n"
            . "Equipamentos e linhas divulgados incluem Canon, Brother, Epson e Ricoh, com opções monocromáticas, coloridas, A4 e A3.\n"
            . "Na locação, a empresa divulga instalação rápida, manutenção e suprimentos conforme o plano, contratos flexíveis e dimensionamento conforme volume e necessidade.\n"
            . "Referência pública de entrada: R$ 69 por mês mais R$ 0,05 por página; o valor final depende do equipamento, volume e projeto e deve ser confirmado pela equipe comercial.\n"
            . "WhatsApp comercial: (11) 99200-6743.",
    );
}

function siteatende_get_config()
{
    $models = siteatende_models();
    $default = siteatende_get_default_config();
    $config = get_option('siteatende_config', array());
    $provider = isset($config['provider']) && isset($models[$config['provider']]) ? $config['provider'] : $default['provider'];
    $model = isset($config['model']) && in_array($config['model'], $models[$provider]['models'], true)
        ? $config['model']
        : $models[$provider]['models'][0];

    return array(
        'provider' => $provider,
        'model' => $model,
        'site_name' => isset($config['site_name']) ? sanitize_text_field($config['site_name']) : $default['site_name'],
        'bot_name' => isset($config['bot_name']) ? sanitize_text_field($config['bot_name']) : $default['bot_name'],
        'lead_email' => isset($config['lead_email']) ? sanitize_email($config['lead_email']) : $default['lead_email'],
        'logo_url' => isset($config['logo_url']) ? esc_url_raw($config['logo_url']) : $default['logo_url'],
        'greeting_text' => isset($config['greeting_text']) ? sanitize_text_field($config['greeting_text']) : $default['greeting_text'],
        'intro_message' => isset($config['intro_message']) ? sanitize_text_field($config['intro_message']) : $default['intro_message'],
        'lead_button_text' => isset($config['lead_button_text']) ? sanitize_text_field($config['lead_button_text']) : $default['lead_button_text'],
        'lead_submit_text' => isset($config['lead_submit_text']) ? sanitize_text_field($config['lead_submit_text']) : $default['lead_submit_text'],
        'contact_button_text' => isset($config['contact_button_text']) ? sanitize_text_field($config['contact_button_text']) : $default['contact_button_text'],
        'contact_submit_text' => isset($config['contact_submit_text']) ? sanitize_text_field($config['contact_submit_text']) : $default['contact_submit_text'],
        'chat_placeholder' => isset($config['chat_placeholder']) ? sanitize_text_field($config['chat_placeholder']) : $default['chat_placeholder'],
        'success_message' => isset($config['success_message']) ? sanitize_text_field($config['success_message']) : $default['success_message'],
        'business_context' => isset($config['business_context']) ? sanitize_textarea_field($config['business_context']) : $default['business_context'],
    );
}

function siteatende_sanitize_config($value)
{
    $models = siteatende_models();
    $default = siteatende_get_default_config();
    $provider = sanitize_key($value['provider'] ?? $default['provider']);
    $model = sanitize_text_field($value['model'] ?? '');

    if (!isset($models[$provider])) {
        $provider = $default['provider'];
    }
    if (!in_array($model, $models[$provider]['models'], true)) {
        $model = $models[$provider]['models'][0];
    }

    return array(
        'provider' => $provider,
        'model' => $model,
        'site_name' => sanitize_text_field($value['site_name'] ?? $default['site_name']),
        'bot_name' => sanitize_text_field($value['bot_name'] ?? $default['bot_name']),
        'lead_email' => sanitize_email($value['lead_email'] ?? $default['lead_email']),
        'logo_url' => esc_url_raw($value['logo_url'] ?? $default['logo_url']),
        'greeting_text' => sanitize_text_field($value['greeting_text'] ?? $default['greeting_text']),
        'intro_message' => sanitize_text_field($value['intro_message'] ?? $default['intro_message']),
        'lead_button_text' => sanitize_text_field($value['lead_button_text'] ?? $default['lead_button_text']),
        'lead_submit_text' => sanitize_text_field($value['lead_submit_text'] ?? $default['lead_submit_text']),
        'contact_button_text' => sanitize_text_field($value['contact_button_text'] ?? $default['contact_button_text']),
        'contact_submit_text' => sanitize_text_field($value['contact_submit_text'] ?? $default['contact_submit_text']),
        'chat_placeholder' => sanitize_text_field($value['chat_placeholder'] ?? $default['chat_placeholder']),
        'success_message' => sanitize_text_field($value['success_message'] ?? $default['success_message']),
        'business_context' => sanitize_textarea_field($value['business_context'] ?? $default['business_context']),
    );
}

function siteatende_register_settings()
{
    register_setting('siteatende_settings', 'siteatende_config', array(
        'sanitize_callback' => 'siteatende_sanitize_config',
    ));
}

function siteatende_add_settings_page()
{
    add_options_page(
        'siteAtende',
        'siteAtende',
        'manage_options',
        'siteatende',
        'siteatende_render_settings'
    );
}

function siteatende_render_settings()
{
    $models = siteatende_models();
    $config = siteatende_get_config();
    ?>
    <div class="wrap">
        <h1>siteAtende</h1>
        <p>Configure o provedor, o modelo e o comportamento do assistente que responde no balão do site.</p>
        <form method="post" action="options.php">
            <?php settings_fields('siteatende_settings'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="siteatende-provider">Provedor LLM</label></th>
                    <td>
                        <select id="siteatende-provider" name="siteatende_config[provider]"></select>
                        <p class="description">
                            Chaves no servidor:
                            Groq <strong><?php echo siteatende_get_api_key('groq') ? 'configurada' : 'ausente'; ?></strong> ·
                            OpenAI <strong><?php echo siteatende_get_api_key('openai') ? 'configurada' : 'ausente'; ?></strong> ·
                            Gemini <strong><?php echo siteatende_get_api_key('gemini') ? 'configurada' : 'ausente'; ?></strong>.
                            Provedores sem chave usam a mensagem de indisponibilidade e não fazem chamada externa.
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-model">Modelo</label></th>
                    <td>
                        <select id="siteatende-model" name="siteatende_config[model]"></select>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-site-name">Nome do site</label></th>
                    <td>
                        <input id="siteatende-site-name" type="text" name="siteatende_config[site_name]" value="<?php echo esc_attr($config['site_name']); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-bot-name">Nome do assistente</label></th>
                    <td>
                        <input id="siteatende-bot-name" type="text" name="siteatende_config[bot_name]" value="<?php echo esc_attr($config['bot_name']); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-lead-email">E-mail de lead</label></th>
                    <td>
                        <input id="siteatende-lead-email" type="email" name="siteatende_config[lead_email]" value="<?php echo esc_attr($config['lead_email']); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-logo-url">URL da logo</label></th>
                    <td>
                        <input id="siteatende-logo-url" type="url" name="siteatende_config[logo_url]" value="<?php echo esc_attr($config['logo_url']); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-greeting">Mensagem do balão</label></th>
                    <td>
                        <input id="siteatende-greeting" type="text" name="siteatende_config[greeting_text]" value="<?php echo esc_attr($config['greeting_text']); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-intro">Mensagem inicial</label></th>
                    <td>
                        <input id="siteatende-intro" type="text" name="siteatende_config[intro_message]" value="<?php echo esc_attr($config['intro_message']); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-lead-button">Texto do botão de orçamento</label></th>
                    <td>
                        <input id="siteatende-lead-button" type="text" name="siteatende_config[lead_button_text]" value="<?php echo esc_attr($config['lead_button_text']); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-submit">Texto do botão do formulário</label></th>
                    <td>
                        <input id="siteatende-submit" type="text" name="siteatende_config[lead_submit_text]" value="<?php echo esc_attr($config['lead_submit_text']); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-contact-button">Texto do botão "falar com atendente"</label></th>
                    <td>
                        <input id="siteatende-contact-button" type="text" name="siteatende_config[contact_button_text]" value="<?php echo esc_attr($config['contact_button_text']); ?>" class="regular-text" />
                        <p class="description">Segundo botão do balão, separado do orçamento — para quem quer só falar com a equipe.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-contact-submit">Texto do botão do formulário de contato</label></th>
                    <td>
                        <input id="siteatende-contact-submit" type="text" name="siteatende_config[contact_submit_text]" value="<?php echo esc_attr($config['contact_submit_text']); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-placeholder">Placeholder do chat</label></th>
                    <td>
                        <input id="siteatende-placeholder" type="text" name="siteatende_config[chat_placeholder]" value="<?php echo esc_attr($config['chat_placeholder']); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-success">Mensagem de sucesso</label></th>
                    <td>
                        <input id="siteatende-success" type="text" name="siteatende_config[success_message]" value="<?php echo esc_attr($config['success_message']); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="siteatende-business-context">Base factual do negócio</label></th>
                    <td>
                        <textarea id="siteatende-business-context" name="siteatende_config[business_context]" rows="9" class="large-text"><?php echo esc_textarea($config['business_context']); ?></textarea>
                        <p class="description">Use somente informações públicas e confirmadas. O assistente recebe este texto como referência e continua proibido de inventar condições.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button('Salvar configuração'); ?>
        </form>
    </div>
    <script>
      (() => {
        const providers = <?php echo wp_json_encode($models); ?>;
        const current = <?php echo wp_json_encode($config); ?>;
        const providerSelect = document.getElementById('siteatende-provider');
        const modelSelect = document.getElementById('siteatende-model');

        Object.entries(providers).forEach(([value, provider]) => {
          providerSelect.add(new Option(provider.label, value, value === current.provider, value === current.provider));
        });

        const updateModels = () => {
          modelSelect.replaceChildren();
          const selectedProvider = providers[providerSelect.value] || providers[current.provider];
          selectedProvider.models.forEach((model) => {
            modelSelect.add(new Option(model, model, model === current.model, model === current.model));
          });
        };

        providerSelect.addEventListener('change', updateModels);
        updateModels();
      })();
    </script>
    <?php
}

function siteatende_get_api_key($provider)
{
    $environmentNames = array(
        'groq' => 'GR_CARTUCHOS_GROQ_KEY',
        'openai' => 'GR_CARTUCHOS_OPENAI_KEY',
        'gemini' => 'GR_CARTUCHOS_GEMINI_KEY',
    );

    return getenv($environmentNames[$provider] ?? '') ?: '';
}

function siteatende_client_fingerprint()
{
    $candidates = array(
        $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '',
        $_SERVER['HTTP_X_REAL_IP'] ?? '',
        isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR'])[0] : '',
        $_SERVER['REMOTE_ADDR'] ?? '',
    );

    foreach ($candidates as $candidate) {
        $ip = trim((string) $candidate);
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            return hash_hmac('sha256', $ip, wp_salt('nonce'));
        }
    }

    return hash_hmac('sha256', 'unknown-client', wp_salt('nonce'));
}

/** Fixed-window limit stored in WordPress transients. */
function siteatende_rate_limit($bucket, $limit, $windowSeconds, $global = false)
{
    $subject = $global ? 'global' : siteatende_client_fingerprint();
    $key = 'siteatende_rl_' . md5($bucket . ':' . $subject);
    $now = time();
    $state = get_transient($key);

    if (!is_array($state) || ($state['reset'] ?? 0) <= $now) {
        set_transient($key, array('count' => 1, 'reset' => $now + $windowSeconds), $windowSeconds);
        return null;
    }

    if ((int) ($state['count'] ?? 0) >= $limit) {
        return new WP_Error(
            'siteatende_rate_limited',
            'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
            array('status' => 429, 'retry_after' => max(1, (int) $state['reset'] - $now))
        );
    }

    $state['count'] = (int) ($state['count'] ?? 0) + 1;
    set_transient($key, $state, max(1, (int) $state['reset'] - $now));
    return null;
}

function siteatende_clean_field($value, $maxLength, $multiline = false)
{
    $text = $multiline
        ? sanitize_textarea_field((string) $value)
        : sanitize_text_field((string) $value);

    return mb_substr(trim($text), 0, $maxLength);
}

function siteatende_register_routes()
{
    register_rest_route('siteatende/v1', '/chat', array(
        'methods' => WP_REST_Server::CREATABLE,
        'callback' => 'siteatende_handle_chat',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('siteatende/v1', '/lead', array(
        'methods' => WP_REST_Server::CREATABLE,
        'callback' => 'siteatende_handle_lead',
        'permission_callback' => '__return_true',
    ));
}

function siteatende_handle_chat(WP_REST_Request $request)
{
    $limited = siteatende_rate_limit('chat', 15, MINUTE_IN_SECONDS);
    if (is_wp_error($limited)) {
        return $limited;
    }

    $payload = $request->get_json_params();
    $message = isset($payload['message']) ? siteatende_clean_field($payload['message'], 2000, true) : '';

    if ($message === '') {
        return new WP_Error('missing_message', 'Mensagem vazia.', array('status' => 400));
    }

    $config = siteatende_get_config();
    $provider = $config['provider'];
    $model = $config['model'];
    $apiKey = siteatende_get_api_key($provider);
    if (!$apiKey || $apiKey === '') {
        return new WP_REST_Response(array(
            'reply' => 'Não consegui confirmar essa informação agora. Para um atendimento mais preciso, fale com a equipe comercial do site.',
        ), 200);
    }

    $siteName = $config['site_name'];
    $businessContext = mb_substr($config['business_context'], 0, 6000);
    $systemPrompt = "Você é o assistente comercial do site {$siteName}.\n\nBASE FACTUAL CONFIRMADA:\n{$businessContext}\n\nSeu objetivo principal é atender pessoas interessadas em informações sobre o negócio e coletar contatos para gerar oportunidades comerciais. Responda em português do Brasil, com clareza e cordialidade.\n\nRegras:\n1. Use apenas a base factual acima e o que a pessoa informou na conversa.\n2. Explique que a equipe avalia a necessidade e prepara uma proposta conforme o perfil do cliente.\n3. Não invente preços, prazos, estoque, marcas, modelos, áreas atendidas ou condições. Trate todo preço divulgado como referência sujeita a confirmação.\n4. Quando houver interesse, incentive o preenchimento do formulário do chat para que a equipe comercial retorne por e-mail ou telefone.\n5. Faça perguntas úteis para o orçamento: nome, empresa, telefone, e-mail, cidade/bairro, necessidade principal.\n6. Não peça dados sensíveis, senhas ou documentos.\n7. Se a dúvida estiver fora do escopo ou não constar da base, diga que a equipe precisa confirmar e ofereça encaminhamento humano.\n8. Mantenha respostas curtas, completas e sem prometer contratação.\n9. Responda em texto simples, sem Markdown, asteriscos, títulos ou tabelas.\n10. Não encaminhe automaticamente para WhatsApp como solução principal; o formulário do chat é o fluxo principal de geração de lead.\n11. Nunca invente dados que não tenham sido confirmados.";
    $messages = array(array('role' => 'system', 'content' => $systemPrompt));

    $history = isset($payload['history']) && is_array($payload['history']) ? array_slice($payload['history'], -8) : array();
    foreach ($history as $item) {
        if (!is_array($item) || !in_array($item['role'] ?? '', array('user', 'assistant'), true)) {
            continue;
        }
        $content = siteatende_clean_field($item['content'] ?? '', 1500, true);
        if ($content !== '') {
            $messages[] = array('role' => $item['role'], 'content' => $content);
        }
    }
    $messages[] = array('role' => 'user', 'content' => $message);

    if ($provider === 'gemini') {
        $response = wp_remote_post(
            'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent?key=' . rawurlencode($apiKey),
            array(
                'timeout' => 30,
                'headers' => array('Content-Type' => 'application/json'),
                'body' => wp_json_encode(array(
                    'systemInstruction' => array('parts' => array(array('text' => $systemPrompt))),
                    'contents' => array_map(function ($item) {
                        return array(
                            'role' => $item['role'] === 'assistant' ? 'model' : 'user',
                            'parts' => array(array('text' => $item['content'])),
                        );
                    }, array_values(array_filter($messages, function ($item) {
                        return $item['role'] !== 'system';
                    }))),
                    'generationConfig' => array('temperature' => 0.6, 'maxOutputTokens' => 350),
                )),
            )
        );
    } else {
        $baseUrl = $provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
        $response = wp_remote_post($baseUrl, array(
            'timeout' => 30,
            'headers' => array(
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ),
            'body' => wp_json_encode(array(
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0.6,
                'max_tokens' => 350,
            )),
        ));
    }

    if (is_wp_error($response)) {
        return new WP_REST_Response(array(
            'reply' => 'Não consegui confirmar essa informação agora. Para um atendimento mais preciso, fale com a equipe comercial do site.',
        ), 200);
    }

    $statusCode = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);

    $reply = $provider === 'gemini'
        ? ($body['candidates'][0]['content']['parts'][0]['text'] ?? '')
        : ($body['choices'][0]['message']['content'] ?? '');

    if ($statusCode >= 400 || $reply === '') {
        return new WP_REST_Response(array(
            'reply' => 'Não consegui confirmar essa informação agora. Para um atendimento mais preciso, fale com a equipe comercial do site.',
        ), 200);
    }

    $reply = trim((string) $reply);

    return new WP_REST_Response(array(
        'reply' => $reply ?: 'Não consegui confirmar essa informação agora. Para um atendimento mais preciso, fale com a equipe comercial do site.',
    ), 200);
}

function siteatende_handle_lead(WP_REST_Request $request)
{
    $limited = siteatende_rate_limit('lead', 5, 15 * MINUTE_IN_SECONDS);
    if (is_wp_error($limited)) {
        return $limited;
    }
    $payload = $request->get_json_params();
    if (!empty($payload['website'])) {
        return new WP_REST_Response(array('message' => 'Obrigado! Recebemos seus dados.'), 200);
    }

    $globalLimited = siteatende_rate_limit('lead', 30, HOUR_IN_SECONDS, true);
    if (is_wp_error($globalLimited)) {
        return $globalLimited;
    }

    $type = ($payload['type'] ?? '') === 'contato' ? 'contato' : 'orcamento';
    if ($type === 'contato') {
        return siteatende_handle_contact_request($payload);
    }

    $name = siteatende_clean_field($payload['name'] ?? '', 120);
    $company = siteatende_clean_field($payload['company'] ?? '', 120);
    $email = sanitize_email($payload['email'] ?? '');
    $phone = siteatende_clean_field($payload['phone'] ?? '', 40);
    $city = siteatende_clean_field($payload['city'] ?? '', 120);
    $printers = siteatende_clean_field($payload['printers'] ?? '', 80);
    $volume = siteatende_clean_field($payload['volume'] ?? '', 80);
    $notes = siteatende_clean_field($payload['notes'] ?? '', 1500, true);

    if ($name === '' || $phone === '' || !is_email($email)) {
        return new WP_Error('invalid_lead', 'Informe nome, telefone e um e-mail válido.', array('status' => 400));
    }

    $config = siteatende_get_config();
    $destination = $config['lead_email'];
    if (!$destination || !is_email($destination)) {
        $destination = getenv('GR_CARTUCHOS_LEAD_EMAIL') ?: 'janaine@grcartuchos.com.br';
    }

    $subject = 'Novo lead - ' . $name;
    $body = "Novo lead recebido pelo assistente do site\n\n"
        . "Nome: {$name}\n"
        . "Empresa: {$company}\n"
        . "E-mail: {$email}\n"
        . "Telefone/WhatsApp: {$phone}\n"
        . "Cidade/bairro: {$city}\n"
        . "Quantidade: {$printers}\n"
        . "Volume aproximado: {$volume}\n"
        . "Necessidade: {$notes}\n\n"
        . 'Origem: widget do site';

    $sent = wp_mail($destination, $subject, $body, array(
        'Reply-To: ' . $name . ' <' . $email . '>',
    ));

    if (!$sent) {
        return new WP_Error('lead_delivery_failed', 'Não foi possível enviar seus dados agora.', array('status' => 500));
    }

    return new WP_REST_Response(array(
        'message' => 'Obrigado! Recebemos seus dados. Nossa equipe entrará em contato em breve.',
    ), 200);
}

/**
 * Second lead flow: "Falar com um atendente" — for anyone who wants human
 * contact (a question, a problem, anything) rather than a rental quote.
 * Same endpoint/rate limits/honeypot as siteatende_handle_lead(), branched
 * by payload.type so the original orçamento flow above stays untouched.
 */
function siteatende_handle_contact_request($payload)
{
    $name = siteatende_clean_field($payload['name'] ?? '', 120);
    $company = siteatende_clean_field($payload['company'] ?? '', 120);
    $channelLabels = array('whatsapp' => 'WhatsApp', 'email' => 'e-mail', 'ligacao' => 'ligação');
    $channelRaw = siteatende_clean_field($payload['preferred_channel'] ?? '', 20);
    $channel = isset($channelLabels[$channelRaw]) ? $channelRaw : '';
    $phone = siteatende_clean_field($payload['phone'] ?? '', 40);
    $email = sanitize_email($payload['email'] ?? '');
    $bestTime = siteatende_clean_field($payload['best_time'] ?? '', 120);
    $message = siteatende_clean_field($payload['message'] ?? '', 1500, true);

    if ($name === '' || $channel === '' || $message === '') {
        return new WP_Error('invalid_contact', 'Informe nome, como prefere ser contatado e sua mensagem.', array('status' => 400));
    }
    if ($channel === 'email' && !is_email($email)) {
        return new WP_Error('invalid_contact', 'Informe um e-mail válido.', array('status' => 400));
    }
    if (($channel === 'whatsapp' || $channel === 'ligacao') && $phone === '') {
        return new WP_Error('invalid_contact', 'Informe um telefone com DDD.', array('status' => 400));
    }
    if ($channel === 'ligacao' && $bestTime === '') {
        return new WP_Error('invalid_contact', 'Informe o melhor dia e horário para ligarmos.', array('status' => 400));
    }

    $config = siteatende_get_config();
    $destination = $config['lead_email'];
    if (!$destination || !is_email($destination)) {
        $destination = getenv('GR_CARTUCHOS_LEAD_EMAIL') ?: 'janaine@grcartuchos.com.br';
    }

    $lines = array('Novo pedido de contato recebido pelo assistente do site', '', "Nome: {$name}");
    if ($company !== '') {
        $lines[] = "Empresa: {$company}";
    }
    $lines[] = 'Prefere ser contatado por: ' . $channelLabels[$channel];
    if ($phone !== '') {
        $lines[] = "Telefone/WhatsApp: {$phone}";
    }
    if ($email !== '') {
        $lines[] = "E-mail: {$email}";
    }
    if ($bestTime !== '') {
        $lines[] = "Melhor horário para ligar: {$bestTime}";
    }
    $lines[] = '';
    $lines[] = "Mensagem: {$message}";
    $lines[] = '';
    $lines[] = 'Origem: widget do site (falar com um atendente)';

    $headers = array();
    if (is_email($email)) {
        $headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
    }

    $sent = wp_mail($destination, 'Novo pedido de contato - ' . $name, implode("\n", $lines), $headers);
    if (!$sent) {
        return new WP_Error('lead_delivery_failed', 'Não foi possível enviar seus dados agora.', array('status' => 500));
    }

    return new WP_REST_Response(array(
        'message' => 'Obrigado! Recebemos seu pedido. Nossa equipe vai falar com você o quanto antes, em horário comercial.',
    ), 200);
}

function siteatende_configure_mailer($mailer)
{
    $mailer->isSMTP();
    $mailer->Host = getenv('GR_CARTUCHOS_SMTP_HOST') ?: 'mail';
    $mailer->Port = 25;
    $mailer->SMTPAuth = false;
    $mailer->SMTPSecure = '';
    $mailer->SMTPAutoTLS = false;
    $mailer->Timeout = 10;
    $mailer->setFrom('rodolfo@grcartuchos.com.br', 'GR Cartuchos');
}

function siteatende_enqueue_widget()
{
    $config = siteatende_get_config();

    wp_enqueue_script(
        'siteatende-widget',
        plugin_dir_url(__FILE__) . 'siteatende.js',
        array(),
        SITEATENDE_VERSION,
        true
    );

    wp_localize_script('siteatende-widget', 'siteAtendeConfig', $config);
}

add_action('rest_api_init', 'siteatende_register_routes');
add_action('wp_enqueue_scripts', 'siteatende_enqueue_widget');
add_action('phpmailer_init', 'siteatende_configure_mailer');
add_action('admin_init', 'siteatende_register_settings');
add_action('admin_menu', 'siteatende_add_settings_page');
