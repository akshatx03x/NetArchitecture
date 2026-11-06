import { generateCiscoConfigs } from '../src/lib/engines/configurationEngine';

describe('Cisco IOS Configuration Generator', () => {
  const mockScenarioData = {
    networkName: 'Test-Campus',
    networkType: 'Campus LAN',
    allocatedSubnets: [
      {
        name: 'Workstations',
        vlanId: 10,
        networkAddress: '10.10.0.0',
        subnetMask: '255.255.254.0',
        wildcardMask: '0.0.1.255',
        defaultGateway: '10.10.0.1'
      },
      {
        name: 'Servers',
        vlanId: 20,
        networkAddress: '10.10.2.0',
        subnetMask: '255.255.255.0',
        wildcardMask: '0.0.0.255',
        defaultGateway: '10.10.2.1'
      }
    ],
    routingRecommendation: {
      protocol: 'Single-Area OSPF'
    },
    redundancy: 'High'
  };

  test('generates complete configuration package with all required devices', () => {
    const configs = generateCiscoConfigs(mockScenarioData);

    expect(configs.coreSwitch).toBeDefined();
    expect(configs.accessSwitch).toBeDefined();
    expect(configs.edgeRouter).toBeDefined();
    expect(configs.securityAcl).toBeDefined();
  });

  test('verifies correct VLAN creation and SVI generation in Core Switch', () => {
    const { coreSwitch } = generateCiscoConfigs(mockScenarioData);
    const content = coreSwitch.content;

    // Check VLANs
    expect(content).toContain('vlan 10');
    expect(content).toContain('name Workstations');
    expect(content).toContain('vlan 20');
    expect(content).toContain('name Servers');

    // Check SVIs with correct gateway IP and subnet mask
    expect(content).toContain('interface Vlan10');
    expect(content).toContain('ip address 10.10.0.1 255.255.254.0');
    expect(content).toContain('interface Vlan20');
    expect(content).toContain('ip address 10.10.2.1 255.255.255.0');
  });

  test('verifies explicit trunk allowed VLANs and native VLAN quarantine', () => {
    const { coreSwitch, accessSwitch } = generateCiscoConfigs(mockScenarioData);

    expect(coreSwitch.content).toContain('switchport trunk allowed vlan 10,20');
    expect(coreSwitch.content).toContain('switchport trunk native vlan 999');
    expect(accessSwitch.content).toContain('switchport trunk allowed vlan 10,20');
    expect(accessSwitch.content).toContain('switchport trunk native vlan 999');
  });

  test('verifies Spanning Tree Rapid-PVST+ and BPDU Guard configuration', () => {
    const { coreSwitch, accessSwitch } = generateCiscoConfigs(mockScenarioData);

    expect(coreSwitch.content).toContain('spanning-tree mode rapid-pvst');
    expect(coreSwitch.content).toContain('priority 4096');

    expect(accessSwitch.content).toContain('spanning-tree mode rapid-pvst');
    expect(accessSwitch.content).toContain('spanning-tree portfast default');
    expect(accessSwitch.content).toContain('spanning-tree portfast bpduguard default');
  });

  test('verifies OSPF network statements with exact calculated wildcard masks', () => {
    const { coreSwitch, edgeRouter } = generateCiscoConfigs(mockScenarioData);

    expect(coreSwitch.content).toContain('network 10.10.0.0 0.0.1.255 area 0');
    expect(coreSwitch.content).toContain('network 10.10.2.0 0.0.0.255 area 0');
    expect(edgeRouter.content).toContain('network 10.10.0.0 0.0.1.255 area 0');
  });

  test('verifies ACL security rules with anti-spoofing and subnet policies', () => {
    const { edgeRouter, securityAcl } = generateCiscoConfigs(mockScenarioData);

    // Anti-spoofing on edge router
    expect(edgeRouter.content).toContain('deny ip 10.0.0.0 0.255.255.255 any');
    expect(edgeRouter.content).toContain('deny ip 192.168.0.0 0.0.255.255 any');

    // Departmental ACLs
    expect(securityAcl.content).toContain('ACL_WORKSTATIONS');
    expect(securityAcl.content).toContain('permit udp 10.10.0.0 0.0.1.255 any eq bootps');
    expect(securityAcl.content).toContain('permit tcp 10.10.0.0 0.0.1.255 any eq 443');
  });
});

