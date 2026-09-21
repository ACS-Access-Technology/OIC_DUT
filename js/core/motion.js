/**
 * Couche motion additive (anime.js v4, chargée en global `anime` via
 * js/vendor/anime.iife.min.js). Purement décorative : si anime.js est absent
 * ou que l'utilisateur préfère moins d'animations, ces fonctions ne touchent
 * à rien — l'UI reste identique et déjà fonctionnelle sans elles.
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function canAnimate() {
  return !!window.anime && !prefersReducedMotion();
}

function formatCount(n, decimals) {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Anime les éléments `[data-countup]` (attribut = valeur cible numérique) d'un conteneur. */
export function animateCountUps(container) {
  if (!canAnimate()) return;
  container.querySelectorAll('[data-countup]').forEach((el) => {
    const target = Number(el.dataset.countup);
    if (!Number.isFinite(target)) return;
    const decimals = Number(el.dataset.countupDecimals || 0);
    const state = { v: target * 0.8 };
    window.anime.animate(state, {
      v: target,
      duration: 650,
      ease: 'out(3)',
      onUpdate: () => { el.textContent = formatCount(state.v, decimals); },
    });
  });
}

/** Fait apparaître une liste d'éléments en fondu + léger décalage vertical, en cascade. */
export function staggerIn(elements) {
  if (!canAnimate() || !elements || !elements.length) return;
  window.anime.animate(elements, {
    opacity: [0.85, 1],
    translateY: [5, 0],
    delay: window.anime.stagger(35),
    duration: 520,
    ease: 'out(3)',
  });
}
