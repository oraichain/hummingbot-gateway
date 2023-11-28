import {
  validateTokenSymbols,
  mkValidator,
  mkRequestValidator,
  RequestValidator,
  Validator,
  validateTxHash,
} from '../../services/validators';
import { normalizeBech32 } from '@cosmjs/encoding';

export const invalidAuraAddressError: string =
  'The spender param is not a valid Aura address. (Bech32 format)';

export const isValidAuraAddress = (str: string): boolean => {
  try {
    normalizeBech32(str);

    return true;
  } catch (e) {
    return false;
  }
};

// given a request, look for a key called address that is a Aura address
export const validatePublicKey: Validator = mkValidator(
  'address',
  invalidAuraAddressError,
  (val) => typeof val === 'string' && isValidAuraAddress(val)
);

export const validateAuraBalanceRequest: RequestValidator = mkRequestValidator([
  validatePublicKey,
  validateTokenSymbols,
]);

export const validateAuraPollRequest: RequestValidator = mkRequestValidator([
  validateTxHash,
]);
