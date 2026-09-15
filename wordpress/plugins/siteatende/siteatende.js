document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gr-chat-widget')) {
    return;
  }

  const cfg = window.siteAtendeConfig || {};
  const siteName = cfg.site_name || 'GR Cartuchos';
  const botName = cfg.bot_name || siteName;
  const logoUrl = cfg.logo_url || 'https://grcartuchos.com.br/wp-content/uploads/2023/08/logo.png.webp';
  const greetingText = cfg.greeting_text || 'Oi! 👋 Quer saber sobre impressoras, suprimentos ou como começar? Pergunta aí';
  const introMessage = cfg.intro_message || `Olá! Como posso ajudar com impressoras, suprimentos e suporte da ${siteName}?`;
  const leadButtonText = cfg.lead_button_text || 'Quero um orçamento de locação';
  const leadSubmitText = cfg.lead_submit_text || 'Enviar para a equipe comercial';
  const chatPlaceholder = cfg.chat_placeholder || 'Digite sua mensagem...';
  const successMessage = cfg.success_message || 'Formulário enviado com sucesso! Nossa equipe entrará em contato em breve.';
  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const widget = document.createElement('div');
  widget.id = 'gr-chat-widget';
  widget.innerHTML = `
    <style>
      #gr-chat-widget {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 2147483647;
        font-family: inherit;
      }

      #gr-chat-greeting {
        position: absolute;
        right: 0;
        bottom: 68px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        pointer-events: none;
      }

      #gr-chat-greeting[hidden],
      #gr-chat-toggle[hidden] {
        display: none;
      }

      #gr-chat-greeting-text {
        width: 220px;
        box-sizing: border-box;
        padding: 10px 14px;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #fff;
        color: #111827;
        font-size: 13px;
        line-height: 1.45;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      }

      .gr-chat-dot {
        border: 1px solid #e5e7eb;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
      }

      .gr-chat-dot.large {
        width: 16px;
        height: 16px;
        margin-top: 6px;
        margin-right: 20px;
      }

      .gr-chat-dot.small {
        width: 9px;
        height: 9px;
        margin-top: 5px;
        margin-right: 11px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

      #gr-chat-toggle {
        display: flex;
        position: relative;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        margin-left: auto;
        padding: 8px;
        border: 0;
        border-radius: 50%;
        background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
        cursor: pointer;
      }

      #gr-chat-toggle img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 50%;
      }

      #gr-chat-panel {
        width: min(360px, calc(100vw - 24px));
        height: min(520px, calc(100vh - 76px));
        margin-bottom: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 18px;
        background: #ffffff;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
      }

      #gr-chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        background: #ffffff;
        color: #111827;
        border-bottom: 1px solid #e5e7eb;
        font-weight: 700;
      }

      .gr-chat-header-user {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .gr-chat-header-user img {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        object-fit: contain;
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
      }

      .gr-chat-header-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
        min-width: 0;
      }

      .gr-chat-header-title {
        font-size: 12.5px;
        color: #111827;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .gr-chat-header-subtitle {
        font-size: 9.5px;
        color: #6b7280;
        font-weight: 500;
      }

      #gr-chat-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: #6b7280;
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
      }

      #gr-chat-messages {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        padding: 12px 14px;
        background: linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%);
      }

      #gr-chat-lead-open {
        width: calc(100% - 24px);
        margin: 10px 12px 0;
        padding: 10px 12px;
        border: 0;
        border-radius: 10px;
        background: #0f766e;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }

      #gr-chat-lead-form {
        display: grid;
        gap: 7px;
        overflow-y: auto;
        padding: 10px 12px 12px;
        background: #fff;
      }

      .gr-chat-lead-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 2px;
        padding: 0 0 6px;
        border-bottom: 1px solid #e2e8f0;
      }

      .gr-chat-lead-logo {
        width: 24px;
        height: 24px;
        object-fit: contain;
        border-radius: 5px;
        background: #fff;
        flex-shrink: 0;
      }

      .gr-chat-lead-title {
        margin: 0;
        color: #0f172a;
        font-size: 12.5px;
        font-weight: 800;
        line-height: 1.25;
      }

      #gr-chat-lead-form[hidden],
      #gr-chat-form[hidden] {
        display: none;
      }

      #gr-chat-lead-form .gr-chat-hp {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }

      #gr-chat-lead-form input,
      #gr-chat-lead-form textarea {
        box-sizing: border-box;
        width: 100%;
        padding: 9px 11px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font: inherit;
        font-size: 13px;
      }

      #gr-chat-lead-form textarea {
        min-height: 58px;
        resize: vertical;
      }

      #gr-chat-lead-form button {
        padding: 10px 12px;
        border: 0;
        border-radius: 8px;
        background: #0f766e;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }

      .gr-chat-message {
        max-width: 85%;
        margin-bottom: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
      }

      .gr-chat-message.user {
        margin-left: auto;
        background: linear-gradient(135deg, #0f766e 0%, #0a8c86 100%);
        color: #fff;
        border-bottom-right-radius: 4px;
      }

      .gr-chat-message.bot {
        margin-right: auto;
        background: #ffffff;
        color: #0f172a;
        border-bottom-left-radius: 4px;
      }

      #gr-chat-form {
        display: flex;
        gap: 8px;
        padding: 12px;
        background: #fff;
        border-top: 1px solid #e2e8f0;
      }

      #gr-chat-input {
        flex: 1;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        padding: 10px 14px;
        font-size: 14px;
      }

      #gr-chat-form button {
        border: 0;
        border-radius: 999px;
        padding: 10px 16px;
        background: #0f766e;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }

      @media (max-width: 640px) {
        #gr-chat-widget {
          right: 12px;
          bottom: calc(84px + env(safe-area-inset-bottom));
        }

        #gr-chat-panel {
          position: fixed;
          right: 12px;
          bottom: calc(84px + env(safe-area-inset-bottom));
          width: min(320px, calc(100vw - 20px));
          height: min(440px, calc(100svh - 180px));
          margin-bottom: 0;
        }

        #gr-chat-lead-form input,
        #gr-chat-lead-form textarea,
        #gr-chat-lead-form button {
          font-size: 12px;
        }

        #gr-chat-lead-form {
          gap: 6px;
          padding: 8px 10px 10px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        #gr-chat-lead-form input[name="name"],
        #gr-chat-lead-form input[name="email"],
        #gr-chat-lead-form input[name="phone"],
        #gr-chat-lead-form textarea,
        #gr-chat-lead-form button {
          grid-column: 1 / -1;
        }

        .gr-chat-lead-title {
          font-size: 12px;
        }
      }
    </style>

    <div id="gr-chat-panel" hidden>
      <div id="gr-chat-header">
        <div class="gr-chat-header-user">
          <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(botName)}" />
          <div class="gr-chat-header-text">
            <span class="gr-chat-header-title">Assistente Virtual ${escapeHtml(botName)}</span>
            <span class="gr-chat-header-subtitle">Tira dúvidas 24/7</span>
          </div>
        </div>
        <button id="gr-chat-close" type="button" aria-label="Fechar chat">×</button>
      </div>
      <div id="gr-chat-messages"></div>
      <button id="gr-chat-lead-open" type="button">${escapeHtml(leadButtonText)}</button>
      <form id="gr-chat-lead-form" hidden>
        <div class="gr-chat-lead-header">
          <img class="gr-chat-lead-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(siteName)}" />
          <p class="gr-chat-lead-title">GR Cartuchos | Locação de Impressoras</p>
        </div>
        <input name="name" type="text" maxlength="120" placeholder="Seu nome *" required />
        <input name="company" type="text" maxlength="120" placeholder="Empresa" />
        <input name="email" type="email" maxlength="200" placeholder="Seu e-mail *" required />
        <input name="phone" type="tel" maxlength="40" placeholder="Telefone ou WhatsApp *" required />
        <input name="city" type="text" maxlength="120" placeholder="Cidade e bairro" />
        <input name="printers" type="text" maxlength="80" placeholder="Quantidade de impressoras" />
        <input name="volume" type="text" maxlength="80" placeholder="Volume mensal aproximado" />
        <textarea name="notes" maxlength="1500" placeholder="Conte brevemente o que precisa"></textarea>
        <label class="gr-chat-hp" aria-hidden="true">Site <input name="website" type="text" tabindex="-1" autocomplete="off" /></label>
        <button type="submit">${escapeHtml(leadSubmitText)}</button>
      </form>
      <form id="gr-chat-form">
        <input id="gr-chat-input" type="text" maxlength="2000" placeholder="${escapeHtml(chatPlaceholder)}" autocomplete="off" />
        <button type="submit">Enviar</button>
      </form>
    </div>

    <div id="gr-chat-greeting" aria-hidden="true">
      <div id="gr-chat-greeting-text">${escapeHtml(greetingText)}</div>
      <div class="gr-chat-dot large"></div>
      <div class="gr-chat-dot small"></div>
    </div>

    <button id="gr-chat-toggle" type="button" aria-label="Abrir chat com a ${escapeHtml(siteName)}">
      <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(siteName)}" />
    </button>
  `;

  document.body.appendChild(widget);

  const panel = document.getElementById('gr-chat-panel');
  const toggle = document.getElementById('gr-chat-toggle');
  const greeting = document.getElementById('gr-chat-greeting');
  const closeButton = document.getElementById('gr-chat-close');
  const form = document.getElementById('gr-chat-form');
  const leadOpen = document.getElementById('gr-chat-lead-open');
  const leadForm = document.getElementById('gr-chat-lead-form');
  const input = document.getElementById('gr-chat-input');
  const messages = document.getElementById('gr-chat-messages');
  const conversationHistory = [];

  const appendMessage = (text, type) => {
    const bubble = document.createElement('div');
    bubble.className = `gr-chat-message ${type}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  };

  const showChatForm = () => {
    form.hidden = false;
    leadForm.hidden = true;
    leadOpen.hidden = false;
    setTimeout(() => input.focus(), 50);
  };

  const openChat = () => {
    panel.hidden = false;
    toggle.hidden = true;
    greeting.hidden = true;
    setTimeout(() => input.focus(), 50);
  };

  const closeChat = () => {
    panel.hidden = true;
    toggle.hidden = false;
    greeting.hidden = false;
  };

  toggle.addEventListener('click', openChat);
  closeButton.addEventListener('click', closeChat);

  appendMessage(introMessage, 'bot');

  leadOpen.addEventListener('click', () => {
    form.hidden = true;
    leadForm.hidden = false;
    leadOpen.hidden = true;
    leadForm.querySelector('input[name="name"]').focus();
  });

  const cleanLeadValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value)
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  leadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = leadForm.querySelector('button');
    const rawFormData = Object.fromEntries(new FormData(leadForm).entries());
    const formData = Object.fromEntries(
      Object.entries(rawFormData).map(([key, value]) => [key, cleanLeadValue(value)])
    );
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    try {
      const response = await fetch('/wp-json/siteatende/v1/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao enviar lead');
      }

      appendMessage(successMessage, 'bot');
      leadForm.reset();
      leadForm.hidden = true;
      showChatForm();
    } catch (error) {
      appendMessage('Não consegui enviar seus dados agora. Tente novamente ou fale diretamente com a equipe comercial.', 'bot');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = leadSubmitText;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const value = input.value.trim();
    if (!value) {
      return;
    }

    appendMessage(value, 'user');
    const requestHistory = conversationHistory.slice(-8);
    conversationHistory.push({ role: 'user', content: value });
    input.value = '';
    input.disabled = true;
    form.querySelector('button').disabled = true;

    try {
      const response = await fetch('/wp-json/siteatende/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: value, history: requestHistory })
      });

      const data = await response.json();
      const reply = data && data.reply ? data.reply : 'Não consegui confirmar essa informação agora. Para um atendimento mais preciso, fale com a GR Cartuchos pelo WhatsApp ou pelo atendimento comercial.';
      appendMessage(reply, 'bot');
      conversationHistory.push({ role: 'assistant', content: reply });
    } catch (error) {
      appendMessage('Não consegui confirmar essa informação agora. Para um atendimento mais preciso, fale com a GR Cartuchos pelo WhatsApp ou pelo atendimento comercial.', 'bot');
    } finally {
      input.disabled = false;
      form.querySelector('button').disabled = false;
      input.focus();
    }
  });
});
