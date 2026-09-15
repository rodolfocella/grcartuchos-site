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
  const contactButtonText = cfg.contact_button_text || 'Falar com um atendente';
  const contactSubmitText = cfg.contact_submit_text || 'Enviar para a equipe';
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

      /* #gr-chat-panel's own display:flex above is an ID rule, which
         outranks the browser's low-specificity default [hidden]{display:
         none} — without this, the panel ignores its hidden attribute
         and shows open on every page load. */
      #gr-chat-panel[hidden] {
        display: none;
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

      #gr-chat-quick-actions {
        display: grid;
        gap: 6px;
        margin: 10px 12px 0;
      }

      #gr-chat-lead-open,
      #gr-chat-contact-open {
        width: 100%;
        padding: 10px 12px;
        border: 0;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
      }

      #gr-chat-lead-open {
        background: #0f766e;
        color: #fff;
      }

      #gr-chat-contact-open {
        background: #fff;
        color: #0f766e;
        border: 1.5px solid #0f766e;
      }

      #gr-chat-quick-actions[hidden] {
        display: none;
      }

      .gr-channel-group {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 2px 0 1px;
      }

      .gr-channel-option {
        position: relative;
      }

      .gr-channel-option input {
        position: absolute;
        opacity: 0;
        width: 1px;
        height: 1px;
      }

      .gr-channel-option span {
        display: inline-block;
        padding: 7px 12px;
        border: 1.5px solid #cbd5e1;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        color: #475569;
        cursor: pointer;
        user-select: none;
      }

      .gr-channel-option input:checked + span {
        border-color: #0f766e;
        background: #0f766e;
        color: #fff;
      }

      .gr-channel-option input:focus-visible + span {
        outline: 2px solid #0f766e;
        outline-offset: 2px;
      }

      #gr-chat-contact-form [data-conditional][hidden] {
        display: none;
      }

      #gr-chat-lead-form,
      #gr-chat-contact-form {
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

      /* Icon-only, same footprint as #gr-chat-close, so the title next to
         it has room to actually show instead of truncating on mobile. */
      .gr-chat-back {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        margin-left: auto;
        padding: 0;
        border: 1px solid #cbd5e1;
        border-radius: 50%;
        background: #fff;
        color: #0f766e;
        font-size: 14px;
        font-weight: 700;
        flex-shrink: 0;
        cursor: pointer;
      }

      .gr-chat-back:hover {
        background: #f0fdfa;
      }

      .gr-chat-back:hover {
        text-decoration: underline;
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
        flex: 1 1 auto;
        min-width: 0;
        margin: 0;
        color: #0f172a;
        font-size: 12.5px;
        font-weight: 800;
        line-height: 1.25;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      #gr-chat-lead-form[hidden],
      #gr-chat-contact-form[hidden],
      #gr-chat-form[hidden] {
        display: none;
      }

      #gr-chat-lead-form .gr-chat-hp,
      #gr-chat-contact-form .gr-chat-hp {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }

      #gr-chat-lead-form input,
      #gr-chat-lead-form textarea,
      #gr-chat-contact-form input,
      #gr-chat-contact-form textarea {
        box-sizing: border-box;
        width: 100%;
        padding: 9px 11px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font: inherit;
        font-size: 13px;
      }

      #gr-chat-lead-form textarea,
      #gr-chat-contact-form textarea {
        min-height: 58px;
        resize: vertical;
      }

      #gr-chat-lead-form button,
      #gr-chat-contact-form button {
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
        #gr-chat-lead-form button,
        #gr-chat-contact-form input,
        #gr-chat-contact-form textarea,
        #gr-chat-contact-form button {
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

        .gr-channel-option span {
          padding: 6px 10px;
          font-size: 11.5px;
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
      <div id="gr-chat-quick-actions">
        <button id="gr-chat-lead-open" type="button">${escapeHtml(leadButtonText)}</button>
        <button id="gr-chat-contact-open" type="button">${escapeHtml(contactButtonText)}</button>
      </div>
      <form id="gr-chat-lead-form" hidden>
        <div class="gr-chat-lead-header">
          <img class="gr-chat-lead-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(siteName)}" />
          <p class="gr-chat-lead-title">Orçamento de locação de impressoras</p>
          <button type="button" id="gr-chat-lead-back" class="gr-chat-back" aria-label="Voltar ao chat">←</button>
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
      <form id="gr-chat-contact-form" hidden>
        <div class="gr-chat-lead-header">
          <img class="gr-chat-lead-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(siteName)}" />
          <p class="gr-chat-lead-title">Falar com a equipe</p>
          <button type="button" id="gr-chat-contact-back" class="gr-chat-back" aria-label="Voltar ao chat">←</button>
        </div>
        <input name="name" type="text" maxlength="120" placeholder="Seu nome *" required />
        <input name="company" type="text" maxlength="120" placeholder="Empresa (opcional)" />
        <div class="gr-channel-group" role="radiogroup" aria-label="Como prefere ser contatado">
          <label class="gr-channel-option">
            <input type="radio" name="preferred_channel" value="whatsapp" checked />
            <span>WhatsApp</span>
          </label>
          <label class="gr-channel-option">
            <input type="radio" name="preferred_channel" value="email" />
            <span>E-mail</span>
          </label>
          <label class="gr-channel-option">
            <input type="radio" name="preferred_channel" value="ligacao" />
            <span>Ligação</span>
          </label>
        </div>
        <input data-conditional="phone" name="phone" type="tel" maxlength="40" placeholder="WhatsApp/telefone com DDD *" required />
        <input data-conditional="email" name="email" type="email" maxlength="200" placeholder="Seu e-mail *" hidden />
        <input data-conditional="best_time" name="best_time" type="text" maxlength="120" placeholder="Melhor dia e horário para ligarmos *" hidden />
        <textarea name="message" maxlength="1500" placeholder="Como podemos ajudar? *" required></textarea>
        <label class="gr-chat-hp" aria-hidden="true">Site <input name="website" type="text" tabindex="-1" autocomplete="off" /></label>
        <button type="submit">${escapeHtml(contactSubmitText)}</button>
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

  const panel = widget.querySelector('#gr-chat-panel');
  const toggle = widget.querySelector('#gr-chat-toggle');
  const greeting = widget.querySelector('#gr-chat-greeting');
  const closeButton = widget.querySelector('#gr-chat-close');
  const form = widget.querySelector('#gr-chat-form');
  const quickActions = widget.querySelector('#gr-chat-quick-actions');
  const leadOpen = widget.querySelector('#gr-chat-lead-open');
  const leadForm = widget.querySelector('#gr-chat-lead-form');
  const contactOpen = widget.querySelector('#gr-chat-contact-open');
  const contactForm = widget.querySelector('#gr-chat-contact-form');
  const input = widget.querySelector('#gr-chat-input');
  const messages = widget.querySelector('#gr-chat-messages');
  const conversationHistory = [];

  const appendMessage = (text, type) => {
    const bubble = document.createElement('div');
    bubble.className = `gr-chat-message ${type}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  };

  // Whichever form is open, back out to the plain chat + the two quick-
  // action buttons — used by each form's "← Voltar" link, by a successful
  // submit, and by closing the widget (so reopening it never leaves someone
  // stuck on a form they can't get out of).
  const resetToChat = () => {
    form.hidden = false;
    leadForm.hidden = true;
    contactForm.hidden = true;
    quickActions.hidden = false;
  };

  const showChatForm = () => {
    resetToChat();
    setTimeout(() => input.focus(), 50);
  };

  const setChatOpen = (isOpen) => {
    panel.hidden = !isOpen;
    toggle.hidden = isOpen;
    greeting.hidden = isOpen;
    toggle.setAttribute('aria-expanded', String(isOpen));
  };

  const openChat = () => {
    setChatOpen(true);
    setTimeout(() => input.focus(), 50);
  };

  const closeChat = () => {
    setChatOpen(false);
    resetToChat();
  };

  toggle.addEventListener('click', openChat);
  closeButton.addEventListener('click', closeChat);
  setChatOpen(false);

  appendMessage(introMessage, 'bot');

  leadOpen.addEventListener('click', () => {
    form.hidden = true;
    quickActions.hidden = true;
    leadForm.hidden = false;
    leadForm.querySelector('input[name="name"]').focus();
  });

  contactOpen.addEventListener('click', () => {
    form.hidden = true;
    quickActions.hidden = true;
    contactForm.hidden = false;
    contactForm.querySelector('input[name="name"]').focus();
  });

  // The contact form asks for phone, e-mail or a best-time-to-call depending
  // on the channel the person actually picked — only that field is shown
  // and required, so the team gets exactly what it needs to follow up.
  const contactPhoneField = contactForm.querySelector('[data-conditional="phone"]');
  const contactEmailField = contactForm.querySelector('[data-conditional="email"]');
  const contactBestTimeField = contactForm.querySelector('[data-conditional="best_time"]');

  const updateContactChannel = () => {
    const channel = (contactForm.querySelector('input[name="preferred_channel"]:checked') || {}).value || 'whatsapp';

    contactPhoneField.hidden = channel === 'email';
    contactPhoneField.required = channel !== 'email';

    contactEmailField.hidden = channel !== 'email';
    contactEmailField.required = channel === 'email';

    contactBestTimeField.hidden = channel !== 'ligacao';
    contactBestTimeField.required = channel === 'ligacao';
  };

  contactForm.querySelectorAll('input[name="preferred_channel"]').forEach((radio) => {
    radio.addEventListener('change', updateContactChannel);
  });
  updateContactChannel();

  widget.querySelector('#gr-chat-lead-back').addEventListener('click', () => {
    leadForm.reset();
    showChatForm();
  });

  widget.querySelector('#gr-chat-contact-back').addEventListener('click', () => {
    contactForm.reset();
    updateContactChannel();
    showChatForm();
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

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button');
    const rawFormData = Object.fromEntries(new FormData(contactForm).entries());
    const formData = Object.fromEntries(
      Object.entries(rawFormData).map(([key, value]) => [key, cleanLeadValue(value)])
    );
    formData.type = 'contato';
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
        throw new Error(data.message || 'Falha ao enviar contato');
      }

      appendMessage(data.message || successMessage, 'bot');
      contactForm.reset();
      updateContactChannel();
      contactForm.hidden = true;
      showChatForm();
    } catch (error) {
      appendMessage('Não consegui enviar seus dados agora. Tente novamente ou fale diretamente com a equipe comercial.', 'bot');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = contactSubmitText;
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
