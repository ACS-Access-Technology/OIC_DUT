import { lineChartSvg } from '../core/charts.js';
import { visibleDuts, computeInsights } from '../services/insights.service.js';
import { icon } from '../core/icons.js';

export function decorateKpis(container, user) {
  const duts = visibleDuts(user);
  const all = computeInsights(duts,0).months;
  container.querySelectorAll('.kpi-card').forEach(card => {
    const label = card.querySelector('.kpi-label').textContent.trim().toLowerCase();
    const status = label.includes('validés') || label.includes('validées') ? ['VALIDE'] : label.includes('rejet') ? ['REJETE'] : label.includes('suspend') ? ['SUSPENDU'] : label.includes('retir') ? ['RETIRE'] : label.includes('édition') ? ['EN_EDITION'] : label.includes('à traiter') ? ['EN_EDITION','TERMINE','REJETE'] : label.includes('à valider') || label === 'en attente' ? ['TERMINE'] : null;
    const isDocuments = /document|dossier|dut|créés/.test(label) && !/numéro|contrôl/.test(label);
    const monthly = status ? computeInsights(duts.filter(d=>status.includes(d.status)),0).months : all;
    const iconEl = card.querySelector('.kpi-icon');
    if (iconEl) { iconEl.innerHTML=icon('dots',{size:18}); iconEl.classList.add('kpi-dots'); }
    const value = card.querySelector('.kpi-value');
    const row = document.createElement('div');row.className='kpi-number-row';value.before(row);row.append(value);
    // Compare actual monthly creations, never invent historical balances or percentages.
    if (isDocuments && monthly.at(-2).count>0) {
      const change=(monthly.at(-1).count-monthly.at(-2).count)/monthly.at(-2).count*100;
      const badge=document.createElement('span');badge.className='kpi-change '+(change<0?'negative':'positive');
      badge.textContent=`${change>0?'+':''}${change.toLocaleString('fr-FR',{maximumFractionDigits:1})}%`;
      badge.title='Créations du mois en cours comparées au mois précédent (mois en cours incomplet)';row.append(badge);
    }
    const chart=document.createElement('div');chart.className='kpi-mini-chart';
    chart.innerHTML=lineChartSvg(monthly,{compact:true,label:status?'DUT créés, filtrés par état actuel':'DUT créés'})+`<div class="kpi-chart-caption">${status?'Créations par état actuel · 6 mois':'Créations de DUT · 6 mois'}</div>`;
    card.append(chart);
  });
}
