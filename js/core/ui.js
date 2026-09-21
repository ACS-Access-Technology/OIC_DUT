import { icon } from './icons.js';
import { el } from './utils.js';

let toastRegion = null;
function region() {
  if (!toastRegion || !document.body.contains(toastRegion)) {
    toastRegion = el('<div class="toast-region" aria-live="polite"></div>');
    document.body.appendChild(toastRegion);
  }
  return toastRegion;
}

const TOAST_ICONS = { success: 'checkCircle', error: 'xCircle', warning: 'alertTriangle', info: 'info' };

export function toast({ type = 'info', title, desc = '' } = {}) {
  const node = el(`
    <div class="toast toast-${type}" role="${type === 'error' || type === 'warning' ? 'alert' : 'status'}">
      <span class="toast-icon">${icon(TOAST_ICONS[type] || 'info', { size: 15 })}</span>
      <div class="toast-body">
        <div class="toast-title"></div>
        ${desc ? '<div class="toast-desc"></div>' : ''}
      </div>
      <button type="button" class="toast-close" aria-label="Fermer">${icon('x', { size: 14 })}</button>
    </div>
  `);
  node.querySelector('.toast-title').textContent = title;
  if (desc) node.querySelector('.toast-desc').textContent = desc;

  const dismiss = () => { node.style.opacity = '0'; setTimeout(() => node.remove(), 150); };
  node.querySelector('.toast-close').addEventListener('click', dismiss);
  let timer = setTimeout(dismiss, 5000);
  node.addEventListener('mouseenter', () => clearTimeout(timer));
  node.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 2500); });

  region().appendChild(node);
}

let activeModal = null;

function trapFocus(container, e) {
  if (e.key !== 'Tab') return;
  const focusable = [...container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((n) => !n.disabled && n.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function closeModal(overlay, returnFocusEl) {
  overlay.remove();
  document.body.style.overflow = '';
  activeModal = null;
  if (returnFocusEl && returnFocusEl.focus) returnFocusEl.focus();
}

/**
 * Modal générique. `bodyHtml` doit être un fragment de contenu de confiance
 * (construit par l'application, jamais une saisie utilisateur brute non échappée).
 */
export function openModal({
  icon: iconName = 'info', tone = 'accent', title, text = '', bodyHtml = '',
  confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false,
  onConfirm = null, hideCancel = false, large = false,
} = {}) {
  const triggerEl = document.activeElement;
  const overlay = el(`
    <div class="modal-overlay" role="presentation">
      <div class="modal-card ${large ? 'modal-lg' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title-el">
        <button type="button" class="modal-close" aria-label="Fermer">${icon('x', { size: 16 })}</button>
        <div class="modal-icon" style="background:var(--${tone}-soft,var(--accent-soft));color:var(--${tone},var(--accent))">
          ${icon(iconName, { size: 20 })}
        </div>
        <h3 class="modal-title" id="modal-title-el"></h3>
        ${text ? '<p class="modal-text"></p>' : ''}
        <div class="modal-body"></div>
        <div class="modal-footer">
          ${hideCancel ? '' : `<button type="button" class="btn btn-secondary" data-action="cancel">${cancelLabel}</button>`}
          <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${confirmLabel}</button>
        </div>
      </div>
    </div>
  `);
  overlay.querySelector('.modal-title').textContent = title;
  if (text) overlay.querySelector('.modal-text').textContent = text;
  if (bodyHtml) overlay.querySelector('.modal-body').innerHTML = bodyHtml;

  const close = () => closeModal(overlay, triggerEl);
  overlay.querySelector('.modal-close').addEventListener('click', close);
  const cancelBtn = overlay.querySelector('[data-action="cancel"]');
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
    if (onConfirm) onConfirm({ close, root: overlay });
    else close();
  });

  const keyHandler = (e) => {
    if (e.key === 'Escape') close();
    trapFocus(overlay, e);
  };
  overlay.addEventListener('keydown', keyHandler);

  document.body.style.overflow = 'hidden';
  document.body.appendChild(overlay);
  activeModal = overlay;
  const firstFocusable = overlay.querySelector(cancelBtn ? '[data-action="cancel"]' : '.modal-close');
  firstFocusable?.focus();
  return { close, root: overlay };
}

/** Modal de confirmation obligatoire pour toute action de validation/rupture. */
export function confirmAction({ title, text, confirmLabel = 'Confirmer', danger = false, icon: iconName, onConfirm }) {
  return openModal({
    icon: iconName || (danger ? 'alertTriangle' : 'alertCircle'),
    tone: danger ? 'error' : 'accent',
    title, text, confirmLabel, danger,
    onConfirm: ({ close }) => { onConfirm(); close(); },
  });
}

export function promptAction({ title, text, label = 'Motif', placeholder = '', confirmLabel = 'Confirmer', danger = false, onConfirm }) {
  const modal = openModal({
    icon: danger ? 'alertTriangle' : 'edit',
    tone: danger ? 'error' : 'accent',
    title, text, confirmLabel, danger,
    bodyHtml: `
      <div class="field">
        <label for="prompt-modal-input">${label} <span class="req">*</span></label>
        <textarea id="prompt-modal-input" class="textarea" rows="3" placeholder="${placeholder}"></textarea>
        <div class="error-msg hidden" id="prompt-modal-error">${icon('alertCircle', { size: 13 })} Ce champ est obligatoire.</div>
      </div>
    `,
    onConfirm: ({ close, root }) => {
      const input = root.querySelector('#prompt-modal-input');
      const value = input.value.trim();
      if (!value) {
        root.querySelector('#prompt-modal-error').classList.remove('hidden');
        input.focus();
        return;
      }
      onConfirm(value);
      close();
    },
  });
  return modal;
}

export function closeActiveModal() {
  if (activeModal) closeModal(activeModal);
}
