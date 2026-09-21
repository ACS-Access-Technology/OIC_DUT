import { getAllAntennas, findAntennaById } from '../repositories/antennas.repository.js';
import { getAllPartners, findPartnerById } from '../repositories/partners.repository.js';
import { getAllUsers } from '../repositories/users.repository.js';

export function listAntennas() { return getAllAntennas(); }
export function getAntenna(id) { return findAntennaById(id); }
export function listPartners() { return getAllPartners(); }
export function getPartner(id) { return findPartnerById(id); }
export function listUsers() { return getAllUsers(); }
