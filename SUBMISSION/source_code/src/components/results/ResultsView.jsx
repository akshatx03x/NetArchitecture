'use client';

import React, { useState } from 'react';
import { useNetwork } from '@/context/NetworkContext';
import ArchitectureDashboardView from '@/components/dashboard/ArchitectureDashboardView';
import SubnetAllocationView from '@/components/subnets/SubnetAllocationView';
import TopologyView from '@/components/topology/TopologyView';
import DecisionsView from '@/components/decisions/DecisionsView';
import { downloadConfigurationsZip } from '@/lib/utils/exportUtils';

export default function ResultsView() {
  const { planResult, activeScenario, setActiveTab } = useNetwork();
  const [subTab, setSubTab] = useState('overview'); // overview, subnets, topology, decisions

  if (!planResult) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-semibold text-white">No Active Network Plan</h2>
        <p className="text-sm text-neutral-400">
          Please select a scenario or configure your custom network parameters in the builder.
        </p>
        <button
          onClick={() => setActiveTab('scenarios')}
          className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-md hover:bg-neutral-200 transition-colors"
        >
          Select a Scenario
        </button>
      </div>
    );
  }

  const subTabs = [
    { id: 'overview', label: 'Architecture & Media' },
    { id: 'subnets', label: 'Subnet Allocation (VLSM)' },
    { id: 'topology', label: 'Network Topology' },
    { id: 'decisions', label: 'Decision Explanations (25 Marks)' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#212121] pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Network Results
            </h1>
            <span className="text-xs text-neutral-300 bg-[#161616] border border-[#2B2B2B] px-2.5 py-0.5 rounded font-medium">
              {activeScenario.name}
            </span>
          </div>
          <p className="text-sm sm:text-base text-neutral-300 mt-1 max-w-2xl leading-relaxed">
            Algorithmic outputs: Physical media specifications, VLSM bitwise addressing, topological interconnects, and self-explaining architecture records.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => setActiveTab('configs')}
            className="px-4 py-2 bg-white text-black font-semibold text-xs sm:text-sm rounded-md hover:bg-neutral-200 transition-colors"
          >
            View Cisco Configs &rarr;
          </button>
          <button
            onClick={() => downloadConfigurationsZip(planResult)}
            className="px-4 py-2 bg-[#1C1C1C] text-neutral-200 border border-[#2E2E2E] text-xs sm:text-sm font-medium rounded-md hover:text-white hover:bg-[#252525] transition-colors"
          >
            Export ZIP
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex space-x-2 border-b border-[#212121] pb-2 overflow-x-auto">
        {subTabs.map((item) => {
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Content */}
      <div className="pt-2">
        {subTab === 'overview' && (
          <ArchitectureDashboardView onTabChange={(tab) => setSubTab(tab)} />
        )}
        {subTab === 'subnets' && <SubnetAllocationView />}
        {subTab === 'topology' && <TopologyView />}
        {subTab === 'decisions' && <DecisionsView />}
      </div>
    </div>
  );
}
