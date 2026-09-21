export function uuid() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function shortId(prefix = 'ID') {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

export function formatMoney(value, currency = 'FCFA') {
  const n = Number(value) || 0;
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${currency}`;
}

export function formatNumber(value, decimals = 0) {
  const n = Number(value) || 0;
  return n.toLocaleString('fr-FR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function el(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

export function on(root, selector, event, handler) {
  root.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  });
}

export function padNumber(value, length) {
  return String(value).padStart(length, '0');
}

/** Barre de progression en segments discrets (style maison Ivoire), pas une barre continue. */
export function segmentedProgressHtml(total, filled) {
  const count = Math.max(1, Number(total) || 0);
  const filledCount = Math.max(0, Math.min(count, Number(filled) || 0));
  let html = '<div class="progress-track">';
  for (let i = 0; i < count; i += 1) {
    html += `<span class="seg${i < filledCount ? ' filled' : ''}"></span>`;
  }
  return `${html}</div>`;
}
