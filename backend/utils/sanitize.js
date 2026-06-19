
const sanitizeHtml = require('sanitize-html');

function sanitizeText(input) {
  if (input === null || input === undefined) return '';
  return sanitizeHtml(String(input), {
    allowedTags: [],
    allowedAttributes: {}
  });
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map(m => ({
    ...m,
    content: sanitizeText(m?.content ?? '')
  }));
}

module.exports = { sanitizeText, sanitizeMessages };
