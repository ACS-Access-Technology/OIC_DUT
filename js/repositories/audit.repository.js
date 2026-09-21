import { STORAGE_KEYS } from '../core/constants.js';
import { readCollection, writeCollection } from '../core/storage.js';

export function getAllAuditLogs() {
  return readCollection(STORAGE_KEYS.AUDIT_LOGS);
}

/** Append-only : aucune fonction d'édition ou de suppression n'est exposée. */
export function appendAuditLog(entry) {
  const list = readCollection(STORAGE_KEYS.AUDIT_LOGS);
  list.push(entry);
  writeCollection(STORAGE_KEYS.AUDIT_LOGS, list);
  return entry;
}

export function getAuditLogsForDut(dutId) {
  return getAllAuditLogs()
    .filter((l) => l.dutId === dutId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
