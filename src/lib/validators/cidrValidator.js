import { isValidIpv4, parseCidr } from '../utils/ipUtils';
import { NetworkValidationError } from '../errors/NetworkErrors';

export function validateCidr(cidr) {
  if (!cidr || typeof cidr !== 'string') {
    return { valid: false, error: 'CIDR string must be provided (e.g., "192.168.1.0/24")' };
  }
  const parts = cidr.trim().split('/');
  if (parts.length !== 2) {
    return { valid: false, error: 'CIDR must follow the format "A.B.C.D/prefix"' };
  }
  const [ip, prefixStr] = parts;
  if (!isValidIpv4(ip)) {
    return { valid: false, error: `Invalid IPv4 address portion: "${ip}"` };
  }
  if (!/^\d+$/.test(prefixStr)) {
    return { valid: false, error: `Prefix length must be a positive integer, received: "${prefixStr}"` };
  }
  const prefix = Number(prefixStr);
  if (prefix < 0 || prefix > 32) {
    return { valid: false, error: `CIDR prefix must be between 0 and 32, received: ${prefix}` };
  }

  try {
    const parsed = parseCidr(cidr);
    return { valid: true, parsed };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

