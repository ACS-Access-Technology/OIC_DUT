/**
 * Revue + validation/rejet d'un DUT par l'antenne. Réutilise le rendu détaillé
 * (mêmes sections, mêmes actions contextuelles) : la logique de validation
 * vit dans dut.service.js, ce fichier ne fait qu'exposer la route dédiée
 * #/antenna/dut/:id prévue par le cahier des charges.
 */
export { render } from './dut-detail.view.js?v=dut-v2';
