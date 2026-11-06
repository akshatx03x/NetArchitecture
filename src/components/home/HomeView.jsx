'use client';

import React from 'react';
import { useNetwork } from '@/context/NetworkContext';

export default function HomeView() {
  const { selectPreset, setActiveTab, activeScenario, planResult } = useNetwork();

  const scenarios = [
    {
      id: 'campus-lan',
      title: 'Campus LAN',
      scale: '3 Buildings · 1,600 Endpoints · 350m',
      summary: 'Hierarchical campus network with Cat6a horizontal runs, OM4 multimode fiber backbone, RSTP switching, and single-area OSPF routing.',
      rootCidr: '10.10.0.0/20'
    },
    {
      id: 'metro-man',
      title: 'Metro MAN',
      scale: '3 Sites · 450 Endpoints · 28 km',
      summary: 'Metropolitan network connecting financial HQ to two remote offices over OS2 single-mode fiber with 10GBASE-ER and dual-homed failover.',
      rootCidr: '172.20.0.0/21'
    },
    {
      id: 'global-wan',
      title: 'Global WAN',
      scale: '4 Cities + Cloud VPC · 2,000 IoT Devices',
      summary: 'Multi-site enterprise WAN with Cloud VPC interconnect, IPsec AES-256 encrypted tunnels, and hybrid multi-area OSPF and eBGP routing.',
      rootCidr: '10.100.0.0/19'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      {/* Intro Header */}
      <section className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          NetArchitect
        </h1>
        <p className="text-base sm:text-lg text-neutral-300 max-w-3xl leading-relaxed">
          An algorithmic network planning and configuration engine. Input your physical constraints,
          scale, and department host sizing to generate mathematically verified VLSM subnets, transmission
          media specifications, dynamic routing designs, and production-ready Cisco configurations.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-3">
          <button
            onClick={() => setActiveTab('builder')}
            className="px-7 py-3.5 bg-white text-black font-bold text-base rounded-md hover:bg-neutral-100 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0A0A0A] flex items-center space-x-2 cursor-pointer"
          >
            <span>Create Custom Network</span>
            <span className="text-base font-bold">&rarr;</span>
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className="px-5 py-3.5 bg-[#161616] text-neutral-200 border border-[#2B2B2B] text-sm font-medium rounded-md hover:text-white hover:bg-[#202020] transition-colors"
          >
            Select Predefined Scenario
          </button>
          {planResult && (
            <button
              onClick={() => setActiveTab('results')}
              className="px-5 py-3.5 bg-[#121212] text-neutral-300 border border-[#262626] text-sm font-medium rounded-md hover:text-white hover:bg-[#1A1A1A] transition-colors"
            >
              View Active Design ({activeScenario.name})
            </button>
          )}
        </div>
      </section>

      {/* Engineering Workflow */}
      <section className="space-y-4 border-t border-[#212121] pt-8">
        <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-neutral-300">
          <div className="space-y-2 border-l border-[#2B2B2B] pl-4">
            <span className="text-white font-semibold block text-base">1. Define Requirements</span>
            <p className="text-neutral-400 leading-relaxed text-sm">
              Select one of the 3 academic scenarios or enter custom sites, building separation, endpoints, and department host counts.
            </p>
          </div>
          <div className="space-y-2 border-l border-[#2B2B2B] pl-4">
            <span className="text-white font-semibold block text-base">2. Synthesize Design</span>
            <p className="text-neutral-400 leading-relaxed text-sm">
              Deterministic engines compute non-overlapping VLSM subnets, select optimal transceivers, and evaluate routing domains.
            </p>
          </div>
          <div className="space-y-2 border-l border-[#2B2B2B] pl-4">
            <span className="text-white font-semibold block text-base">3. Export Configurations</span>
            <p className="text-neutral-400 leading-relaxed text-sm">
              Review topology, inspect decision logs, and download deployable Cisco IOS-XE configuration scripts and CSV matrices.
            </p>
          </div>
        </div>
      </section>

      {/* Scenarios Overview */}
      <section className="space-y-6 border-t border-[#212121] pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
            Included Scenarios
          </h2>
          <button
            onClick={() => setActiveTab('scenarios')}
            className="text-sm text-white hover:underline font-medium"
          >
            View All Scenarios &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {scenarios.map((item) => (
            <div
              key={item.id}
              className="border border-[#262626] rounded-lg p-5 bg-[#121212] space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-xs text-neutral-400 font-mono bg-[#1A1A1A] border border-[#2B2B2B] px-2 py-0.5 rounded">
                  {item.rootCidr}
                </span>
                <h3 className="text-base font-semibold text-white pt-1">{item.title}</h3>
                <p className="text-xs text-neutral-400 font-medium">{item.scale}</p>
                <p className="text-xs text-neutral-300 leading-relaxed pt-1">
                  {item.summary}
                </p>
              </div>

              <button
                onClick={() => {
                  selectPreset(item.id);
                  setActiveTab('results');
                }}
                className="w-full mt-3 py-2 bg-[#1C1C1C] hover:bg-white hover:text-black text-neutral-200 border border-[#2E2E2E] text-xs font-semibold rounded-md transition-colors text-center"
              >
                Load Scenario &rarr;
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
