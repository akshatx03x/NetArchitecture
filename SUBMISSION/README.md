# NetArchitect: Recommendation & Configuration Engine

**Course:** CIC-307 — Computer Networks Mini-Project (100 Marks)  
**Student:** Akshat Gupta (01514802724)  
**Specification:** Algorithmic Network Planning & Self-Explaining Architecture Engine  

---

## 1. Project Overview

NetArchitect is an intelligent network planning and automated configuration system. Given enterprise physical constraints (site count, inter-building distance, host requirements, bandwidth, and redundancy), it algorithmically computes:

1. **Physical Transmission Media & Transceivers:** Deterministic distance-boundary selection (Cat6a copper, OM4 multimode fiber, OS2 single-mode fiber) and dynamic optical power budget calculations.
2. **VLSM Subnet Allocation (RFC 4632):** Descending host-demand ordering, unsigned 32-bit arithmetic, exact wildcard masks, SVI gateways, and non-overlapping boundary guarantees.
3. **Dynamic Routing Design:** Scale-based link-state evaluation (Single-Area OSPF vs. Multi-Area OSPF vs. Hybrid eBGP/OSPF with Dijkstra complexity rationale).
4. **Cisco IOS Configurations:** Hardened, production-ready Cisco IOS-XE 17.x scripts for Core Switches, Access Switches, Edge Routers, and Security ACLs.
5. **Explainable Decision Engine (25 Marks):** Self-explaining engineering justification logs backed by IEEE standards, RFC citations, and rejected alternatives.

---

## 2. Technologies Used

- **Framework:** Next.js 14 (App Router)
- **Language:** JavaScript ONLY (Zero TypeScript, strictly compliant with specification)
- **Styling:** Tailwind CSS (Minimal, high-contrast, black-and-white professional design)
- **Algorithms:** Native JavaScript ES6 modules (Zero external mathematical dependencies)
- **Testing:** Jest 29.7 with `next/jest` (SWC compiler transformation)
- **Topology Visualization:** React Flow (`@xyflow/react`)
- **Packaging:** JSZip & FileSaver for configuration export archives

**Zero-Backend Architecture:**
- No separate Express.js, FastAPI, or Flask server.
- No external databases (MongoDB, PostgreSQL, Firebase).
- No paid third-party AI APIs or cloud service dependencies.
- Completely deployable to Vercel with zero configuration.

---

## 3. Key Implemented Features

- **3 Predefined Enterprise Scenarios:** Campus LAN, Metro Financial MAN, and Global Multi-Cloud WAN.
- **Custom Scenario Builder:** Interactive form with physical distance rules, CIDR validation, and dynamic department sizing.
- **Explainable Decision Engine:** Every recommendation is supported by calculated values, applied algorithms, and IEEE/RFC citations.
- **Interactive Network Topology Graph:** Pan, zoom, and click nodes to inspect device roles and interface allocations.
- **Mathematical Derivation Inspector:** Step-by-step bitwise allocation proofs for any allocated subnet.
- **One-Click Export:** Download all generated Cisco `.cfg` files, CSV matrices, and Markdown ADRs as a ZIP archive.
- **In-Browser Regression Test Suite:** Execute all 37 unit and integration tests directly in the browser or via CLI.

---

## 4. How to Install and Run the Project

### Prerequisites
- Node.js v18.17.0 or higher (Tested on Node.js v22.22.0)
- npm v9 or higher

### Installation
From within the `source_code/` directory (or root repository):
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Launch
```bash
npm run build
npm start
```

---

## 5. How to Run Automated Tests

To execute the complete Jest test suite:
```bash
npm test
```
All 6 test suites and 37 assertions execute in under 4 seconds with 100% pass rate.

To run with coverage reporting:
```bash
npm run test:coverage
```

---

## 6. How to Use the Three Scenario Presets

1. Open the application and click **"Select Predefined Scenario"** (or click **"Network Scenarios"** in the top navigation).
2. Choose one of the three profiles:
   - **Campus LAN Enterprise:** 3 Buildings, 1,600 endpoints, 350m separation, OM4 fiber backbone, OSPF Area 0, root `10.10.0.0/20`.
   - **Metro Financial MAN:** 3 Sites, 450 endpoints, 28 km distance, OS2 10GBASE-ER fiber, low-latency trading desk, root `172.20.0.0/21`.
   - **Global Multi-Cloud WAN:** 4 Regional Hubs + AWS Cloud VPC, 2,000 IoT sensors, IPsec encrypted tunnels, hybrid eBGP + OSPF, root `10.100.0.0/19`.
3. Click **"Load & View Results"** to simulate the full architecture.
4. Explore the four results tabs:
   - **Architecture & Media:** Hardware BOM, optical power budgets, transceiver models.
   - **Subnet Allocation (VLSM):** IP address allocation table with bitwise derivation drawer and CSV export.
   - **Network Topology:** Interactive React Flow device interconnect canvas.
   - **Decision Explanations:** 25-mark explainability rubric with alternative rejection tables.

---

## 7. How to Generate Configuration Exports

1. In the application, navigate to the **"Configurations"** tab.
2. Select any device (`Core Switch`, `Access Switch`, `Edge Router`, `Security ACLs`) to inspect syntax.
3. Click **"Download All as ZIP"** in the header to download a `.zip` containing all `.cfg` files, the VLSM `.csv` matrix, and the Markdown Architecture Decision Record (`.md`).
4. Alternatively, open the **`configuration_exports/`** folder in this submission directory to inspect pre-generated consolidated `.cfg` packages:
   - `campus_lan.cfg`
   - `metro_man.cfg`
   - `global_wan.cfg`

---

## 8. Repository Structure Overview

```text
SUBMISSION/
├── README.md                          # Project documentation and submission instructions
├── ai_audit_log.md                    # Verified AI development audit log (2 concrete case studies)
│
├── configuration_exports/             # Verified Cisco configuration exports from all 3 presets
│   ├── campus_lan.cfg                 # Campus LAN (Core Switch, Access Switch, Router, ACLs)
│   ├── metro_man.cfg                  # Metro MAN (Core Switch, Access Switch, Router, ACLs)
│   └── global_wan.cfg                 # Global WAN (Core Switch, Access Switch, Router, ACLs)
│
├── source_code/                       # Complete, clean, independently runnable source code
│   ├── package.json                   # Project dependencies and test scripts
│   ├── next.config.js                 # Next.js configuration
│   ├── jest.config.js                 # Jest test runner configuration with next/jest
│   ├── tailwind.config.js             # Minimal monochrome styling system
│   ├── jsconfig.json                  # Path alias mappings (@/* -> ./src/*)
│   ├── src/
│   │   ├── app/                       # Next.js 14 App Router (layout, page, icon)
│   │   ├── components/                # Modular UI views (scenarios, builder, results, configs, docs)
│   │   ├── context/                   # NetworkContext (state management and plan caching)
│   │   └── lib/
│   │       ├── engines/               # Core deterministic algorithms (media, VLSM, routing, configs, explanations)
│   │       ├── errors/                # Custom domain errors (PhysicalDistanceViolation, AddressExhaustion)
│   │       ├── presets/               # Official presets (Campus LAN, Metro MAN, Global WAN)
│   │       ├── utils/                 # Bitwise IP math, export utilities, optical helpers
│   │       └── validators/            # CIDR and scenario parameter validation
│   └── tests/                         # 6 Jest test suites (37 passing assertions)
│
└── verification/
    └── test_results.txt               # Formal execution log of npm test and next build
```

