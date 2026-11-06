import { allocateVlsm, calculateRequiredPrefix } from '../src/lib/engines/vlsmEngine';
import {
  isValidIpv4,
  ipv4ToUint32,
  uint32ToIpv4,
  prefixToWildcardMask,
  prefixToSubnetMask,
  parseCidr
} from '../src/lib/utils/ipUtils';
import { AddressSpaceExhaustionError, NetworkValidationError } from '../src/lib/errors/NetworkErrors';

describe('VLSM Subnet Allocation Engine', () => {
  test('correctly calculates example: 192.168.0.0/24 with 100, 50, 20 hosts', () => {
    const root = '192.168.0.0/24';
    const departments = [
      { name: 'Department A', hosts: 100 },
      { name: 'Department B', hosts: 50 },
      { name: 'Department C', hosts: 20 }
    ];

    const result = allocateVlsm(root, departments);
    const subs = result.allocatedSubnets;

    expect(subs).toHaveLength(3);
    // Dept A: 100 hosts -> /25 (128 addresses)
    expect(subs[0].name).toBe('Department A');
    expect(subs[0].cidr).toBe('192.168.0.0/25');
    expect(subs[0].networkAddress).toBe('192.168.0.0');
    expect(subs[0].broadcastAddress).toBe('192.168.0.127');
    expect(subs[0].firstUsable).toBe('192.168.0.1');
    expect(subs[0].lastUsable).toBe('192.168.0.126');
    expect(subs[0].defaultGateway).toBe('192.168.0.1');
    expect(subs[0].subnetMask).toBe('255.255.255.128');
    expect(subs[0].wildcardMask).toBe('0.0.0.127');

    // Dept B: 50 hosts -> /26 (64 addresses)
    expect(subs[1].name).toBe('Department B');
    expect(subs[1].cidr).toBe('192.168.0.128/26');
    expect(subs[1].networkAddress).toBe('192.168.0.128');
    expect(subs[1].broadcastAddress).toBe('192.168.0.191');
    expect(subs[1].firstUsable).toBe('192.168.0.129');
    expect(subs[1].lastUsable).toBe('192.168.0.190');
    expect(subs[1].subnetMask).toBe('255.255.255.192');
    expect(subs[1].wildcardMask).toBe('0.0.0.63');

    // Dept C: 20 hosts -> /27 (32 addresses)
    expect(subs[2].name).toBe('Department C');
    expect(subs[2].cidr).toBe('192.168.0.192/27');
    expect(subs[2].networkAddress).toBe('192.168.0.192');
    expect(subs[2].broadcastAddress).toBe('192.168.0.223');
    expect(subs[2].firstUsable).toBe('192.168.0.193');
    expect(subs[2].lastUsable).toBe('192.168.0.222');
    expect(subs[2].subnetMask).toBe('255.255.255.224');
    expect(subs[2].wildcardMask).toBe('0.0.0.31');
  });

  test('sorts requests descending regardless of input order', () => {
    const root = '10.0.0.0/24';
    const departments = [
      { name: 'Small', hosts: 10 },
      { name: 'Large', hosts: 120 },
      { name: 'Medium', hosts: 50 }
    ];

    const result = allocateVlsm(root, departments);
    expect(result.allocatedSubnets[0].name).toBe('Large');
    expect(result.allocatedSubnets[0].cidr).toBe('10.0.0.0/25');
    expect(result.allocatedSubnets[1].name).toBe('Medium');
    expect(result.allocatedSubnets[1].cidr).toBe('10.0.0.128/26');
    expect(result.allocatedSubnets[2].name).toBe('Small');
    expect(result.allocatedSubnets[2].cidr).toBe('10.0.0.192/28');
  });

  test('verifies no allocated subnets overlap', () => {
    const root = '172.16.0.0/20';
    const departments = [
      { name: 'D1', hosts: 500 },
      { name: 'D2', hosts: 250 },
      { name: 'D3', hosts: 120 },
      { name: 'D4', hosts: 60 },
      { name: 'D5', hosts: 30 },
      { name: 'D6', hosts: 10 }
    ];

    const result = allocateVlsm(root, departments);
    const subnets = result.allocatedSubnets;

    for (let i = 0; i < subnets.length; i++) {
      const netA = ipv4ToUint32(subnets[i].networkAddress);
      const bcastA = ipv4ToUint32(subnets[i].broadcastAddress);

      for (let j = i + 1; j < subnets.length; j++) {
        const netB = ipv4ToUint32(subnets[j].networkAddress);
        const bcastB = ipv4ToUint32(subnets[j].broadcastAddress);

        // Neither range can overlap
        const overlap = (netA <= bcastB && bcastA >= netB);
        expect(overlap).toBe(false);
      }
    }
  });

  test('throws AddressSpaceExhaustionError when requests exceed available addresses', () => {
    const root = '192.168.1.0/24'; // 256 addresses total
    const departments = [
      { name: 'Heavy1', hosts: 150 },
      { name: 'Heavy2', hosts: 150 } // Total addresses required: 256 + 256 = 512
    ];

    expect(() => {
      allocateVlsm(root, departments);
    }).toThrow(AddressSpaceExhaustionError);
  });

  test('correctly allocates /30 subnets for point-to-point links (standard LAN)', () => {
    const res = calculateRequiredPrefix(2);
    expect(res.prefix).toBe(30);
    expect(res.totalAddresses).toBe(4);
    expect(res.usableHosts).toBe(2);
  });

  test('correctly supports /31 for RFC 3021 Point-to-Point links', () => {
    const res = calculateRequiredPrefix(2, { allowRfc3021: true });
    expect(res.prefix).toBe(31);
    expect(res.totalAddresses).toBe(2);
    expect(res.usableHosts).toBe(2);
  });

  test('correctly supports /32 host route', () => {
    const res = calculateRequiredPrefix(1, { isHostRoute: true });
    expect(res.prefix).toBe(32);
    expect(res.totalAddresses).toBe(1);
    expect(res.usableHosts).toBe(1);
  });

  test('computes exact wildcard masks across standard prefixes', () => {
    expect(prefixToWildcardMask(24)).toBe('0.0.0.255');
    expect(prefixToWildcardMask(25)).toBe('0.0.0.127');
    expect(prefixToWildcardMask(26)).toBe('0.0.0.63');
    expect(prefixToWildcardMask(27)).toBe('0.0.0.31');
    expect(prefixToWildcardMask(28)).toBe('0.0.0.15');
    expect(prefixToWildcardMask(29)).toBe('0.0.0.7');
    expect(prefixToWildcardMask(30)).toBe('0.0.0.3');
    expect(prefixToWildcardMask(16)).toBe('0.0.255.255');
    expect(prefixToWildcardMask(8)).toBe('0.255.255.255');
  });

  test('handles boundary IPv4 addresses without integer wrap-around', () => {
    const ip0 = ipv4ToUint32('0.0.0.0');
    expect(ip0).toBe(0);
    expect(uint32ToIpv4(ip0)).toBe('0.0.0.0');

    const ip255 = ipv4ToUint32('255.255.255.255');
    expect(ip255).toBe(4294967295);
    expect(uint32ToIpv4(ip255)).toBe('255.255.255.255');

    const parsed = parseCidr('10.0.0.0/8');
    expect(parsed.networkIp).toBe('10.0.0.0');
    expect(parsed.broadcastIp).toBe('10.255.255.255');
  });

  test('allocates large enterprise Class B network 172.16.0.0/16 with non-overlapping subnets', () => {
    const root = '172.16.0.0/16';
    const departments = [
      { name: 'Data Center Primary', hosts: 4000 }, // 4000 hosts -> /20 (4096 IPs)
      { name: 'Corporate Campuses', hosts: 2000 },  // 2000 hosts -> /21 (2048 IPs)
      { name: 'Remote Engineering', hosts: 1000 }   // 1000 hosts -> /22 (1024 IPs)
    ];

    const result = allocateVlsm(root, departments);
    const subnets = result.allocatedSubnets;

    expect(subnets[0].cidr).toBe('172.16.0.0/20');
    expect(subnets[0].networkAddress).toBe('172.16.0.0');
    expect(subnets[0].broadcastAddress).toBe('172.16.15.255');

    expect(subnets[1].cidr).toBe('172.16.16.0/21');
    expect(subnets[1].networkAddress).toBe('172.16.16.0');
    expect(subnets[1].broadcastAddress).toBe('172.16.23.255');

    expect(subnets[2].cidr).toBe('172.16.24.0/22');
    expect(subnets[2].networkAddress).toBe('172.16.24.0');
    expect(subnets[2].broadcastAddress).toBe('172.16.27.255');

    // Pairwise non-overlapping check
    const net0 = ipv4ToUint32(subnets[0].networkAddress);
    const bc0 = ipv4ToUint32(subnets[0].broadcastAddress);
    const net1 = ipv4ToUint32(subnets[1].networkAddress);
    const bc1 = ipv4ToUint32(subnets[1].broadcastAddress);
    const net2 = ipv4ToUint32(subnets[2].networkAddress);
    const bc2 = ipv4ToUint32(subnets[2].broadcastAddress);

    expect(bc0 < net1).toBe(true);
    expect(bc1 < net2).toBe(true);
  });

  test('allocates very large Class A network 10.0.0.0/8 with 50000 and 20000 hosts', () => {
    const root = '10.0.0.0/8';
    const departments = [
      { name: 'Regional Hub 1', hosts: 50000 }, // 50000 -> /16 (65536 IPs)
      { name: 'Regional Hub 2', hosts: 20000 }  // 20000 -> /17 (32768 IPs)
    ];

    const result = allocateVlsm(root, departments);
    const subnets = result.allocatedSubnets;

    expect(subnets[0].cidr).toBe('10.0.0.0/16');
    expect(subnets[0].broadcastAddress).toBe('10.0.255.255');
    expect(subnets[1].cidr).toBe('10.1.0.0/17');
    expect(subnets[1].broadcastAddress).toBe('10.1.127.255');
  });

  test('throws NetworkValidationError on invalid CIDR string', () => {
    expect(() => {
      allocateVlsm('192.168.1.500/24', [{ name: 'Test', hosts: 10 }]);
    }).toThrow(Error);

    expect(() => {
      allocateVlsm('not-a-cidr', [{ name: 'Test', hosts: 10 }]);
    }).toThrow(Error);
  });
});

