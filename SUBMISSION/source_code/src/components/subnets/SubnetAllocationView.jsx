'use client';

import React, { useState } from 'react';
import { useNetwork } from '@/context/NetworkContext';

export default function SubnetAllocationView() {
  const { planResult } = useNetwork();
  const [selectedSubnet, setSelectedSubnet] = useState(null);

  if (!planResult) {
    return (
      <div className="p-8 text-center text-neutral-400 text-sm">
        No VLSM data available.
      </div>
    );
  }

  const { vlsm } = planResult;
  const subnets = vlsm.allocatedSubnets;
  const summary = vlsm.summary;

  const handleDownloadCsv = () => {
    let csv = 'Name,VLAN,Requested Hosts,CIDR,Network Address,Subnet Mask,Wildcard Mask,First Usable,Last Usable,Broadcast,Default Gateway,Usable Hosts,Utilization %\n';
    subnets.forEach(s => {
      csv += `"${s.name}",${s.vlanId},${s.requestedHosts},"${s.cidr}","${s.networkAddress}","${s.subnetMask}","${s.wildcardMask}","${s.firstUsable}","${s.lastUsable}","${s.broadcastAddress}","${s.defaultGateway}",${s.usableHosts},${s.utilizationPercent}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${planResult.scenario.name.replace(/\s+/g, '_')}_VLSM_Allocations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#212121] pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white">
              VLSM Subnet Allocation Engine
            </h3>
            <span className="text-xs text-neutral-400 bg-[#161616] border border-[#2B2B2B] px-2 py-0.5 rounded font-mono">
              RFC 4632 / CIDR
            </span>
          </div>
          <p className="text-sm text-neutral-300 mt-1">
            Descending host-demand ordering, exact wildcard masks, and non-overlapping subnet boundary verification.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="px-4 py-2 bg-white text-black font-semibold text-xs sm:text-sm rounded-md hover:bg-neutral-200 transition-colors self-start"
        >
          Export CSV Matrix
        </button>
      </div>

      {/* Root Network & Capacity Meter */}
      <div className="border border-[#262626] rounded-lg p-5 bg-[#111111] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
          <div>
            <span className="text-neutral-400">Root Network Block: </span>
            <span className="text-white font-semibold font-mono">{vlsm.rootNetwork}</span>
            <span className="text-neutral-400 font-mono text-xs ml-2">({vlsm.rootNetworkIp} &rarr; {vlsm.rootBroadcastIp})</span>
          </div>
          <div className="text-neutral-300">
            <span>Allocated: </span>
            <span className="text-white font-semibold">{summary.totalAllocatedAddresses}</span>
            <span className="text-neutral-400"> / {vlsm.rootTotalAddresses} total addresses</span>
            <span className="text-white font-semibold ml-2">({summary.overallUtilizationPercent}%)</span>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full bg-[#1A1A1A] rounded-full h-2.5 overflow-hidden border border-[#262626]">
          <div
            className="bg-white h-full transition-all duration-300"
            style={{ width: `${Math.min(100, summary.overallUtilizationPercent)}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-neutral-300 pt-1 gap-2">
          <div>Requested Hosts Sum: <span className="text-white font-semibold">{summary.totalRequestedHosts}</span></div>
          <div>Remaining Free IPs: <span className="text-white font-semibold">{summary.remainingAddresses}</span></div>
          <div>Next Available Subnet: <span className="text-neutral-200 font-mono font-medium">{summary.nextAvailableNetwork}</span></div>
        </div>
      </div>

      {/* Master Subnet Table */}
      <div className="border border-[#262626] rounded-lg bg-[#111111] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#212121] flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-[#141414]">
          <h4 className="text-sm font-semibold text-white">
            Allocated Subnets ({subnets.length} Segments)
          </h4>
          <span className="text-xs text-neutral-400">Click any row to inspect bitwise derivation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#212121] text-neutral-400 bg-[#0E0E0E]">
                <th className="py-3 px-4">Segment / Department</th>
                <th className="py-3 px-3">VLAN</th>
                <th className="py-3 px-3">CIDR Block</th>
                <th className="py-3 px-3">Subnet Mask</th>
                <th className="py-3 px-3">Wildcard Mask</th>
                <th className="py-3 px-3">Usable Host Range</th>
                <th className="py-3 px-3">Broadcast</th>
                <th className="py-3 px-3">Gateway (SVI)</th>
                <th className="py-3 px-3">Req / Cap</th>
                <th className="py-3 px-3">Util</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {subnets.map((sub, idx) => {
                const isSelected = selectedSubnet?.name === sub.name;
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedSubnet(sub)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#1C1C1C]' : 'hover:bg-[#141414]'
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-white">
                      {sub.name}
                    </td>
                    <td className="py-3 px-3 text-neutral-300 font-mono text-xs">VLAN {sub.vlanId}</td>
                    <td className="py-3 px-3 text-white font-mono font-semibold">{sub.cidr}</td>
                    <td className="py-3 px-3 text-neutral-300 font-mono text-xs">{sub.subnetMask}</td>
                    <td className="py-3 px-3 text-neutral-400 font-mono text-xs">{sub.wildcardMask}</td>
                    <td className="py-3 px-3 text-neutral-300 font-mono text-xs">
                      {sub.firstUsable} &ndash; {sub.lastUsable}
                    </td>
                    <td className="py-3 px-3 text-neutral-400 font-mono text-xs">{sub.broadcastAddress}</td>
                    <td className="py-3 px-3 text-white font-mono font-medium">{sub.defaultGateway}</td>
                    <td className="py-3 px-3 text-neutral-300">{sub.requestedHosts} / {sub.usableHosts}</td>
                    <td className="py-3 px-3">
                      <span className="text-white font-semibold">
                        {sub.utilizationPercent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Subnet Math Steps Panel */}
      {selectedSubnet && (
        <div className="border border-[#383838] rounded-lg p-6 bg-[#141414] space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <h4 className="text-sm font-semibold text-white">
              Mathematical Derivation: {selectedSubnet.name} ({selectedSubnet.cidr})
            </h4>
            <button
              onClick={() => setSelectedSubnet(null)}
              className="text-xs text-neutral-300 hover:text-white px-2.5 py-1 bg-[#222222] border border-[#333333] rounded-md font-medium"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-[#0E0E0E] rounded-md p-4 text-sm space-y-2 border border-[#212121]">
              <span className="text-neutral-400 text-xs uppercase font-semibold block">Bitwise Arithmetic Steps:</span>
              <ul className="space-y-2 text-neutral-200">
                {selectedSubnet.mathSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-neutral-500 mt-0.5">&bull;</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0E0E0E] rounded-md p-4 text-sm space-y-2.5 border border-[#212121]">
              <span className="text-neutral-400 text-xs uppercase font-semibold block">Boundary Verification:</span>
              <div className="space-y-2 text-neutral-200">
                <div className="flex justify-between border-b border-[#1C1C1C] pb-1.5">
                  <span className="text-neutral-400">Network ID:</span>
                  <span className="text-white font-mono font-medium">{selectedSubnet.networkAddress}</span>
                </div>
                <div className="flex justify-between border-b border-[#1C1C1C] pb-1.5">
                  <span className="text-neutral-400">Default Gateway (SVI):</span>
                  <span className="text-white font-mono font-medium">{selectedSubnet.defaultGateway}</span>
                </div>
                <div className="flex justify-between border-b border-[#1C1C1C] pb-1.5">
                  <span className="text-neutral-400">Directed Broadcast:</span>
                  <span className="text-white font-mono font-medium">{selectedSubnet.broadcastAddress}</span>
                </div>
                <div className="flex justify-between border-b border-[#1C1C1C] pb-1.5">
                  <span className="text-neutral-400">Total Block Size:</span>
                  <span className="text-white">{selectedSubnet.totalAddresses} Addresses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Usable Hosts:</span>
                  <span className="text-white">{selectedSubnet.usableHosts} IPs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
