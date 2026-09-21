import { uuid, nowIso } from '../core/utils.js';
import { getCurrentUser } from '../core/auth.js';
import { CONTROL_RESULTS, DUT_STATUS, AUDIT_ACTIONS } from '../core/constants.js';
import { findDutByQrToken } from '../repositories/dut.repository.js';
import { appendControlLog } from '../repositories/controls.repository.js';
import { extractToken } from './qr.service.js';
import * as auditService from './audit.service.js';

const STATUS_TO_RESULT = {
  [DUT_STATUS.VALIDE]: CONTROL_RESULTS.VALID,
  [DUT_STATUS.SUSPENDU]: CONTROL_RESULTS.SUSPENDED,
  [DUT_STATUS.RETIRE]: CONTROL_RESULTS.WITHDRAWN,
};

/**
 * Vérifie un token scanné auprès du système officiel (simulé par LocalStorage
 * dans ce POC). Le statut affiché est TOUJOURS celui du système, jamais celui
 * imprimé sur un document papier — c'est la source de vérité.
 */
export function verifyScan(rawScanValue, geo = null) {
  const token = extractToken(rawScanValue) || rawScanValue;
  const dut = findDutByQrToken(token);
  const result = dut ? (STATUS_TO_RESULT[dut.status] || CONTROL_RESULTS.UNKNOWN) : CONTROL_RESULTS.UNKNOWN;

  const user = getCurrentUser();
  const entry = {
    id: uuid(),
    token,
    dutId: dut?.id || null,
    dutNumber: dut?.dutNumber || null,
    agentId: user?.id || 'SYSTEM',
    agentLabel: user?.name || 'SYSTEM',
    result,
    date: nowIso(),
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
  };
  appendControlLog(entry);

  if (dut) {
    auditService.log(AUDIT_ACTIONS.DUT_CONTROLLED, {
      dutId: dut.id,
      dutNumber: dut.dutNumber,
      newValue: result,
      note: `Contrôle par ${user?.name || 'agent'} — résultat ${result}`,
    });
  }

  return { result, dut, entry };
}
