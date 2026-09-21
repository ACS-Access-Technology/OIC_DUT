import { getCurrentUser } from '../core/auth.js';
import { navigate } from '../core/router.js';
import { icon } from '../core/icons.js';
import { escapeHtml, formatDateTime, formatNumber, segmentedProgressHtml } from '../core/utils.js';
import * as dashboardService from '../services/dashboard.service.js';
import * as dutService from '../services/dut.service.js';
import * as auditService from '../services/audit.service.js';
import { animateCountUps, staggerIn } from '../core/motion.js?v=oic-blue';

const ACTIVITY_ICON = {
  DUT_CREATED: 'file', DUT_SUBMITTED: 'arrowRight', DUT_RESUBMITTED: 'arrowRight',
  DUT_REJECTED: 'xCircle', DUT_VALIDATED: 'checkCircle', DUT_SUSPENDED: 'alertTriangle',
  DUT_UNSUSPENDED: 'checkCircle', DUT_WITHDRAWN: 'trash', DUT_PDF_GENERATED: 'download',
  DUT_REPRINTED: 'download', DUT_CONTROLLED: 'scan', DUT_UPDATED: 'edit',
};
const ACTIVITY_COLOR = {
  DUT_VALIDATED: 'var(--success)', DUT_UNSUSPENDED: 'var(--success)',
  DUT_REJECTED: 'var(--error)', DUT_WITHDRAWN: 'var(--error)', DUT_SUSPENDED: 'var(--warning)',
  DUT_SUBMITTED: 'var(--accent-hover)', DUT_RESUBMITTED: 'var(--accent-hover)',
};

export function render(container) {
  const user = getCurrentUser();
  const stats = dashboardService.partnerStats(user.partnerId);
  const activity = auditService.all().filter((a) => {
    const dut = a.dutId ? dutService.getDut(a.dutId) : null;
    return dut && dut.partnerId === user.partnerId;
  }).slice(0, 8);

  const op = stats.operation;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <span class="overline">Partenaire · ${escapeHtml(user.partnerName)}</span>
        <h1>Tableau de bord</h1>
        <div class="subtitle">Suivi de vos documents de transport et de la plage de numéros qui vous est attribuée.</div>
      </div>
      <button type="button" class="btn btn-primary" id="btn-new-dut">${icon('plus', { size: 15 })} Nouveau DUT</button>
    </div>
    <div class="page-header-rule"></div>

    <div class="kpi-grid">
      ${kpi('Documents de transport', stats.duts.length, 'file', 'violet', `${stats.creesMois} créé(s) ce mois`)}
      ${kpi('À traiter', stats.enEdition + stats.enAttente + stats.rejetes, 'clock', 'amber', `${stats.enAttente} en attente de validation`)}
      ${kpi('DUT validés', stats.valides, 'checkCircle', 'green', 'Documents actifs')}
      ${kpi('Numéros disponibles', stats.disponibles, 'layers', 'violet', op ? `${op.used} utilisés sur ${op.quantity}` : 'Demander une plage')}

    </div>

    <div class="dash-grid" style="margin-top:var(--s4)">
      <div class="card">
        <div class="card-header">
          <div>
            <h3>Activité récente</h3>
            <div class="subtitle">Derniers événements sur vos DUT</div>
          </div>
          <a href="#/partner/dut">Voir les documents</a>
        </div>
        <div class="activity-list" id="activity-list"></div>
      </div>

      <div class="stack gap-4">
        <div class="range-progress-card">
          <div class="card-header" style="margin-bottom:8px">
            <h3>Plage active</h3>
            <a href="#/partner/operations">Voir tout</a>
          </div>
          ${op ? `
            <div class="row-between" style="align-items:baseline">
              <span class="range-code">${escapeHtml(op.code)}</span>
              <span class="badge badge-success"><span class="badge-dot"></span>Validée</span>
            </div>
            <div style="margin:16px 0 10px">${segmentedProgressHtml(op.quantity, op.used)}</div>
            <div class="range-meta" style="margin-top:0">
              <span>DUT-${op.year}-${String(op.rangeStart).padStart(6, '0')} → ${String(op.rangeEnd).padStart(6, '0')}</span>
              <span><strong class="mono-num">${op.quantity - op.used}</strong> restants</span>
            </div>
          ` : `<p class="text-muted" style="font-size:.85rem">Aucune plage active.</p>`}
        </div>
        <div class="card">
          <h3 style="margin-bottom:10px">Raccourcis</h3>
          <div class="stack gap-2">
            <a href="#/partner/dut" class="btn btn-secondary btn-block">${icon('list', { size: 15 })} Mes DUT</a>
            <a href="#/partner/referentials" class="btn btn-secondary btn-block">${icon('users', { size: 15 })} Référentiels</a>
            <a href="#/partner/antennas" class="btn btn-secondary btn-block">${icon('map', { size: 15 })} Carte des antennes</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const list = container.querySelector('#activity-list');
  if (activity.length === 0) {
    list.innerHTML = `<p class="text-muted" style="font-size:.85rem">Aucune activité récente.</p>`;
  } else {
    list.innerHTML = activity.map((a) => `
      <div class="activity-item">
        <span class="activity-icon" style="color:${ACTIVITY_COLOR[a.action] || 'var(--text-secondary)'}">${icon(ACTIVITY_ICON[a.action] || 'info', { size: 17 })}</span>
        <div>
          <div class="activity-text">${escapeHtml(a.label)}${a.dutNumber ? ` · <span class="sub">${escapeHtml(a.dutNumber)}</span>` : ''}</div>
          <div class="activity-time">${formatDateTime(a.date)} · ${escapeHtml(a.userLabel)}</div>
        </div>
      </div>
    `).join('');
  }

  animateCountUps(container);
  staggerIn(container.querySelectorAll('.kpi-card'));

  container.querySelector('#btn-new-dut').addEventListener('click', () => {
    const dut = dutService.createDraft(user);
    sessionStorage.setItem('dut_wizard_draft_id', dut.id);
    navigate('/dut/new/1');
  });
}

function kpi(label, value, iconName, tone, badgeText = null) {
  return `
    <div class="kpi-card">
      <div class="kpi-label">${label}<span class="kpi-icon" style="background:var(--sq-${tone}-bg);color:var(--sq-${tone}-fg)">${icon(iconName, { size: 13 })}</span></div>
      <div class="kpi-value" style="color:var(--sq-${tone}-fg)" data-countup="${value}">${formatNumber(value)}</div>
      ${badgeText ? `<div style="margin-top:6px"><span class="badge badge-neutral"><span class="badge-dot"></span>${escapeHtml(badgeText)}</span></div>` : ''}
    </div>
  `;
}
