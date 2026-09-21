import { icon } from '../core/icons.js';
import { escapeHtml, formatDate, formatNumber } from '../core/utils.js';
import { navigate } from '../core/router.js';
import { getCurrentUser } from '../core/auth.js';
import { DUT_STATUS_LABELS } from '../core/constants.js';
import * as dashboardService from '../services/dashboard.service.js';
import { animateCountUps, staggerIn } from '../core/motion.js?v=oic-blue';

export function render(container) {
  const user = getCurrentUser();
  const stats = dashboardService.antennaStats(user.antennaId);

  container.innerHTML = `
    <div class="page-header">
      <div>
        <span class="overline">Antenne · ${escapeHtml(user.antennaName)}</span>
        <h1>Tableau de bord</h1>
        <div class="subtitle">${escapeHtml(user.name)}</div>
      </div>
    </div>
    <div class="page-header-rule"></div>

    <div class="kpi-grid">
      ${kpi('DUT à valider', stats.aValider, 'clock', 'amber')}
      ${kpi('Validés aujourd’hui', stats.valideesAujourdhui, 'checkCircle', 'green')}
      ${kpi('Rejetés', stats.rejetes, 'xCircle', 'rose')}
      ${kpi('Partenaires actifs', stats.partenairesActifs, 'users', 'blue')}
      ${kpi('Opérations en attente', stats.operationsEnAttente, 'layers', 'violet')}
    </div>

    <div class="card" style="margin-top:var(--s4);padding:0">
      <div class="card-header" style="padding:var(--s4) var(--s4) 0">
        <div>
          <h3>DUT en attente de validation</h3>
          <div class="subtitle">Cliquez sur une ligne pour ouvrir le détail et valider ou rejeter</div>
        </div>
      </div>
      <div class="table-wrap"><table class="data-table" id="pending-table"></table></div>
    </div>
  `;

  animateCountUps(container);
  staggerIn(container.querySelectorAll('.kpi-card'));

  const table = container.querySelector('#pending-table');
  if (stats.pending.length === 0) {
    table.innerHTML = `<tr><td class="table-empty">${icon('inbox', { size: 32 })}<div>Aucun DUT en attente</div></td></tr>`;
  } else {
    table.innerHTML = `
      <thead><tr><th scope="col">Soumis le</th><th scope="col">Partenaire</th><th scope="col">Transporteur</th><th scope="col">Véhicule</th><th scope="col">État</th><th></th></tr></thead>
      <tbody>
        ${stats.pending.map((d) => `
          <tr data-id="${d.id}">
            <td>${formatDate(d.submittedAt)}</td>
            <td>${escapeHtml(d.partnerName)}</td>
            <td>${escapeHtml(d.general.transporterName || '—')}</td>
            <td>${escapeHtml(d.general.immatriculation || '—')}</td>
            <td><span class="badge status-${d.status}"><span class="badge-dot"></span>${DUT_STATUS_LABELS[d.status]}</span></td>
            <td class="text-right"><span class="link-action">Examiner</span></td>
          </tr>
        `).join('')}
      </tbody>
    `;
    table.querySelector('tbody').addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (tr) navigate(`/antenna/dut/${tr.dataset.id}`);
    });
  }
}

function kpi(label, value, iconName, tone) {
  return `
    <div class="kpi-card">
      <div class="kpi-label">${label}<span class="kpi-icon" style="background:var(--sq-${tone}-bg);color:var(--sq-${tone}-fg)">${icon(iconName, { size: 13 })}</span></div>
      <div class="kpi-value" style="color:var(--sq-${tone}-fg)" data-countup="${value}">${formatNumber(value)}</div>
    </div>
  `;
}
