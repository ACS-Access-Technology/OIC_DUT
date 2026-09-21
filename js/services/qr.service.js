import { uuid } from '../core/utils.js';
import { QR_SCHEME } from '../core/constants.js';

/**
 * Le QR ne doit JAMAIS contenir de donnée métier en clair : uniquement un
 * token opaque, aléatoire et non séquentiel (crypto.randomUUID()).
 */
export function generateToken() {
  return uuid();
}

export function buildVerifyUri(token) {
  return `${QR_SCHEME}${token}`;
}

export function extractToken(rawScanValue) {
  const value = String(rawScanValue || '').trim();
  if (value.startsWith(QR_SCHEME)) return value.slice(QR_SCHEME.length);
  return null;
}

/** Rend le QR dans un conteneur DOM visible (détail DUT, PDF preview). */
export function renderQrInto(container, token, size = 176) {
  container.innerHTML = '';
  if (!window.QRCode) {
    container.textContent = 'QR indisponible (librairie non chargée).';
    return;
  }
  // eslint-disable-next-line no-new
  new window.QRCode(container, {
    text: buildVerifyUri(token),
    width: size,
    height: size,
    correctLevel: window.QRCode.CorrectLevel.M,
  });
}

/** Génère une image QR en data-URL (utile pour l'intégrer dans le PDF). */
export function qrToDataUrl(token, size = 220) {
  if (!window.QRCode) return null;
  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.left = '-9999px';
  document.body.appendChild(holder);
  // eslint-disable-next-line no-new
  new window.QRCode(holder, {
    text: buildVerifyUri(token),
    width: size,
    height: size,
    correctLevel: window.QRCode.CorrectLevel.M,
  });
  const canvas = holder.querySelector('canvas');
  const dataUrl = canvas ? canvas.toDataURL('image/png') : null;
  document.body.removeChild(holder);
  return dataUrl;
}
