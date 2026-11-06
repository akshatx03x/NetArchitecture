'use client';

import React from 'react';
import { useNetwork } from '@/context/NetworkContext';

export default function ArchitectureDashboardView({ onTabChange }) {
  const { planResult, activeScenario, setActiveTab } = useNetwork();

  const handleNav = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setActiveTab(tab);
    }
  };

  if (!planResult) {
    return (
      <div className="p-8 text-center text-neutral-400 text-sm">
        No active plan calculated. Please select or run a network scenario.
      </div>
    );
  }

  const { media, routing, topology, vlsm, configurations, explanations } = planResult;

  return (
    <div className="space-y-6">
      {/* Top Level Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="border border-[#262626] rounded-lg p-4 bg-[#111111] space-y-1">
          <span className="text-xs text-neutral-400 uppercase font-semibold block">Architecture</span>
          <span className="text-sm font-semibold text-white block truncate" title={topology.topologyTier}>
            {topology.topologyTier.split('(')[0]}
          </span>
        </div>

        <div className="border border-[#262626] rounded-lg p-4 bg-[#111111] space-y-1">
          <span className="text-xs text-neutral-400 uppercase font-semibold block">Media Selected</span>
          <span className="text-sm font-semibold text-white block truncate" title={media.mediaType}>
            {media.mediaType.split('(')[0]}
          </span>
        </div>

        <div className="border border-[#262626] rounded-lg p-4 bg-[#111111] space-y-1">
          <span className="text-xs text-neutral-400 uppercase font-semibold block">Routing Protocol</span>
          <span className="text-sm font-semibold text-white block truncate" title={routing.protocol}>
            {routing.protocol.split('(')[0]}
          </span>
        </div>

        <div className="border border-[#262626] rounded-lg p-4 bg-[#111111] space-y-1">
          <span className="text-xs text-neutral-400 uppercase font-semibold block">Subnets</span>
          <span className="text-sm font-semibold text-white block">
            {vlsm.allocatedSubnets.length} Segments
          </span>
        </div>

        <div className="border border-[#262626] rounded-lg p-4 bg-[#111111] space-y-1">
          <span className="text-xs text-neutral-400 uppercase font-semibold block">Allocated Scope</span>
          <span className="text-sm font-semibold text-white block font-mono">
            {vlsm.summary.totalAllocatedAddresses} / {vlsm.rootTotalAddresses} IPs
          </span>
        </div>

        <div className="border border-[#262626] rounded-lg p-4 bg-[#111111] space-y-1">
          <span className="text-xs text-neutral-400 uppercase font-semibold block">Root Utilization</span>
          <span className="text-sm font-semibold text-white block">
            {vlsm.summary.overallUtilizationPercent}%
          </span>
        </div>
      </div>

      {/* Grid: Physical Media & Routing Engine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Physical Media Card */}
        <div className="border border-[#262626] rounded-lg p-6 bg-[#111111] space-y-4">
          <div className="flex items-center justify-between border-b border-[#212121] pb-3">
            <div>
              <h3 className="text-sm uppercase tracking-wider text-neutral-300 font-semibold">
                Physical Media &amp; Transceiver Selection
              </h3>
              <p className="text-xs text-neutral-400">Boundary distance rule evaluation</p>
            </div>
            <span className="text-xs text-white bg-[#1A1A1A] border border-[#2E2E2E] px-2.5 py-1 rounded font-mono">
              {media.distanceDisplay}
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 bg-[#161616] p-4 rounded-lg border border-[#242424]">
              <div>
                <span className="text-neutral-400 block text-xs font-medium">Selected Medium</span>
                <span className="text-white font-semibold text-sm">{media.mediaType}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-xs font-medium">Optical Interface</span>
                <span className="text-white font-semibold text-sm font-mono">{media.transceiver}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-xs font-medium">Relevant Standard</span>
                <span className="text-neutral-300 text-sm">{media.standard}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-xs font-medium">Wavelength / PHY</span>
                <span className="text-neutral-300 text-sm">{media.wavelength}</span>
              </div>
            </div>

            <p className="text-neutral-300 leading-relaxed text-sm">
              {media.technicalReason}
            </p>

            {media.opticalBudget && (
              <div className="bg-[#161616] p-4 rounded-lg border border-[#242424] space-y-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-300 block">
                  Calculated Optical Power Budget:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-neutral-300">
                  {media.opticalBudget.totalBudgetDb && (
                    <div>Total Budget: <span className="text-white font-semibold">{media.opticalBudget.totalBudgetDb} dB</span></div>
                  )}
                  {media.opticalBudget.totalPowerBudgetDb && (
                    <div>Total Budget: <span className="text-white font-semibold">{media.opticalBudget.totalPowerBudgetDb} dB</span></div>
                  )}
                  {media.opticalBudget.txPowerMinDbm !== undefined && (
                    <div>Min Tx Power: <span className="text-white font-semibold">{media.opticalBudget.txPowerMinDbm} dBm</span></div>
                  )}
                  {media.opticalBudget.rxSensitivityDbm !== undefined && (
                    <div>Rx Sensitivity: <span className="text-white font-semibold">{media.opticalBudget.rxSensitivityDbm} dBm</span></div>
                  )}
                  {media.opticalBudget.marginSafetyDb !== undefined && (
                    <div>Safety Margin: <span className="text-white font-semibold">+{media.opticalBudget.marginSafetyDb} dB</span></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Routing Protocol Decision Card */}
        <div className="border border-[#262626] rounded-lg p-6 bg-[#111111] space-y-4">
          <div className="flex items-center justify-between border-b border-[#212121] pb-3">
            <div>
              <h3 className="text-sm uppercase tracking-wider text-neutral-300 font-semibold">
                Routing Architecture Engine
              </h3>
              <p className="text-xs text-neutral-400">Convergence, summarization &amp; AS boundary</p>
            </div>
            <span className="text-xs text-white bg-[#1A1A1A] border border-[#2E2E2E] px-2.5 py-1 rounded font-mono">
              {routing.architecture.split('-')[0]}
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div className="bg-[#161616] p-4 rounded-lg border border-[#242424] space-y-2">
              <div>
                <span className="text-neutral-400 block text-xs font-medium">Selected Protocol</span>
                <span className="text-white font-semibold text-sm">{routing.protocol}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-xs font-medium">Applicable RFC Standards</span>
                <span className="text-neutral-300 text-sm font-mono">{routing.rfcReferences.join(' | ')}</span>
              </div>
            </div>

            <p className="text-neutral-300 leading-relaxed text-sm">
              {routing.technicalExplanation}
            </p>

            <div className="bg-[#161616] p-4 rounded-lg border border-[#242424] space-y-1.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-300 block">
                Route Summarization &amp; Convergence:
              </span>
              <p className="text-neutral-300 text-sm leading-relaxed">
                {routing.summarizationPlan}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Component Estimates */}
      <div className="border border-[#262626] rounded-lg p-6 bg-[#111111] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#212121] pb-3 gap-2">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-neutral-300 font-semibold">
              Hardware Component Estimation
            </h3>
            <p className="text-xs text-neutral-400">Recommended equipment quantities for {activeScenario.endpoints} endpoints</p>
          </div>
          <button
            onClick={() => handleNav('topology')}
            className="text-sm text-white hover:underline font-medium flex items-center space-x-1"
          >
            <span>View Interactive Topology &rarr;</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
          {Object.entries(topology.deviceEstimates).map(([key, count]) => (
            <div key={key} className="border border-[#212121] bg-[#161616] rounded-md p-3.5 space-y-1">
              <span className="text-xs text-neutral-400 uppercase font-medium block truncate">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <span className="text-xl font-bold text-white block">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Subnet Quick Table */}
      <div className="border border-[#262626] rounded-lg p-6 bg-[#111111] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#212121] pb-3 gap-2">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-neutral-300 font-semibold">
              Subnet Allocation Summary
            </h3>
            <p className="text-xs text-neutral-400">Root prefix: <span className="font-mono text-neutral-200">{vlsm.rootNetwork}</span> ({vlsm.rootTotalAddresses} addresses)</p>
          </div>
          <button
            onClick={() => handleNav('subnets')}
            className="text-sm text-white hover:underline font-medium flex items-center space-x-1"
          >
            <span>Full VLSM Math Matrix &rarr;</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#212121] text-neutral-400">
                <th className="pb-2.5">VLAN</th>
                <th className="pb-2.5">Department Name</th>
                <th className="pb-2.5">Allocated CIDR</th>
                <th className="pb-2.5">Subnet Mask</th>
                <th className="pb-2.5">Default Gateway</th>
                <th className="pb-2.5">Hosts (Req / Usable)</th>
                <th className="pb-2.5">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {vlsm.allocatedSubnets.map((sub, i) => (
                <tr key={i} className="hover:bg-[#151515]">
                  <td className="py-2.5 text-white font-mono font-medium">VLAN {sub.vlanId}</td>
                  <td className="py-2.5 text-neutral-200">{sub.name}</td>
                  <td className="py-2.5 text-white font-mono font-semibold">{sub.cidr}</td>
                  <td className="py-2.5 text-neutral-300 font-mono">{sub.subnetMask}</td>
                  <td className="py-2.5 text-neutral-300 font-mono">{sub.defaultGateway}</td>
                  <td className="py-2.5 text-neutral-300">{sub.requestedHosts} / {sub.usableHosts}</td>
                  <td className="py-2.5 text-white font-medium">{sub.utilizationPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
