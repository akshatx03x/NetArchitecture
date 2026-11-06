'use client';

import React, { useState } from 'react';
import TestingView from '@/components/testing/TestingView';

export default function DocumentationView() {
  const [activeDoc, setActiveDoc] = useState('specs');

  const docs = [
    { id: 'specs', title: 'System Architecture & Objectives' },
    { id: 'standards', title: 'Standards Reference (IEEE/RFC)' },
    { id: 'ai-audit', title: 'AI Development Audit Log' },
    { id: 'packet-tracer', title: 'Packet Tracer Lab Guide' },
    { id: 'deployment', title: 'Vercel Deployment Guide' },
    { id: 'tests', title: 'Interactive Test Suite' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="border-b border-[#212121] pb-6">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Validation &amp; Documentation
          </h1>
          <span className="text-xs text-neutral-300 bg-[#161616] border border-[#2B2B2B] px-2.5 py-0.5 rounded font-mono">
            CIC-307 Comprehensive
          </span>
        </div>
        <p className="text-sm sm:text-base text-neutral-300 mt-1 max-w-2xl leading-relaxed">
          Formal engineering documentation, physical media attenuation rules, packet tracer topology guidance, and AI-assisted audit records.
        </p>
      </div>

      {/* Docs Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#212121] pb-3">
        {docs.map((doc) => {
          const isActive = activeDoc === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
              }`}
            >
              {doc.title}
            </button>
          );
        })}
      </div>

      {/* Content Container */}
      <div className="border border-[#262626] rounded-lg p-6 sm:p-8 bg-[#111111] space-y-6 text-sm text-neutral-300 leading-relaxed">
        {activeDoc === 'specs' && (
          <div className="space-y-6">
            <div className="border-b border-[#212121] pb-3">
              <h2 className="text-lg font-bold text-white">Project Overview &amp; Academic Specification</h2>
              <p className="text-neutral-400 text-xs mt-1">Course: CIC-307 Computer Networks Mini-Project (100 Marks)</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">1. Problem Statement</h3>
              <p className="text-neutral-200 text-sm leading-relaxed">
                Enterprise network design frequently suffers from fragmented planning tools, arbitrary IP address allocation that leads to address exhaustion,
                and opaque recommendation engines that offer no technical or mathematical justification for selected architectures.
                NetArchitect solves this through a deterministic, explainable expert engine operating completely within the browser without external backends.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">2. System Architecture</h3>
              <p className="text-neutral-200 text-sm leading-relaxed">
                The NetArchitect stack is constructed using Next.js App Router (JavaScript only), styled via Tailwind CSS, and driven by pure ES6 JavaScript algorithm modules:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-neutral-300 text-sm">
                <li><strong className="text-white">Physical Media Engine:</strong> Implements deterministic reach thresholds for Cat6a (&le;100m), OM4 MMF (&le;400m), and OS2 SMF (&gt;400m).</li>
                <li><strong className="text-white">VLSM Allocation Engine:</strong> Bitwise unsigned 32-bit arithmetic preventing signed wrap-around, sorting by descending host count, and detecting boundary exhaustion.</li>
                <li><strong className="text-white">Routing Protocol Engine:</strong> OSPF Area 0 vs. Multi-Area OSPF vs. Hybrid eBGP/OSPF with Dijkstra complexity proofs.</li>
                <li><strong className="text-white">Topology Engine:</strong> Dynamic React Flow node-edge graph synthesizer for 3-tier, collapsed core, and dual-homed WANs.</li>
                <li><strong className="text-white">Cisco Configuration Generator:</strong> Hardened Catalyst 9500/9200 and ISR 4451 IOS-XE scripts with explicit trunking, SVI gateways, and ACLs.</li>
                <li><strong className="text-white">Explainable Decision Engine (25 Marks):</strong> Self-explaining justification records with IEEE/RFC citations and alternative rejection reasons.</li>
              </ul>
            </div>
          </div>
        )}

        {activeDoc === 'standards' && (
          <div className="space-y-6">
            <div className="border-b border-[#212121] pb-3">
              <h2 className="text-lg font-bold text-white">Networking Rules &amp; Standards References</h2>
              <p className="text-neutral-400 text-xs mt-1">Formal IEEE, TIA/EIA, and IETF RFC mappings</p>
            </div>

            <div className="overflow-x-auto border border-[#212121] rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#141414] border-b border-[#212121] text-neutral-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Standard / RFC</th>
                    <th className="py-3 px-4 font-semibold">Domain</th>
                    <th className="py-3 px-4 font-semibold">Mandate &amp; Implementation in NetArchitect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E1E]">
                  <tr>
                    <td className="py-3 px-4 text-white font-mono font-medium">IEEE 802.3an</td>
                    <td className="py-3 px-4 text-neutral-400">Physical Layer (Copper)</td>
                    <td className="py-3 px-4 text-neutral-200">10GBASE-T over Cat6a; strict 100-meter channel limit enforced. Raises error if copper requested &gt; 100m.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-mono font-medium">IEEE 802.3ae</td>
                    <td className="py-3 px-4 text-neutral-400">Physical Layer (Fiber Optics)</td>
                    <td className="py-3 px-4 text-neutral-200">10GBASE-SR (850nm VCSEL on OM4 MMF up to 400m), 10GBASE-LR (1310nm on OS2 up to 10km), 10GBASE-ER (1550nm up to 40km).</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-mono font-medium">RFC 4632</td>
                    <td className="py-3 px-4 text-neutral-400">Network Layer (VLSM/CIDR)</td>
                    <td className="py-3 px-4 text-neutral-200">Classless Inter-Domain Routing; variable-length subnet masks allocated in descending order on aligned binary boundaries.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-mono font-medium">RFC 3021</td>
                    <td className="py-3 px-4 text-neutral-400">Point-to-Point Links</td>
                    <td className="py-3 px-4 text-neutral-200">Using 31-bit prefixes (/31) for router point-to-point links; conserves IPv4 space without separate broadcast/network addresses.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-mono font-medium">RFC 2328</td>
                    <td className="py-3 px-4 text-neutral-400">Dynamic Routing</td>
                    <td className="py-3 px-4 text-neutral-200">OSPF Version 2 Link-State IGP. Area 0 for &lt;50 subnets; Multi-Area hierarchical summarization for &ge;50 subnets.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-mono font-medium">RFC 4271</td>
                    <td className="py-3 px-4 text-neutral-400">Inter-Domain Routing</td>
                    <td className="py-3 px-4 text-neutral-200">Border Gateway Protocol 4 (BGP-4); path-vector routing at WAN and Cloud VPC autonomous system boundaries.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-mono font-medium">IEEE 802.1w</td>
                    <td className="py-3 px-4 text-neutral-400">Data Link (STP)</td>
                    <td className="py-3 px-4 text-neutral-200">Rapid Spanning Tree Protocol (Rapid-PVST+); Root Bridge priority 4096 (Primary) and 8192 (Secondary) with BPDU Guard.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeDoc === 'ai-audit' && (
          <div className="space-y-6">
            <div className="border-b border-[#212121] pb-3">
              <h2 className="text-lg font-bold text-white">AI Development Audit Log (Academic Review)</h2>
              <p className="text-neutral-400 text-xs mt-1">
                Authentic documentation of two technical errors encountered during development, technical diagnoses, corrected algorithms, and validation results.
              </p>
            </div>

            {/* Incident 1 */}
            <div className="border border-[#262626] rounded-lg p-5 bg-[#141414] space-y-3">
              <div className="flex items-center justify-between border-b border-[#212121] pb-2">
                <span className="text-white font-semibold text-sm">CASE STUDY 1: IPv4 Bitwise Shift Operator Signed Integer Overflow</span>
                <span className="text-xs text-neutral-400 border border-[#2B2B2B] px-2 py-0.5 rounded">Fixed &amp; Verified</span>
              </div>

              <div className="space-y-2 text-neutral-200 text-sm">
                <p><strong className="text-white">1. Initial Prompt:</strong> &quot;Write a JavaScript function to convert an IPv4 address string into a 32-bit number for VLSM calculations.&quot;</p>
                <div className="bg-[#0D0D0D] p-3 rounded-md border border-[#212121] text-neutral-300 font-mono text-xs">
                  <span className="text-neutral-500 block text-xs">// Flawed Implementation:</span>
                  <code>{`function ipToInt(ip) { return (o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]; }`}</code>
                </div>
                <p><strong className="text-white">2. Why it seemed reasonable:</strong> The 4 octets were shifted into their 8-bit byte positions and bitwise OR-ed together.</p>
                <p><strong className="text-white">3. Defect:</strong> In JavaScript, all bitwise operators (such as &lt;&lt; and |) coerce operands into signed 32-bit two&apos;s-complement integers. Whenever an IP address has an octet &ge; 128 (e.g. 192.168.1.1 or 172.16.0.1), the 31st sign bit is set to 1, causing the returned integer to become a negative number (-1062731519 instead of 3232235777)! This corrupted modulus alignment checks.</p>
                <p><strong className="text-white">4. Technical Diagnosis:</strong> Signed arithmetic causes negative modulus calculations and silently wraps address bounds, causing false exhaustion errors.</p>
                <div className="bg-[#0D0D0D] p-3 rounded-md border border-[#212121] text-neutral-200 font-mono text-xs">
                  <span className="text-neutral-500 block text-xs">// Corrected Implementation:</span>
                  <code>{`export function ipv4ToUint32(ip) { return (((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0); }`}</code>
                </div>
                <p><strong className="text-white">5. Verification Method:</strong> Jest unit test asserting <code>ipv4ToUint32(&apos;255.255.255.255&apos;) === 4294967295</code> and <code>ipv4ToUint32(&apos;192.168.0.0&apos;) === 3232235520</code> passed with 100% precision.</p>
              </div>
            </div>

            {/* Incident 2 */}
            <div className="border border-[#262626] rounded-lg p-5 bg-[#141414] space-y-3">
              <div className="flex items-center justify-between border-b border-[#212121] pb-2">
                <span className="text-white font-semibold text-sm">CASE STUDY 2: Insecure Trunk Defaults &amp; Catalyst 9000 Platform Syntax Incompatibility</span>
                <span className="text-xs text-neutral-400 border border-[#2B2B2B] px-2 py-0.5 rounded">Fixed &amp; Hardened</span>
              </div>

              <div className="space-y-2 text-neutral-200 text-sm">
                <p><strong className="text-white">1. Initial Prompt:</strong> &quot;Generate Cisco IOS trunk configuration for the distribution switches.&quot;</p>
                <div className="bg-[#0D0D0D] p-3 rounded-md border border-[#212121] text-neutral-300 font-mono text-xs">
                  <span className="text-neutral-500 block text-xs">// Flawed Implementation:</span>
                  <code>{`interface TenGigabitEthernet1/0/1\n switchport mode trunk\n switchport trunk encapsulation dot1q`}</code>
                </div>
                <p><strong className="text-white">2. Why it seemed reasonable:</strong> In legacy CCNA lab equipment (Catalyst 3560/3750), <code>switchport trunk encapsulation dot1q</code> was required before setting trunk mode.</p>
                <p><strong className="text-white">3. Defect:</strong> Modern Catalyst 9000 switches (9200/9300/9500) use 802.1Q exclusively; the obsolete encapsulation command causes a syntax rejection (% Invalid input). Furthermore, unconstrained trunks default to allowed VLANs 1-4094 and native VLAN 1 untagged, exposing the network to VLAN hopping.</p>
                <p><strong className="text-white">4. Technical Diagnosis:</strong> Enterprise switch trunks must prune all unused VLANs using <code>switchport trunk allowed vlan &lt;list&gt;</code>, isolate untagged frames to quarantine VLAN 999, disable DTP with <code>switchport nonegotiate</code>, and omit obsolete encapsulation commands on Catalyst 9000.</p>
                <div className="bg-[#0D0D0D] p-3 rounded-md border border-[#212121] text-neutral-200 font-mono text-xs">
                  <span className="text-neutral-500 block text-xs">// Corrected Implementation:</span>
                  <code>{`interface TenGigabitEthernet1/0/1\n switchport mode trunk\n switchport trunk native vlan 999\n switchport trunk allowed vlan 10,20,30,40,50,99\n switchport nonegotiate\n spanning-tree guard root`}</code>
                </div>
                <p><strong className="text-white">5. Verification Method:</strong> Verified in Cisco IOS configuration generator unit tests ensuring exact permitted VLAN lists, quarantine native tags, and syntax compatibility are strictly enforced.</p>
              </div>
            </div>
          </div>
        )}

        {activeDoc === 'packet-tracer' && (
          <div className="space-y-6">
            <div className="border-b border-[#212121] pb-3">
              <h2 className="text-lg font-bold text-white">Cisco Packet Tracer Lab Guide</h2>
              <p className="text-neutral-400 text-xs mt-1">Step-by-step instructions to recreate and verify the generated network in Cisco Packet Tracer</p>
            </div>

            <div className="space-y-4 text-sm">
              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">1. Recommended Device Models</h3>
              <ul className="list-disc list-inside space-y-1 text-neutral-200">
                <li><strong>Core / Distribution Switches:</strong> Multilayer Switch 3650-24PS or 3560-24PS (Enable routing with <code>ip routing</code>)</li>
                <li><strong>Access Switches:</strong> Cisco 2960-24TT switches</li>
                <li><strong>Border Router:</strong> Cisco 2911 or 4331 ISR Router</li>
                <li><strong>End Devices:</strong> Standard PC, Server, and Wireless AP PT</li>
              </ul>

              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold pt-2">2. Cabling Instructions</h3>
              <ol className="list-decimal list-inside space-y-1.5 text-neutral-200">
                <li>Connect Access Switch GigabitEthernet ports to Core Switch GigabitEthernet ports using Copper Straight-Through.</li>
                <li>For inter-core switch links, bundle two interfaces into a port-channel (<code>channel-group 1 mode active</code>).</li>
                <li>Connect Core Switch GigabitEthernet to Router GigabitEthernet0/0/0 using a routed link (<code>no switchport</code> with /30 IP).</li>
              </ol>

              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold pt-2">3. Applying Configurations</h3>
              <ol className="list-decimal list-inside space-y-1.5 text-neutral-200">
                <li>Click on the Core Switch in Packet Tracer, navigate to the <strong>CLI</strong> tab.</li>
                <li>Enter privileged exec mode (<code>enable</code>), type <code>configure terminal</code>.</li>
                <li>Copy the generated configuration from NetArchitect&apos;s <strong>Configurations</strong> tab and paste directly into the CLI.</li>
                <li>Repeat for the Access Switch and Router.</li>
              </ol>

              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold pt-2">4. Lab Verification Commands</h3>
              <div className="bg-[#0E0E0E] p-4 rounded-md border border-[#212121] font-mono text-xs space-y-1.5 text-neutral-200">
                <p># Verify VLAN database: <code>show vlan brief</code></p>
                <p># Verify 802.1Q trunking: <code>show interfaces trunk</code></p>
                <p># Verify Rapid-PVST+ root bridge: <code>show spanning-tree vlan 10</code></p>
                <p># Verify OSPF neighbor adjacencies: <code>show ip ospf neighbor</code></p>
                <p># Verify IP routing table: <code>show ip route</code></p>
                <p># Test end-to-end ping from PC to default gateway: <code>ping 10.10.0.1</code></p>
              </div>
            </div>
          </div>
        )}

        {activeDoc === 'deployment' && (
          <div className="space-y-6">
            <div className="border-b border-[#212121] pb-3">
              <h2 className="text-lg font-bold text-white">Vercel Deployment Guide</h2>
              <p className="text-neutral-400 text-xs mt-1">Direct GitHub-to-Vercel deployment</p>
            </div>

            <div className="space-y-4 text-sm">
              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Zero-Config Vercel Compatibility</h3>
              <p className="text-neutral-200 leading-relaxed">
                NetArchitect is designed strictly as a self-contained Next.js application using pure JavaScript algorithms.
                It requires no external databases (PostgreSQL/MongoDB), no Docker, no external Node.js backend, and no paid API keys.
              </p>

              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold pt-2">Steps to Deploy:</h3>
              <ol className="list-decimal list-inside space-y-2 text-neutral-200">
                <li>Push this repository to your GitHub account (<code>git push origin main</code>).</li>
                <li>Sign in to your Vercel Dashboard (https://vercel.com).</li>
                <li>Click <strong>&quot;Add New Project&quot;</strong> and select your <code>NetArchitect</code> repository.</li>
                <li>Framework Preset: Leave as <strong>Next.js</strong>. Build Command: <code>npm run build</code>.</li>
                <li>Environment Variables: None required! Leave empty.</li>
                <li>Click <strong>&quot;Deploy&quot;</strong>. Vercel will build and deploy the production bundle in ~45 seconds.</li>
              </ol>
            </div>
          </div>
        )}

        {activeDoc === 'tests' && (
          <div>
            <TestingView />
          </div>
        )}
      </div>
    </div>
  );
}
