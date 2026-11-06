/**
 * IPv4 Mathematical & Bitwise Utilities
 * Safe unsigned 32-bit operations avoiding JavaScript signed integer wrap-around.
 */

export function isValidIpv4(ip) {
  if (typeof ip !== 'string') return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  for (let i = 0; i < 4; i++) {
    const p = parts[i];
    if (!/^\d+$/.test(p)) return false;
    const n = Number(p);
    if (n < 0 || n > 255 || (p.length > 1 && p.startsWith('0'))) return false;
  }
  return true;
}

export function ipv4ToUint32(ip) {
  if (!isValidIpv4(ip)) {
    throw new Error(`Invalid IPv4 address format: "${ip}"`);
  }
  const octets = ip.trim().split('.').map(Number);
  return (((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0);
}

export function uint32ToIpv4(uint32) {
  const safeUint = uint32 >>> 0;
  const octet1 = (safeUint >>> 24) & 255;
  const octet2 = (safeUint >>> 16) & 255;
  const octet3 = (safeUint >>> 8) & 255;
  const octet4 = safeUint & 255;
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

export function cidrToMaskUint32(prefix) {
  const p = Number(prefix);
  if (!Number.isInteger(p) || p < 0 || p > 32) {
    throw new Error(`CIDR prefix must be an integer between 0 and 32, received: ${prefix}`);
  }
  if (p === 0) return 0 >>> 0;
  return ((0xffffffff << (32 - p)) >>> 0);
}

export function prefixToSubnetMask(prefix) {
  return uint32ToIpv4(cidrToMaskUint32(prefix));
}

export function prefixToWildcardMask(prefix) {
  const mask = cidrToMaskUint32(prefix);
  const wildcard = (~mask) >>> 0;
  return uint32ToIpv4(wildcard);
}

export function calculateNetworkAddress(ipUint32, maskUint32) {
  return ((ipUint32 & maskUint32) >>> 0);
}

export function calculateBroadcastAddress(netUint32, maskUint32) {
  const hostBits = (~maskUint32) >>> 0;
  return ((netUint32 | hostBits) >>> 0);
}

export function parseCidr(cidr) {
  if (typeof cidr !== 'string') {
    throw new Error('CIDR must be a string in format "x.x.x.x/yy"');
  }
  const parts = cidr.trim().split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid CIDR notation "${cidr}". Must contain exactly one "/"`);
  }
  const [ipStr, prefixStr] = parts;
  if (!isValidIpv4(ipStr)) {
    throw new Error(`Invalid IP address in CIDR: "${ipStr}"`);
  }
  if (!/^\d+$/.test(prefixStr)) {
    throw new Error(`Invalid prefix length in CIDR: "${prefixStr}"`);
  }
  const prefix = Number(prefixStr);
  if (prefix < 0 || prefix > 32) {
    throw new Error(`Prefix length must be between 0 and 32. Received: ${prefix}`);
  }

  const maskUint32 = cidrToMaskUint32(prefix);
  const ipUint32 = ipv4ToUint32(ipStr);
  const networkUint32 = calculateNetworkAddress(ipUint32, maskUint32);
  const broadcastUint32 = calculateBroadcastAddress(networkUint32, maskUint32);

  return {
    ip: ipStr,
    prefix,
    networkIp: uint32ToIpv4(networkUint32),
    networkUint32,
    maskUint32,
    subnetMask: prefixToSubnetMask(prefix),
    wildcardMask: prefixToWildcardMask(prefix),
    broadcastIp: uint32ToIpv4(broadcastUint32),
    broadcastUint32,
    totalAddresses: prefix === 0 ? 4294967296 : Math.pow(2, 32 - prefix),
    isExactNetwork: ipUint32 === networkUint32
  };
}

