import { STORAGE_KEYS } from '../core/constants.js';
import { readCollection } from '../core/storage.js';

export function getAllPartners() {
  return readCollection(STORAGE_KEYS.PARTNERS);
}

export function findPartnerById(id) {
  return getAllPartners().find((p) => p.id === id) || null;
}
