import { verifyPrint } from '../services/dut-print.service.js';
import { icon } from '../core/icons.js';
import { escapeHtml, formatDate, formatDateTime, formatNumber } from '../core/utils.js';
import { navigate } from '../core/router.js';
import { toast } from '../core/ui.js';
import { CONTROL_RESULTS } from '../core/constants.js';
import * as controlService from '../services/control.service.js';
import { getAllDuts } from '../repositories/dut.repository.js';

let html5QrInstance = null;

export function render(container, params) {
  stopScanner();
  if (params.token) renderResult(container, params.token);
  else renderScan(container);
}

function renderScan(container) {
  container.innerHTML = `
    <div class="text-center" style="margin-bottom:var(--s4)">
      <h1 style="font-size:1.3rem">Contrôle DUT</h1>
      <p class="text-muted" style="font-size:.85rem">Scannez le QR code du document ou saisissez le token manuellement.</p>
    </div>
    <div class="card">
      <div class="scan-box" id="scan-box">
        ${icon('camera', { size: 40 })}
      </div>
      <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-start-scan" style="margin-top:var(--s3)">
        ${icon('scan', { size: 17 })} Scanner un DUT
      </button>
    </div>

    <div class="card" style="margin-top:var(--s3)">
      <h3 style="margin-bottom:var(--s2)">Saisie manuelle</h3>
      <div class="field">
        <label for="manual-token">Token du QR (repli si la caméra est indisponible)</label>
        <input class="input" id="manual-token" placeholder="oicdut://verify/... ou token seul">
      </div>
      <button type="button" class="btn btn-secondary btn-block" id="btn-manual-verify">Vérifier</button>
    </div>

    <div class="card" style="margin-top:var(--s3)">
      <h3 style="margin-bottom:var(--s2)">Simulation (démonstration)</h3>
      <div class="stack gap-2">
        <button type="button" class="btn btn-success btn-block" id="btn-sim-valid">${icon('checkCircle', { size: 15 })} Simuler scan DUT valide</button>
        <button type="button" class="btn btn-danger btn-block" id="btn-sim-fake">${icon('xCircle', { size: 15 })} Simuler scan DUT faux</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-manual-verify').addEventListener('click', () => {
    const value = container.querySelector('#manual-token').value.trim();
    if (!value) { toast({ type: 'error', title: 'Veuillez saisir un token.' }); return; }
    navigate(`/control/result/${encodeURIComponent(value)}`);
  });

  container.querySelector('#btn-sim-valid').addEventListener('click', () => {
    const validDut = getAllDuts().find((d) => d.status === 'VALIDE' && d.qrToken);
    if (!validDut) { toast({ type: 'error', title: 'Aucun DUT validé en démonstration.' }); return; }
    navigate(`/control/result/${validDut.qrToken}`);
  });
  container.querySelector('#btn-sim-fake').addEventListener('click', () => {
    navigate(`/control/result/token-invalide-${Date.now()}`);
  });

  container.querySelector('#btn-start-scan').addEventListener('click', () => startScanner(container));
}

function startScanner(container) {
  const box = container.querySelector('#scan-box');
  if (!window.Html5Qrcode) {
    toast({ type: 'warning', title: 'Caméra indisponible', desc: 'Utilisez la saisie manuelle ou la simulation.' });
    return;
  }
  box.innerHTML = `<div id="qr-reader" style="width:100%;height:100%"></div>`;
  html5QrInstance = new window.Html5Qrcode('qr-reader');
  html5QrInstance.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: 220 },
    (decodedText) => {
      navigate(`/control/result/${encodeURIComponent(decodedText)}`);
    },
    () => {},
  ).catch(() => {
    toast({ type: 'warning', title: 'Caméra inaccessible', desc: 'Utilisez la saisie manuelle ou la simulation.' });
    box.innerHTML = icon('camera', { size: 40 });
  });
}

function stopScanner() {
  if (html5QrInstance) {
    html5QrInstance.stop().catch(() => {}).finally(() => { html5QrInstance = null; });
  }
}

const RESULT_META = {
  [CONTROL_RESULTS.VALID]: { cls: 'valid', icon: 'checkCircle', title: 'DUT RECONNU ET VALIDE (POC)' },
  [CONTROL_RESULTS.SUSPENDED]: { cls: 'suspended', icon: 'alertTriangle', title: 'DUT SUSPENDU' },
  [CONTROL_RESULTS.WITHDRAWN]: { cls: 'withdrawn', icon: 'xCircle', title: 'DUT RETIRÉ' },
  [CONTROL_RESULTS.UNKNOWN]: { cls: 'unknown', icon: 'xCircle', title: 'QR NON RECONNU' },
};

function renderResult(container, rawToken) {
  const { result, dut } = controlService.verifyScan(rawToken);
  const meta = RESULT_META[result];

  container.innerHTML = `
    <div class="control-result-badge ${meta.cls}">
      ${icon(meta.icon, { size: 48 })}
      <h2>${meta.title}</h2>
      ${dut?.dutNumber ? `<div class="fw-bold">${escapeHtml(dut.dutNumber)}</div>` : ''}
    </div>

    ${dut ? `
      <div class="card">
        <div class="recap-grid">
          <div class="recap-item"><span>Transporteur</span><strong>${escapeHtml(dut.general.transporterName || '—')}</strong></div>
          <div class="recap-item"><span>Véhicule</span><strong>${escapeHtml(dut.general.immatriculation || '—')}</strong></div>
          <div class="recap-item"><span>Conducteur</span><strong>${escapeHtml(dut.general.driverNom)} ${escapeHtml(dut.general.driverPrenoms)}</strong></div>
          <div class="recap-item"><span>Trajet</span><strong>${escapeHtml(dut.trajet.chargement.ville || '—')} → ${escapeHtml(dut.trajet.dechargement.ville || '—')}</strong></div>
          <div class="recap-item"><span>Marchandise</span><strong>${escapeHtml(dut.marchandises[0]?.nature || '—')}</strong></div>
          <div class="recap-item"><span>Poids</span><strong>${formatNumber(dut.marchandises.reduce((s, m) => s + (Number(m.poidsTonnes) || 0), 0), 1)} t</strong></div>
          <div class="recap-item"><span>Date émission</span><strong>${formatDate(dut.general.dateEmission)}</strong></div>
          <div class="recap-item"><span>Date validation</span><strong>${formatDateTime(dut.validatedAt)}</strong></div>
        </div>
        <p class="text-muted" style="font-size:.75rem;margin-top:var(--s3)">
          Comparez ces informations du registre local au véhicule et au document présentés physiquement.
          Le statut affiché provient des données locales du POC, pas du document papier.
        </p>
      </div>
    ` : `
      <div class="card"><p class="text-secondary" style="font-size:.85rem">Ce token n’est pas reconnu dans les données locales du POC. L’authenticité de ce document ne peut pas être établie ici.</p></div>
    `}

    ${dut ? `<div class="card" style="margin-top:var(--s3)"><h3>Vérifier l’impression présentée</h3><p class="text-muted">Comparez l’empreinte imprimée au rang enregistré localement. Cette vérification ne remplace pas la comparaison des champs du papier.</p><form id="verify-print-form"><div class="field"><label for="print-rank">Rang d’impression</label><input class="input" type="number" min="1" step="1" id="print-rank" required></div><div class="field"><label for="print-hash">Empreinte SHA-256 (64 caractères)</label><input class="input" id="print-hash" maxlength="64" required pattern="[a-fA-F0-9]{64}"></div><button class="btn btn-secondary" type="submit">Comparer l’empreinte</button><p id="print-check-result" role="status"></p></form></div>` : ''}

    <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-new-scan" style="margin-top:var(--s3)">
      ${icon('scan', { size: 16 })} Nouveau contrôle
    </button>
  `;

  toast({
    type: result === 'VALID' ? 'success' : result === 'SUSPENDED' ? 'warning' : 'error',
    title: meta.title,
  });

  container.querySelector('#verify-print-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const output=container.querySelector('#print-check-result');
    try { const result=await verifyPrint(dut,container.querySelector('#print-rank').value,container.querySelector('#print-hash').value);output.textContent=result.message;output.style.color=result.ok?'var(--success)':'var(--error)'; }
    catch(err){output.textContent=err.message;}
  });
  container.querySelector('#btn-new-scan').addEventListener('click', () => navigate('/control'));
}
