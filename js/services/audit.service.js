import { readCollection } from '../core/storage.js';
import { uuid, nowIso } from '../core/utils.js';
import { getCurrentUser } from '../core/auth.js';
import { appendAuditLog, getAuditLogsForDut, getAllAuditLogs } from '../repositories/audit.repository.js';
import { AUDIT_LABELS } from '../core/constants.js';

export function log(action, { dutId = null, dutNumber = null, oldValue = null, newValue = null, note = null } = {}) {
  const user = getCurrentUser();
  const entry = {
    id: uuid(),
    action,
    label: AUDIT_LABELS[action] || action,
    dutId,
    dutNumber,
    userId: user?.id || 'SYSTEM',
    userLabel: user?.name || 'SYSTEM',
    role: user?.role || 'SYSTEM',
    oldValue,
    newValue,
    note,
    date: nowIso(),
  };
  return appendAuditLog(entry);
}

export function forDut(dutId) {
  return getAuditLogsForDut(dutId);
}

export function all() {
  const prints=readCollection('dut_prints_v2').map(p=>({id:p.id,action:'DUT_PDF_GENERATED',label:`Impression n° ${p.rank}`,dutId:p.dutId,dutNumber:p.payload.document.dutNumber,userLabel:p.author,role:p.role||'',date:p.at,note:p.reason,newValue:p.hash}));
  return [...getAllAuditLogs(),...prints].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function recent(limit = 10) {
  return all().slice(0, limit);
}
