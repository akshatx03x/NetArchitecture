# NetArchitect: Test Strategy, Execution Results & Validation Suite

**Test Framework:** Jest 29.7.0 with Babel-Jest  
**Target Architecture:** Node.js v22 runtime / Browser JSDOM  
**Current Test Status:** 6 Test Suites, 34 Tests Passed, 0 Failures  

---

## 1. Test Strategy Overview

The NetArchitect testing matrix is organized into modular suites targeting each critical algorithm layer:

1. **Physical Media Suite (`tests/mediaEngine.test.js`):** Validates deterministic distance threshold transitions, transceiver selection, optical power budget arithmetic, and strict enforcement of the 100m copper channel ceiling.
2. **VLSM Allocation Suite (`tests/vlsmEngine.test.js`):** Verifies binary radix sizing, descending-order sorting, non-overlapping subnet allocations, safe unsigned 32-bit arithmetic, wildcard masks, /30, /31 (RFC 3021), /32 (RFC 6164), and boundary exhaustion exceptions.
3. **Routing Decision Suite (`tests/routingEngine.test.js`):** Tests protocol transitions (Single-Area OSPF vs. Multi-Area OSPF vs. Hybrid eBGP) against subnet counts ($<50$ vs. $\ge 50$), multi-site domains, and cloud VPC integration.
4. **Cisco Configuration Suite (`tests/configurationEngine.test.js`):** Verifies syntax correctness, explicit trunk allowed lists, native VLAN 999 isolation, Rapid-PVST+ root priorities, SVI IP assignments, and extended ACL definitions.
5. **Preset Scenario Suite (`tests/presets.test.js`):** Validates end-to-end execution of Profile 1 (Campus LAN), Profile 2 (Metro MAN), and Profile 3 (Global WAN).
6. **Artifact Export Suite (`tests/exportPresets.test.js`):** Generates and verifies physical configuration files, CSV tables, and Markdown ADR deliverables on disk.

---

## 2. Test Execution Commands

Run all tests from the project root:
```bash
npm test
```

Run test suite with code coverage analysis:
```bash
npm run test:coverage
```

Watch mode during interactive development:
```bash
npm run test:watch
```

---

## 3. Concrete Test Cases Matrix

| Test Suite | Test Case Description | Expected Result | Status |
|---|---|---|:---:|
| **Physical Media** | Exactly 100m distance | Recommends Cat6a Copper 10GBASE-T | **PASS** |
| **Physical Media** | 101m distance boundary | Recommends OM4 MMF 10GBASE-SR (850nm) | **PASS** |
| **Physical Media** | Exactly 400m distance | Recommends OM4 MMF with 2.6 dB budget | **PASS** |
| **Physical Media** | 401m distance boundary | Recommends OS2 SMF 10GBASE-LR | **PASS** |
| **Physical Media** | 25 km Metro MAN link | Recommends OS2 SMF 10GBASE-ER (1550nm) | **PASS** |
| **Physical Media** | 50 km Long-Haul link | Recommends OS2 SMF 10GBASE-ZR | **PASS** |
| **Physical Media** | Copper requested for 150m | Throws `PhysicalDistanceViolationError` | **PASS** |
| **Physical Media** | Negative distance input | Throws `NetworkValidationError` | **PASS** |
| **VLSM Engine** | Standard /24 with 100, 50, 20 hosts | Dept A: /25, Dept B: /26, Dept C: /27 | **PASS** |
| **VLSM Engine** | Arbitrary input ordering | Sorts descending automatically | **PASS** |
| **VLSM Engine** | Non-overlapping verification | Pairwise checks prove no overlapping IPs | **PASS** |
| **VLSM Engine** | Over-capacity request | Throws `AddressSpaceExhaustionError` | **PASS** |
| **VLSM Engine** | /30 Standard LAN link | Block size 4, 2 usable hosts | **PASS** |
| **VLSM Engine** | /31 RFC 3021 P2P link | Block size 2, 2 usable hosts | **PASS** |
| **VLSM Engine** | /32 RFC 6164 Host route | Block size 1, 1 usable host | **PASS** |
| **VLSM Engine** | Wildcard mask calculation | Inverts subnet mask accurately across /8-/30 | **PASS** |
| **VLSM Engine** | Boundary addresses | Safe unsigned arithmetic for 0.0.0.0 & 255.255.255.255 | **PASS** |
| **Routing Engine**| Single site, $<50$ subnets | Selects Single-Area OSPF Area 0 | **PASS** |
| **Routing Engine**| Subnets count $\ge 50$ | Selects Multi-Area OSPF | **PASS** |
| **Routing Engine**| Multi-site enterprise (no cloud) | Selects Multi-Area OSPF with regional areas | **PASS** |
| **Routing Engine**| Global WAN with Cloud VPC | Selects Hybrid Multi-Area OSPF + eBGP | **PASS** |
| **Configuration** | Core switch SVI creation | Injects default gateway IPs and subnet masks | **PASS** |
| **Configuration** | Trunk allowed VLAN pruning | Enforces explicit VLAN lists on 802.1Q trunks | **PASS** |
| **Configuration** | Native VLAN quarantine | Enforces `switchport trunk native vlan 999` | **PASS** |
| **Configuration** | Spanning Tree hardening | Configures Rapid-PVST+ root priority 4096 & BPDU Guard | **PASS** |
| **Configuration** | OSPF network statements | Wildcard masks match calculated bit inversions | **PASS** |
| **Configuration** | Extended ACL security | Anti-spoofing BCP 38 drops inbound RFC 1918 | **PASS** |
| **Presets E2E**   | Profile 1: Campus LAN | 6 subnets allocated, OM4 media, OSPF Area 0 | **PASS** |
| **Presets E2E**   | Profile 2: Metro MAN | OS2 ER media, dual-homed, sub-5ms ToF analysis | **PASS** |
| **Presets E2E**   | Profile 3: Global WAN | OS2 media, eBGP AS 65001, IPsec tunnels | **PASS** |
| **Artifact Export**| Disk artifact generation | Writes `.cfg`, `.csv`, `.md`, `.json` to `exports/` | **PASS** |

---

## 4. In-Browser Test Suite Runner

In addition to automated CLI testing via Jest, NetArchitect features an **in-browser validation suite** accessible via the **"Validation Tests"** tab in the web application.

- Users, professors, or evaluators can click **"Re-Run All Validation Tests"** to execute the complete test matrix live within the browser environment.
- Displays execution duration (typically $<15\text{ ms}$ for the entire suite), individual assertion results, and error diagnostic traces.

