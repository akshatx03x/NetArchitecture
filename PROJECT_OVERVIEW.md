# NetArchitect: Comprehensive Project Overview

**Academic Subject:** CIC-307 Computer Networks Mini-Project (100 Marks)  
**Project Title:** NetArchitect: Recommendation & Configuration Engine  
**Subtitle:** Algorithmic Network Planning & Self-Explaining Architecture Engine  

---

## 1. Problem Statement

Modern enterprise and campus network engineering requires synthesizing physical constraints (link distances, attenuation, modal dispersion), mathematical constraints (VLSM binary boundaries, host capacities, address space exhaustion), and logical protocols (OSPF link-state graphs, BGP autonomous systems, 802.1Q VLANs, Rapid-PVST+ root bridge priorities).

Traditional approaches suffer from:
1. **Opaque Planning:** Network engineers or students make arbitrary subnet allocations that fragment address space or exceed root prefix bounds.
2. **Disconnected Configuration:** Cisco switch and router configurations are often handwritten using insecure defaults (e.g., untagged native VLAN 1, unconstrained trunks, and disabled Spanning Tree guards).
3. **Black-Box Tools:** Most commercial or academic design tools output diagrams without explaining the mathematical or standards-based justification for *why* a technology was selected over viable alternatives.

---

## 2. Project Objectives

NetArchitect was built to achieve seven primary engineering objectives:

1. **Deterministic Architecture Synthesis:** Given any set of network requirements (or one of three preset scenarios), deterministically recommend the optimal physical media, transceivers, routing protocols, and switching tiers.
2. **Mathematical VLSM Engine:** Implement genuine IPv4 bitwise radix allocation using safe unsigned 32-bit operations. Prevent address wrap-around, enforce descending host sizing, compute exact wildcard masks, and detect subnet exhaustion.
3. **Self-Explaining Decision Engine (25 Marks):** Deliver comprehensive justifications for every major design decision, citing IEEE standards, RFC references, mathematical proofs, engineering assumptions, and explicit alternative rejection reasons.
4. **Hardened Cisco IOS Generation:** Generate production-grade, deployable Cisco IOS-XE configuration scripts for Core switches, Access switches, Border routers, and Interface ACLs.
5. **Interactive Dynamic Visualization:** Generate responsive React Flow topology graphs directly derived from the calculated scenario.
6. **Zero-Dependency Serverless Architecture:** Run completely within the client and Next.js Route Handlers without requiring external databases, Docker, or paid AI APIs.
7. **Empirical Verification:** Validate all algorithms against a comprehensive 34-test Jest suite and provide a live in-browser test runner.

---

## 3. The Three Required Preset Scenarios

### Profile 1: Campus LAN
- **Parameters:** 3 multi-story buildings, maximum building separation of 350m (< 400m threshold), 1,600 endpoints, PoE+ 802.11ax access points.
- **Root Network:** `10.10.0.0/20` (4,096 IP addresses).
- **Core Decisions:**
  - *Horizontal Access:* Cat6a copper (up to 100m) with 802.3at/bt PoE.
  - *Inter-Building Backbone:* OM4 Laser-Optimized Multimode Fiber (50/125 µm) with 10GBASE-SR SFP+ transceivers (850nm VCSEL) and calculated optical power margin of 2.6 dB.
  - *Switching:* 3-Tier Hierarchical model (Catalyst 9500 Core, Catalyst 9300 Distribution, Catalyst 9200 Access) with IEEE 802.1w Rapid-PVST+ (Core priority 4096).
  - *Routing:* Single-Area OSPF (Area 0) across all core switches and edge router.
  - *VLAN Architecture:* 6 segmented VLANs for Wi-Fi, Academic Labs, Administration, Data Center, Telephony, and Management.

### Profile 2: Metro MAN
- **Parameters:** Financial headquarters colocation interconnected to two remote branch offices over carrier EVPL links spanning 15–35 km (28 km nominal link distance), 450 users, dual-homed failover, sub-5ms latency target.
- **Root Network:** `172.20.0.0/21` (2,048 IP addresses).
- **Core Decisions:**
  - *Physical Medium:* OS2 Single-Mode Fiber (9/125 µm core).
  - *Optical Transceivers:* 10GBASE-ER SFP+ (1550nm EML laser) providing 11.1 dB optical budget for distances up to 40 km.
  - *Latency Analysis:* Transparent time-of-flight physics calculation proving light propagates in silica glass at 4.898 µs/km. Round-Trip propagation delay across 28 km is 0.274 ms, leaving 4.726 ms for carrier routing curvature and serialization. Notes explicitly that QoS alone cannot defy physical transmission distance.
  - *Resiliency:* Active-standby dual-homed router pairs running HSRP and BFD over EVPL.

### Profile 3: Global WAN
- **Parameters:** 4 global city hubs (Americas, EMEA, APAC, IoT Logistics Depot), AWS/Azure Cloud VPC integration, and 2,000 IoT scanners/sensors.
- **Root Network:** `10.100.0.0/19` (8,192 IP addresses).
- **Core Decisions:**
  - *Perimeter Security:* IPsec VPN tunnels with AES-256-GCM encryption, IKEv2, SHA-384, and TCP MSS clamping at 1400 bytes.
  - *Routing Architecture:* Hybrid routing featuring Multi-Area OSPF internally within regional hubs, plus external BGP (eBGP AS 65001 to Cloud AS 64512) for policy-based path control and AS_PATH loop prevention.
  - *Route Summarization:* Autonomous System Boundary Routers (ASBRs) announce only aggregated supernet CIDR blocks to external transit carriers.

---

## 4. User Workflow

1. **Exploration:** View the Overview page to examine the system capabilities and select any of the 3 preset profiles with one click.
2. **Custom Building:** Open the Custom Scenario Builder to define network names, scale, distance, bandwidth, root CIDR, and add/remove departments with custom host sizes.
3. **Verification & Planning:** The engine validates all parameters, detects contradictions or exhaustion, and executes the mathematical allocation.
4. **Dashboard Inspection:** Review the high-level architecture KPIs, physical media details, optical power budget, and estimated hardware Bill of Materials (BOM).
5. **Subnet Examination:** Drill into the VLSM table, review usable ranges, and open the mathematical derivation drawer to inspect the exact binary alignment steps.
6. **Topology Visualization:** Pan and zoom the React Flow network graph, inspect individual node roles, and trace uplinks.
7. **Configuration Generation:** Switch between Core Switch, Access Switch, Edge Router, and Security ACL tabs. Copy configuration lines or download `.cfg` files directly.
8. **Explainable Decision Review:** Filter decisions by category and inspect the applied algorithm, mathematical calculations, IEEE/RFC references, and alternative rejection reasons.
9. **Validation Test Runner:** Launch the live in-browser test runner to watch all 34 Jest tests execute and report empirical pass status.
10. **Exporting:** Download a ZIP archive containing all configuration files, CSV subnet matrices, Markdown ADRs, and JSON parameters.

