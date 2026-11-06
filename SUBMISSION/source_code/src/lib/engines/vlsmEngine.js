import {
  isValidIpv4,
  ipv4ToUint32,
  uint32ToIpv4,
  cidrToMaskUint32,
  prefixToSubnetMask,
  prefixToWildcardMask,
  parseCidr,
  calculateNetworkAddress,
  calculateBroadcastAddress
} from '../utils/ipUtils';
import {
  AddressSpaceExhaustionError,
  NetworkValidationError,
  SubnetAlignmentError
} from '../errors/NetworkErrors';

/**
 * Calculates prefix needed for a given host requirement
 */
export function calculateRequiredPrefix(hostCount, options = {}) {
  const { allowRfc3021 = false, isHostRoute = false } = options;
  const hosts = Number(hostCount);

  if (!Number.isInteger(hosts) || hosts < 1) {
    throw new NetworkValidationError(`Host requirement must be an integer >= 1. Received: ${hostCount}`, 'hostCount', hostCount);
  }

  // Specialized /32 single host loopback/route
  if (hosts === 1 && isHostRoute) {
    return { prefix: 32, totalAddresses: 1, usableHosts: 1, hostBits: 0, rfcNote: 'RFC 6164/Host Route (/32)' };
  }

  // Specialized /31 Point-to-Point link (RFC 3021)
  if (hosts === 2 && allowRfc3021) {
    return { prefix: 31, totalAddresses: 2, usableHosts: 2, hostBits: 1, rfcNote: 'RFC 3021 Point-to-Point (/31)' };
  }

  // Standard IPv4 LAN: requires 1 Network IP + 1 Broadcast IP
  const addressesNeeded = hosts + 2;
  let hostBits = Math.ceil(Math.log2(addressesNeeded));
  // In standard IPv4 LANs, minimum host bits is 2 (/30 providing 2 usable hosts)
  if (hostBits < 2) hostBits = 2;

  if (hostBits > 32) {
    throw new NetworkValidationError(`Host requirement of ${hosts} exceeds total IPv4 capacity.`, 'hostCount', hostCount);
  }

  const prefix = 32 - hostBits;
  const totalAddresses = Math.pow(2, hostBits);
  const usableHosts = totalAddresses - 2;

  return {
    prefix,
    totalAddresses,
    usableHosts,
    hostBits,
    rfcNote: 'Standard IPv4 RFC 791 / RFC 4632'
  };
}

/**
 * Genuine VLSM Allocation Engine
 */
export function allocateVlsm(rootCidr, departments, options = {}) {
  if (!rootCidr) {
    throw new NetworkValidationError('Root CIDR network is required for VLSM allocation.', 'rootCidr');
  }

  const root = parseCidr(rootCidr);
  if (!Array.isArray(departments) || departments.length === 0) {
    throw new NetworkValidationError('Departments array must contain at least one requirement.', 'departments');
  }

  // Validate and clone department requests
  const normalizedRequests = departments.map((dept, index) => {
    const name = dept.name || `Subnet-${index + 1}`;
    const hosts = Number(dept.hosts ?? dept.hostCount ?? dept.requiredHosts);
    if (!Number.isInteger(hosts) || hosts < 1) {
      throw new NetworkValidationError(
        `Department "${name}" has invalid host count: ${dept.hosts}. Must be integer >= 1.`,
        'hosts',
        dept.hosts
      );
    }
    const vlanId = dept.vlanId || (10 * (index + 1));
    const allowRfc3021 = Boolean(dept.allowRfc3021 || options.allowRfc3021);
    const isHostRoute = Boolean(dept.isHostRoute);
    return {
      originalIndex: index,
      name,
      requestedHosts: hosts,
      vlanId,
      allowRfc3021,
      isHostRoute,
      description: dept.description || `${name} network segment`
    };
  });

  // Step 3: Sort host requirements in descending order
  // (Fundamental VLSM requirement to prevent fragmentation and guarantee alignment)
  const sortedRequests = [...normalizedRequests].sort((a, b) => b.requestedHosts - a.requestedHosts);

  let currentUint32 = root.networkUint32;
  const allocations = [];
  let totalAllocatedAddresses = 0;
  let totalRequestedHosts = 0;

  for (const req of sortedRequests) {
    const calc = calculateRequiredPrefix(req.requestedHosts, {
      allowRfc3021: req.allowRfc3021,
      isHostRoute: req.isHostRoute
    });

    const prefix = calc.prefix;
    const totalAddresses = calc.totalAddresses;
    const maskUint32 = cidrToMaskUint32(prefix);

    // Step 6: Subnet alignment. Subnet address must be a multiple of totalAddresses
    // Because totalAddresses is a power of 2, alignment is:
    // (currentUint32 + (totalAddresses - 1)) & ~(totalAddresses - 1)
    const alignmentOffset = currentUint32 % totalAddresses;
    if (alignmentOffset !== 0) {
      currentUint32 = (currentUint32 + (totalAddresses - alignmentOffset)) >>> 0;
    }

    const subnetNetworkUint32 = currentUint32;
    const subnetBroadcastUint32 = calculateBroadcastAddress(subnetNetworkUint32, maskUint32);

    // Step 5 & 10: Check exhaustion against root broadcast
    if (subnetBroadcastUint32 > root.broadcastUint32 || subnetNetworkUint32 > root.broadcastUint32) {
      throw new AddressSpaceExhaustionError(
        `Address space exhausted in root network ${rootCidr}. ` +
        `Subnet for "${req.name}" requires ${totalAddresses} addresses (/ ${prefix}) ending at ${uint32ToIpv4(subnetBroadcastUint32)}, ` +
        `which exceeds root boundary ${root.broadcastIp}.`,
        totalAllocatedAddresses + totalAddresses,
        root.totalAddresses
      );
    }

    // Usable range computation
    let firstUsableUint32, lastUsableUint32, defaultGatewayUint32;
    if (prefix === 32) {
      firstUsableUint32 = subnetNetworkUint32;
      lastUsableUint32 = subnetNetworkUint32;
      defaultGatewayUint32 = subnetNetworkUint32;
    } else if (prefix === 31) {
      firstUsableUint32 = subnetNetworkUint32;
      lastUsableUint32 = subnetBroadcastUint32;
      defaultGatewayUint32 = subnetNetworkUint32;
    } else {
      firstUsableUint32 = subnetNetworkUint32 + 1;
      lastUsableUint32 = subnetBroadcastUint32 - 1;
      defaultGatewayUint32 = subnetNetworkUint32 + 1; // standard first usable IP
    }

    const allocation = {
      name: req.name,
      vlanId: req.vlanId,
      requestedHosts: req.requestedHosts,
      prefix,
      cidr: `${uint32ToIpv4(subnetNetworkUint32)}/${prefix}`,
      networkAddress: uint32ToIpv4(subnetNetworkUint32),
      subnetMask: prefixToSubnetMask(prefix),
      wildcardMask: prefixToWildcardMask(prefix),
      firstUsable: uint32ToIpv4(firstUsableUint32),
      lastUsable: uint32ToIpv4(lastUsableUint32),
      broadcastAddress: uint32ToIpv4(subnetBroadcastUint32),
      defaultGateway: uint32ToIpv4(defaultGatewayUint32),
      totalAddresses,
      usableHosts: calc.usableHosts,
      utilizationPercent: Number(((req.requestedHosts / calc.usableHosts) * 100).toFixed(1)),
      mathSteps: [
        `Requested hosts: ${req.requestedHosts}`,
        `Formula: 2^H - 2 >= ${req.requestedHosts} (where H = host bits)`,
        `Calculated host bits H = ${calc.hostBits}, prefix = 32 - ${calc.hostBits} = /${prefix}`,
        `Total block size: 2^${calc.hostBits} = ${totalAddresses} IP addresses`,
        `Subnet boundary: Aligned on block boundary ${uint32ToIpv4(subnetNetworkUint32)}`,
        `Subnet mask: ${prefixToSubnetMask(prefix)} (Wildcard: ${prefixToWildcardMask(prefix)})`,
        `Usable range: ${uint32ToIpv4(firstUsableUint32)} to ${uint32ToIpv4(lastUsableUint32)} (${calc.usableHosts} usable)`,
        `Default Gateway (First usable): ${uint32ToIpv4(defaultGatewayUint32)}`
      ]
    };

    allocations.push(allocation);
    totalAllocatedAddresses += totalAddresses;
    totalRequestedHosts += req.requestedHosts;

    // Advance current pointer to next address block
    currentUint32 = (subnetBroadcastUint32 + 1) >>> 0;
  }

  const remainingAddresses = Math.max(0, root.totalAddresses - totalAllocatedAddresses);
  const overallUtilizationPercent = Number(((totalAllocatedAddresses / root.totalAddresses) * 100).toFixed(1));

  return {
    rootNetwork: rootCidr,
    rootNetworkIp: root.networkIp,
    rootBroadcastIp: root.broadcastIp,
    rootTotalAddresses: root.totalAddresses,
    allocatedSubnets: allocations,
    summary: {
      totalRequestedHosts,
      totalAllocatedAddresses,
      remainingAddresses,
      overallUtilizationPercent,
      subnetsCount: allocations.length,
      nextAvailableNetwork: remainingAddresses > 0 && currentUint32 <= root.broadcastUint32 ? uint32ToIpv4(currentUint32) : 'None (Full)'
    }
  };
}

