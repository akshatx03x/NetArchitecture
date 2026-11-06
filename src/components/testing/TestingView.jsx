'use client';

import React, { useState } from 'react';
import { recommendMedia } from '@/lib/engines/mediaEngine';
import { allocateVlsm, calculateRequiredPrefix } from '@/lib/engines/vlsmEngine';
import { recommendRouting } from '@/lib/engines/routingEngine';
import { campusLANPreset } from '@/lib/presets/campusLAN';
import { metroMANPreset } from '@/lib/presets/metroMAN';
import { globalWANPreset } from '@/lib/presets/globalWAN';
import { planNetwork } from '@/lib/engines/networkEngine';
import { ipv4ToUint32, uint32ToIpv4, prefixToWildcardMask } from '@/lib/utils/ipUtils';
import { PhysicalDistanceViolationError, AddressSpaceExhaustionError } from '@/lib/errors/NetworkErrors';

export default function TestingView() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, durationMs: 0 });

  const runAllTests = () => {
    setIsRunning(true);
    const start = performance.now();
    const results = [];

    const assert = (name, category, testFn) => {
      try {
        testFn();
        results.push({ name, category, passed: true, error: null });
      } catch (err) {
        results.push({ name, category, passed: false, error: err.message });
      }
    };

    // 1. PHYSICAL MEDIA TESTS
    assert('Cat6a Copper recommended for exactly 100m', 'Physical Media', () => {
      const res = recommendMedia(100);
      if (!res.mediaType.includes('Category 6A') || !res.transceiver.includes('10GBASE-T')) {
        throw new Error(`Expected Cat6a / 10GBASE-T, got: ${res.mediaType}`);
      }
    });

    assert('OM4 Multimode Fiber recommended for 101m', 'Physical Media', () => {
      const res = recommendMedia(101);
      if (!res.mediaType.includes('OM4') || !res.transceiver.includes('10GBASE-SR')) {
        throw new Error(`Expected OM4 MMF / 10GBASE-SR, got: ${res.mediaType}`);
      }
    });

    assert('OM4 Multimode Fiber recommended for exactly 400m with power budget', 'Physical Media', () => {
      const res = recommendMedia(400);
      if (!res.mediaType.includes('OM4') || !res.opticalBudget) {
        throw new Error('Expected OM4 with optical budget');
      }
    });

    assert('OS2 Single-Mode Fiber recommended for 401m', 'Physical Media', () => {
      const res = recommendMedia(401);
      if (!res.mediaType.includes('OS2') || !res.transceiver.includes('10GBASE-LR')) {
        throw new Error(`Expected OS2 SMF / 10GBASE-LR, got: ${res.mediaType}`);
      }
    });

    assert('OS2 Single-Mode Fiber 10GBASE-ER for 25km (Metro MAN)', 'Physical Media', () => {
      const res = recommendMedia(25000);
      if (!res.transceiver.includes('10GBASE-ER')) {
        throw new Error(`Expected 10GBASE-ER, got: ${res.transceiver}`);
      }
    });

    assert('PhysicalDistanceViolationError thrown when copper requested above 100m', 'Physical Media', () => {
      let threw = false;
      try {
        recommendMedia(150, { forceCopper: true });
      } catch (e) {
        if (e instanceof PhysicalDistanceViolationError || e.name === 'PhysicalDistanceViolationError') {
          threw = true;
        }
      }
      if (!threw) throw new Error('Failed to reject copper above 100m channel reach');
    });

    // 2. VLSM ALGORITHM & IP UTILS TESTS
    assert('Uint32 conversion correctly preserves 255.255.255.255 without signed wrap', 'VLSM & IP Utils', () => {
      const num = ipv4ToUint32('255.255.255.255');
      if (num !== 4294967295) throw new Error(`Expected 4294967295, got ${num}`);
      const ip = uint32ToIpv4(num);
      if (ip !== '255.255.255.255') throw new Error(`Expected 255.255.255.255, got ${ip}`);
    });

    assert('Wildcard mask calculation exact for /24, /27, /30', 'VLSM & IP Utils', () => {
      if (prefixToWildcardMask(24) !== '0.0.0.255') throw new Error('Failed /24 wildcard');
      if (prefixToWildcardMask(27) !== '0.0.0.31') throw new Error('Failed /27 wildcard');
      if (prefixToWildcardMask(30) !== '0.0.0.3') throw new Error('Failed /30 wildcard');
    });

    assert('Prefix calculation strictly accounts for 2 reserved addresses (Network & Broadcast)', 'VLSM & IP Utils', () => {
      if (calculateRequiredPrefix(60) !== 26) throw new Error('60 hosts should require /26 (62 usable)');
      if (calculateRequiredPrefix(62) !== 26) throw new Error('62 hosts should require /26 (62 usable)');
      if (calculateRequiredPrefix(63) !== 25) throw new Error('63 hosts should require /25 (126 usable)');
    });

    assert('Campus LAN 10.10.0.0/20 allocates all 6 subnets without overlapping', 'VLSM & IP Utils', () => {
      const result = allocateVlsm('10.10.0.0/20', campusLANPreset.departments);
      if (result.allocatedSubnets.length !== 6) throw new Error('Did not allocate 6 subnets');

      for (let i = 0; i < result.allocatedSubnets.length; i++) {
        for (let j = i + 1; j < result.allocatedSubnets.length; j++) {
          const a = result.allocatedSubnets[i];
          const b = result.allocatedSubnets[j];
          if (!(a.lastUint < b.firstUint || a.firstUint > b.lastUint)) {
            throw new Error(`Overlap between ${a.name} and ${b.name}`);
          }
        }
      }
    });

    assert('AddressSpaceExhaustionError thrown when host demand exceeds root capacity', 'VLSM & IP Utils', () => {
      let threw = false;
      try {
        allocateVlsm('192.168.1.0/28', [{ name: 'Massive Department', hosts: 500, vlanId: 10 }]);
      } catch (e) {
        if (e instanceof AddressSpaceExhaustionError || e.name === 'AddressSpaceExhaustionError') {
          threw = true;
        }
      }
      if (!threw) throw new Error('Failed to raise AddressSpaceExhaustionError');
    });

    // 3. ROUTING PROTOCOL ENGINE TESTS
    assert('Single-Site <50 subnets selects OSPF Single Area 0', 'Routing Engine', () => {
      const res = recommendRouting({ sitesCount: 1, departmentsCount: 6, cloudIntegration: false });
      if (!res.protocol.includes('OSPF') || !res.architecture.includes('Single Area')) {
        throw new Error(`Expected OSPF Single Area, got: ${res.protocol} / ${res.architecture}`);
      }
    });

    assert('Multi-Site or Large Subnet Scale selects Multi-Area OSPF', 'Routing Engine', () => {
      const res = recommendRouting({ sitesCount: 3, departmentsCount: 8, cloudIntegration: false });
      if (!res.architecture.includes('Multi-Area')) {
        throw new Error(`Expected Multi-Area OSPF, got: ${res.architecture}`);
      }
    });

    assert('Cloud Integration or External AS selects BGP + OSPF Hybrid', 'Routing Engine', () => {
      const res = recommendRouting({ sitesCount: 4, departmentsCount: 6, cloudIntegration: true });
      if (!res.protocol.includes('BGP') || !res.protocol.includes('OSPF')) {
        throw new Error(`Expected Hybrid BGP + OSPF, got: ${res.protocol}`);
      }
    });

    // 4. CISCO IOS CONFIGURATION TESTS
    assert('Generated Core Switch contains valid VLAN database and SVIs', 'Cisco Configurations', () => {
      const plan = planNetwork(campusLANPreset);
      const coreCfg = plan.configurations.coreSwitch.content;
      if (!coreCfg.includes('vlan 10') || !coreCfg.includes('interface Vlan10')) {
        throw new Error('Core Switch missing VLAN 10 definition or SVI');
      }
      if (!coreCfg.includes('ip routing')) {
        throw new Error('Core Switch missing "ip routing" global command');
      }
    });

    assert('Access Switch implements PortFast and BPDU Guard on host access ports', 'Cisco Configurations', () => {
      const plan = planNetwork(campusLANPreset);
      const accCfg = plan.configurations.accessSwitch.content;
      if (!accCfg.includes('spanning-tree portfast') || !accCfg.includes('spanning-tree bpduguard enable')) {
        throw new Error('Access Switch missing Spanning-Tree PortFast or BPDU Guard');
      }
    });

    assert('Trunk configurations prune allowed VLANs and avoid obsolete encapsulation commands', 'Cisco Configurations', () => {
      const plan = planNetwork(campusLANPreset);
      const coreCfg = plan.configurations.coreSwitch.content;
      if (coreCfg.includes('switchport trunk encapsulation dot1q')) {
        throw new Error('Found obsolete switchport trunk encapsulation dot1q command rejected by Catalyst 9000');
      }
      if (!coreCfg.includes('switchport trunk allowed vlan')) {
        throw new Error('Trunk missing explicit allowed VLAN pruning list');
      }
    });

    // 5. PRESET SCENARIOS E2E VALIDATION
    assert('Campus LAN preset executes end-to-end plan cleanly', 'E2E Presets', () => {
      const plan = planNetwork(campusLANPreset);
      if (!plan || !plan.vlsm || !plan.configurations || !plan.explanations) {
        throw new Error('Campus LAN failed complete synthesis');
      }
    });

    assert('Metro MAN preset executes end-to-end plan cleanly', 'E2E Presets', () => {
      const plan = planNetwork(metroMANPreset);
      if (plan.media.transceiver !== '10GBASE-ER' || !plan.media.propagationLatencyMs) {
        throw new Error('Metro MAN missing 10GBASE-ER or propagation latency metric');
      }
    });

    assert('Global WAN preset executes end-to-end plan cleanly with BGP', 'E2E Presets', () => {
      const plan = planNetwork(globalWANPreset);
      if (!plan.routing.protocol.includes('BGP') || !plan.configurations.edgeRouter.content.includes('router bgp')) {
        throw new Error('Global WAN missing BGP configuration block');
      }
    });

    const end = performance.now();
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    setTestResults(results);
    setStats({
      total: results.length,
      passed,
      failed,
      durationMs: Math.round(end - start)
    });
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Test Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-[#262626] rounded-lg p-5 bg-[#111111] gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">
            In-Browser Engineering Test Suite
          </h3>
          <p className="text-sm text-neutral-300 mt-1">
            20+ unit and integration tests executing real networking algorithms inside the browser.
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-md hover:bg-neutral-200 transition-colors disabled:opacity-40 self-start sm:self-auto"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {/* Summary Scoreboard */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="border border-[#262626] rounded-lg p-4 bg-[#111111]">
            <span className="text-neutral-400 text-xs uppercase font-medium block">Total Assertions</span>
            <span className="text-lg font-bold text-white">{stats.total}</span>
          </div>
          <div className="border border-[#262626] rounded-lg p-4 bg-[#111111]">
            <span className="text-neutral-400 text-xs uppercase font-medium block">Passed</span>
            <span className="text-lg font-bold text-white">{stats.passed}</span>
          </div>
          <div className="border border-[#262626] rounded-lg p-4 bg-[#111111]">
            <span className="text-neutral-400 text-xs uppercase font-medium block">Failed</span>
            <span className="text-lg font-bold text-white">{stats.failed}</span>
          </div>
          <div className="border border-[#262626] rounded-lg p-4 bg-[#111111]">
            <span className="text-neutral-400 text-xs uppercase font-medium block">Execution Time</span>
            <span className="text-lg font-bold text-white">{stats.durationMs} ms</span>
          </div>
        </div>
      )}

      {/* Test Results Table */}
      {testResults.length > 0 ? (
        <div className="border border-[#262626] rounded-lg bg-[#111111] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#212121] text-neutral-400 bg-[#0E0E0E]">
                <th className="py-3 px-4 w-24 font-semibold">Status</th>
                <th className="py-3 px-3.5 w-44 font-semibold">Category</th>
                <th className="py-3 px-3.5 font-semibold">Test Specification</th>
                <th className="py-3 px-3.5 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {testResults.map((t, idx) => (
                <tr key={idx} className="hover:bg-[#141414]">
                  <td className="py-3 px-4 font-bold text-xs">
                    {t.passed ? (
                      <span className="text-white bg-[#1E1E1E] border border-[#333333] px-2 py-0.5 rounded">PASS</span>
                    ) : (
                      <span className="text-red-400 bg-red-950/40 border border-red-800 px-2 py-0.5 rounded">FAIL</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-neutral-300 font-medium">{t.category}</td>
                  <td className="py-3 px-3.5 text-white">{t.name}</td>
                  <td className="py-3 px-3.5 text-neutral-400 text-xs">
                    {t.error ? <span className="text-red-300">{t.error}</span> : 'Clean exit'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-[#262626] rounded-lg p-8 bg-[#111111] text-center text-sm text-neutral-400">
          Click &quot;Run All Tests&quot; above to execute the in-browser unit and integration test suite.
        </div>
      )}
    </div>
  );
}
