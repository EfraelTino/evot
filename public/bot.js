(function() {
  'use strict';

  var currentScript = document.currentScript;
  if (!currentScript) return;
  var scriptSrc = currentScript.getAttribute('src');
  if (!scriptSrc) return;
  var urlParams = new URL(scriptSrc, window.location.origin).searchParams;
  var BOT_ID = urlParams.get('id');
  if (!BOT_ID) { console.error('[ChatBot] Missing ?id= parameter'); return; }

  var WEBHOOK_URL = '__WEBHOOK_URL__';
  var CONFIG = { name: 'Chat', color: '#7C3AED', welcome_msg: 'Hola, ¿en qué puedo ayudarte?', prompt: '', logo_url: '', button_icon: 'bot', position: 'right' };

  var SESSION_KEY = 'chatbot_session_' + BOT_ID;
  var sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  var SUPABASE_URL = 'https://esup.yaagendo.com';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.8WZIP8dCsbDrPfjwYysRcu2IgoMeCwPy8aQuLbmKI7k';

  var isOpen = false;
  var shadowRoot = null;
  var container = null;
  var messagesContainer = null;
  var isLoading = false;

  // Lucide-style SVG icons (bot-related)
  var ICONS = {
    bot: '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>',
    'message-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    headphones: '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>',
    'life-buoy': '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>',
    zap: '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
    'message-square': '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  };

  var SEND_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/></svg>';

  var STYLES = [
    ':host{all:initial;display:block}',
    '*{box-sizing:border-box;margin:0;padding:0}',
    '.cbot-btn{position:fixed;bottom:34px;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;z-index:999998;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.2);transition:transform 0.2s ease,box-shadow 0.2s ease;color:#fff;outline:none;}',
    '.cbot-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,0.25);}',
    '.cbot-widget{position:fixed;bottom:96px;width:380px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 10px 50px rgba(0,0,0,0.15);z-index:999999;display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(16px) scale(0.95);transition:opacity 0.25s ease,transform 0.25s ease;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}',
    '.cbot-widget.cbot-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}',
    '.cbot-header{padding:14px 18px;color:#fff;font-size:15px;font-weight:600;display:flex;align-items:center;gap:10px;flex-shrink:0;}',
    '.cbot-header-logo{width:34px;height:34px;border-radius:50%;background:#fff;object-fit:cover;flex-shrink:0;}',
    '.cbot-header-icon{width:34px;height:34px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;}',
    '.cbot-header-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.cbot-close{font-size: 24px; margin-left:auto;background:none;border:none;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;flex-shrink:0;outline:none;}',
    '.cbot-close:hover{background:rgba(255,255,255,0);}',
    '.cbot-close span{display:block;width:20px;height:1.5px;background-color:#fff;border-radius:10px;transition:all 0.3s ease;transform-origin:center;}',
    '.cbot-close span:nth-child(1){      transform: rotate(45deg) translateX(8px) translateY(8px);}',
    '.cbot-close span:nth-child(2){opacity:0;}',
    '.cbot-close span:nth-child(3){      transform: rotate(-45deg) translateX(2px) translateY(-3px);}',
    '.cbot-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}',
    '.cbot-msg{max-width:82%;padding:10px 14px;font-size:14px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap;}',
    '.cbot-msg-user{align-self:flex-end;background:#f0f0f0;color:#1a1a1a;border-radius:16px 16px 4px 16px;}',
    '.cbot-msg-bot{align-self:flex-start;background:#f4f4f6;color:#1a1a1a;border-radius:16px 16px 16px 4px;}',
    '.cbot-typing{align-self:flex-start;background:#f4f4f6;border-radius:16px;padding:12px 18px;display:flex;gap:5px;align-items:center;}',
    '.cbot-typing span{width:7px;height:7px;background:#aaa;border-radius:50%;animation:cbot-bounce 1.2s infinite;}',
    '.cbot-typing span:nth-child(2){animation-delay:0.15s;}',
    '.cbot-typing span:nth-child(3){animation-delay:0.3s;}',
    '@keyframes cbot-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}',
    '.cbot-input-area{border-top:1px solid #ebebeb;padding:12px 16px;display:flex;gap:8px;flex-shrink:0;background:#fff;}',
    '.cbot-input-wrapper{display:flex;align-items:center;flex:1;border:1px solid #d1d5db;border-radius:10px;padding:8px 16px;background:#fff;transition:box-shadow 0.2s ease,border-color 0.2s ease;}',
    '.cbot-input-wrapper:focus-within{border-color:var(--cbot-color);box-shadow:0 0 0 3px color-mix(in srgb,var(--cbot-color) 25%,transparent);}',
    '.cbot-input{flex:1;border:none;outline:none;font-size:14px;color:#111827;background:transparent;font-family:inherit;}',
    '.cbot-input::placeholder{color:#9ca3af;}',
    '.cbot-send{width:40px;height:40px;border-radius:12px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity 0.15s;flex-shrink:0;color:#fff;}',
    '.cbot-send:disabled{opacity:0.7;cursor:not-allowed;}',
    '.cbot-send-loader{width:18px;height:18px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:cbot-spin 0.7s linear infinite;}',
    '@keyframes cbot-spin{to{transform:rotate(360deg)}}',
    '.cbot-error{align-self:center;color:#e53e3e;font-size:12px;padding:6px 12px;background:#fff5f5;border-radius:8px;}',
  ].join('');

  function getButtonIcon() {
    return ICONS[CONFIG.button_icon] || ICONS['bot'];
  }

  function addMessage(text, role) {
    var div = document.createElement('div');
    div.className = 'cbot-msg ' + (role === 'user' ? 'cbot-msg-user' : 'cbot-msg-bot');
    div.textContent = text;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'cbot-typing';
    div.id = 'cbot-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTyping() {
    var el = shadowRoot.querySelector('#cbot-typing');
    if (el) el.remove();
  }

  function showError(msg) {
    var div = document.createElement('div');
    div.className = 'cbot-error';
    div.textContent = msg || 'Error de conexión. Intenta de nuevo.';
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function saveMessage(content, role) {
    fetch(SUPABASE_URL + '/rest/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal',
        'Accept-Profile': 'chatbot_redcuore',
        'Content-Profile': 'chatbot_redcuore'
      },
      body: JSON.stringify({ bot_id: BOT_ID, session_id: sessionId, role: role, content: content })
    }).catch(function(e) { console.warn('[ChatBot] Could not save message', e); });
  }

  async function loadPreviousMessages() {
    try {
      var res = await fetch(
        SUPABASE_URL + '/rest/v1/messages?bot_id=eq.' + BOT_ID + '&session_id=eq.' + sessionId + '&order=created_at.asc&select=content,role',
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'Accept-Profile': 'chatbot_redcuore', 'x-session-id': sessionId } }
      );
      if (res.ok) {
        var msgs = await res.json();
        if (msgs && msgs.length > 0) return msgs;
      }
    } catch (e) { console.warn('[ChatBot] Could not load messages', e); }
    return null;
  }

  async function sendMessage(text) {
    if (isLoading || !text.trim()) return;
    if (!WEBHOOK_URL) { showError('Bot no configurado correctamente.'); return; }
    isLoading = true;

    var sendBtn = shadowRoot.querySelector('.cbot-send');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<span class="cbot-send-loader"></span>';
    }

    addMessage(text, 'user');
    showTyping();

    try {
      var res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, bot_id: BOT_ID, message: text, system_prompt: CONFIG.prompt || '' })
      });

      hideTyping();
      if (!res.ok) throw new Error('Network error');

      var reply = '';
      var contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        var data = await res.json();
        reply = data.output || data.response || data.message || data.text || JSON.stringify(data);
      } else {
        reply = await res.text();
      }

      addMessage(reply, 'assistant');
    } catch (err) {
      hideTyping();
      showError();
    } finally {
      isLoading = false;
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = SEND_ICON;
      }
    }
  }

  function createWidget(previousMessages) {
    var isLeft = CONFIG.position === 'left';
    var side = isLeft ? 'left' : 'right';

    // Shadow host
    var host = document.createElement('div');
    host.id = 'cbot-root';
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'open' });

    // Styles
    var style = document.createElement('style');
    style.textContent = STYLES;
    shadowRoot.appendChild(style);

    // Toggle button
    var btn = document.createElement('button');
    btn.className = 'cbot-btn';
    btn.style.backgroundColor = CONFIG.color;
    btn.style[side] = '24px';
    btn.innerHTML = getButtonIcon();
    btn.setAttribute('aria-label', 'Abrir chat');
    btn.onclick = function() {
      isOpen = !isOpen;
      container.classList.toggle('cbot-open', isOpen);
      if (isOpen) {
        var input = shadowRoot.querySelector('.cbot-input');
        if (input) input.focus();
      }
    };
    shadowRoot.appendChild(btn);

    // Widget panel
    container = document.createElement('div');
    container.className = 'cbot-widget';
    container.style[side] = '24px';
    container.style.setProperty('--cbot-color', CONFIG.color);

    // Header
    var header = document.createElement('div');
    header.className = 'cbot-header';
    header.style.backgroundColor = CONFIG.color;

    if (CONFIG.logo_url) {
      var logo = document.createElement('img');
      logo.className = 'cbot-header-logo';
      logo.src = CONFIG.logo_url;
      logo.alt = '';
      header.appendChild(logo);
    } else {
      var iconWrap = document.createElement('div');
      iconWrap.className = 'cbot-header-icon';
      iconWrap.innerHTML = ICONS['bot'];
      header.appendChild(iconWrap);
    }

    var nameSpan = document.createElement('span');
    nameSpan.className = 'cbot-header-name';
    nameSpan.textContent = CONFIG.name || 'Chat';
    header.appendChild(nameSpan);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'cbot-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.onclick = function() { isOpen = false; container.classList.remove('cbot-open'); };
    header.appendChild(closeBtn);
    container.appendChild(header);

    // Messages
    messagesContainer = document.createElement('div');
    messagesContainer.className = 'cbot-messages';
    container.appendChild(messagesContainer);

    if (previousMessages && previousMessages.length > 0) {
      previousMessages.forEach(function(msg) { addMessage(msg.content, msg.role); });
    } else if (CONFIG.welcome_msg) {
      addMessage(CONFIG.welcome_msg, 'assistant');
    }

    // Input area
    var inputArea = document.createElement('div');
    inputArea.className = 'cbot-input-area';

    var inputWrapper = document.createElement('div');
    inputWrapper.className = 'cbot-input-wrapper';

    var input = document.createElement('input');
    input.className = 'cbot-input';
    input.type = 'text';
    input.placeholder = 'Escribe un mensaje...';

    var sendBtn = document.createElement('button');
    sendBtn.className = 'cbot-send';
    sendBtn.style.backgroundColor = CONFIG.color;
    sendBtn.innerHTML = SEND_ICON;

    function doSend() {
      var val = input.value.trim();
      if (val) { sendMessage(val); input.value = ''; }
    }

    sendBtn.onclick = doSend;
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });

    inputWrapper.appendChild(input);
    inputArea.appendChild(inputWrapper);
    inputArea.appendChild(sendBtn);
    container.appendChild(inputArea);
    shadowRoot.appendChild(container);
  }

  async function init() {
    try {
      var res = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_bot_config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Accept-Profile': 'chatbot_redcuore',
          'Content-Profile': 'chatbot_redcuore'
        },
        body: JSON.stringify({ bot_uuid: BOT_ID })
      });

      if (!res.ok) return;

      var data = await res.json();
      if (!data || !data.name) return;

      CONFIG.name        = data.name        || CONFIG.name;
      CONFIG.color       = data.color       || CONFIG.color;
      CONFIG.welcome_msg = data.welcome_msg || CONFIG.welcome_msg;
      CONFIG.prompt      = data.prompt      || '';
      CONFIG.logo_url    = data.logo_url    || '';
      CONFIG.button_icon = data.button_icon || 'bot';
      CONFIG.position    = data.position    || 'right';
    } catch (e) { return; }

    var previousMessages = await loadPreviousMessages();
    createWidget(previousMessages);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
