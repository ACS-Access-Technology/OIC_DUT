import { icon } from '../core/icons.js';
import { escapeHtml } from '../core/utils.js';
import { openModal, toast } from '../core/ui.js';
import {
  transporters, vehicles, drivers, thirdParties, merchandiseTypes, packagingTypes,
} from '../services/referentials.service.js';

const TABS = [
  { key: 'transporteurs', label: 'Transporteurs' },
  { key: 'vehicules', label: 'Véhicules' },
  { key: 'conducteurs', label: 'Conducteurs' },
  { key: 'tiers', label: 'Tiers' },
  { key: 'marchandises', label: 'Marchandises' },
  { key: 'emballages', label: 'Emballages' },
];

let activeTab = 'transporteurs';
let searchTerm = '';

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <span class="overline">Partenaire · Ressources</span>
        <h1>Référentiels</h1>
        <div class="subtitle">Transporteurs, véhicules, conducteurs et tiers</div>
      </div>
    </div>
    <div class="page-header-rule"></div>
    <div class="tabs" id="ref-tabs">
      ${TABS.map((t) => `<button type="button" class="tab-btn ${t.key === activeTab ? 'active' : ''}" data-tab="${t.key}">${t.label}</button>`).join('')}
    </div>
    <div class="table-toolbar">
      <div class="search-input">${icon('search', { size: 15 })}<input type="text" id="ref-search" placeholder="Rechercher..."></div>
      <button type="button" class="btn btn-primary btn-sm" id="btn-add-ref">${icon('plus', { size: 14 })} Ajouter</button>
    </div>
    <div class="card" style="padding:0"><div class="table-wrap"><table class="data-table" id="ref-table"></table></div></div>
  `;

  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => { activeTab = btn.dataset.tab; searchTerm = ''; render(container); });
  });
  container.querySelector('#ref-search').addEventListener('input', (e) => { searchTerm = e.target.value.toLowerCase(); renderTable(container); });
  container.querySelector('#btn-add-ref').addEventListener('click', () => openForm(container, null));

  renderTable(container);
}

function getConfig() {
  switch (activeTab) {
    case 'transporteurs': return {
      service: transporters, columns: ['name', 'registre', 'contact', 'adresse'],
      headers: ['Nom', 'Registre', 'Contact', 'Adresse'],
      fields: [
        { key: 'name', label: 'Nom / raison sociale', required: true },
        { key: 'registre', label: 'Numéro de registre' },
        { key: 'contact', label: 'Contact' },
        { key: 'adresse', label: 'Adresse' },
      ],
    };
    case 'vehicules': return {
      service: vehicles, columns: ['immatriculation', 'type', 'capaciteTonnes', 'ptac', 'carteTransport'],
      headers: ['Immatriculation', 'Type', 'Capacité (t)', 'PTAC (t)', 'Carte de transport'],
      fields: [
        { key: 'immatriculation', label: 'Immatriculation', required: true },
        { key: 'type', label: 'Type de véhicule' },
        { key: 'capaciteTonnes', label: 'Capacité (tonnes)', type: 'number' },
        { key: 'cartegrise', label: 'Carte grise (numéro)' },
        { key: 'ptac', label: 'PTAC — poids total en charge (tonnes)', type: 'number' },
        { key: 'dateMiseEnCirculation', label: 'Date de mise en circulation', type: 'date' },
        { key: 'carteTransport', label: 'Carte de transport (numéro)' },
      ],
    };
    case 'conducteurs': return {
      service: drivers, columns: ['nom', 'prenoms', 'permis', 'piece', 'nationalite'],
      headers: ['Nom', 'Prénoms', 'Permis', 'Pièce d’identité', 'Nationalité'],
      fields: [
        { key: 'nom', label: 'Nom', required: true },
        { key: 'prenoms', label: 'Prénoms', required: true },
        { key: 'permis', label: 'Numéro de permis', required: true },
        { key: 'dateDelivrancePermis', label: 'Date de délivrance du permis', type: 'date' },
        { key: 'typePiece', label: 'Type de pièce', select: ['CNI', 'PASSEPORT', 'CARTE_SEJOUR'] },
        { key: 'piece', label: 'Numéro de pièce d’identité' },
        { key: 'dateDelivrancePiece', label: 'Date de délivrance de la pièce', type: 'date' },
        { key: 'nationalite', label: 'Nationalité' },
      ],
    };
    case 'marchandises': return {
      service: merchandiseTypes, columns: ['nom', 'code'],
      headers: ['Nature de marchandise', 'Code'],
      fields: [
        { key: 'nom', label: 'Nature de marchandise', required: true },
        { key: 'code', label: 'Code référentiel' },
      ],
    };
    case 'emballages': return {
      service: packagingTypes, columns: ['nom', 'code'],
      headers: ['Type d’emballage', 'Code'],
      fields: [
        { key: 'nom', label: 'Type d’emballage', required: true },
        { key: 'code', label: 'Code référentiel' },
      ],
    };
    default: return {
      service: thirdParties, columns: ['raisonSociale', 'type', 'registre', 'adresse'],
      headers: ['Raison sociale', 'Type', 'Registre', 'Adresse'],
      fields: [
        { key: 'raisonSociale', label: 'Raison sociale', required: true },
        { key: 'type', label: 'Type', select: ['EXPEDITEUR', 'DESTINATAIRE', 'LES_DEUX'] },
        { key: 'registre', label: 'Numéro de registre' },
        { key: 'adresse', label: 'Adresse' },
        { key: 'contact', label: 'Contact' },
      ],
    };
  }
}

function renderTable(container) {
  const cfg = getConfig();
  const items = cfg.service.list().filter((item) => {
    if (!searchTerm) return true;
    return cfg.columns.some((c) => String(item[c] || '').toLowerCase().includes(searchTerm));
  });
  const table = container.querySelector('#ref-table');

  if (items.length === 0) {
    table.innerHTML = `<tr><td class="table-empty">${icon('inbox', { size: 32 })}<div>Aucun résultat</div></td></tr>`;
    return;
  }

  table.innerHTML = `
    <thead><tr>${cfg.headers.map((h) => `<th scope="col">${h}</th>`).join('')}<th scope="col" class="text-right">Actions</th></tr></thead>
    <tbody>
      ${items.map((item) => `
        <tr data-id="${item.id}">
          ${cfg.columns.map((c) => `<td>${escapeHtml(item[c] ?? '—')}</td>`).join('')}
          <td class="text-right"><button type="button" class="btn btn-ghost btn-sm btn-edit">${icon('edit', { size: 14 })} Modifier</button></td>
        </tr>
      `).join('')}
    </tbody>
  `;

  table.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const item = cfg.service.list().find((i) => i.id === id);
      openForm(container, item);
    });
  });
}

function openForm(container, item) {
  const cfg = getConfig();
  const isEdit = !!item;
  const modal = openModal({
    icon: isEdit ? 'edit' : 'plus',
    title: isEdit ? 'Modifier la fiche' : 'Ajouter une fiche',
    confirmLabel: isEdit ? 'Enregistrer' : 'Ajouter',
    bodyHtml: cfg.fields.map((f) => `
      <div class="field">
        <label for="ref-field-${f.key}">${f.label}${f.required ? ' <span class="req">*</span>' : ''}</label>
        ${f.select ? `
          <div class="select-wrap">
            <select class="select" id="ref-field-${f.key}">
              ${f.select.map((opt) => `<option value="${opt}" ${item?.[f.key] === opt ? 'selected' : ''}>${opt.replaceAll('_', ' ')}</option>`).join('')}
            </select>
            ${icon('chevronDown', { size: 14 })}
          </div>
        ` : `<input class="input" type="${f.type || 'text'}" id="ref-field-${f.key}" value="${escapeHtml(item?.[f.key] ?? '')}">`}
      </div>
    `).join(''),
    onConfirm: ({ close, root }) => {
      const data = {};
      let missing = false;
      cfg.fields.forEach((f) => {
        const val = root.querySelector(`#ref-field-${f.key}`).value;
        if (f.required && !val) missing = true;
        data[f.key] = f.type === 'number' ? Number(val) || 0 : val;
      });
      if (missing) { toast({ type: 'error', title: 'Champs obligatoires manquants' }); return; }
      if (isEdit) cfg.service.update(item.id, data);
      else cfg.service.add(data);
      toast({ type: 'success', title: isEdit ? 'Fiche modifiée' : 'Fiche ajoutée' });
      close();
      renderTable(container);
    },
  });
}
