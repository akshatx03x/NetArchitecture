'use client';

import React, { useState } from 'react';
import { useNetwork } from '@/context/NetworkContext';
import { downloadTextFile, downloadConfigurationsZip } from '@/lib/utils/exportUtils';

export default function ConfigurationCenterView() {
  const { planResult, activeScenario } = useNetwork();
  const [activeDevice, setActiveDevice] = useState('coreSwitch');
  const [copied, setCopied] = useState(false);

  if (!planResult || !planResult.configurations) {
    return (
      <div className="p-8 text-center text-neutral-400 text-sm">
        No configurations generated. Please run or select a network scenario.
      </div>
    );
  }

  const { configurations } = planResult;
  const currentConfig = configurations[activeDevice];

  const handleCopy = () => {
    if (currentConfig?.content) {
      navigator.clipboard.writeText(currentConfig.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSingle = () => {
    if (currentConfig) {
      downloadTextFile(currentConfig.filename, currentConfig.content);
    }
  };

  const handleDownloadAllZip = async () => {
    await downloadConfigurationsZip(planResult);
  };

  const devices = [
    { id: 'coreSwitch', label: 'Core / Distribution Switch', filename: configurations.coreSwitch?.filename },
    { id: 'accessSwitch', label: 'Layer 2 Access Switch', filename: configurations.accessSwitch?.filename },
    { id: 'edgeRouter', label: 'Border / Edge Router', filename: configurations.edgeRouter?.filename },
    { id: 'securityAcl', label: 'Security ACL Policy', filename: configurations.securityAcl?.filename }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#212121] pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Cisco Configurations
            </h1>
            <span className="text-xs text-neutral-300 bg-[#161616] border border-[#2B2B2B] px-2.5 py-0.5 rounded font-mono">
              Cisco IOS-XE 17.x
            </span>
          </div>
          <p className="text-sm sm:text-base text-neutral-300 mt-1 max-w-2xl leading-relaxed">
            Production-grade configuration scripts dynamically generated from calculated VLSM subnets, Rapid-PVST+ root priorities, and hardened security baselines.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleDownloadAllZip}
            className="px-4 py-2 bg-white text-black font-semibold text-xs sm:text-sm rounded-md hover:bg-neutral-200 transition-colors"
          >
            Download All (ZIP)
          </button>
        </div>
      </div>

      {/* Device Selection Bar */}
      <div className="flex flex-wrap gap-2 border-b border-[#212121] pb-3">
        {devices.map((dev) => {
          const isActive = activeDevice === dev.id;
          return (
            <button
              key={dev.id}
              onClick={() => {
                setActiveDevice(dev.id);
                setCopied(false);
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
              }`}
            >
              {dev.label}
            </button>
          );
        })}
      </div>

      {/* Configuration Viewer Card */}
      <div className="border border-[#262626] rounded-lg bg-[#111111] overflow-hidden">
        {/* Card Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-[#212121] bg-[#141414] gap-2">
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-neutral-300">
            <span className="text-neutral-400">File:</span>
            <span className="text-white font-mono font-medium">{currentConfig?.filename}</span>
            <span className="text-neutral-600">&bull;</span>
            <span className="text-neutral-400">{currentConfig?.content?.split('\n').length || 0} lines</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-[#1C1C1C] hover:bg-[#252525] border border-[#2B2B2B] text-neutral-200 text-xs sm:text-sm font-medium rounded-md transition-colors"
            >
              {copied ? 'Copied to Clipboard' : 'Copy Configuration'}
            </button>
            <button
              onClick={handleDownloadSingle}
              className="px-3.5 py-1.5 bg-white text-black font-semibold text-xs sm:text-sm rounded-md hover:bg-neutral-200 transition-colors"
            >
              Download .cfg
            </button>
          </div>
        </div>

        {/* Code Output */}
        <pre className="p-5 bg-[#0A0A0A] text-[#EDEDED] font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed max-h-[580px] scrollbar-thin">
          <code>{currentConfig?.content}</code>
        </pre>
      </div>

      {/* Syntax & Verification Note */}
      <div className="border border-[#212121] rounded-lg p-4 bg-[#0E0E0E] text-sm text-neutral-300 space-y-1">
        <div className="text-white font-semibold">Deployment Specifications:</div>
        <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
          Target hardware: Cisco Catalyst 9300/9500 switches and Cisco ISR 4400 / Catalyst 8300 edge routers.
          802.1Q encapsulation is native. BPDU Guard is active on access edge ports; Spanning Tree Root Guard is placed strictly on distribution downstream interfaces.
        </p>
      </div>
    </div>
  );
}
