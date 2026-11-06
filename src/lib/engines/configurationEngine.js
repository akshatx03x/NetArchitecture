/**
 * Cisco IOS / IOS-XE Configuration Generator Engine
 * Generates standards-compliant, hardened Cisco configuration scripts
 * based on calculated architecture parameters, VLSM allocations, and routing design.
 */

export function generateCiscoConfigs(scenarioData) {
  const {
    networkName = 'Enterprise-Network',
    networkType = 'Campus LAN',
    allocatedSubnets = [],
    routingRecommendation = {},
    topologyRecommendation = {},
    mediaRecommendation = {},
    redundancy = 'High'
  } = scenarioData;

  const vlanList = allocatedSubnets.map(s => s.vlanId).join(',');
  const primarySubnet = allocatedSubnets[0] || {
    networkAddress: '192.168.1.0',
    subnetMask: '255.255.255.0',
    wildcardMask: '0.0.0.255',
    defaultGateway: '192.168.1.1',
    vlanId: 10
  };

  // 1. Core Switch Configuration
  const coreSwitchConfig = generateCoreSwitchConfig({
    networkName,
    allocatedSubnets,
    vlanList,
    routingRecommendation,
    redundancy
  });

  // 2. Access Switch Configuration
  const accessSwitchConfig = generateAccessSwitchConfig({
    networkName,
    allocatedSubnets,
    vlanList,
    primarySubnet
  });

  // 3. Edge Router Configuration
  const routerConfig = generateRouterConfig({
    networkName,
    networkType,
    allocatedSubnets,
    routingRecommendation,
    primarySubnet
  });

  // 4. Comprehensive ACL Security Policy Configuration
  const aclConfig = generateAclConfig({
    networkName,
    allocatedSubnets
  });

  return {
    coreSwitch: {
      filename: `${slugify(networkName)}-CORE-SW01.cfg`,
      title: 'Core/Distribution Switch Configuration',
      targetDevice: 'Cisco Catalyst 9500 / 9300 (IOS-XE 17.x)',
      content: coreSwitchConfig
    },
    accessSwitch: {
      filename: `${slugify(networkName)}-ACC-SW01.cfg`,
      title: 'Access Switch Configuration',
      targetDevice: 'Cisco Catalyst 9200 (IOS-XE 17.x)',
      content: accessSwitchConfig
    },
    edgeRouter: {
      filename: `${slugify(networkName)}-EDGE-RTR01.cfg`,
      title: 'Border / Edge Router Configuration',
      targetDevice: 'Cisco ISR 4451 / ASR 1001-X (IOS-XE 17.x)',
      content: routerConfig
    },
    securityAcl: {
      filename: `${slugify(networkName)}-SECURITY-ACLS.cfg`,
      title: 'Network Access Control Lists (ACLs) & Hardening',
      targetDevice: 'Cisco IOS-XE Multi-Device Application',
      content: aclConfig
    }
  };
}

function generateCoreSwitchConfig({ networkName, allocatedSubnets, vlanList, routingRecommendation, redundancy }) {
  const vlanBlocks = allocatedSubnets.map(s => `vlan ${s.vlanId}\n name ${s.name.replace(/\s+/g, '_')}`).join('\n!\n');
  const sviBlocks = allocatedSubnets.map(s => `interface Vlan${s.vlanId}
 description SVI Gateway for ${s.name} [VLAN ${s.vlanId}]
 ip address ${s.defaultGateway} ${s.subnetMask}
 no shutdown`).join('\n!\n');

  const ospfNetworkStatements = allocatedSubnets.map(s => ` network ${s.networkAddress} ${s.wildcardMask} area 0`).join('\n');

  return `! =====================================================================
! NetArchitect Generated Configuration
! Device: Core / Distribution Layer Switch 01
! Hostname: ${networkName.toUpperCase().replace(/\s+/g, '-')}-CORE-SW01
! Platform Assumption: Cisco Catalyst 9500 / 9300 (IOS-XE 17.9+)
! =====================================================================
version 17.9
service timestamps debug datetime msec
service timestamps log datetime msec
service password-encryption
!
hostname ${networkName.toUpperCase().replace(/\s+/g, '-')}-CORE-SW01
!
boot-start-marker
boot-end-marker
!
! Management & Security Baselines
enable secret 9 $9$PlaceholderCoreSecret$NetArchitect
!
aaa new-model
aaa authentication login default local
aaa authorization exec default local
username netadmin privilege 15 secret 9 $9$AdminSecret$2026Net
!
ip routing
ip domain name netarchitect.internal
ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 3
!
! Spanning Tree Protocol (IEEE 802.1w Rapid-PVST+)
! Root Bridge Primary Configuration
spanning-tree mode rapid-pvst
spanning-tree extend system-id
spanning-tree vlan 1-4094 priority 4096
!
! VLAN Database Definitions
vlan 999
 name QUARANTINE_NATIVE
!
${vlanBlocks}
!
! 802.1Q Core Downlink Trunks to Access Layer
! Platform note: Modern Cisco Catalyst 9000 switches use IEEE 802.1Q exclusively.
! Obsolete 'switchport trunk encapsulation dot1q' command is rejected on Cat 9000 and therefore omitted.
interface range TenGigabitEthernet1/0/1 - 4
 description 10G OM4/OS2 SFP+ 802.1Q Downlink Trunks to Access Switches
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan ${vlanList || '1-4094'}
 switchport nonegotiate
 spanning-tree guard root
 no shutdown
!
! Port-Channel Inter-Switch Link (LACP - Core Redundancy)
interface Port-channel1
 description LACP Inter-Chassis Core Cross-Connect
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan ${vlanList || '1-4094'}
 no shutdown
!
interface range TenGigabitEthernet1/0/47 - 48
 description LACP Core Member Bundle
 channel-group 1 mode active
!
! Switched Virtual Interfaces (SVIs) - Default Gateways
${sviBlocks}
!
! Dynamic Routing Protocol: OSPF Process 1
router ospf 1
 router-id 10.255.255.1
 log-adjacency-changes
 passive-interface default
${allocatedSubnets.map(s => ` no passive-interface Vlan${s.vlanId}`).join('\n')}
${ospfNetworkStatements}
!
! Line Security
line con 0
 exec-timeout 5 0
 logging synchronous
 login authentication default
line vty 0 4
 exec-timeout 10 0
 transport input ssh
 logging synchronous
 login authentication default
!
end
write memory`;
}

function generateAccessSwitchConfig({ networkName, allocatedSubnets, vlanList, primarySubnet }) {
  const vlanBlocks = allocatedSubnets.map(s => `vlan ${s.vlanId}\n name ${s.name.replace(/\s+/g, '_')}`).join('\n!\n');
  const primaryVlan = primarySubnet.vlanId || 10;

  return `! =====================================================================
! NetArchitect Generated Configuration
! Device: Layer 2 Access Switch 01
! Hostname: ${networkName.toUpperCase().replace(/\s+/g, '-')}-ACC-SW01
! Platform Assumption: Cisco Catalyst 9200L-48P (IOS-XE 17.9+)
! =====================================================================
version 17.9
service timestamps debug datetime msec
service timestamps log datetime msec
service password-encryption
!
hostname ${networkName.toUpperCase().replace(/\s+/g, '-')}-ACC-SW01
!
enable secret 9 $9$PlaceholderAccSecret$NetArchitect
!
username netadmin privilege 15 secret 9 $9$AdminSecret$2026Net
!
no ip routing
ip default-gateway ${primarySubnet.defaultGateway}
!
! Rapid PVST+ Access Protection
spanning-tree mode rapid-pvst
spanning-tree portfast default
spanning-tree portfast bpduguard default
!
! VLAN Definitions
vlan 999
 name QUARANTINE_NATIVE
!
${vlanBlocks}
!
! Redundant 802.1Q Trunks to Core/Distribution
interface GigabitEthernet1/0/49
 description Primary Trunk to Core Switch 01
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan ${vlanList || '1-4094'}
 switchport nonegotiate
 no shutdown
!
interface GigabitEthernet1/0/50
 description Secondary Trunk to Core Switch 02
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan ${vlanList || '1-4094'}
 switchport nonegotiate
 no shutdown
!
! End-User Workstation Ports (VLAN ${primaryVlan})
interface range GigabitEthernet1/0/1 - 24
 description Standard User Workstations
 switchport mode access
 switchport access vlan ${primaryVlan}
 switchport nonegotiate
 spanning-tree portfast
 spanning-tree bpduguard enable
 power inline auto
 no shutdown
!
! PoE Access Point Uplink Ports
interface range GigabitEthernet1/0/25 - 28
 description 802.11ax Wi-Fi Access Points (PoE+ Enabled)
 switchport mode access
 switchport access vlan ${primaryVlan}
 power inline auto
 spanning-tree portfast
 no shutdown
!
! Hardened Unused Ports - Administratively Disabled to prevent rogue taps
interface range GigabitEthernet1/0/29 - 48
 description UNUSED_RESERVED_PORTS
 switchport mode access
 switchport access vlan 999
 shutdown
!
! Management SVI
interface Vlan${primaryVlan}
 description In-Band Management SVI
 ip address ${incrementIp(primarySubnet.networkAddress, 5)} ${primarySubnet.subnetMask}
 no shutdown
!
line con 0
 exec-timeout 5 0
 login local
line vty 0 4
 transport input ssh
 exec-timeout 10 0
 login local
!
end
write memory`;
}

function generateRouterConfig({ networkName, networkType, allocatedSubnets, routingRecommendation, primarySubnet }) {
  const isWan = networkType === 'Global WAN' || networkType === 'Metro MAN';
  const ospfNetworkStatements = allocatedSubnets.map(s => ` network ${s.networkAddress} ${s.wildcardMask} area 0`).join('\n');

  return `! =====================================================================
! NetArchitect Generated Configuration
! Device: Border / WAN Edge Router 01
! Hostname: ${networkName.toUpperCase().replace(/\s+/g, '-')}-EDGE-RTR01
! Platform Assumption: Cisco ISR 4451 / ASR 1001-X (IOS-XE 17.9+)
! =====================================================================
version 17.9
service timestamps debug datetime msec
service timestamps log datetime msec
service password-encryption
!
hostname ${networkName.toUpperCase().replace(/\s+/g, '-')}-EDGE-RTR01
!
enable secret 9 $9$PlaceholderRtrSecret$NetArchitect
!
ip routing
ip cef
!
! Core LAN Facing Interface (Downlink to Core Switches)
interface GigabitEthernet0/0/0
 description Downlink to LAN Core Switch 01
 ip address 10.255.0.1 255.255.255.252
 ip ospf 1 area 0
 no shutdown
!
! WAN / Carrier Facing Interface
interface GigabitEthernet0/0/1
 description WAN Uplink to Carrier Provider / EVPL
 ip address 198.51.100.2 255.255.255.252
 ip access-group WAN_INBOUND_FILTER in
 no shutdown
!
${isWan ? `!
! External BGP Peering (eBGP AS 65001 to Cloud/Carrier AS 64512)
router bgp 65001
 bgp log-neighbor-changes
 neighbor 198.51.100.1 remote-as 64512
 neighbor 198.51.100.1 description Primary Carrier / Cloud VPC Gateway
 neighbor 198.51.100.1 fall-over bfd
 !
 address-family ipv4
  neighbor 198.51.100.1 activate
  neighbor 198.51.100.1 prefix-list SUMMARY_ONLY out
${allocatedSubnets[0] ? `  network ${allocatedSubnets[0].networkAddress} mask ${allocatedSubnets[0].subnetMask}` : ''}
 exit-address-family
!` : ''}
!
! Internal Dynamic Routing: OSPF Process 1
router ospf 1
 router-id 10.255.255.254
 log-adjacency-changes
 passive-interface GigabitEthernet0/0/1
${ospfNetworkStatements}
!
! Static Default Route to Carrier Gateway
ip route 0.0.0.0 0.0.0.0 198.51.100.1
!
! WAN Edge Security Filter
ip access-list extended WAN_INBOUND_FILTER
 remark Block Inbound RFC 1918 Private Addresses (Anti-Spoofing)
 deny ip 10.0.0.0 0.255.255.255 any
 deny ip 172.16.0.0 0.15.255.255 any
 deny ip 192.168.0.0 0.0.255.255 any
 remark Permit Established State Sessions
 permit tcp any any established
 remark Permit Essential ICMP Diagnostics
 permit icmp any any echo-reply
 permit icmp any any unreachable
 permit icmp any any time-exceeded
 remark Permit IPsec VPN Tunnels
 permit esp any host 198.51.100.2
 permit udp any host 198.51.100.2 eq isakmp
 permit udp any host 198.51.100.2 eq non500-isakmp
 remark Deny All Other Inbound Traffic
 deny ip any any log
!
end
write memory`;
}

function generateAclConfig({ networkName, allocatedSubnets }) {
  const rules = allocatedSubnets.map((subnet, idx) => {
    return `remark Isolation and Policy for ${subnet.name} [VLAN ${subnet.vlanId}]
ip access-list extended ACL_${subnet.name.toUpperCase().replace(/\s+/g, '_')}
 remark Allow DHCP and DNS resolution
 permit udp ${subnet.networkAddress} ${subnet.wildcardMask} any eq bootps
 permit udp ${subnet.networkAddress} ${subnet.wildcardMask} any eq domain
 permit tcp ${subnet.networkAddress} ${subnet.wildcardMask} any eq domain
 remark Allow Outbound Web Traffic (HTTP/HTTPS)
 permit tcp ${subnet.networkAddress} ${subnet.wildcardMask} any eq 80
 permit tcp ${subnet.networkAddress} ${subnet.wildcardMask} any eq 443
 remark Prevent unauthorized cross-VLAN probing
 deny ip ${subnet.networkAddress} ${subnet.wildcardMask} 10.0.0.0 0.255.255.255
 deny ip ${subnet.networkAddress} ${subnet.wildcardMask} 172.16.0.0 0.15.255.255
 deny ip ${subnet.networkAddress} ${subnet.wildcardMask} 192.168.0.0 0.0.255.255
 remark Permit all other external internet access
 permit ip ${subnet.networkAddress} ${subnet.wildcardMask} any
 deny ip any any log
!`;
  }).join('\n\n');

  return `! =====================================================================
! NetArchitect Security Policy & Extended ACL Definitions
! Target: Layer 3 Distribution Switch / Firewall Interface ACLs
! Project: ${networkName}
! =====================================================================
!
! Management Plane Protection (MPP) - Authorized Admins Only
ip access-list standard ACL_MANAGEMENT_ACCESS
 remark Permit Network Operations Center (NOC) Workstations
 permit 10.255.0.0 0.0.0.255
 permit 192.168.1.0 0.0.0.31
 deny any log
!
${rules}
!
! End of Security Configuration`;
}

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function incrementIp(ipStr, increment) {
  const parts = ipStr.split('.').map(Number);
  parts[3] = Math.min(254, parts[3] + increment);
  return parts.join('.');
}

