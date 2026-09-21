import { icon } from '../core/icons.js';
import { escapeHtml } from '../core/utils.js';
import { listAntennas } from '../services/directory.service.js';

let mapInstance = null;

export function render(container) {
  const antennas = listAntennas();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <span class="overline">Partenaire · Réseau</span>
        <h1>Carte des antennes OIC</h1>
        <div class="subtitle">Localisez l’antenne la plus proche</div>
      </div>
    </div>
    <div class="page-header-rule"></div>
    <div class="alert-banner info">
      ${icon('info', { size: 18 })}
      <div class="alert-text"><strong>Données de démonstration</strong>Les positions affichées sont indicatives et ne constituent pas des coordonnées officielles.</div>
    </div>
    <div class="antennas-layout">
    <section class="map-card antennas-map-panel" aria-label="Localisation des antennes">
      <div class="card-header"><h3>Localisation</h3></div>
      <div id="antennas-map" class="map-container"></div>
    </section>
    <section class="card antennas-table-panel" aria-label="Liste des antennes">
      <div class="card-header"><div><h3>Antennes du réseau</h3><div class="subtitle">Sélectionnez une antenne pour la situer sur la carte.</div></div></div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th scope="col">Antenne</th><th scope="col">Adresse</th><th scope="col">Téléphone</th><th scope="col">Horaires</th><th></th></tr></thead>
        <tbody id="antenna-cards"></tbody>
      </table></div>
    </section>
    </div>
  `;

  container.querySelector('#antenna-cards').innerHTML = antennas.map((a) => `
    <tr data-id="${a.id}">
      <td class="cell-2line"><strong>${escapeHtml(a.name)}</strong><span>${escapeHtml(a.city)}</span></td>
      <td>${escapeHtml(a.address)}</td>
      <td>${escapeHtml(a.phone)}</td>
      <td>${escapeHtml(a.hours)}</td>
      <td class="text-right">
        <a class="link-action guide-btn" target="_blank" rel="noopener"
           href="https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=15/${a.lat}/${a.lng}">Me guider</a>
      </td>
    </tr>
  `).join('');

  if (!window.L) {
    container.querySelector('#antennas-map').innerHTML = '<p style="padding:var(--s4);color:var(--text-muted)">Carte indisponible (Leaflet non chargé).</p>';
    return;
  }

  if (mapInstance) { mapInstance.remove(); mapInstance = null; }
  mapInstance = window.L.map('antennas-map').setView([7.54, -5.55], 7);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(mapInstance);

  if (antennas.length) mapInstance.fitBounds(antennas.map(a => [a.lat, a.lng]), { padding: [24, 24], maxZoom: 7 });

  antennas.forEach((a) => {
    const marker = window.L.marker([a.lat, a.lng]).addTo(mapInstance);
    marker.bindPopup(`
      <div class="antenna-popup">
        <strong>${escapeHtml(a.name)}</strong>
        <div class="row">${escapeHtml(a.address)}</div>
        <div class="row">${escapeHtml(a.phone)}</div>
        <div class="row">${escapeHtml(a.hours)}</div>
      </div>
    `);
    container.querySelector(`[data-id="${a.id}"]`)?.addEventListener('click', (e) => {
      if (e.target.closest('.guide-btn')) return;
      mapInstance.setView([a.lat, a.lng], 12);
      marker.openPopup();
    });
  });
}
