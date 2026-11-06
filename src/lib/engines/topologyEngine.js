import { NetworkValidationError } from '../errors/NetworkErrors';

/**
 * Topology & Architecture Decision Engine
 * Determines hierarchical network architecture and produces dynamic visual nodes and edges.
 */
export function recommendTopology(params = {}) {
  const {
    endpoints = 100,
    buildingsCount = 1,
    sitesCount = 1,
    redundancy = 'High', // 'None', 'Standard', 'High', 'Dual-Homed'
    networkType = 'Campus LAN',
    cloudIntegration = false,
    maxDistanceMeters = 100,
    departments = [],
    allocatedSubnets = []
  } = params;

  let topologyTier = '';
  let architectureName = '';
  let description = '';
  let switchingStandards = [];
  let deviceEstimates = {};
  let technicalJustification = '';

  // Calculate estimated hardware counts
  // Standard switch: 48 ports (allocating ~40 ports for endpoints + 8 for uplinks/spares)
  const estimatedAccessSwitches = Math.max(1, Math.ceil(endpoints / 40));
  
  if (sitesCount > 1 || networkType === 'Global WAN' || networkType === 'Metro MAN') {
    // Multi-site / WAN architecture
    if (networkType === 'Metro MAN') {
      topologyTier = 'Dual-Homed Metro MAN (Carrier EVPL / Dark Fiber)';
      architectureName = 'Spine/WAN Edge with Colocation Core & Redundant Branch Links';
      description = 'Colocation HQ core routers connected via dual-homed OS2 fiber / EVPL to remote branch distribution switches with sub-second failover.';
      deviceEstimates = {
        coreRouters: 2,
        distributionSwitches: 4,
        accessSwitches: Math.max(2, estimatedAccessSwitches),
        firewallClusters: 2,
        wanCircuits: 4
      };
      technicalJustification =
        `For Metro MAN environments connecting ${sitesCount} locations across ${maxDistanceMeters >= 1000 ? (maxDistanceMeters / 1000) + ' km' : maxDistanceMeters + ' m'} with ${redundancy} resiliency, ` +
        `a dual-homed WAN topology avoids single points of failure. HQ utilizes active-standby or active-active router pairs running HSRP/VRRP and BGP/OSPF with BFD over carrier EVPL.`;
    } else {
      // Global WAN
      topologyTier = 'Multi-Site SD-WAN / Mesh IPsec & Cloud Interconnect';
      architectureName = 'Hub-and-Spoke with Multi-Cloud Direct Interconnect & Redundant Core';
      description = 'Enterprise WAN routers at each regional hub meshed via IPsec VPN tunnels, terminating on Cloud VPC Virtual Private Gateways.';
      deviceEstimates = {
        edgeRouters: sitesCount * 2,
        coreSwitches: sitesCount * 2,
        accessSwitches: Math.max(sitesCount * 2, estimatedAccessSwitches),
        cloudGateways: cloudIntegration ? 2 : 0,
        ipsecTunnels: (sitesCount * (sitesCount - 1)) / 2 + (cloudIntegration ? sitesCount : 0)
      };
      technicalJustification =
        `With ${sitesCount} international city sites and ${endpoints} endpoints including IoT fleets, ` +
        `a multi-tier WAN edge architecture is required. Edge routers terminate dual Internet/MPLS uplinks, perform IPsec encryption and route redistribution between OSPF and eBGP into cloud VPCs.`;
    }
    switchingStandards = [
      'IEEE 802.1Q (VLAN Tagging)',
      'IEEE 802.1w (Rapid Spanning Tree Protocol - RSTP)',
      'IEEE 802.3ad (LACP Link Aggregation)',
      'ITU-T G.8032 (Ethernet Ring Protection Switching for MANs)'
    ];
  } else if (endpoints > 1000 || buildingsCount > 2) {
    // Large Campus: 3-Tier Hierarchical (Core, Distribution, Access)
    topologyTier = '3-Tier Hierarchical Campus (Core, Distribution, Access)';
    architectureName = 'Modular Three-Layer Architecture (Cisco Campus Model)';
    description = 'High-speed switched Core backbone interconnecting independent Distribution blocks per building, aggregating dual-homed Access switches.';
    deviceEstimates = {
      coreSwitches: 2, // Redundant VSS/StackWise Virtual or MLAG Core
      distributionSwitches: buildingsCount * 2, // Dual switches per building
      accessSwitches: Math.max(buildingsCount * 2, estimatedAccessSwitches),
      coreRouters: 2
    };
    switchingStandards = [
      'IEEE 802.1Q (VLAN Trunking)',
      'IEEE 802.1w (Rapid Spanning Tree Protocol - RSTP) / 802.1s (MSTP)',
      'IEEE 802.3ad (LACP Port-Channels)',
      'IEEE 802.3at/bt (PoE/PoE+ for APs and VoIP)'
    ];
    technicalJustification =
      `For ${endpoints} endpoints distributed across ${buildingsCount} buildings, a 3-Tier Campus model isolates faults, ` +
      `permits non-blocking line-rate backbone routing at the core, encapsulates broadcast domains at the distribution layer, ` +
      `and provides deterministic RSTP convergence.`;
  } else {
    // 2-Tier Collapsed Core (Core + Distribution collapsed into one layer)
    topologyTier = '2-Tier Collapsed Core Architecture';
    architectureName = 'Collapsed Core / Distribution with Access Edge';
    description = 'Redundant Core/Distribution switches handle both inter-VLAN routing and uplink aggregation for local building Access layer switches.';
    deviceEstimates = {
      collapsedCoreSwitches: 2,
      accessSwitches: Math.max(1, estimatedAccessSwitches),
      borderRouters: 1
    };
    switchingStandards = [
      'IEEE 802.1Q (VLAN Tagging)',
      'IEEE 802.1w (RSTP)',
      'IEEE 802.3ad (LACP)'
    ];
    technicalJustification =
      `For smaller scale deployments (${endpoints} endpoints, ${buildingsCount} building), ` +
      `a Collapsed Core architecture optimizes capital expenditures and administrative overhead by unifying core routing and distribution switching in a single resilient pair.`;
  }

  // Generate React Flow graph (Nodes & Edges) dynamically based on actual scenario
  const graph = generateTopologyGraph({
    topologyTier,
    networkType,
    sitesCount,
    buildingsCount,
    cloudIntegration,
    departments,
    allocatedSubnets
  });

  return {
    topologyTier,
    architectureName,
    description,
    deviceEstimates,
    switchingStandards,
    technicalJustification,
    graph
  };
}

/**
 * Builds dynamic React Flow Nodes and Edges
 */
function generateTopologyGraph(options) {
  const {
    topologyTier,
    networkType,
    sitesCount,
    buildingsCount,
    cloudIntegration,
    departments = [],
    allocatedSubnets = []
  } = options;

  const nodes = [];
  const edges = [];

  const defaultNodeStyle = {
    background: '#141414',
    color: '#EDEDED',
    border: '1px solid #2B2B2B',
    borderRadius: '4px',
    padding: '10px',
    textAlign: 'center',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono, monospace'
  };

  const primaryEdgeStyle = { stroke: '#666666', strokeWidth: 1.5 };
  const dashedEdgeStyle = { stroke: '#444444', strokeWidth: 1.5, strokeDasharray: '4 4' };

  if (networkType === 'Campus LAN') {
    // Campus LAN: Router -> Core Switches -> Distribution Blocks -> Access Switches -> Department VLANs
    // 1. Border Router
    nodes.push({
      id: 'border-router',
      type: 'default',
      data: {
        label: 'Edge Router\nCisco ISR 4451\nOSPF Area 0',
        deviceType: 'router',
        ip: '192.168.0.1 / 10.0.0.1'
      },
      position: { x: 380, y: 30 },
      style: { ...defaultNodeStyle, border: '1px solid #444444', width: 200 }
    });

    // 2. Redundant Core Switches
    nodes.push({
      id: 'core-sw1',
      type: 'default',
      data: {
        label: 'Core Switch 01\nCatalyst 9500\nRoot Primary',
        deviceType: 'core-switch'
      },
      position: { x: 220, y: 150 },
      style: { ...defaultNodeStyle, width: 190 }
    });
    nodes.push({
      id: 'core-sw2',
      type: 'default',
      data: {
        label: 'Core Switch 02\nCatalyst 9500\nRoot Secondary',
        deviceType: 'core-switch'
      },
      position: { x: 550, y: 150 },
      style: { ...defaultNodeStyle, width: 190 }
    });

    // Uplinks to router
    edges.push({ id: 'e-r-core1', source: 'border-router', target: 'core-sw1', label: '10G OM4 MMF', style: primaryEdgeStyle });
    edges.push({ id: 'e-r-core2', source: 'border-router', target: 'core-sw2', label: '10G OM4 MMF', style: primaryEdgeStyle });
    // Core Interlink (LACP)
    edges.push({ id: 'e-core-isl', source: 'core-sw1', target: 'core-sw2', label: '40G Port-Channel', style: dashedEdgeStyle });

    // 3. Distribution Switches per Building
    const bldCount = Math.min(3, Math.max(2, buildingsCount));
    for (let b = 1; b <= bldCount; b++) {
      const xPos = 120 + (b - 1) * 350;
      const distId = `dist-bld${b}`;
      const accessId = `acc-bld${b}`;
      const subnetInfo = allocatedSubnets[b - 1] ? `${allocatedSubnets[b - 1].cidr}` : `Building ${b} Subnet`;

      nodes.push({
        id: distId,
        type: 'default',
        data: {
          label: `Bld ${b} Dist Switch\nCatalyst 9300\nSVI Routing`,
          deviceType: 'dist-switch'
        },
        position: { x: xPos, y: 290 },
        style: { ...defaultNodeStyle, width: 180 }
      });

      // Dual-home Distribution to both Core Switches
      edges.push({ id: `e-core1-${distId}`, source: 'core-sw1', target: distId, label: '10G Trunk', style: primaryEdgeStyle });
      edges.push({ id: `e-core2-${distId}`, source: 'core-sw2', target: distId, label: '10G Trunk', style: primaryEdgeStyle });

      // Access Switch
      nodes.push({
        id: accessId,
        type: 'default',
        data: {
          label: `Bld ${b} Access Stack\nCat 9200 (PoE+)\n${subnetInfo}`,
          deviceType: 'access-switch'
        },
        position: { x: xPos, y: 430 },
        style: { ...defaultNodeStyle, width: 190 }
      });

      edges.push({ id: `e-dist-${accessId}`, source: distId, target: accessId, label: '802.1Q Trunk', style: primaryEdgeStyle });
    }
  } else if (networkType === 'Metro MAN') {
    // Metro MAN: HQ Colocation Core <-> Carrier EVPL (OS2 SMF) <-> Remote Office 1 & Remote Office 2
    nodes.push({
      id: 'hq-dc-core',
      type: 'default',
      data: {
        label: 'HQ Core Colocation\nDual ASR 1001-X\n10GBASE-LR/ER',
        deviceType: 'core-router'
      },
      position: { x: 380, y: 40 },
      style: { ...defaultNodeStyle, border: '1px solid #444444', width: 220 }
    });

    nodes.push({
      id: 'carrier-evpl',
      type: 'default',
      data: {
        label: 'Carrier EVPL Network\nOS2 Dark Fiber (15–35 km)\nSub-5ms SLA Target',
        deviceType: 'carrier'
      },
      position: { x: 390, y: 190 },
      style: { ...defaultNodeStyle, border: '1px dashed #555555', width: 210 }
    });

    edges.push({ id: 'e-hq-carrier', source: 'hq-dc-core', target: 'carrier-evpl', label: 'Primary 10G OS2', style: primaryEdgeStyle });

    // Remote Office 1
    nodes.push({
      id: 'remote-1',
      type: 'default',
      data: {
        label: 'Remote Office 1 (22 km)\nFinTech Trading Floor\nVLAN 10/20',
        deviceType: 'branch'
      },
      position: { x: 180, y: 340 },
      style: { ...defaultNodeStyle, width: 200 }
    });

    // Remote Office 2
    nodes.push({
      id: 'remote-2',
      type: 'default',
      data: {
        label: 'Remote Office 2 (31 km)\nOperations & DR Site\nVLAN 30/40',
        deviceType: 'branch'
      },
      position: { x: 580, y: 340 },
      style: { ...defaultNodeStyle, width: 200 }
    });

    edges.push({ id: 'e-carrier-rem1', source: 'carrier-evpl', target: 'remote-1', label: '10GBASE-ER OS2', style: primaryEdgeStyle });
    edges.push({ id: 'e-carrier-rem2', source: 'carrier-evpl', target: 'remote-2', label: '10GBASE-ER OS2', style: primaryEdgeStyle });
    // Inter-branch backup tunnel
    edges.push({ id: 'e-rem1-rem2', source: 'remote-1', target: 'remote-2', label: 'Backup IPsec', style: dashedEdgeStyle });
  } else {
    // Global WAN with Cloud VPC
    nodes.push({
      id: 'cloud-vpc',
      type: 'default',
      data: {
        label: 'Cloud Infrastructure\nAWS / Azure VPC\neBGP AS 64512',
        deviceType: 'cloud'
      },
      position: { x: 380, y: 30 },
      style: { ...defaultNodeStyle, border: '1px solid #444444', width: 210 }
    });

    nodes.push({
      id: 'wan-hub',
      type: 'default',
      data: {
        label: 'Global WAN Edge Hub\nCatalyst 8500 Edge\nOSPF Area 0 / eBGP',
        deviceType: 'wan-edge'
      },
      position: { x: 380, y: 180 },
      style: { ...defaultNodeStyle, width: 220 }
    });

    edges.push({ id: 'e-cloud-wan', source: 'cloud-vpc', target: 'wan-hub', label: 'Direct Connect / IPsec', style: primaryEdgeStyle });

    // 4 Cities
    const cities = ['City 1 (Americas)', 'City 2 (EMEA)', 'City 3 (APAC)', 'City 4 (IoT Depot)'];
    cities.forEach((city, idx) => {
      const cityId = `city-${idx + 1}`;
      const x = 80 + idx * 240;
      nodes.push({
        id: cityId,
        type: 'default',
        data: {
          label: `${city}\nEdge SD-WAN Router\nArea ${10 * (idx + 1)}`,
          deviceType: 'city-site'
        },
        position: { x, y: 340 },
        style: { ...defaultNodeStyle, width: 190 }
      });
      edges.push({ id: `e-wan-${cityId}`, source: 'wan-hub', target: cityId, label: 'IPsec VPN', style: primaryEdgeStyle });
    });
  }

  return { nodes, edges };
}

