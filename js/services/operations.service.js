import { getCurrentUser } from '../core/auth.js';
import { getAllDuts } from '../repositories/dut.repository.js';
import { uuid, nowIso } from '../core/utils.js';
import { AUDIT_ACTIONS } from '../core/constants.js';
import { getAllOperations, addOperation, saveOperations } from '../repositories/operations.repository.js';
import * as auditService from './audit.service.js';

export function listForPartner(partnerId) {
  return getAllOperations().filter((o) => o.partnerId === partnerId);
}

export function listAll() {
  return getAllOperations();
}

export function requestNewRange(user, { quantite, tarifUnitaire, commentaire }) {
  if (getCurrentUser()?.id !== user.id || !['PARTNER_ADMIN', 'PARTNER_EDITOR'].includes(user.role)) throw new Error('Demande non autorisée.');
  if (!Number.isFinite(Number(tarifUnitaire)) || Number(tarifUnitaire) < 0) throw new Error('Tarif invalide.');
  const qty = Number(quantite);
  if (!Number.isSafeInteger(qty) || qty <= 0 || qty > 10000) throw new Error('La quantité doit être un entier entre 1 et 10 000.');
  const operation = {
    id: uuid(),
    code: `OP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
    partnerId: user.partnerId,
    partnerName: user.partnerName,
    year: new Date().getFullYear(),
    rangeStart: null,
    rangeEnd: null,
    quantity: qty,
    used: 0,
    tarifUnitaire: Number(tarifUnitaire) || 0,
    montantTotal: qty * (Number(tarifUnitaire) || 0),
    commentaire: commentaire || '',
    status: 'PENDING',
    requestedAt: nowIso(),
    validatedAt: null,
  };
  addOperation(operation);
  auditService.log(AUDIT_ACTIONS.OPERATION_REQUESTED, { note: `${operation.code} — ${qty} numéros demandés` });
  return operation;
}

export function decideRange(id, accepted, reason = '') {
  const user = getCurrentUser();
  if (user?.role !== 'OIC_ADMIN') throw new Error('Cette action est réservée à l’OIC.');
  const list = getAllOperations();
  const op = list.find(item => item.id === id);
  if (!op || op.status !== 'PENDING') throw new Error('Cette demande a déjà été traitée ou est introuvable.');
  if (!accepted && !reason.trim()) throw new Error('Le motif du refus est obligatoire.');
  if (accepted) {
    if (!Number.isSafeInteger(op.quantity) || op.quantity < 1 || op.quantity > 10000) throw new Error('Quantité de la demande invalide.');
    const year = new Date().getFullYear();
    const existing = getAllDuts().map(d => d.dutNumber?.match(/^DUT-CI-(\d{4})-(\d+)$/)).filter(m => m && Number(m[1]) === year).map(m => Number(m[2]));
    const maximum = Math.max(0, ...list.filter(o => o.status === 'VALIDATED' && Number(o.year) === year).map(o => Number(o.rangeEnd) || 0), ...existing);
    if (maximum + op.quantity > 999999) throw new Error('Capacité de numérotation annuelle atteinte.');
    Object.assign(op, { status: 'VALIDATED', year, rangeStart: maximum + 1, rangeEnd: maximum + op.quantity, used: 0, validatedAt: nowIso() });
  } else Object.assign(op, { status: 'REJECTED', rejectionReason: reason.trim(), rejectedAt: nowIso() });
  op.decidedBy = user.name;
  saveOperations(list);
  return op;
}
