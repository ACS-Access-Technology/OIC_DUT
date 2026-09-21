/**
 * Couche unique d'accès à LocalStorage. Aucun autre module ne doit appeler
 * localStorage directement — cela permettra de brancher une vraie API plus tard.
 */
export function readCollection(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCollection(key, items) {
  writeObject(key, items);
}

export function readObject(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeObject(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error("Enregistrement local impossible : le stockage du navigateur est plein ou indisponible. Libérez de l’espace puis réessayez."); }
}

export function removeKey(key) {
  localStorage.removeItem(key);
}

export function clearAll() {
  localStorage.clear();
}
