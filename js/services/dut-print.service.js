import { readCollection, writeCollection, readObject } from '../core/storage.js';
import { getCurrentUser } from '../core/auth.js';
import { accessibleDut } from './workspace.service.js';
import { transportersRepo, vehiclesRepo } from '../repositories/referentials.repository.js';
import { findOperationById } from '../repositories/operations.repository.js';
import { forDut } from './audit.service.js';
import { uuid } from '../core/utils.js';
export const PRINT_KEY = 'dut_prints_v2';
export const COPIES = { TRANSPORTEUR:'Exemplaire transporteur', EXPEDITEUR:'Exemplaire expéditeur', DESTINATAIRE:'Exemplaire destinataire', OIC:'Souche OIC' };
export function printState(dut) {
  if (dut.status === 'VALIDE') return { label:'VALIDÉ', color:[18,112,67], watermark:'', qr:'QR actif', warning:'Statut au moment de l’impression. Vérifier le registre local lors du contrôle.' };
  if (dut.status === 'SUSPENDU') return { label:'SUSPENDU', color:[155,94,10], watermark:'SUSPENDU', qr:'QR en alerte', warning:'Ce document ne peut pas être présenté comme valide tant que la suspension n’est pas levée.' };
  if (dut.status === 'RETIRE') return { label:'RETIRÉ', color:[166,40,40], watermark:'RETIRÉ', qr:'QR révoqué', warning:'Document sans valeur. Le numéro attribué ne peut pas être réutilisé.' };
  return { label: dut.status === 'TERMINE' ? 'EN ATTENTE' : dut.status === 'REJETE' ? 'REJETÉ' : 'BROUILLON', color:[97,105,121], watermark:'SANS VALEUR', qr:'Aucun QR', warning:'Épreuve de travail non officielle. Numéro et QR attribués uniquement à la validation.' };
}
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(v => canonical(v ?? null)).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).filter(k => value[k] !== undefined).sort().map(k => JSON.stringify(k)+':'+canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
export async function fingerprint(payload) {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(payload)));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,'0')).join('');
}
export function printHistory(id) { return readCollection(PRINT_KEY).filter(p => p.dutId === id).sort((a,b)=>b.rank-a.rank); }
export function nextRank(dut) { return Math.max(0, ...printHistory(dut.id).map(p=>p.rank), ...(dut.pdfVersions || []).map(v=>v.version)) + 1; }
export function printPayload(dut, { copy='TRANSPORTEUR', rank=nextRank(dut), generatedAt=new Date().toISOString() } = {}) {
  if (!COPIES[copy]) throw new Error('Exemplaire inconnu.');
  const linkedTransporter = transportersRepo.findById(dut.general.transporterId);
  const transporter = linkedTransporter?.name === dut.general.transporterName ? linkedTransporter : transportersRepo.getAll().find(t=>t.name===dut.general.transporterName);
  const linkedVehicle = vehiclesRepo.findById(dut.general.vehicleId);
  const vehicle = linkedVehicle?.immatriculation === dut.general.immatriculation ? linkedVehicle : vehiclesRepo.getAll().find(v=>v.immatriculation===dut.general.immatriculation);
  const workspace = readObject('dut_workspace_v1', {})[dut.id];
  const action = dut.status === 'SUSPENDU' ? 'DUT_SUSPENDED' : 'DUT_WITHDRAWN';
  const statusNote = forDut(dut.id).filter(a=>a.action===action).sort((a,b)=>b.date.localeCompare(a.date))[0]?.note || '';
  const { pdfVersions, updatedAt, ...document } = dut;
  return { schema:'DUT-OIC-RECTO-VERSO-2', document, copy, rank, generatedAt,
    transporter: { registre: dut.general.transporterRegistre || transporter?.registre || '' },
    vehicle: { type:dut.general.vehicleType || vehicle?.type || '', capaciteTonnes:dut.general.vehicleCapacity ?? vehicle?.capaciteTonnes ?? null },
    operation: findOperationById(dut.operationId)?.code || '',
    files: (workspace?.files || []).map(f=>({name:f.name,category:f.category})), statusNote,
  };
}
export function commitPrint(payload, hash, reason) {
  const dut = accessibleDut(payload.document.id);
  if (nextRank(dut) !== payload.rank || canonical(printPayload(dut,{copy:payload.copy,rank:payload.rank,generatedAt:payload.generatedAt})) !== canonical(payload)) throw new Error('Le dossier a changé pendant la génération. Relancez l’impression.');
  if (payload.rank > 1 && !reason?.trim()) throw new Error('Le motif de réimpression est obligatoire.');
  const prints = readCollection(PRINT_KEY);
  const entry = { id:uuid(),dutId:dut.id,rank:payload.rank,copy:payload.copy,hash,payload,reason:reason?.trim() || 'Première impression',author:getCurrentUser()?.name || '',role:getCurrentUser()?.role || '',at:payload.generatedAt };
  prints.push(entry); writeCollection(PRINT_KEY,prints); return entry;
}
export async function verifyPrint(dut, rank, hash) {
  const entry = printHistory(dut.id).find(p=>p.rank===Number(rank));
  if (!entry) return { ok:false,message:'Rang d’impression inconnu dans ce navigateur.' };
  if (!/^[a-f0-9]{64}$/i.test(String(hash).trim())) return {ok:false,message:'Saisissez les 64 caractères de l’empreinte.'};
  const computed = await fingerprint(entry.payload);
  const ok = computed === entry.hash && computed === String(hash).trim().toLowerCase();
  return {ok,message:ok ? `Empreinte conforme à l’impression n° ${entry.rank} (${COPIES[entry.copy]}). Comparez aussi les champs du papier aux données du registre.` : 'Empreinte différente : cet exemplaire ne correspond pas à l’impression enregistrée.'};
}
