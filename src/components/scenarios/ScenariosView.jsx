'use client';

import React from 'react';
import { useNetwork } from '@/context/NetworkContext';
import { campusLANPreset } from '@/lib/presets/campusLAN';
import { metroMANPreset } from '@/lib/presets/metroMAN';
import { globalWANPreset } from '@/lib/presets/globalWAN';

export default function ScenariosView() {
  const { activeScenarioId, selectPreset, setActiveTab } = useNetwork();

  const presets = [
    {
      preset: campusLANPreset,
      tag: 'Profile 1',
      highlights: [
        '3 Buildings · 1,600 Endpoints · 350m Separation',
        'OM4 Multimode Fiber Backbone & Cat6a Horizontal Drops',
        'Cisco Rapid PVST+ (802.1w) Core-Access Spanning Tree',
        'Single-Area OSPF (Area 0) with passive-interface defaults'
      ]
    },
    {
      preset: metroMANPreset,
      tag: 'Profile 2',
      highlights: [
        '3 Inter-city Sites · 450 Endpoints · 28 km Distance',
        'OS2 Single-Mode Fiber with 10GBASE-ER 1550nm Transceivers',
        'Calculated 0.14 ms One-Way Optical Propagation Latency',
        'Dual-Homed Failover Ring with sub-50ms Convergence'
      ]
    },
    {
      preset: globalWANPreset,
      tag: 'Profile 3',
      highlights: [
        '4 Regional Hubs + AWS Cloud VPC · 2,000 IoT Devices',
        'IPsec Site-to-Site Encrypted Tunnels (AES-256-GCM / SHA-384)',
        'Hybrid Routing: Multi-Area OSPF (Core) + eBGP (Edge/Cloud)',
        'Hierarchical VLSM allocation with 8,192 address capacity'
      ]
    }
  ];

  const handleSelectAndRun = (id) => {
    selectPreset(id);
    setActiveTab('results');
  };

  const handleSelectAndCustomize = (id) => {
    selectPreset(id);
    setActiveTab('builder');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Network Scenarios
        </h1>
        <p className="text-sm sm:text-base text-neutral-300 mt-2 max-w-3xl leading-relaxed">
          Three pre-engineered enterprise topologies representing distinct geographical scopes, physical media constraints, and routing complexities.
        </p>
      </div>

      {/* Preset Cards Grid */}
      <div className="space-y-6">
        {presets.map(({ preset, tag, highlights }) => {
          const isActive = activeScenarioId === preset.id;
          const totalRequestedHosts = preset.departments.reduce((sum, d) => sum + d.hosts, 0);

          return (
            <div
              key={preset.id}
              className={`border rounded-lg p-6 bg-[#111111] transition-colors ${
                isActive ? 'border-white/60' : 'border-[#262626] hover:border-[#3A3A3A]'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212121] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs text-neutral-400 bg-[#1A1A1A] border border-[#2B2B2B] px-2 py-0.5 rounded font-mono">
                      {tag}
                    </span>
                    <h2 className="text-lg font-semibold text-white">{preset.name}</h2>
                    {isActive && (
                      <span className="text-xs text-white bg-neutral-800 border border-neutral-600 px-2 py-0.5 rounded font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed max-w-3xl">
                    {preset.description}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleSelectAndRun(preset.id)}
                    className="px-4 py-2 bg-white text-black font-semibold text-xs sm:text-sm rounded-md hover:bg-neutral-200 transition-colors"
                  >
                    Load & View Results
                  </button>
                  <button
                    onClick={() => handleSelectAndCustomize(preset.id)}
                    className="px-4 py-2 bg-[#1C1C1C] text-neutral-200 border border-[#2E2E2E] text-xs sm:text-sm font-medium rounded-md hover:text-white hover:bg-[#252525] transition-colors"
                  >
                    Customize
                  </button>
                </div>
              </div>

              {/* Specs & Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                {/* Parameters Table */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3">
                    Technical Parameters
                  </h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-[#1F1F1F]">
                      <tr>
                        <td className="py-1.5 text-neutral-400">Root CIDR Block</td>
                        <td className="py-1.5 text-right text-white font-mono font-medium">{preset.rootCidr}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-neutral-400">Total Host Demand</td>
                        <td className="py-1.5 text-right text-white">{totalRequestedHosts} endpoints</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-neutral-400">Separation Distance</td>
                        <td className="py-1.5 text-right text-white">
                          {preset.distanceMeters >= 1000
                            ? `${preset.distanceMeters / 1000} km`
                            : `${preset.distanceMeters} m`}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-neutral-400">Physical Topology</td>
                        <td className="py-1.5 text-right text-white">
                          {preset.sitesCount > 1 ? `${preset.sitesCount} Sites / ${preset.buildingsCount} Buildings` : `${preset.buildingsCount} Campus Buildings`}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-neutral-400">Target Bandwidth</td>
                        <td className="py-1.5 text-right text-white">{preset.requestedBandwidth}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-neutral-400">Cloud VPC Uplink</td>
                        <td className="py-1.5 text-right text-white">{preset.cloudIntegration ? 'Yes (eBGP AS 64512)' : 'No (Local Gateway)'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Engineering Highlights */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3">
                    Key Architectural Decisions
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-300">
                    {highlights.map((h, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-neutral-500 mt-1">&bull;</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Subnet Departments Mini List */}
                  <div className="mt-4 pt-3 border-t border-[#1F1F1F]">
                    <div className="text-xs text-neutral-400 font-medium mb-2">
                      Configured Subnets ({preset.departments.length} segments):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preset.departments.map((d) => (
                        <span
                          key={d.vlanId}
                          className="text-xs bg-[#181818] border border-[#292929] px-2.5 py-1 rounded-md text-neutral-200"
                        >
                          <span className="text-neutral-400 font-mono">VLAN {d.vlanId}:</span> {d.name} ({d.hosts})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
