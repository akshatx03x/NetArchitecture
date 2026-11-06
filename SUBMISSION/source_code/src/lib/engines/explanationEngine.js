/**
 * Explainable Decision Engine
 * Generates transparent, deterministic, mathematically grounded justifications
 * for every network architectural decision.
 */

export function generateAllExplanations(scenarioData) {
  const {
    networkName = 'Enterprise Network',
    networkType = 'Campus LAN',
    distance = 100,
    mediaRecommendation = {},
    routingRecommendation = {},
    topologyRecommendation = {},
    vlsmResult = {},
    endpoints = 100,
    buildingsCount = 1,
    sitesCount = 1,
    cloudIntegration = false,
    qosEnabled = false
  } = scenarioData;

  const decisions = [];

  // Decision 1: Physical Transmission Medium
  decisions.push(buildMediaExplanation(distance, mediaRecommendation));

  // Decision 2: Transceiver Interface & Optical Budget
  decisions.push(buildTransceiverExplanation(distance, mediaRecommendation));

  // Decision 3: VLSM Address Allocation & Boundary Math
  decisions.push(buildVlsmExplanation(vlsmResult));

  // Decision 4: Routing Protocol & Autonomous System Architecture
  decisions.push(buildRoutingExplanation(routingRecommendation, sitesCount, vlsmResult?.allocatedSubnets?.length || 1, cloudIntegration));

  // Decision 5: Switching & Spanning Tree Hierarchy (802.1Q & RSTP)
  decisions.push(buildSwitchingExplanation(topologyRecommendation, endpoints, buildingsCount));

  // Decision 6: QoS & Latency SLA Analysis (Crucial for Profile 2 Metro MAN!)
  if (networkType === 'Metro MAN' || qosEnabled) {
    decisions.push(buildQosLatencyExplanation(distance));
  }

  // Decision 7: Cloud & Edge Perimeter Security (IPsec / ACLs)
  if (cloudIntegration || networkType === 'Global WAN') {
    decisions.push(buildWanCloudSecurityExplanation(sitesCount, cloudIntegration));
  }

  return {
    projectName: networkName,
    generatedAt: new Date().toISOString(),
    totalDecisions: decisions.length,
    decisions,
    exportMarkdown: () => exportDecisionsAsMarkdown(decisions, scenarioData),
    exportJson: () => JSON.stringify(decisions, null, 2)
  };
}

function buildMediaExplanation(distance, media) {
  let appliedRule = '';
  let mathCalc = '';
  let warnings = [];

  if (distance <= 100) {
    appliedRule = 'Rule 5.A: Distance <= 100m -> Cat6a Copper 10GBASE-T horizontal cabling';
    mathCalc = `Distance ${distance}m <= 100m Ethernet channel limit. Attenuation margin: ${(100 - distance)}m remaining.`;
  } else if (distance <= 400) {
    appliedRule = 'Rule 5.B: 101m <= Distance <= 400m -> OM4 Laser-Optimized Multimode Fiber (850nm VCSEL)';
    mathCalc = `Distance ${distance}m exceeds 100m copper limit by ${(distance - 100)}m; within 400m OM4 modal bandwidth threshold (4700 MHz·km at 850nm).`;
  } else {
    appliedRule = 'Rule 5.C: Distance > 400m -> OS2 Single-Mode Fiber (9/125 µm core)';
    mathCalc = `Distance ${distance}m exceeds 400m multimode modal dispersion boundary by ${(distance - 400)}m. Single-mode zero-modal dispersion required.`;
  }

  if (distance > 80000) {
    warnings.push('Distance exceeds 80 km without optical amplification (EDFA) or dense wavelength division multiplexing (DWDM).');
  }

  return {
    id: 'decision-media',
    category: 'Physical Layer (Layer 1)',
    decision: `Selected ${media.mediaType || 'Physical Medium'}`,
    inputParameters: {
      linkDistanceMeters: distance,
      linkDistanceDisplay: media.distanceDisplay || `${distance}m`,
      environment: 'Enterprise Backbone / Channel'
    },
    appliedAlgorithm: appliedRule,
    mathematicalCalculation: mathCalc,
    technicalExplanation: media.technicalReason || `Evaluated link distance against IEEE 802.3 and ANSI/TIA-568-C channel thresholds.`,
    standardsReference: media.standard || 'IEEE 802.3an / IEEE 802.3ae',
    alternativesRejected: media.alternativesRejected || [],
    assumptions: media.assumptions || [
      'Structured cabling adheres to standard bend-radius and patch-cord allowances.',
      'TIA/EIA-568 permanent link compliance maintained.'
    ],
    warnings
  };
}

function buildTransceiverExplanation(distance, media) {
  const budget = media.opticalBudget;
  let mathCalc = 'N/A for Baseband Copper PHY';

  if (budget) {
    mathCalc = `Total Power Budget = Min Launch Power (${budget.txPowerMinDbm} dBm) - Max Rx Sensitivity (${budget.rxSensitivityDbm} dBm) = ${budget.totalBudgetDb} dB. ` +
      `Channel Insertion Loss = Fiber Loss (${budget.distanceKm} km x ${budget.fiberAttenuationDbPerKm} dB/km = ${budget.fiberLossDb} dB) + ` +
      `Connector Loss (${budget.connectorLossDb} dB) + Splice Loss (${budget.spliceLossDb} dB) = ${budget.totalChannelLossDb} dB. ` +
      `Calculated Net Optical Margin = ${budget.totalBudgetDb} dB - ${budget.totalChannelLossDb} dB = ${budget.calculatedMarginDb} dB (${budget.isFeasible ? 'Pass / Sufficient Margin' : 'Negative Margin - Amplification Required'}).`;
  }

  return {
    id: 'decision-transceiver',
    category: 'Optical & Transceiver Engineering',
    decision: `Selected Optical Interface: ${media.transceiver || 'Standard PHY'}`,
    inputParameters: {
      distanceMeters: distance,
      wavelength: media.wavelength || 'Electrical baseband',
      connectorType: media.connector || 'RJ-45'
    },
    appliedAlgorithm: 'Transceiver Reach Selection vs Optical Power Budgeting',
    mathematicalCalculation: mathCalc,
    technicalExplanation:
      `The transceiver module was selected based on transmitter launch power, photodetector sensitivity, ` +
      `dispersion penalty over distance, and operating wavelength (${media.wavelength || '850nm/1310nm'}). ` +
      `Selecting higher-powered optics (such as ZR on a short link) could saturate the optical receiver diode, ` +
      `while insufficient optics would fail bit-error-rate thresholds.`,
    standardsReference: media.standard || 'SFF-8431 / IEEE 802.3ae',
    alternativesRejected: [
      {
        technology: 'Fixed unpluggable interface',
        reason: 'Lacks modularity; SFP+ allows field replacement and sparing flexibility.'
      }
    ],
    assumptions: [
      'Digital Optical Monitoring (DOM/SFF-8472) enabled on all optical transceivers.',
      'Receiver dynamic range is not exceeded; attenuators installed if power exceeds max receiver input.'
    ],
    warnings: distance > 40000 ? ['Extended reach 1550nm optics require APD receiver verification to avoid overload.'] : []
  };
}

function buildVlsmExplanation(vlsmResult) {
  const subnetsCount = vlsmResult?.allocatedSubnets?.length || 0;
  const root = vlsmResult?.rootNetwork || '192.168.0.0/24';
  const utilization = vlsmResult?.summary?.overallUtilizationPercent || 0;

  return {
    id: 'decision-vlsm',
    category: 'Network Layer (Layer 3) Addressing',
    decision: `Variable Length Subnet Mask (VLSM) Allocations for ${subnetsCount} Departments`,
    inputParameters: {
      rootCidr: root,
      totalRequestedHosts: vlsmResult?.summary?.totalRequestedHosts || 0,
      departmentsCount: subnetsCount
    },
    appliedAlgorithm: 'Descending-Order Binary Radix Tree Subnet Allocation (RFC 4632 / CIDR)',
    mathematicalCalculation:
      `Root Network: ${root} contains ${vlsmResult?.rootTotalAddresses || 256} total IP addresses. ` +
      `Allocated: ${vlsmResult?.summary?.totalAllocatedAddresses || 0} addresses across ${subnetsCount} subnets. ` +
      `Address Space Utilization: ${utilization}%. Remaining Free Space: ${vlsmResult?.summary?.remainingAddresses || 0} addresses.`,
    technicalExplanation:
      `Subnet requests were sorted strictly in descending order of host requirements prior to allocation. ` +
      `This deterministic ordering prevents memory fragmentation and guarantees that every allocated subnet starts on a ` +
      `naturally aligned binary address boundary (where starting address mod 2^(32 - prefix) == 0). ` +
      `Network and broadcast addresses are mathematically preserved, preventing subnet overlap or silent address overflow.`,
    standardsReference: 'RFC 4632 (Classless Inter-domain Routing) & RFC 1918 (Private Address Allocation)',
    alternativesRejected: [
      {
        technology: 'Classful Subnetting (FLSM / Fixed Length Subnet Masking)',
        reason: 'Forces uniform mask (e.g. /25 for all departments), causing severe address exhaustion and waste for small departments.'
      },
      {
        technology: 'Arbitrary / First-Come Ordering',
        reason: 'Causes address fragmentation where larger blocks cannot find continuous aligned binary boundaries.'
      }
    ],
    assumptions: [
      'Standard LAN segments reserve 2 addresses (Network ID and Directed Broadcast).',
      'The first usable IPv4 address in each subnet is designated as the Default Gateway (SVI).'
    ],
    warnings: utilization > 85 ? ['Root address space utilization exceeds 85%; expansion requires additional supernet block.'] : []
  };
}

function buildRoutingExplanation(routing, sitesCount, subnetsCount, cloudIntegration) {
  return {
    id: 'decision-routing',
    category: 'Dynamic Routing & Convergence',
    decision: `Selected ${routing.protocol || 'OSPF'}`,
    inputParameters: {
      subnetsCount,
      sitesCount,
      cloudIntegration,
      architecture: routing.architecture || 'Hierarchical IGP'
    },
    appliedAlgorithm: 'Dijkstra SPF Shortest-Path First Link-State Routing with Area Hierarchies',
    mathematicalCalculation:
      `SPF Time Complexity: O(E + V log V) where V = ${subnetsCount + sitesCount + 2} nodes, E = ${(subnetsCount + sitesCount) * 2} links. ` +
      `Database scale remains well within sub-second Dijkstra recomputation limits (<15ms compute overhead).`,
    technicalExplanation: routing.technicalExplanation || `Link-state routing provides loop-free dynamic routing.`,
    standardsReference: (routing.rfcReferences && routing.rfcReferences[0]) || 'RFC 2328 (OSPFv2)',
    alternativesRejected: routing.alternativesRejected || [],
    assumptions: [
      'All OSPF Area 0 routers maintain contiguous backbone adjacencies.',
      'Point-to-point OSPF network type configured on all routed inter-switch links to bypass DR/BDR election latency.'
    ],
    warnings: []
  };
}

function buildSwitchingExplanation(topology, endpoints, buildingsCount) {
  return {
    id: 'decision-switching',
    category: 'Data Link Layer (Layer 2) & Spanning Tree',
    decision: 'IEEE 802.1w Rapid Spanning Tree Protocol (Rapid-PVST+) & 802.1Q Tagged Trunks',
    inputParameters: {
      endpoints,
      buildingsCount,
      redundancy: 'Dual-Homed Core & Distribution'
    },
    appliedAlgorithm: 'Rapid Spanning Tree Protocol Proposal-Agreement Handshake (RFC 802.1w)',
    mathematicalCalculation:
      `Convergence time reduced from 30-50 seconds (Legacy 802.1D Spanning Tree) to < 1.0 second (802.1w Rapid-PVST+) ` +
      `via direct edge-port PortFast transitions and point-to-point proposal-agreement handshakes.`,
    technicalExplanation:
      `Rapid-PVST+ is configured with explicit bridge priority tuning. Core Switch 01 is configured with Priority 4096 (Root Primary), ` +
      `and Core Switch 02 with Priority 8192 (Root Secondary). Access switches use default 32768. ` +
      `BPDU Guard is enabled on all access edge ports to instantly error-disable ports if rogue switches are attached, ` +
      `preventing accidental root bridge takeover. Native VLAN is changed to an unused quarantine VLAN 999 to mitigate VLAN hopping attacks.`,
    standardsReference: 'IEEE 802.1Q-2018 (VLAN Tagging) & IEEE 802.1w / 802.1D-2004 (RSTP)',
    alternativesRejected: [
      {
        technology: 'Legacy 802.1D Spanning Tree Protocol (STP)',
        reason: 'Slow 30 to 50 second convergence timers (Listening and Learning states) disrupt mission-critical traffic and VoIP streams.'
      },
      {
        technology: 'Unrestricted Trunking (VLAN 1 default)',
        reason: 'Leaves trunk open to VLAN hopping and unauthorized broadcast domain leakage; native VLAN 1 presents documented security vulnerabilities.'
      }
    ],
    assumptions: [
      'Uplink interfaces configured as Point-to-Point full-duplex to enable RSTP rapid transitions.',
      'BPDU Guard enabled globally on all PortFast access ports.'
    ],
    warnings: []
  };
}

function buildQosLatencyExplanation(distance) {
  // Financial colocation latency analysis:
  // Speed of light in single-mode fiber core (refractive index n ~ 1.4682) = ~204,195 km/s = ~4.9 µs per km (one-way propagation).
  // Round Trip Time (RTT) propagation alone = distance * 2 * 4.9 µs/km.
  const distanceKm = distance / 1000;
  const propagationRttMs = Number(((distanceKm * 2 * 4.898) / 1000).toFixed(3));

  return {
    id: 'decision-qos',
    category: 'QoS & Low-Latency SLA Engineering',
    decision: 'Strict Priority Low-Latency Queuing (LLQ) with Sub-5ms Target Analysis',
    inputParameters: {
      linkDistanceKm: distanceKm,
      environment: 'Financial Colocation / Trading Link',
      targetSla: 'Sub-5ms RTT Latency'
    },
    appliedAlgorithm: 'Fiber Optical Time of Flight (ToF) & Differentiated Services (DiffServ / RFC 2474)',
    mathematicalCalculation:
      `Light propagation in silica fiber core (refractive index n ≈ 1.468): v = c / n = 299,792 km/s / 1.4682 ≈ 204,190 km/s (4.898 µs/km). ` +
      `One-way fiber flight delay for ${distanceKm} km = ${(distanceKm * 4.898).toFixed(2)} µs. ` +
      `Round-Trip Time (RTT) pure fiber propagation = ${propagationRttMs} ms. ` +
      `Remaining latency budget for switch serialization, queuing, and carrier transport: ${(5.0 - propagationRttMs).toFixed(3)} ms.`,
    technicalExplanation:
      `Do NOT guarantee sub-5ms latency merely because QoS is enabled! Latency is governed by fundamental physics and carrier transport. ` +
      `While the pure optical propagation delay across ${distanceKm} km is ${propagationRttMs} ms, the total end-to-end latency experienced ` +
      `depends on: (1) Carrier route curvature/trench routing factor (typically 1.3x - 1.5x physical distance), (2) DWDM optical transponder regeneration, ` +
      `(3) Buffer queuing delays, and (4) Store-and-forward switch serialization delay. ` +
      `QoS Low-Latency Queuing (LLQ / Expedited Forwarding DSCP 46) eliminates queuing jitter for voice and high-priority financial packets, ` +
      `but cannot reduce the physical optical propagation constant.`,
    standardsReference: 'RFC 2474 (DiffServ Architecture), RFC 3246 (Expedited Forwarding PHB), ITU-T G.8261',
    alternativesRejected: [
      {
        technology: 'Best-Effort First-In First-Out (FIFO) Queuing',
        reason: 'Large bulk file transfers induce bufferbloat, increasing latency spikes well above 20-50ms.'
      }
    ],
    assumptions: [
      'Carrier EVPL path does not exceed 1.4x straight-line fiber trench distance.',
      'Core interfaces run at 10Gbps line-rate with hardware cut-through or fast store-and-forward switching.'
    ],
    warnings: [
      'Sub-5ms latency SLA requires strict carrier SLA commitments and verification via RFC 2544 / ITU-T Y.1564 BERT testing; QoS configuration alone cannot overcome transmission distance.'
    ]
  };
}

function buildWanCloudSecurityExplanation(sitesCount, cloudIntegration) {
  return {
    id: 'decision-security-cloud',
    category: 'Cloud Interconnect & WAN Perimeter Defense',
    decision: 'IPsec AES-256-GCM / IKEv2 Cryptographic Tunneling & eBGP Peering',
    inputParameters: {
      sitesCount,
      cloudIntegration,
      cryptoSuite: 'AES-256-GCM + SHA-384 + Diffie-Hellman Group 21'
    },
    appliedAlgorithm: 'Authenticated Encryption with Associated Data (AEAD) & BGP Route Filtering',
    mathematicalCalculation:
      `IPsec encapsulation overhead: 20 bytes IPv4 + 8 bytes ESP + 16 bytes IV/ICV = ~56 bytes per packet. ` +
      `WAN MTU adjusted to 1440 bytes with TCP MSS clamping at 1400 bytes to prevent packet fragmentation.`,
    technicalExplanation:
      `Site-to-site communication traversing public networks or carrier infrastructure is encrypted via IPsec using IKEv2 and modern AES-256-GCM. ` +
      `eBGP peers exchange only verified summary prefix-lists. Anti-spoofing ACLs drop inbound RFC 1918 traffic arriving on external interfaces (BCP 38 / RFC 2827).`,
    standardsReference: 'RFC 4301 (IPsec Security Architecture), RFC 7296 (IKEv2), RFC 2827 (Network Ingress Filtering / BCP 38)',
    alternativesRejected: [
      {
        technology: 'Unencrypted GRE Tunnels',
        reason: 'Transmits all corporate and IoT payloads in plaintext across public transit networks.'
      },
      {
        technology: 'Legacy 3DES / MD5 IPsec',
        reason: 'Cryptographically broken; susceptible to Sweet32 collision attacks and collision vulnerabilities.'
      }
    ],
    assumptions: [
      'Cloud VPC Virtual Private Gateway configured with ASN 64512.',
      'TCP MSS Clamping enabled on all crypto tunnel interfaces to prevent PMTU black holes.'
    ],
    warnings: []
  };
}

function exportDecisionsAsMarkdown(decisions, scenarioData) {
  let md = `# NetArchitect — Architectural Decision Record (ADR)
## Project: ${scenarioData.networkName || 'Enterprise Architecture'}
**Network Classification:** ${scenarioData.networkType || 'Campus LAN'}  
**Generated At:** ${new Date().toISOString()}  
**Engine:** NetArchitect Explainable Decision Engine v1.0  

---

`;

  decisions.forEach((d, idx) => {
    md += `### Decision ${idx + 1}: ${d.category} — ${d.decision}\n\n`;
    md += `* **Applied Rule / Algorithm:** ${d.appliedAlgorithm}\n`;
    md += `* **Mathematical Calculation:** \`${d.mathematicalCalculation}\`\n`;
    md += `* **Technical Explanation:** ${d.technicalExplanation}\n`;
    md += `* **Standard Reference:** ${d.standardsReference}\n\n`;

    if (d.alternativesRejected && d.alternativesRejected.length > 0) {
      md += `**Alternatives Rejected:**\n`;
      d.alternativesRejected.forEach(alt => {
        md += `- **${alt.technology || alt.protocol}:** ${alt.reason}\n`;
      });
      md += `\n`;
    }

    if (d.assumptions && d.assumptions.length > 0) {
      md += `**Engineering Assumptions:**\n`;
      d.assumptions.forEach(a => md += `- ${a}\n`);
      md += `\n`;
    }

    if (d.warnings && d.warnings.length > 0) {
      md += `**Engineering Warnings:**\n`;
      d.warnings.forEach(w => md += `> ⚠️ **Warning:** ${w}\n`);
      md += `\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

