'use client';

import React from 'react';
import { useNetwork } from '@/context/NetworkContext';
import { downloadConfigurationsZip } from '@/lib/utils/exportUtils';

export default function Navbar() {
  const {
    activeTab,
    setActiveTab,
    planResult
  } = useNetwork();

  const handleDownloadZip = async () => {
    if (planResult) {
      await downloadConfigurationsZip(planResult);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'scenarios', label: 'Network Scenarios' },
    { id: 'builder', label: 'Network Builder' },
    { id: 'results', label: 'Network Results' },
    { id: 'configs', label: 'Configurations' },
    { id: 'docs', label: 'Validation & Docs' }
  ];

  return (
    <header className="border-b border-[#262626] bg-[#0A0A0A] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('home')}
              className="text-left font-semibold text-white tracking-tight text-base hover:text-neutral-300 transition-colors"
            >
              NetArchitect
            </button>
            <span className="text-neutral-600 text-sm">/</span>
            <span className="text-neutral-400 text-sm font-medium">Akshat Gupta(01514802724)</span>
          </div>

          {/* Quick ZIP Export Action */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadZip}
              disabled={!planResult}
              className="px-3.5 py-1.5 text-xs bg-white text-black font-semibold rounded-md hover:bg-neutral-200 transition-colors disabled:opacity-40"
            >
              Export ZIP
            </button>
          </div>
        </div>

        {/* Minimal text-based navigation tabs */}
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto border-t border-[#1C1C1C] py-2 scrollbar-none text-sm">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-1.5 px-3 rounded-md transition-colors whitespace-nowrap text-xs sm:text-sm ${
                  isActive
                    ? 'bg-[#222222] text-white font-medium'
                    : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
