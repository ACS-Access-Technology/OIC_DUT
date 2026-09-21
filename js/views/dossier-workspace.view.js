import { escapeHtml as esc, formatDateTime } from '../core/utils.js';
import { toast, promptAction, confirmAction } from '../core/ui.js';
import * as workspace from '../services/workspace.service.js';

export const CHECKS = [['transport', 'Carte de transporteur / carte de transport'], ['registration', 'Carte grise du véhicule et de la remorque'], ['license', 'Permis de conduire'], ['cargo', 'Facture ou document décrivant le chargement']];
const field = (label, html) => `<label class="field">${label}${html}</label>`;
function run(action, refresh) {
  try { action(); refresh(); toast({ type: 'success', title: 'Enregistré dans ce navigateur' }); }
  catch (err) { toast({ type: 'error', title: 'Enregistrement impossible', desc: err.message }); }
}
export function renderWorkspace(tab, dut, section, refresh) {
  const record = workspace.dossier(dut.id);
  tab.innerHTML = `<div class="local-save-note">Enregistrement local actif · ${record.updatedAt ? `Dernière modification : ${formatDateTime(record.updatedAt)}` : 'Les informations sont conservées sur ce navigateur.'}</div>`;
  if (section === 'transport') renderTransport(tab, dut, record, refresh);
  if (section === 'incidents') renderIncidents(tab, dut, record, refresh);
  if (section === 'documents') renderDocuments(tab, dut, record, refresh);
  if (section === 'checklist') renderChecklist(tab, dut, record, refresh);
}
function renderTransport(tab, dut, record, refresh) {
  const keys = Object.keys(workspace.STAGES);
  const current = keys.indexOf(record.stage);
  const next = keys[current + 1];
  tab.insertAdjacentHTML('beforeend', `<div class="card workspace-card"><div class="row-between"><div><span class="overline">Suivi déclaré</span><h2>${esc(dut.trajet?.chargement?.ville || 'Origine à préciser')} → ${esc(dut.trajet?.dechargement?.ville || 'Destination à préciser')}</h2></div><span class="badge badge-accent">${workspace.STAGES[record.stage]}</span></div>
  <p class="text-muted">${esc(dut.general?.transporterName || '')} · ${esc(dut.general?.immatriculation || '')} · ${esc([dut.general?.driverNom, dut.general?.driverPrenoms].filter(Boolean).join(' '))}</p>
  <p><a class="btn btn-secondary" href="#/planning">Voir le planning des trajets</a></p>${record.schedule ? `<p class="text-muted">Prévision opérationnelle : ${formatDateTime(record.schedule.start)} → ${formatDateTime(record.schedule.end)}</p>` : ''}
  <ol class="transport-steps">${keys.map((key, i) => `<li class="${i <= current ? 'complete' : ''}"><span>${i + 1}</span>${workspace.STAGES[key]}</li>`).join('')}</ol>
  <p class="text-muted">Le suivi du transport est indépendant de la validité administrative du DUT. Chaque étape est déclarée et horodatée ; aucune position GPS n’est collectée.</p>
  ${next && dut.status === 'VALIDE' ? `<form id="transport-form" class="workspace-form">${field('Observation (facultative)', '<textarea class="textarea" name="note" maxlength="1000" placeholder="Lieu, quantité chargée ou information utile"></textarea>')}<button class="btn btn-primary" type="submit">Confirmer : ${workspace.STAGES[next]}</button></form>` : next ? '<div class="alert-banner warning">Le DUT doit être valide pour avancer le transport.</div>' : '<div class="alert-banner success">Livraison confirmée et enregistrée.</div>'}</div>
  <div class="card workspace-card"><h3>Historique opérationnel</h3>${record.events.length ? `<div class="timeline">${record.events.map(e => `<div class="timeline-item"><span class="timeline-dot done"></span><div class="timeline-content"><strong>${esc(e.label)}</strong><div class="meta">${formatDateTime(e.at)} · ${esc(e.author)}</div><p>${esc(e.note)}</p></div></div>`).join('')}</div>` : '<p class="text-muted">Aucun événement déclaré pour ce transport.</p>'}</div>`);
  tab.querySelector('#transport-form')?.addEventListener('submit', e => { e.preventDefault(); run(() => workspace.advanceTransport(dut.id, next, new FormData(e.target).get('note')), refresh); });
}
function renderIncidents(tab, dut, record, refresh) {
  tab.insertAdjacentHTML('beforeend', `<div class="workspace-grid"><div class="card workspace-card"><h3>Signaler un incident ou une réserve</h3><form id="incident-form" class="workspace-form">
  ${field('Type', `<select name="type" class="select">${workspace.INCIDENT_TYPES.map(t => `<option>${t}</option>`).join('')}</select>`)}
  ${field('Priorité', '<select name="severity" class="select"><option value="NORMAL">Normale</option><option value="URGENT">Urgente</option></select>')}
  ${field('Responsable du suivi', '<input class="input" name="assignee" required maxlength="100" placeholder="Nom ou équipe en charge">')}
  ${field('Faits et réserves', '<textarea class="textarea" name="description" required maxlength="2000" rows="4" placeholder="Décrivez le problème constaté"></textarea>')}
  <button class="btn btn-primary" type="submit">Enregistrer l’incident</button></form></div>
  <div class="stack gap-3">${record.incidents.length ? record.incidents.map(i => `<article class="card workspace-card"><div class="row-between"><h3>${esc(i.type)}</h3><span class="badge ${i.status === 'RESOLVED' ? 'badge-success' : i.severity === 'URGENT' ? 'badge-error' : 'badge-warning'}">${i.status === 'RESOLVED' ? 'Résolu' : i.severity === 'URGENT' ? 'Urgent · Ouvert' : 'Ouvert'}</span></div><p class="preserve-lines">${esc(i.description)}</p><p class="text-muted">Suivi : ${esc(i.assignee)}<br>${formatDateTime(i.createdAt)} · ${esc(i.author)}</p>${i.status === 'OPEN' ? `<button class="btn btn-secondary" data-resolve="${esc(i.id)}">Résoudre l’incident</button>` : `<div class="resolution"><strong>Résolution</strong><p>${esc(i.resolution)}</p><small>${formatDateTime(i.resolvedAt)} · ${esc(i.resolvedBy)}</small></div>`}</article>`).join('') : '<div class="card empty-state"><h3>Aucun incident</h3><p>Les incidents et réserves de ce dossier apparaîtront ici.</p></div>'}</div></div>`);
  tab.querySelector('#incident-form').addEventListener('submit', e => { e.preventDefault(); run(() => workspace.addIncident(dut.id, Object.fromEntries(new FormData(e.target))), refresh); });
  tab.querySelectorAll('[data-resolve]').forEach(button => button.addEventListener('click', () => promptAction({ title: 'Résoudre l’incident', label: 'Solution apportée', confirmLabel: 'Enregistrer la résolution', onConfirm: resolution => run(() => workspace.resolveIncident(dut.id, button.dataset.resolve, resolution), refresh) })));
}
function renderDocuments(tab, dut, record, refresh) {
  tab.insertAdjacentHTML('beforeend', `<div class="card workspace-card"><h3>Documents et preuves</h3><p class="text-muted">Les fichiers sont conservés dans ce navigateur : PDF, JPEG ou PNG, 300 Ko par fichier, 1,5 Mo au total. Ils restent téléchargeables après rechargement.</p><form id="file-form" class="workspace-form">
  ${field('Catégorie', '<select class="select" name="category"><option>Facture / chargement</option><option>Véhicule / transporteur</option><option>Permis de conduire</option><option>Photo du chargement</option><option>Preuve de livraison</option><option>Autre</option></select>')}
  ${field('Pièce jointe', '<input class="input" type="file" name="file" accept="application/pdf,image/jpeg,image/png" required>')}<button class="btn btn-primary" type="submit">Enregistrer le fichier</button><p role="status" id="file-status"></p></form></div>
  <div class="card workspace-card">${record.files.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Document</th><th>Catégorie</th><th>Ajout</th><th>Actions</th></tr></thead><tbody>${record.files.map(f => `<tr><td><strong>${esc(f.name)}</strong><br>${Math.ceil(f.size / 1024)} Ko</td><td>${esc(f.category)}</td><td>${formatDateTime(f.at)}<br>${esc(f.author)}</td><td><a class="btn btn-secondary" href="${esc(f.data)}" download="${esc(f.name)}">Télécharger</a> <button class="btn btn-ghost" data-remove="${esc(f.id)}">Supprimer</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="text-muted">Aucun fichier enregistré.</p>'}
  ${(dut.annexes?.pieces || []).length ? `<p class="text-muted">Anciennes références d’annexes (fichiers à joindre ici) : ${dut.annexes.pieces.map(p => esc(p.name)).join(', ')}.</p>` : ''}</div>`);
  tab.querySelector('#file-form').addEventListener('submit', async e => {
    e.preventDefault(); const form = e.target; const button = form.querySelector('button'); button.disabled = true;
    try { const values = new FormData(form); await workspace.attachFile(dut.id, values.get('file'), values.get('category')); refresh(); toast({ type: 'success', title: 'Fichier enregistré localement' }); }
    catch (err) { tab.querySelector('#file-status').textContent = err.message; button.disabled = false; }
  });
  tab.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => confirmAction({ title: 'Supprimer cette pièce jointe ?', text: 'Le fichier sera retiré de ce navigateur. Son ajout restera dans l’historique.', danger: true, confirmLabel: 'Supprimer', onConfirm: () => run(() => workspace.removeFile(dut.id, button.dataset.remove), refresh) })));
}
function renderChecklist(tab, dut, record, refresh) {
  const errors = workspace.checklist(dut);
  tab.insertAdjacentHTML('beforeend', `<div class="workspace-grid"><div class="card workspace-card"><h3>Complétude du dossier</h3>${errors.length ? `<ul class="checklist-errors">${errors.map(error => `<li>${esc(error)}</li>`).join('')}</ul>` : '<div class="alert-banner success">Les informations nécessaires à la soumission sont renseignées.</div>'}<a class="btn btn-secondary" href="#/dut/${encodeURIComponent(dut.id)}">Voir le détail administratif</a></div>
  <div class="card workspace-card"><h3>Vérification des pièces</h3><p class="text-muted">Checklist déclarative : elle ne remplace pas la validation du DUT. Cochez les documents effectivement vérifiés.</p>${CHECKS.map(([key, label]) => `<label class="checklist-row"><input type="checkbox" data-check="${key}" ${record.checks[key] ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div></div>`);
  tab.querySelectorAll('[data-check]').forEach(input => input.addEventListener('change', () => run(() => workspace.setCheck(dut.id, input.dataset.check, input.checked), refresh)));
}
