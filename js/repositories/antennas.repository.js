import { STORAGE_KEYS } from '../core/constants.js';
import { readCollection, writeCollection } from '../core/storage.js';

export function getAllAntennas() {
  return readCollection(STORAGE_KEYS.ANTENNAS);
}

export function saveAntennas(list) {
  writeCollection(STORAGE_KEYS.ANTENNAS, list);
}

export function findAntennaById(id) {
  return getAllAntennas().find((a) => a.id === id) || null;
}

export function findAntennaByName(name) {
  return getAllAntennas().find((a) => a.name.toLowerCase() === String(name).toLowerCase()) || null;
}
