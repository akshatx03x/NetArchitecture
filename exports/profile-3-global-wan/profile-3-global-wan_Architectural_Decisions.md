# NetArchitect — Architectural Decision Record (ADR)
## Project: Global Multi-Cloud WAN & IoT
**Network Classification:** Global WAN  
**Generated At:** 2026-11-06T08:59:10.523Z  
**Engine:** NetArchitect Explainable Decision Engine v1.0  

---

### Decision 1: Physical Layer (Layer 1) — Selected OS2 Single-Mode Fiber (SMF 9/125 µm)

* **Applied Rule / Algorithm:** Rule 5.C: Distance > 400m -> OS2 Single-Mode Fiber (9/125 µm core)
* **Mathematical Calculation:** `Distance 6200000m exceeds 400m multimode modal dispersion boundary by 6199600m. Single-mode zero-modal dispersion required.`
* **Technical Explanation:** For link distances above 400m (6200.0 km requested), OS2 Single-Mode Fiber (9/125 µm core) eliminates modal dispersion entirely. Core diameter permits only a single fundamental transverse optical mode, enabling high-bandwidth transmission over tens of kilometers. Interface "10GBASE-ZR SFP+ (1550nm Cooled EML / APD Receiver)" was selected to guarantee optical link margin over the required span.
* **Standard Reference:** Industry Standard SFF-8431 / Multi-Source Agreement (MSA)

**Alternatives Rejected:**
- **OM4 Multimode Fiber:** Exceeds the 400m modal dispersion limit of OM4 10GBASE-SR by 6199600m; severe pulse spreading causes bit error rate (BER) collapse.
- **Cat6a Copper:** Exceeds the 100m copper channel limit by 6199900m.

**Engineering Assumptions:**
- Low water-peak ITU-T G.652.D single-mode fiber infrastructure.
- Optical attenuation calculated at 1310nm (~0.35-0.4 dB/km) or 1550nm (~0.22-0.25 dB/km).
- Receiver optical power monitored via SFP+ Digital Optical Monitoring (DOM / SFF-8472) to prevent receiver saturation.

**Engineering Warnings:**
> ⚠️ **Warning:** Distance exceeds 80 km without optical amplification (EDFA) or dense wavelength division multiplexing (DWDM).

---

### Decision 2: Optical & Transceiver Engineering — Selected Optical Interface: 10GBASE-ZR SFP+ (1550nm Cooled EML / APD Receiver)

* **Applied Rule / Algorithm:** Transceiver Reach Selection vs Optical Power Budgeting
* **Mathematical Calculation:** `Total Power Budget = Min Launch Power (0 dBm) - Max Rx Sensitivity (-24 dBm) = 24 dB. Channel Insertion Loss = Fiber Loss (6200 km x 0.22 dB/km = 1364 dB) + Connector Loss (2 dB) + Splice Loss (1 dB) = 1367 dB. Calculated Net Optical Margin = 24 dB - 1367 dB = -1343 dB (Negative Margin - Amplification Required).`
* **Technical Explanation:** The transceiver module was selected based on transmitter launch power, photodetector sensitivity, dispersion penalty over distance, and operating wavelength (1550 nm (Cooled Narrow-Linewidth Laser)). Selecting higher-powered optics (such as ZR on a short link) could saturate the optical receiver diode, while insufficient optics would fail bit-error-rate thresholds.
* **Standard Reference:** Industry Standard SFF-8431 / Multi-Source Agreement (MSA)

**Alternatives Rejected:**
- **Fixed unpluggable interface:** Lacks modularity; SFP+ allows field replacement and sparing flexibility.

**Engineering Assumptions:**
- Digital Optical Monitoring (DOM/SFF-8472) enabled on all optical transceivers.
- Receiver dynamic range is not exceeded; attenuators installed if power exceeds max receiver input.

**Engineering Warnings:**
> ⚠️ **Warning:** Extended reach 1550nm optics require APD receiver verification to avoid overload.

---

### Decision 3: Network Layer (Layer 3) Addressing — Variable Length Subnet Mask (VLSM) Allocations for 6 Departments

* **Applied Rule / Algorithm:** Descending-Order Binary Radix Tree Subnet Allocation (RFC 4632 / CIDR)
* **Mathematical Calculation:** `Root Network: 10.100.0.0/19 contains 8192 total IP addresses. Allocated: 2464 addresses across 6 subnets. Address Space Utilization: 30.1%. Remaining Free Space: 5728 addresses.`
* **Technical Explanation:** Subnet requests were sorted strictly in descending order of host requirements prior to allocation. This deterministic ordering prevents memory fragmentation and guarantees that every allocated subnet starts on a naturally aligned binary address boundary (where starting address mod 2^(32 - prefix) == 0). Network and broadcast addresses are mathematically preserved, preventing subnet overlap or silent address overflow.
* **Standard Reference:** RFC 4632 (Classless Inter-domain Routing) & RFC 1918 (Private Address Allocation)

**Alternatives Rejected:**
- **Classful Subnetting (FLSM / Fixed Length Subnet Masking):** Forces uniform mask (e.g. /25 for all departments), causing severe address exhaustion and waste for small departments.
- **Arbitrary / First-Come Ordering:** Causes address fragmentation where larger blocks cannot find continuous aligned binary boundaries.

**Engineering Assumptions:**
- Standard LAN segments reserve 2 addresses (Network ID and Directed Broadcast).
- The first usable IPv4 address in each subnet is designated as the Default Gateway (SVI).

---

### Decision 4: Dynamic Routing & Convergence — Selected Hybrid Routing: Multi-Area OSPF (IGP) + External BGP (eBGP / IPsec WAN)

* **Applied Rule / Algorithm:** Dijkstra SPF Shortest-Path First Link-State Routing with Area Hierarchies
* **Mathematical Calculation:** `SPF Time Complexity: O(E + V log V) where V = 12 nodes, E = 20 links. Database scale remains well within sub-second Dijkstra recomputation limits (<15ms compute overhead).`
* **Technical Explanation:** For multi-site global WAN infrastructure with 4 sites and Cloud VPC integration, a hybrid routing architecture is required. Internal site networks utilize Multi-Area OSPF for fast IGP convergence. Edge routers and Cloud Virtual Private Gateways run eBGP (AS 65001 to Cloud AS 64512), enabling policy-based path control, AS_PATH loop prevention, multi-exit discriminators (MED), and controlled route redistribution at ASBR boundaries.
* **Standard Reference:** RFC 4271: A Border Gateway Protocol 4 (BGP-4)

**Alternatives Rejected:**
- **Pure OSPF over Global Internet/Cloud:** OSPF cannot cross independent administrative boundaries, cannot enforce multi-hop AS path policy filters, and exposes internal link states to third-party cloud providers.
- **Pure BGP for all internal desktop subnets:** BGP lacks rapid link-state discovery and topology awareness necessary for high-density local campus switching and fast convergence.

**Engineering Assumptions:**
- All OSPF Area 0 routers maintain contiguous backbone adjacencies.
- Point-to-point OSPF network type configured on all routed inter-switch links to bypass DR/BDR election latency.

---

### Decision 5: Data Link Layer (Layer 2) & Spanning Tree — IEEE 802.1w Rapid Spanning Tree Protocol (Rapid-PVST+) & 802.1Q Tagged Trunks

* **Applied Rule / Algorithm:** Rapid Spanning Tree Protocol Proposal-Agreement Handshake (RFC 802.1w)
* **Mathematical Calculation:** `Convergence time reduced from 30-50 seconds (Legacy 802.1D Spanning Tree) to < 1.0 second (802.1w Rapid-PVST+) via direct edge-port PortFast transitions and point-to-point proposal-agreement handshakes.`
* **Technical Explanation:** Rapid-PVST+ is configured with explicit bridge priority tuning. Core Switch 01 is configured with Priority 4096 (Root Primary), and Core Switch 02 with Priority 8192 (Root Secondary). Access switches use default 32768. BPDU Guard is enabled on all access edge ports to instantly error-disable ports if rogue switches are attached, preventing accidental root bridge takeover. Native VLAN is changed to an unused quarantine VLAN 999 to mitigate VLAN hopping attacks.
* **Standard Reference:** IEEE 802.1Q-2018 (VLAN Tagging) & IEEE 802.1w / 802.1D-2004 (RSTP)

**Alternatives Rejected:**
- **Legacy 802.1D Spanning Tree Protocol (STP):** Slow 30 to 50 second convergence timers (Listening and Learning states) disrupt mission-critical traffic and VoIP streams.
- **Unrestricted Trunking (VLAN 1 default):** Leaves trunk open to VLAN hopping and unauthorized broadcast domain leakage; native VLAN 1 presents documented security vulnerabilities.

**Engineering Assumptions:**
- Uplink interfaces configured as Point-to-Point full-duplex to enable RSTP rapid transitions.
- BPDU Guard enabled globally on all PortFast access ports.

---

### Decision 6: QoS & Low-Latency SLA Engineering — Strict Priority Low-Latency Queuing (LLQ) with Sub-5ms Target Analysis

* **Applied Rule / Algorithm:** Fiber Optical Time of Flight (ToF) & Differentiated Services (DiffServ / RFC 2474)
* **Mathematical Calculation:** `Light propagation in silica fiber core (refractive index n ≈ 1.468): v = c / n = 299,792 km/s / 1.4682 ≈ 204,190 km/s (4.898 µs/km). One-way fiber flight delay for 6200 km = 30367.60 µs. Round-Trip Time (RTT) pure fiber propagation = 60.735 ms. Remaining latency budget for switch serialization, queuing, and carrier transport: -55.735 ms.`
* **Technical Explanation:** Do NOT guarantee sub-5ms latency merely because QoS is enabled! Latency is governed by fundamental physics and carrier transport. While the pure optical propagation delay across 6200 km is 60.735 ms, the total end-to-end latency experienced depends on: (1) Carrier route curvature/trench routing factor (typically 1.3x - 1.5x physical distance), (2) DWDM optical transponder regeneration, (3) Buffer queuing delays, and (4) Store-and-forward switch serialization delay. QoS Low-Latency Queuing (LLQ / Expedited Forwarding DSCP 46) eliminates queuing jitter for voice and high-priority financial packets, but cannot reduce the physical optical propagation constant.
* **Standard Reference:** RFC 2474 (DiffServ Architecture), RFC 3246 (Expedited Forwarding PHB), ITU-T G.8261

**Alternatives Rejected:**
- **Best-Effort First-In First-Out (FIFO) Queuing:** Large bulk file transfers induce bufferbloat, increasing latency spikes well above 20-50ms.

**Engineering Assumptions:**
- Carrier EVPL path does not exceed 1.4x straight-line fiber trench distance.
- Core interfaces run at 10Gbps line-rate with hardware cut-through or fast store-and-forward switching.

**Engineering Warnings:**
> ⚠️ **Warning:** Sub-5ms latency SLA requires strict carrier SLA commitments and verification via RFC 2544 / ITU-T Y.1564 BERT testing; QoS configuration alone cannot overcome transmission distance.

---

### Decision 7: Cloud Interconnect & WAN Perimeter Defense — IPsec AES-256-GCM / IKEv2 Cryptographic Tunneling & eBGP Peering

* **Applied Rule / Algorithm:** Authenticated Encryption with Associated Data (AEAD) & BGP Route Filtering
* **Mathematical Calculation:** `IPsec encapsulation overhead: 20 bytes IPv4 + 8 bytes ESP + 16 bytes IV/ICV = ~56 bytes per packet. WAN MTU adjusted to 1440 bytes with TCP MSS clamping at 1400 bytes to prevent packet fragmentation.`
* **Technical Explanation:** Site-to-site communication traversing public networks or carrier infrastructure is encrypted via IPsec using IKEv2 and modern AES-256-GCM. eBGP peers exchange only verified summary prefix-lists. Anti-spoofing ACLs drop inbound RFC 1918 traffic arriving on external interfaces (BCP 38 / RFC 2827).
* **Standard Reference:** RFC 4301 (IPsec Security Architecture), RFC 7296 (IKEv2), RFC 2827 (Network Ingress Filtering / BCP 38)

**Alternatives Rejected:**
- **Unencrypted GRE Tunnels:** Transmits all corporate and IoT payloads in plaintext across public transit networks.
- **Legacy 3DES / MD5 IPsec:** Cryptographically broken; susceptible to Sweet32 collision attacks and collision vulnerabilities.

**Engineering Assumptions:**
- Cloud VPC Virtual Private Gateway configured with ASN 64512.
- TCP MSS Clamping enabled on all crypto tunnel interfaces to prevent PMTU black holes.

---

