# NetArchitect: System Architecture & Engineering Specification

## 1. Architectural Principles

NetArchitect is engineered as a deterministic, client-side capable, serverless-ready network planning system. It strictly enforces the non-negotiable project constraints:
- **Zero External Database:** All state is handled in-memory and persisted via browser `localStorage`.
- **Pure JavaScript:** Built using modern ES6+ JavaScript without TypeScript.
- **Explainability as a Core Primitive:** Algorithms produce structured explanation objects alongside calculation results.

```
                      +---------------------------------------+
                      |       User Interaction / GUI          |
                      |  (Next.js App Router + Tailwind CSS)  |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       NetworkContext State Manager    |
                      +-------------------+-------------------+
                                          |
                      +-------------------+-------------------+
                      |      Input Validation Pipeline        |
                      |  (networkValidator + cidrValidator)   |
                      +-------------------+-------------------+
                                          |
                                          v
+---------------------------------------------------------------------------------+
|                         Core Deterministic Algorithm Engines                    |
|                                                                                 |
|   +-------------------+    +--------------------+    +----------------------+   |
|   |   Media Engine    |    |    VLSM Engine     |    |    Routing Engine    |   |
|   |  (IEEE 802.3an/ae)|    | (RFC 4632 Radix)   |    | (RFC 2328 / Dijkstra)|   |
|   +-------------------+    +--------------------+    +----------------------+   |
|                                                                                 |
|   +-------------------+    +--------------------+    +----------------------+   |
|   |  Topology Engine  |    | Cisco Config Engine|    |  Explanation Engine  |   |
|   |  (React Flow)     |    | (IOS-XE Generator) |    |  (25-Mark Core ADR)  |   |
|   +-------------------+    +--------------------+    +----------------------+   |
+---------------------------------------------------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |         Output Deliverables           |
                      |  - Interactive Dashboard Views        |
                      |  - Cisco IOS .cfg Configurations      |
                      |  - VLSM Subnet CSV Allocation Matrix  |
                      |  - Architectural Decision Record (MD) |
                      |  - Multi-File ZIP Package Export      |
                      +---------------------------------------+
```

---

## 2. Core Engine Specifications

### 2.1 IPv4 Mathematical Utilities (`src/lib/utils/ipUtils.js`)
- Handles 32-bit unsigned integer conversions using the unsigned right-shift operator (`>>> 0`) to prevent JavaScript's default signed integer coercion from corrupting high-order bits (e.g., in `192.168.0.0` or `255.255.255.255`).
- Validates IPv4 dotted-quad octet strings, rejecting non-numeric tokens, negative values, and numbers > 255.
- Computes bitwise masks:
  $$\text{MaskUint32} = (0\text{xFFFFFFFF} \ll (32 - \text{prefix})) \ggg 0$$
  $$\text{WildcardUint32} = (\sim \text{MaskUint32}) \ggg 0$$

### 2.2 VLSM Subnet Allocation Engine (`src/lib/engines/vlsmEngine.js`)
- **Ordering:** Subnet requests are cloned and sorted strictly in descending order of host requirements. This mathematical rule prevents external fragmentation and ensures smaller subnets fit into remaining boundaries.
- **Prefix Calculation:** For a required host count $H$, the engine computes host bits $k$:
  $$2^k - 2 \ge H \implies k = \lceil\log_2(H + 2)\rceil, \quad \text{prefix} = 32 - k$$
- **Binary Boundary Alignment:** Every subnet must start on a multiple of its block size $S = 2^k$:
  $$\text{AlignedStart} = \left\lceil \frac{\text{CurrentUint32}}{S} \right\rceil \times S$$
- **Boundary Exhaustion Detection:** If $\text{AlignedStart} + S - 1 > \text{RootBroadcastUint32}$, the engine immediately throws an `AddressSpaceExhaustionError` detailing the exact overflow.
- **Specialized Prefix Support:**
  - Handles `/31` Point-to-Point links per RFC 3021 (no separate network/broadcast addresses, 2 usable hosts).
  - Handles `/32` Host routes per RFC 6164 (1 usable host).

### 2.3 Physical Media Decision Engine (`src/lib/engines/mediaEngine.js`)
- Enforces the project's educational distance thresholds:
  - $\text{Distance} \le 100\text{m}$: Cat6a / 10GBASE-T. Explicit copper requests above 100m throw `PhysicalDistanceViolationError`.
  - $101\text{m} \le \text{Distance} \le 400\text{m}$: OM4 Multimode Fiber (50/125 µm) with 10GBASE-SR SFP+ transceivers (850nm VCSEL). Computes optical power budget ($2.6\text{ dB}$ margin).
  - $\text{Distance} > 400\text{m}$: OS2 Single-Mode Fiber (9/125 µm). Automatically matches optical transceiver to reach:
    - $\le 10\text{ km}$: 10GBASE-LR (1310nm DFB laser).
    - $10\text{ km} - 40\text{ km}$: 10GBASE-ER (1550nm EML laser).
    - $> 40\text{ km}$: 10GBASE-ZR (1550nm cooled laser with APD receiver).

### 2.4 Routing Protocol Decision Engine (`src/lib/engines/routingEngine.js`)
- Evaluates subnet count, site topology, cloud VPC integration, and administrative boundaries:
  - Single site, $< 50$ subnets $\implies$ Single-Area OSPF Area 0. Explains Dijkstra SPF $O(E + V \log V)$ scaling and rapid sub-second convergence.
  - Multi-site enterprise or $\ge 50$ subnets $\implies$ Multi-Area OSPF with Area 0 backbone and regional stub/NSSA areas to isolate LSA flooding.
  - Multi-site with Cloud VPC or external carrier transit $\implies$ Hybrid routing combining internal Multi-Area OSPF IGP with external BGP (eBGP AS 65001 to Cloud AS 64512) for AS_PATH loop prevention.

### 2.5 Cisco IOS Configuration Generator (`src/lib/engines/configurationEngine.js`)
- Generates hardened Cisco IOS-XE 17.x scripts:
  - **Core Switch:** SVI default gateways, explicit 802.1Q trunk allowed lists, native VLAN 999 quarantine, Rapid-PVST+ root bridge priority 4096, LACP port-channels, and OSPF network statements with exact calculated wildcard masks.
  - **Access Switch:** Rapid-PVST+ edge PortFast with BPDU Guard enabled globally, disabled unused ports assigned to VLAN 999, and management SVI.
  - **Border Router:** Downlink to core switches, WAN uplink filter, BGP peering statements, default static route to carrier gateway, and anti-spoofing extended ACLs dropping inbound RFC 1918 traffic (BCP 38).
  - **Security ACLs:** Dedicated extended access lists per department enforcing DNS/DHCP inspection, outbound web filtering, and inter-VLAN isolation.

### 2.6 Explainable Decision Engine (`src/lib/engines/explanationEngine.js`)
- Centralized explainability layer (25 Marks). For every decision, constructs a structured record containing:
  - Category, Decision, Input Parameters, Applied Rule.
  - Mathematical calculation and margin proof.
  - Technical engineering justification.
  - IEEE standards and IETF RFC mapping.
  - Alternatives considered and detailed rejection reasons.
  - Engineering assumptions and operational warnings.

---

## 3. Serverless API Endpoint (`src/app/api/plan/route.js`)

NetArchitect exposes a Next.js Serverless Route Handler at `POST /api/plan`.

- **Request Body:** JSON payload matching scenario schema (name, networkType, distanceMeters, endpoints, rootCidr, departments).
- **Response:** JSON object containing `media`, `vlsm`, `routing`, `topology`, `configurations`, and `explanations`.
- **Error Handling:** Returns HTTP 400 with specific error messages (`AddressSpaceExhaustionError`, `PhysicalDistanceViolationError`, or `NetworkValidationError`) on invalid inputs.

