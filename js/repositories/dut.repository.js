import { STORAGE_KEYS } from '../core/constants.js';
import { readCollection, writeCollection } from '../core/storage.js';

export function getAllDuts() {
  return readCollection(STORAGE_KEYS.DUT_LIST);
}

export function saveDuts(list) {
  writeCollection(STORAGE_KEYS.DUT_LIST, list);
}

export function findDutById(id) {
  return getAllDuts().find((d) => d.id === id) || null;
}

export function findDutByQrToken(token) {
  return getAllDuts().find((d) => d.qrToken === token) || null;
}

export function findDutByNumber(number) {
  return getAllDuts().find((d) => d.dutNumber === number) || null;
}

export function addDut(dut) {
  const list = getAllDuts();
  list.push(dut);
  saveDuts(list);
  return dut;
}

export function updateDut(id, patch) {
  const list = getAllDuts();
  const idx = list.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error('DUT introuvable.');
  list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
  saveDuts(list);
  return list[idx];
}
