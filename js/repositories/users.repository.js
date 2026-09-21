import { STORAGE_KEYS } from '../core/constants.js';
import { readCollection, writeCollection, readObject, writeObject, removeKey } from '../core/storage.js';

export function getAllUsers() {
  return readCollection(STORAGE_KEYS.USERS);
}

export function saveUsers(users) {
  writeCollection(STORAGE_KEYS.USERS, users);
}

export function findUserByEmail(email) {
  return getAllUsers().find((u) => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}

export function getCurrentUser() {
  return readObject(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user) {
  writeObject(STORAGE_KEYS.CURRENT_USER, user);
}

export function clearCurrentUser() {
  removeKey(STORAGE_KEYS.CURRENT_USER);
}
