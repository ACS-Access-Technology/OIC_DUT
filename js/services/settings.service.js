import { readObject } from '../core/storage.js';
export const SETTINGS_KEY = 'dut_settings_v1';
export const DEFAULT_SETTINGS = { platformName:'DUT-OIC', supportEmail:'', overdueDays:2, rangeQuantity:100, rangePrice:2500 };
export function settings() { return {...DEFAULT_SETTINGS,...readObject(SETTINGS_KEY,{})}; }
export function validateSettings(values) {
  const value={platformName:String(values.platformName||'').trim(),supportEmail:String(values.supportEmail||'').trim(),overdueDays:Number(values.overdueDays),rangeQuantity:Number(values.rangeQuantity),rangePrice:Number(values.rangePrice)};
  if (!value.platformName || value.platformName.length>45) throw new Error('Le nom doit contenir entre 1 et 45 caractères.');
  if(value.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.supportEmail)) throw new Error('Adresse d’assistance invalide.');
  if(!Number.isInteger(value.overdueDays)||value.overdueDays<1||value.overdueDays>90)throw new Error('Le seuil doit être compris entre 1 et 90 jours.');
  if(!Number.isInteger(value.rangeQuantity)||value.rangeQuantity<1||value.rangeQuantity>10000)throw new Error('La quantité doit être comprise entre 1 et 10 000.');
  if(!Number.isFinite(value.rangePrice)||value.rangePrice<0||value.rangePrice>1000000)throw new Error('Le tarif doit être compris entre 0 et 1 000 000 FCFA.');
  return value;
}
