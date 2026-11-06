# NetArchitect — Architectural Decision Record (ADR)
## Project: Campus LAN Enterprise
**Network Classification:** Campus LAN  
**Generated At:** 2026-11-06T08:32:25.991Z  
**Engine:** NetArchitect Explainable Decision Engine v1.0  

---

### Decision 1: Physical Layer (Layer 1) — Selected OM4 Laser-Optimized Multimode Fiber (MMF 50/125 µm)

* **Applied Rule / Algorithm:** Rule 5.B: 101m <= Distance <= 400m -> OM4 Laser-Optimized Multimode Fiber (850nm VCSEL)
* **Mathematical Calculation:** `Distance 350m exceeds 100m copper limit by 250m; within 400m OM4 modal bandwidth threshold (4700 MHz·km at 850nm).`
* **Technical Explanation:** For distances between 101m and 400m (350m requested), OM4 50/125 µm Multimode Fiber with 10GBASE-SR transceivers provides low-loss optical interconnectivity. OM4 features an effective modal bandwidth (EMB) of 4700 MHz·km at 850nm, supporting 10Gbps transmissions up to 400m.
* **Standard Reference:** IEEE 802.3ae (10GBASE-SR) / ISO/IEC 11801 OM4

**Alternatives Rejected:**
- **Cat6a Copper:** Exceeds the 100m physical channel limit by 250m; violates IEEE 802.3an attenuation limits.
- **OS2 Single-Mode Fiber:** Functionally capable but single-mode transceivers (10GBASE-LR) are significantly more expensive than 10GBASE-SR optics for links under 400m.

**Engineering Assumptions:**
- High-quality 850nm Vertical-Cavity Surface-Emitting Lasers (VCSEL) used in SFP+ optics.
- Connector insertion losses strictly kept below 0.75 dB combined total.
- Internal campus/building riser or duct installation.

---

### Decision 2: Optical & Transceiver Engineering — Selected Optical Interface: 10GBASE-SR SFP+ (850nm Short Reach)

* **Applied Rule / Algorithm:** Transceiver Reach Selection vs Optical Power Budgeting
* **Mathematical Calculation:** `Total Power Budget = Min Launch Power (-7.3 dBm) - Max Rx Sensitivity (-9.9 dBm) = 2.6 dB. Channel Insertion Loss = Fiber Loss (0.35 km x 3 dB/km = 1.05 dB) + Connector Loss (0.75 dB) + Splice Loss (0.1 dB) = 1.9 dB. Calculated Net Optical Margin = 2.6 dB - 1.9 dB = 0.7 dB (Pass / Sufficient Margin).`
* **Technical Explanation:** The transceiver module was selected based on transmitter launch power, photodetector sensitivity, dispersion penalty over distance, and operating wavelength (850 nm (VCSEL Laser)). Selecting higher-powered optics (such as ZR on a short link) could saturate the optical receiver diode, while insufficient optics would fail bit-error-rate thresholds.
* **Standard Reference:** IEEE 802.3ae (10GBASE-SR) / ISO/IEC 11801 OM4

**Alternatives Rejected:**
- **Fixed unpluggable interface:** Lacks modularity; SFP+ allows field replacement and sparing flexibility.

**Engineering Assumptions:**
- Digital Optical Monitoring (DOM/SFF-8472) enabled on all optical transceivers.
- Receiver dynamic range is not exceeded; attenuators installed if power exceeds max receiver input.

---

### Decision 3: Network Layer (Layer 3) Addressing — Variable Length Subnet Mask (VLSM) Allocations for 6 Departments

* **Applied Rule / Algorithm:** Descending-Order Binary Radix Tree Subnet Allocation (RFC 4632 / CIDR)
* **Mathematical Calculation:** `Root Network: 10.10.0.0/20 contains 4096 total IP addresses. Allocated: 2368 addresses across 6 subnets. Address Space Utilization: 57.8%. Remaining Free Space: 1728 addresses.`
* **Technical Explanation:** Subnet requests were sorted strictly in descending order of host requirements prior to allocation. This deterministic ordering prevents memory fragmentation and guarantees that every allocated subnet starts on a naturally aligned binary address boundary (where starting address mod 2^(32 - prefix) == 0). Network and broadcast addresses are mathematically preserved, preventing subnet overlap or silent address overflow.
* **Standard Reference:** RFC 4632 (Classless Inter-domain Routing) & RFC 1918 (Private Address Allocation)

**Alternatives Rejected:**
- **Classful Subnetting (FLSM / Fixed Length Subnet Masking):** Forces uniform mask (e.g. /25 for all departments), causing severe address exhaustion and waste for small departments.
- **Arbitrary / First-Come Ordering:** Causes address fragmentation where larger blocks cannot find continuous aligned binary boundaries.

**Engineering Assumptions:**
- Standard LAN segments reserve 2 addresses (Network ID and Directed Broadcast).
- The first usable IPv4 address in each subnet is designated as the Default Gateway (SVI).

---

### Decision 4: Dynamic Routing & Convergence — Selected Single-Area OSPF (Open Shortest Path First v2 - Area 0)

* **Applied Rule / Algorithm:** Dijkstra SPF Shortest-Path First Link-State Routing with Area Hierarchies
* **Mathematical Calculation:** `SPF Time Complexity: O(E + V log V) where V = 9 nodes, E = 14 links. Database scale remains well within sub-second Dijkstra recomputation limits (<15ms compute overhead).`
* **Technical Explanation:** For a single autonomous system with 6 subnets (fewer than 50 threshold), Single-Area OSPF (Backbone Area 0) is optimal. OSPF uses Dijkstra's Shortest Path First (SPF) algorithm to calculate loop-free paths with rapid sub-second convergence. Because the Link-State Database (LSDB) remains compact under 50 subnets, CPU and memory overhead during SPF recalculations is negligible, obviating the configuration complexity of multi-area partitioning.
* **Standard Reference:** RFC 2328: OSPF Version 2 (STD 54)

**Alternatives Rejected:**
- **EIGRP (Enhanced Interior Gateway Routing Protocol):** Cisco-proprietary lineage (RFC 7868 informational); lacks open multi-vendor interoperability and standardization guarantees.
- **RIPv2 (Routing Information Protocol):** Distance-vector protocol with 15-hop limit, slow timer-based convergence (up to 180 seconds), and high bandwidth consumption due to periodic broadcast/multicast updates (RFC 2453).
- **BGP (Border Gateway Protocol):** Heavy path-vector protocol with extensive memory requirements and slower convergence; excessive operational complexity for an internal single-site LAN.

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
* **Mathematical Calculation:** `Light propagation in silica fiber core (refractive index n ≈ 1.468): v = c / n = 299,792 km/s / 1.4682 ≈ 204,190 km/s (4.898 µs/km). One-way fiber flight delay for 0.35 km = 1.71 µs. Round-Trip Time (RTT) pure fiber propagation = 0.003 ms. Remaining latency budget for switch serialization, queuing, and carrier transport: 4.997 ms.`
* **Technical Explanation:** Do NOT guarantee sub-5ms latency merely because QoS is enabled! Latency is governed by fundamental physics and carrier transport. While the pure optical propagation delay across 0.35 km is 0.003 ms, the total end-to-end latency experienced depends on: (1) Carrier route curvature/trench routing factor (typically 1.3x - 1.5x physical distance), (2) DWDM optical transponder regeneration, (3) Buffer queuing delays, and (4) Store-and-forward switch serialization delay. QoS Low-Latency Queuing (LLQ / Expedited Forwarding DSCP 46) eliminates queuing jitter for voice and high-priority financial packets, but cannot reduce the physical optical propagation constant.
* **Standard Reference:** RFC 2474 (DiffServ Architecture), RFC 3246 (Expedited Forwarding PHB), ITU-T G.8261

**Alternatives Rejected:**
- **Best-Effort First-In First-Out (FIFO) Queuing:** Large bulk file transfers induce bufferbloat, increasing latency spikes well above 20-50ms.

**Engineering Assumptions:**
- Carrier EVPL path does not exceed 1.4x straight-line fiber trench distance.
- Core interfaces run at 10Gbps line-rate with hardware cut-through or fast store-and-forward switching.

**Engineering Warnings:**
> ⚠️ **Warning:** Sub-5ms latency SLA requires strict carrier SLA commitments and verification via RFC 2544 / ITU-T Y.1564 BERT testing; QoS configuration alone cannot overcome transmission distance.

---

