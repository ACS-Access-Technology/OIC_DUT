import { settings } from '../services/settings.service.js';
import { getCurrentUser } from '../core/auth.js';
import { icon } from '../core/icons.js';
import { escapeHtml, formatDate, formatMoney, segmentedProgressHtml } from '../core/utils.js';
import { openModal, toast, confirmAction, promptAction } from '../core/ui.js';
import * as operationsService from '../services/operations.service.js';

const STATUS_BADGE = {
  VALIDATED: '<span class="badge badge-success"><span class="badge-dot"></span>Validée</span>',
  PENDING: '<span class="badge badge-warning"><span class="badge-dot"></span>En attente</span>',
  REJECTED: '<span class="badge badge-error"><span class="badge-dot"></span>Rejetée</span>',
};

export function render(container) {
  const user = getCurrentUser();
  renderList(container, user);
}

function renderList(container, user) {
  const operations = (user.role === 'OIC_ADMIN' ? operationsService.listAll() : operationsService.listForPartner(user.partnerId)).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

  container.innerHTML = `
    <div class="page-header">
      <div>
        <span class="overline">${user.role === 'OIC_ADMIN' ? 'OIC' : 'Partenaire'} · Ressources</span>
        <h1>Opérations &amp; plages de numéros</h1>
        <div class="subtitle">${escapeHtml(user.role === 'OIC_ADMIN' ? 'Demandes des partenaires · Attribution locale des plages' : user.partnerName)}</div>
      </div>
      ${user.role !== 'OIC_ADMIN' ? `<button type="button" class="btn btn-primary" id="btn-request-range">${icon('plus', { size: 15 })} Demander une nouvelle plage</button>` : ''}
    </div>
    <div class="page-header-rule"></div>

    <div class="stack gap-3" id="operations-list"></div>
  `;

  const list = container.querySelector('#operations-list');
  if (operations.length === 0) {
    list.innerHTML = `<div class="card empty-state">${icon('layers', { size: 40 })}<h3>Aucune opération</h3><p>Demandez votre première plage de numéros DUT.</p></div>`;
  } else {
    list.innerHTML = operations.map((op) => `
        <div class="range-progress-card">
          <div class="row-between" style="margin-bottom:8px">
            <div>
              <div class="range-code">${escapeHtml(op.code)} · ${escapeHtml(op.partnerName || '')}</div>
              <div class="text-muted" style="font-size:.78rem">Demandée le ${formatDate(op.requestedAt)}</div>
            </div>
            ${STATUS_BADGE[op.status] || ''}
          </div>
          ${op.status === 'VALIDATED' ? `
            <div style="margin:12px 0 10px">${segmentedProgressHtml(op.quantity, op.used)}</div>
            <div class="range-meta" style="margin-top:0">
              <span>DUT-CI-${op.year}-${String(op.rangeStart).padStart(6, '0')} à DUT-CI-${op.year}-${String(op.rangeEnd).padStart(6, '0')}</span>
              <span class="mono-num fw-bold">${op.quantity - op.used} / ${op.quantity} disponibles</span>
            </div>
          ` : `
            <div class="text-muted" style="font-size:.85rem;margin-top:8px">Quantité demandée : ${op.quantity} · Montant estimé : ${formatMoney(op.montantTotal)}</div>
          `}
          ${op.commentaire ? `<p>${escapeHtml(op.commentaire)}</p>` : ''}
          ${op.rejectionReason ? `<p class="text-error">Motif du refus : ${escapeHtml(op.rejectionReason)}</p>` : ''}
          ${op.decidedBy ? `<p class="text-muted">Décision : ${escapeHtml(op.decidedBy)} · ${formatDate(op.validatedAt || op.rejectedAt)}</p>` : ''}
          ${user.role === 'OIC_ADMIN' && op.status === 'PENDING' ? `<div class="row gap-2" style="margin-top:16px"><button class="btn btn-primary" data-approve="${op.id}">Attribuer la plage</button><button class="btn btn-secondary" data-reject="${op.id}">Refuser</button></div>` : ''}
        </div>
      `).join('');
  }

  const decide = (id, accepted, reason) => {
    try { operationsService.decideRange(id, accepted, reason); renderList(container, user); toast({ type: 'success', title: accepted ? 'Plage attribuée localement' : 'Demande refusée' }); }
    catch (err) { toast({ type: 'error', title: 'Décision impossible', desc: err.message }); }
  };
  container.querySelectorAll('[data-approve]').forEach(button => button.addEventListener('click', () => confirmAction({ title: 'Attribuer cette plage ?', text: 'Une nouvelle plage sans chevauchement sera réservée au partenaire dans ce POC.', confirmLabel: 'Attribuer', onConfirm: () => decide(button.dataset.approve, true) })));
  container.querySelectorAll('[data-reject]').forEach(button => button.addEventListener('click', () => promptAction({ title: 'Refuser la demande', label: 'Motif du refus', confirmLabel: 'Refuser', danger: true, onConfirm: reason => decide(button.dataset.reject, false, reason) })));
  container.querySelector('#btn-request-range')?.addEventListener('click', () => openRequestModal(container, user));
}

function openRequestModal(container, user) {
  const modal = openModal({
    icon: 'layers', title: 'Demander une nouvelle plage de numéros',
    confirmLabel: 'Soumettre la demande',
    bodyHtml: `
      <div class="field">
        <label for="req-qty">Quantité demandée <span class="req">*</span></label>
        <input class="input" type="number" min="1" id="req-qty" value="${settings().rangeQuantity}">
      </div>
      <div class="field">
        <label for="req-tarif">Tarif unitaire (FCFA) <span class="req">*</span></label>
        <input class="input" type="number" min="0" id="req-tarif" step="0.01" value="${settings().rangePrice}">
      </div>
      <div class="field">
        <label>Montant total</label>
        <input class="input" id="req-total" readonly value="0 FCFA">
      </div>
      <div class="field">
        <label for="req-comment">Commentaire</label>
        <textarea class="textarea" id="req-comment" rows="2" placeholder="Précisions éventuelles"></textarea>
      </div>
    `,
    onConfirm: ({ close, root }) => {
      const quantite = root.querySelector('#req-qty').value;
      const tarifUnitaire = root.querySelector('#req-tarif').value;
      const commentaire = root.querySelector('#req-comment').value;
      try {
        operationsService.requestNewRange(user, { quantite, tarifUnitaire, commentaire });
        toast({ type: 'success', title: 'Demande envoyée', desc: 'Votre demande est enregistrée localement et visible dans l’espace OIC de ce navigateur.' });
        close();
        renderList(container, user);
      } catch (err) {
        toast({ type: 'error', title: 'Demande invalide', desc: err.message });
      }
    },
  });

  const updateTotal = () => {
    const q = Number(modal.root.querySelector('#req-qty').value) || 0;
    const t = Number(modal.root.querySelector('#req-tarif').value) || 0;
    modal.root.querySelector('#req-total').value = formatMoney(q * t);
  };
  modal.root.querySelector('#req-qty').addEventListener('input', updateTotal);
  modal.root.querySelector('#req-tarif').addEventListener('input', updateTotal);
  updateTotal();
}
