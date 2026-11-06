'use client';

import React from 'react';
import { NetworkProvider, useNetwork } from '@/context/NetworkContext';
import Navbar from '@/components/layout/Navbar';
import HomeView from '@/components/home/HomeView';
import ScenariosView from '@/components/scenarios/ScenariosView';
import CustomBuilderView from '@/components/builder/CustomBuilderView';
import ResultsView from '@/components/results/ResultsView';
import ConfigurationCenterView from '@/components/configs/ConfigurationCenterView';
import DocumentationView from '@/components/docs/DocumentationView';

function MainApp() {
  const { activeTab } = useNetwork();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Simplified 5 Section Structure + Docs */}
        {(activeTab === 'home' || activeTab === 'overview') && <HomeView />}
        {activeTab === 'scenarios' && <ScenariosView />}
        {activeTab === 'builder' && <CustomBuilderView />}
        {(activeTab === 'results' ||
          activeTab === 'dashboard' ||
          activeTab === 'subnets' ||
          activeTab === 'topology' ||
          activeTab === 'decisions') && <ResultsView />}
        {activeTab === 'configs' && <ConfigurationCenterView />}
        {(activeTab === 'docs' || activeTab === 'testing') && <DocumentationView />}
      </main>

      <footer className="border-t border-[#1C1C1C] bg-[#0A0A0A] py-6 text-xs text-neutral-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-neutral-300">NetArchitect</span>
            <span>&bull;</span>
            <span>CIC-307 Computer Networks Mini-Project</span>
          </div>
          <div>
            <span>Vercel Deployable &bull; Pure JavaScript &bull; Deterministic Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <NetworkProvider>
      <MainApp />
    </NetworkProvider>
  );
}
