import { STORAGE_KEYS } from '../core/constants.js';
import { readCollection, writeCollection } from '../core/storage.js';

export function getAllControlLogs() {
  return readCollection(STORAGE_KEYS.CONTROL_LOGS);
}

export function appendControlLog(entry) {
  const list = readCollection(STORAGE_KEYS.CONTROL_LOGS);
  list.push(entry);
  writeCollection(STORAGE_KEYS.CONTROL_LOGS, list);
  return entry;
}
