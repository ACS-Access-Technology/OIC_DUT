import { icon } from '../core/icons.js';
import { escapeHtml, formatDate, formatNumber } from '../core/utils.js';
import { navigate } from '../core/router.js';
import { getCurrentUser } from '../core/auth.js';
import { DUT_STATUS, DUT_STATUS_LABELS } from '../core/constants.js';
import * as dutService from '../services/dut.service.js';
import { vehicles, drivers } from '../services/referentials.service.js';
import { animateCountUps, staggerIn } from '../core/motion.js?v=oic-blue';

export function render(container) {
  const user = getCurrentUser();
  const duts = dutService.listForTransporter(user.transporterId);
  const tonnage = duts.reduce((sum, d) => sum + (d.marchandises || []).reduce((s, m) => s + (Number(m.poidsTonnes) || 0), 0), 0);
  const myVehicles = vehicles.list().filter((v) => v.transporterId === user.transporterId);
  const myDrivers = drivers.list();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <span class="overline">Transporteur · ${escapeHtml(user.transporterName)}</span>
        <h1>Tableau de bord</h1>
        <div class="subtitle">Suivi des DUT transportés pour votre compte, en lecture seule.</div>
      </div>
    </div>
    <div class="page-header-rule"></div>

    <div class="kpi-grid">
      ${kpi('DUT transportés', duts.length, 'truck', 'blue')}
      ${kpi('Validés', duts.filter((d) => d.status === DUT_STATUS.VALIDE).length, 'checkCircle', 'green')}
      ${kpi('En cours', duts.filter((d) => [DUT_STATUS.EN_EDITION, DUT_STATUS.TERMINE].includes(d.status)).length, 'clock', 'amber')}
      ${kpi('Tonnage déclaré (tous DUT)', `${formatNumber(tonnage, 1)} t`, 'package', 'violet')}
      ${kpi('Véhicules actifs', myVehicles.length, 'truck', 'navy')}
    </div>

    <div class="dash-grid" style="margin-top:var(--s4)">
      <div class="card" style="padding:0">
        <div class="card-header" style="padding:22px 22px 0">
          <div><h3>Mes DUT</h3><div class="subtitle">Cliquez sur une ligne pour consulter le détail</div></div>
        </div>
        <div class="table-wrap"><table class="data-table" id="transporteur-duts"></table></div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:var(--s3)">Mon parc</h3>
        <div class="stack gap-2">
          ${myVehicles.map((v) => `
            <div class="card-flat" style="padding:12px 14px">
              <div class="row-between"><strong>${escapeHtml(v.immatriculation)}</strong><span class="text-muted" style="font-size:.75rem">${escapeHtml(v.type || '')}</span></div>
              <div class="text-muted" style="font-size:.72rem;margin-top:2px">PTAC ${v.ptac || '—'} t · Carte transport ${escapeHtml(v.carteTransport || '—')}</div>
            </div>
          `).join('') || '<p class="text-muted" style="font-size:.85rem">Aucun véhicule rattaché.</p>'}
        </div>
      </div>
    </div>
  `;

  const table = container.querySelector('#transporteur-duts');
  if (duts.length === 0) {
    table.innerHTML = `<tr><td class="table-empty">${icon('inbox', { size: 32 })}<div>Aucun DUT pour ce transporteur</div></td></tr>`;
  } else {
    table.innerHTML = `
      <thead><tr><th scope="col">Date</th><th scope="col">Code</th><th scope="col">Véhicule</th><th scope="col">Origine → Destination</th><th scope="col">État</th><th></th></tr></thead>
      <tbody>
        ${duts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((d) => `
          <tr data-id="${d.id}">
            <td>${formatDate(d.createdAt)}</td>
            <td class="fw-medium">${escapeHtml(d.dutNumber || '—')}</td>
            <td>${escapeHtml(d.general.immatriculation || '—')}</td>
            <td>${escapeHtml(d.trajet.chargement.ville || '—')} → ${escapeHtml(d.trajet.dechargement.ville || '—')}</td>
            <td><span class="badge status-${d.status}"><span class="badge-dot"></span>${DUT_STATUS_LABELS[d.status]}</span></td>
            <td class="text-right"><span class="link-action">Ouvrir</span></td>
          </tr>
        `).join('')}
      </tbody>
    `;
    table.querySelector('tbody').addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (tr) navigate(`/dut/${tr.dataset.id}`);
    });
  }

  animateCountUps(container);
  staggerIn(container.querySelectorAll('.kpi-card'));
}

function kpi(label, value, iconName, tone) {
  return `
    <div class="kpi-card">
      <div class="kpi-label">${label}<span class="kpi-icon" style="background:var(--sq-${tone}-bg);color:var(--sq-${tone}-fg)">${icon(iconName, { size: 13 })}</span></div>
      <div class="kpi-value" style="color:var(--sq-${tone}-fg)"${typeof value === 'number' ? ` data-countup="${value}"` : ''}>${typeof value === 'number' ? formatNumber(value) : value}</div>
    </div>
  `;
}
