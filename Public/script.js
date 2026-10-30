const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');

// Maintain conversation history for multi-turn context
const conversation = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 1. Add user's message to the chat box and conversation history
  appendMessage('user', userMessage);
  conversation.push({ role: 'user', text: userMessage });
  input.value = '';
  setFormDisabled(true);

  // 2. Show temporary "Thinking..." bot message
  const thinkingMsg = appendMessage('bot', 'Thinking...', { isThinking: true });

  try {
    // 3. Send POST request to /api/chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    // 4. Replace "Thinking..." with the AI's reply (rendered from Markdown) or handle empty result
    if (data && data.result) {
      thinkingMsg.innerHTML = renderMarkdown(data.result);
      conversation.push({ role: 'model', text: data.result });
    } else {
      thinkingMsg.classList.add('error');
      thinkingMsg.textContent = 'Sorry, no response received.';
    }
  } catch (error) {
    // 5. Handle network or server errors
    console.error('Error fetching chat response:', error);
    thinkingMsg.classList.add('error');
    thinkingMsg.textContent = 'Failed to get response from server.';
  } finally {
    setFormDisabled(false);
    input.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

function setFormDisabled(disabled) {
  input.disabled = disabled;
  if (sendBtn) sendBtn.disabled = disabled;
}

function appendMessage(sender, text, options = {}) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);

  if (options.isThinking) {
    msg.innerHTML = `
      <span class="thinking-indicator">
        <span>Thinking...</span>
        <span class="thinking-dots" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
      </span>
    `;
  } else if (sender === 'bot') {
    msg.innerHTML = renderMarkdown(text);
  } else {
    msg.textContent = text;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

/**
 * Safe, lightweight Vanilla JS Markdown renderer for AI responses.
 * Escapes raw HTML first to prevent XSS, then converts Markdown syntax.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInline(text) {
  return text
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold + Italic: ***text***
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold: **text** or __text__
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,!?;:])/g, '$1<em>$2</em>');
}

function renderMarkdown(md) {
  if (!md) return '';

  // Normalize line endings and escape HTML
  const escaped = escapeHtml(md.replace(/\r\n/g, '\n'));

  // Extract fenced code blocks first so their contents aren't parsed as markdown
  const codeBlocks = [];
  const withPlaceholders = escaped.replace(/```(?:\w+)?\n([\s\S]*?)```/g, (_, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre><code>${code.trimEnd()}</code></pre>`);
    return `@@CODEBLOCK_${index}@@`;
  });

  const lines = withPlaceholders.split('\n');
  const html = [];
  let inUl = false;
  let inOl = false;
  let inBlockquote = false;
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      html.push(`<p>${formatInline(paragraphBuffer.join('<br>'))}</p>`);
      paragraphBuffer = [];
    }
  };

  const closeListsAndQuotes = () => {
    if (inUl) {
      html.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      html.push('</ol>');
      inOl = false;
    }
    if (inBlockquote) {
      html.push('</blockquote>');
      inBlockquote = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line ends current paragraph / list / quote
    if (!trimmed) {
      flushParagraph();
      closeListsAndQuotes();
      continue;
    }

    // Code block placeholder
    const codeMatch = trimmed.match(/^@@CODEBLOCK_(\d+)@@$/);
    if (codeMatch) {
      flushParagraph();
      closeListsAndQuotes();
      html.push(codeBlocks[Number(codeMatch[1])]);
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      closeListsAndQuotes();
      html.push('<hr>');
      continue;
    }

    // Headings (# to ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      closeListsAndQuotes();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Blockquote (> text)
    const quoteMatch = trimmed.match(/^&gt;\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      if (inUl) { html.push('</ul>'); inUl = false; }
      if (inOl) { html.push('</ol>'); inOl = false; }
      if (!inBlockquote) {
        html.push('<blockquote>');
        inBlockquote = true;
      }
      html.push(`<p>${formatInline(quoteMatch[1])}</p>`);
      continue;
    }

    // Unordered list (- or * or •)
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (inOl) { html.push('</ol>'); inOl = false; }
      if (inBlockquote) { html.push('</blockquote>'); inBlockquote = false; }
      if (!inUl) {
        html.push('<ul>');
        inUl = true;
      }
      html.push(`<li>${formatInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list (1. text)
    const olMatch = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      if (inUl) { html.push('</ul>'); inUl = false; }
      if (inBlockquote) { html.push('</blockquote>'); inBlockquote = false; }
      if (!inOl) {
        html.push('<ol>');
        inOl = true;
      }
      html.push(`<li>${formatInline(olMatch[1])}</li>`);
      continue;
    }

    // Regular paragraph text
    closeListsAndQuotes();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  closeListsAndQuotes();

  return html.join('');
}
