# NetArchitect — Architectural Decision Record (ADR)
## Project: Metro Financial Colocation MAN
**Network Classification:** Metro MAN  
**Generated At:** 2026-11-06T08:32:26.027Z  
**Engine:** NetArchitect Explainable Decision Engine v1.0  

---

### Decision 1: Physical Layer (Layer 1) — Selected OS2 Single-Mode Fiber (SMF 9/125 µm)

* **Applied Rule / Algorithm:** Rule 5.C: Distance > 400m -> OS2 Single-Mode Fiber (9/125 µm core)
* **Mathematical Calculation:** `Distance 28000m exceeds 400m multimode modal dispersion boundary by 27600m. Single-mode zero-modal dispersion required.`
* **Technical Explanation:** For link distances above 400m (28.0 km requested), OS2 Single-Mode Fiber (9/125 µm core) eliminates modal dispersion entirely. Core diameter permits only a single fundamental transverse optical mode, enabling high-bandwidth transmission over tens of kilometers. Interface "10GBASE-ER SFP+ (1550nm Extended Reach Laser)" was selected to guarantee optical link margin over the required span.
* **Standard Reference:** IEEE 802.3ae (10GBASE-ER) / ITU-T G.652.D

**Alternatives Rejected:**
- **OM4 Multimode Fiber:** Exceeds the 400m modal dispersion limit of OM4 10GBASE-SR by 27600m; severe pulse spreading causes bit error rate (BER) collapse.
- **Cat6a Copper:** Exceeds the 100m copper channel limit by 27900m.

**Engineering Assumptions:**
- Low water-peak ITU-T G.652.D single-mode fiber infrastructure.
- Optical attenuation calculated at 1310nm (~0.35-0.4 dB/km) or 1550nm (~0.22-0.25 dB/km).
- Receiver optical power monitored via SFP+ Digital Optical Monitoring (DOM / SFF-8472) to prevent receiver saturation.

---

### Decision 2: Optical & Transceiver Engineering — Selected Optical Interface: 10GBASE-ER SFP+ (1550nm Extended Reach Laser)

* **Applied Rule / Algorithm:** Transceiver Reach Selection vs Optical Power Budgeting
* **Mathematical Calculation:** `Total Power Budget = Min Launch Power (-4.7 dBm) - Max Rx Sensitivity (-15.8 dBm) = 11.1 dB. Channel Insertion Loss = Fiber Loss (28 km x 0.25 dB/km = 7 dB) + Connector Loss (1.5 dB) + Splice Loss (0.5 dB) = 9 dB. Calculated Net Optical Margin = 11.1 dB - 9 dB = 2.1 dB (Pass / Sufficient Margin).`
* **Technical Explanation:** The transceiver module was selected based on transmitter launch power, photodetector sensitivity, dispersion penalty over distance, and operating wavelength (1550 nm (EML Laser)). Selecting higher-powered optics (such as ZR on a short link) could saturate the optical receiver diode, while insufficient optics would fail bit-error-rate thresholds.
* **Standard Reference:** IEEE 802.3ae (10GBASE-ER) / ITU-T G.652.D

**Alternatives Rejected:**
- **Fixed unpluggable interface:** Lacks modularity; SFP+ allows field replacement and sparing flexibility.

**Engineering Assumptions:**
- Digital Optical Monitoring (DOM/SFF-8472) enabled on all optical transceivers.
- Receiver dynamic range is not exceeded; attenuators installed if power exceeds max receiver input.

---

### Decision 3: Network Layer (Layer 3) Addressing — Variable Length Subnet Mask (VLSM) Allocations for 6 Departments

* **Applied Rule / Algorithm:** Descending-Order Binary Radix Tree Subnet Allocation (RFC 4632 / CIDR)
* **Mathematical Calculation:** `Root Network: 172.20.0.0/21 contains 2048 total IP addresses. Allocated: 624 addresses across 6 subnets. Address Space Utilization: 30.5%. Remaining Free Space: 1424 addresses.`
* **Technical Explanation:** Subnet requests were sorted strictly in descending order of host requirements prior to allocation. This deterministic ordering prevents memory fragmentation and guarantees that every allocated subnet starts on a naturally aligned binary address boundary (where starting address mod 2^(32 - prefix) == 0). Network and broadcast addresses are mathematically preserved, preventing subnet overlap or silent address overflow.
* **Standard Reference:** RFC 4632 (Classless Inter-domain Routing) & RFC 1918 (Private Address Allocation)

**Alternatives Rejected:**
- **Classful Subnetting (FLSM / Fixed Length Subnet Masking):** Forces uniform mask (e.g. /25 for all departments), causing severe address exhaustion and waste for small departments.
- **Arbitrary / First-Come Ordering:** Causes address fragmentation where larger blocks cannot find continuous aligned binary boundaries.

**Engineering Assumptions:**
- Standard LAN segments reserve 2 addresses (Network ID and Directed Broadcast).
- The first usable IPv4 address in each subnet is designated as the Default Gateway (SVI).

---

### Decision 4: Dynamic Routing & Convergence — Selected Multi-Area OSPF (Hierarchical Link-State)

* **Applied Rule / Algorithm:** Dijkstra SPF Shortest-Path First Link-State Routing with Area Hierarchies
* **Mathematical Calculation:** `SPF Time Complexity: O(E + V log V) where V = 11 nodes, E = 18 links. Database scale remains well within sub-second Dijkstra recomputation limits (<15ms compute overhead).`
* **Technical Explanation:** With 3 sites and 6 subnets, a hierarchical multi-area OSPF design is mandated. Area 0 (Backbone) interconnects all Area Border Routers (ABRs). Each regional site is assigned a dedicated non-backbone area (e.g. Area 10, Area 20). This confines Type 1 and Type 2 LSA flooding and Dijkstra SPF calculations strictly within the originating area, isolating route churn and preserving router processing resources.
* **Standard Reference:** RFC 2328: OSPF Version 2

**Alternatives Rejected:**
- **Single-Area OSPF Flat Topology:** A flat Area 0 across multi-site links propagates every link flap globally, causing repeated full SPF tree recalculations across all routers.
- **Static Routing with Floating Backup:** Unmaintainable at this scale; does not automatically adapt to link degradation or dynamic topology changes.

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
* **Mathematical Calculation:** `Light propagation in silica fiber core (refractive index n ≈ 1.468): v = c / n = 299,792 km/s / 1.4682 ≈ 204,190 km/s (4.898 µs/km). One-way fiber flight delay for 28 km = 137.14 µs. Round-Trip Time (RTT) pure fiber propagation = 0.274 ms. Remaining latency budget for switch serialization, queuing, and carrier transport: 4.726 ms.`
* **Technical Explanation:** Do NOT guarantee sub-5ms latency merely because QoS is enabled! Latency is governed by fundamental physics and carrier transport. While the pure optical propagation delay across 28 km is 0.274 ms, the total end-to-end latency experienced depends on: (1) Carrier route curvature/trench routing factor (typically 1.3x - 1.5x physical distance), (2) DWDM optical transponder regeneration, (3) Buffer queuing delays, and (4) Store-and-forward switch serialization delay. QoS Low-Latency Queuing (LLQ / Expedited Forwarding DSCP 46) eliminates queuing jitter for voice and high-priority financial packets, but cannot reduce the physical optical propagation constant.
* **Standard Reference:** RFC 2474 (DiffServ Architecture), RFC 3246 (Expedited Forwarding PHB), ITU-T G.8261

**Alternatives Rejected:**
- **Best-Effort First-In First-Out (FIFO) Queuing:** Large bulk file transfers induce bufferbloat, increasing latency spikes well above 20-50ms.

**Engineering Assumptions:**
- Carrier EVPL path does not exceed 1.4x straight-line fiber trench distance.
- Core interfaces run at 10Gbps line-rate with hardware cut-through or fast store-and-forward switching.

**Engineering Warnings:**
> ⚠️ **Warning:** Sub-5ms latency SLA requires strict carrier SLA commitments and verification via RFC 2544 / ITU-T Y.1564 BERT testing; QoS configuration alone cannot overcome transmission distance.

---

