# NetArchitect: Networking Rules, Mathematical Methods & Standards Reference

This document formalizes the networking decision rules, mathematical allocation equations, physical transmission principles, and standard references used by the NetArchitect engine.

---

## 1. Physical Media Decision Rules & Attenuation Math

### Rule Set 1: Transmission Distance Thresholds

| Link Distance Range | Selected Medium | Recommended Transceiver | Relevant Standard |
|---|---|---|---|
| **Up to 100 meters** | Category 6A UTP/STP Copper | 10GBASE-T RJ-45 | IEEE 802.3an / ANSI/TIA-568-C.2 |
| **101 to 400 meters** | OM4 Laser-Optimized MMF (50/125 µm) | 10GBASE-SR SFP+ (850nm) | IEEE 802.3ae / ISO/IEC 11801 OM4 |
| **401m to 10 km** | OS2 Single-Mode Fiber (9/125 µm) | 10GBASE-LR SFP+ (1310nm) | IEEE 802.3ae / ITU-T G.652.D |
| **10 km to 40 km** | OS2 Single-Mode Fiber (9/125 µm) | 10GBASE-ER SFP+ (1550nm) | IEEE 802.3ae / ITU-T G.652.D |
| **Above 40 km (to 80 km)** | OS2 Single-Mode Fiber (9/125 µm) | 10GBASE-ZR SFP+ (1550nm) | SFF-8431 / Multi-Source Agreement |

### Engineering Constraints:
1. **Copper Channel Limitation:** Per IEEE 802.3an and ANSI/TIA-568-C.2, twisted-pair copper channels are strictly limited to a combined 100 meters (90m solid horizontal cable + 10m stranded patch cords). When an explicit request for copper exceeds 100m, NetArchitect raises a `PhysicalDistanceViolationError`.
2. **Multimode Modal Dispersion:** OM4 fiber operates at 850nm with an Effective Modal Bandwidth (EMB) of $4700\text{ MHz}\cdot\text{km}$. Links exceeding 400m suffer severe differential mode delay (DMD), leading to inter-symbol interference (ISI) and bit-error-rate collapse.
3. **Single-Mode Zero-Dispersion:** OS2 fiber has a 9 µm core diameter which permits only the fundamental optical mode ($LP_{01}$), completely eliminating modal dispersion. Attenuation is calculated at $0.35 - 0.4\text{ dB/km}$ at 1310nm and $0.22 - 0.25\text{ dB/km}$ at 1550nm.

### Optical Power Budget Equation:
$$\text{Optical Margin (dB)} = P_{\text{Tx, min}} - S_{\text{Rx}} - (\alpha \cdot L + N_{\text{conn}} \cdot L_{\text{conn}} + N_{\text{splice}} \cdot L_{\text{splice}})$$
Where:
- $P_{\text{Tx, min}}$: Minimum transmitter launch power (dBm)
- $S_{\text{Rx}}$: Maximum receiver sensitivity threshold (dBm)
- $\alpha$: Fiber attenuation coefficient (dB/km)
- $L$: Link distance in km
- $L_{\text{conn}}$: Connector insertion loss ($\sim 0.75\text{ dB}$ per mated pair)
- $L_{\text{splice}}$: Fusion splice loss ($\sim 0.1\text{ dB}$)

---

## 2. VLSM Subnet Mathematical Allocation Rules

### Rule Set 2: Radix Binary Sizing and Alignment
Variable Length Subnet Masking (VLSM) adheres to RFC 4632 (CIDR) and RFC 791 (IPv4):

1. **Host-to-Prefix Transformation:**
   For a department requiring $H$ usable IP addresses:
   $$2^k - 2 \ge H$$
   $$k = \lceil \log_2(H + 2) \rceil$$
   $$\text{Subnet Prefix} = 32 - k, \quad \text{Block Size } S = 2^k$$

2. **Descending Order Rule:**
   Subnet requirements must be sorted in descending order of block size:
   $$S_1 \ge S_2 \ge \dots \ge S_n$$
   *Proof:* Sorting ensures that higher-order bit boundaries are partitioned first. If a smaller block (/28) were placed at offset 0, a subsequent larger block (/25) starting immediately after it (offset 16) would violate natural binary alignment, leaving unallocatable fragments.

3. **Binary Boundary Alignment:**
   A subnet with block size $S$ must start at an IPv4 integer offset that is an exact multiple of $S$:
   $$\text{AlignedStartUint32} = \text{CurrentUint32} + ((S - (\text{CurrentUint32} \bmod S)) \bmod S)$$

4. **Wildcard Mask Inversion:**
   $$\text{WildcardMask} = (\sim \text{SubnetMaskUint32}) \ggg 0$$
   *Example:* Prefix `/26` $\implies$ Subnet Mask `255.255.255.192` $\implies$ Wildcard Mask `0.0.0.63`.

5. **Usable IP Allocations:**
   - **First Usable Address:** $\text{NetworkUint32} + 1$ (Assigned to the SVI / Default Gateway).
   - **Last Usable Address:** $\text{BroadcastUint32} - 1$.
   - **Directed Broadcast:** $\text{NetworkUint32} + S - 1$.

6. **Special Cases:**
   - **/31 Subnets (RFC 3021):** Point-to-point router serial/Ethernet links. Network and broadcast addresses are eliminated; both IPs ($2^1 = 2$) are usable hosts.
   - **/32 Subnets (RFC 6164):** Single-host loopback interfaces or explicit host routes.

---

## 3. Dynamic Routing Protocol Decision Rules

### Rule Set 3: Routing Domain Partitioning

```
                            [Total Subnets < 50?]
                                    /     \
                                  YES      NO
                                  /         \
                       [Single Site?]      [Multi-Area OSPF]
                           /     \
                         YES      NO
                         /         \
             [Single-Area OSPF]   [Multi-Area OSPF]
                                          |
                              [Cloud VPC / External AS?]
                                          |
                            [Hybrid: Multi-Area OSPF + eBGP]
```

1. **Single Autonomous System, $< 50$ Subnets:**
   - **Recommendation:** Single-Area OSPF (Backbone Area 0) per RFC 2328.
   - **Rationale:** Dijkstra's Shortest Path First (SPF) algorithm exhibits computational complexity of $O(E + V \log V)$. With fewer than 50 subnets and 10 routers, LSDB synchronization takes $<15\text{ ms}$, rendering multi-area hierarchy unnecessary overhead.

2. **$\ge 50$ Subnets or Multiple Geographic Sites:**
   - **Recommendation:** Multi-Area OSPF.
   - **Rationale:** Inter-area route summarization performed by Area Border Routers (ABRs) confines Type 1 and Type 2 LSA flooding inside originating areas, preventing link flap churn from triggering global SPF runs.

3. **Multi-Site WAN with Cloud VPC (AWS / Azure):**
   - **Recommendation:** Hybrid Architecture: Multi-Area OSPF IGP + eBGP (Border Gateway Protocol per RFC 4271).
   - **Rationale:** Cloud Virtual Private Gateways and carrier EVPL circuits do not support internal link-state flooding across untrusted boundaries. eBGP provides policy-based prefix filtering, autonomous system path (`AS_PATH`) loop prevention, and multi-exit discriminators (MED).

---

## 4. Switching, Spanning Tree & Security Rules

1. **Spanning Tree Protocol (IEEE 802.1w Rapid-PVST+):**
   - Core Switch 01 configured as Root Bridge Primary: `spanning-tree vlan 1-4094 priority 4096`.
   - Core Switch 02 configured as Root Bridge Secondary: `spanning-tree vlan 1-4094 priority 8192`.
   - Edge Access Switches: Default priority 32768, with `spanning-tree portfast default` and `spanning-tree portfast bpduguard default` enabled to prevent rogue switch attachments.
2. **802.1Q Trunk Hardening:**
   - Explicit allowed VLAN pruning: `switchport trunk allowed vlan <list>`.
   - Native VLAN changed to quarantine VLAN 999: `switchport trunk native vlan 999`.
   - Dynamic Trunking Protocol disabled: `switchport nonegotiate`.
3. **Perimeter ACLs & Anti-Spoofing (BCP 38 / RFC 2827):**
   - External WAN interfaces explicitly drop inbound packets bearing RFC 1918 private source addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
   - TCP MSS Clamping enforced at 1400 bytes on crypto tunnel interfaces to prevent Path MTU black-hole fragmentation.

