'use client';

import React, { useState } from 'react';
import { useNetwork } from '@/context/NetworkContext';
import { validateNetworkScenario } from '@/lib/validators/networkValidator';

export default function CustomBuilderView() {
  const { activeScenario, saveCustomScenario, setActiveTab } = useNetwork();

  const [formData, setFormData] = useState({
    name: activeScenario.name || 'Custom Enterprise Network',
    networkType: activeScenario.networkType || 'Campus LAN',
    endpoints: activeScenario.endpoints || 500,
    buildingsCount: activeScenario.buildingsCount || 2,
    sitesCount: activeScenario.sitesCount || 1,
    distanceMeters: activeScenario.distanceMeters || 120,
    requestedBandwidth: activeScenario.requestedBandwidth || '10 Gbps',
    redundancy: activeScenario.redundancy || 'High',
    poeRequired: activeScenario.poeRequired !== undefined ? activeScenario.poeRequired : true,
    cloudIntegration: Boolean(activeScenario.cloudIntegration),
    qosEnabled: Boolean(activeScenario.qosEnabled),
    rootCidr: activeScenario.rootCidr || '192.168.0.0/22',
    allowRfc3021: Boolean(activeScenario.allowRfc3021),
    departments: activeScenario.departments && activeScenario.departments.length > 0
      ? activeScenario.departments.map(d => ({ ...d }))
      : [
          { name: 'Engineering Workstations', hosts: 150, vlanId: 10, description: 'R&D developer desktops' },
          { name: 'Corporate Operations', hosts: 80, vlanId: 20, description: 'Finance, HR, and marketing' },
          { name: 'Server Farm & Storage', hosts: 40, vlanId: 30, description: 'Core application hosts' },
          { name: 'Guest & IoT Devices', hosts: 20, vlanId: 40, description: 'Isolated wireless guests' }
        ]
  });

  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleDepartmentChange = (index, field, value) => {
    const updated = [...formData.departments];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, departments: updated }));
    setSaveSuccess(false);
  };

  const addDepartment = () => {
    const nextVlan = (formData.departments.length + 1) * 10;
    setFormData(prev => ({
      ...prev,
      departments: [
        ...prev.departments,
        {
          name: `Department ${prev.departments.length + 1}`,
          hosts: 30,
          vlanId: nextVlan,
          description: 'Departmental network segment'
        }
      ]
    }));
    setSaveSuccess(false);
  };

  const removeDepartment = (index) => {
    if (formData.departments.length <= 1) {
      alert('At least one department segment is required.');
      return;
    }
    const updated = formData.departments.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, departments: updated }));
    setSaveSuccess(false);
  };

  const handleValidateAndApply = () => {
    const result = validateNetworkScenario(formData);
    setErrors(result.errors);
    setWarnings(result.warnings);

    if (result.valid) {
      saveCustomScenario(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setActiveTab('results');
      }, 500);
    }
  };

  const totalRequestedHosts = formData.departments.reduce((acc, d) => acc + (Number(d.hosts) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#212121] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Network Builder
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 mt-1 max-w-2xl leading-relaxed">
            Specify enterprise parameters, physical distance boundaries, root IPv4 prefix, and department host sizing.
          </p>
        </div>

        <button
          onClick={handleValidateAndApply}
          className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-md hover:bg-neutral-200 transition-colors self-start sm:self-auto shrink-0"
        >
          Generate Network Design
        </button>
      </div>

      {/* Validation Feedback Messages */}
      {errors.length > 0 && (
        <div className="bg-[#171111] border border-red-800/80 rounded-lg p-4 text-sm text-red-200 space-y-2">
          <div className="font-semibold text-red-400">
            Validation Errors ({errors.length}):
          </div>
          <ul className="list-disc list-inside space-y-1 text-red-300 text-sm">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-[#16130D] border border-amber-800/70 rounded-lg p-4 text-sm text-amber-200 space-y-2">
          <div className="font-semibold text-amber-400">
            Advisory Warnings ({warnings.length}):
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-300 text-sm">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-[#101710] border border-neutral-600 rounded-lg p-4 text-sm text-neutral-200">
          Design generated and validated successfully. Routing to Network Results...
        </div>
      )}

      {/* 1. General Profile & Physical Constraints */}
      <div className="border border-[#262626] rounded-lg p-6 bg-[#111111] space-y-6">
        <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold border-b border-[#212121] pb-3">
          1. General Profile & Physical Constraints
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
          {/* Network Name */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium text-sm">Network Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-white text-sm focus:border-neutral-400 focus:outline-none"
              placeholder="e.g. Apex Financial HQ"
            />
          </div>

          {/* Network Type */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium text-sm">Architecture Scope</label>
            <select
              value={formData.networkType}
              onChange={(e) => handleFieldChange('networkType', e.target.value)}
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-white text-sm focus:border-neutral-400 focus:outline-none"
            >
              <option value="Campus LAN">Campus LAN</option>
              <option value="Metro MAN">Metro MAN</option>
              <option value="Global WAN">Global WAN</option>
              <option value="Custom">Custom Enterprise Architecture</option>
            </select>
          </div>

          {/* Total Endpoints */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium text-sm">Estimated Endpoints</label>
            <input
              type="number"
              min="1"
              value={formData.endpoints}
              onChange={(e) => handleFieldChange('endpoints', Number(e.target.value))}
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-white text-sm focus:border-neutral-400 focus:outline-none"
            />
          </div>

          {/* Buildings */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium text-sm">Number of Buildings</label>
            <input
              type="number"
              min="1"
              value={formData.buildingsCount}
              onChange={(e) => handleFieldChange('buildingsCount', Number(e.target.value))}
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-white text-sm focus:border-neutral-400 focus:outline-none"
            />
          </div>

          {/* Geographic Sites */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium text-sm">Geographic Sites</label>
            <input
              type="number"
              min="1"
              value={formData.sitesCount}
              onChange={(e) => handleFieldChange('sitesCount', Number(e.target.value))}
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-white text-sm focus:border-neutral-400 focus:outline-none"
            />
          </div>

          {/* Link Distance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 font-medium text-sm">Max Separation (Meters)</label>
              <span className="text-xs text-neutral-400 font-mono">
                {formData.distanceMeters >= 1000
                  ? `${(formData.distanceMeters / 1000).toFixed(1)} km`
                  : `${formData.distanceMeters} m`}
              </span>
            </div>
            <input
              type="number"
              min="1"
              value={formData.distanceMeters}
              onChange={(e) => handleFieldChange('distanceMeters', Number(e.target.value))}
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-white text-sm focus:border-neutral-400 focus:outline-none"
            />
            <p className="text-xs text-neutral-400">
              &le;100m: Cat6a | 101–400m: OM4 MMF | &gt;400m: OS2 SMF
            </p>
          </div>

          {/* Bandwidth */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium text-sm">Backbone Bandwidth</label>
            <select
              value={formData.requestedBandwidth}
              onChange={(e) => handleFieldChange('requestedBandwidth', e.target.value)}
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-white text-sm focus:border-neutral-400 focus:outline-none"
            >
              <option value="1 Gbps">1 Gbps</option>
              <option value="10 Gbps">10 Gbps</option>
              <option value="40 Gbps">40 Gbps</option>
              <option value="100 Gbps">100 Gbps</option>
            </select>
          </div>

          {/* Redundancy */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium text-sm">Redundancy Model</label>
            <select
              value={formData.redundancy}
              onChange={(e) => handleFieldChange('redundancy', e.target.value)}
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-white text-sm focus:border-neutral-400 focus:outline-none"
            >
              <option value="Standard">Standard (Single Uplink)</option>
              <option value="High">High (Dual-Homed Core/Distribution)</option>
              <option value="Dual-Homed">Dual-Homed Full Fault Tolerance</option>
            </select>
          </div>

          {/* Feature Flags */}
          <div className="flex flex-col justify-center space-y-2.5 pt-1">
            <label className="flex items-center space-x-2.5 text-neutral-200 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={formData.poeRequired}
                onChange={(e) => handleFieldChange('poeRequired', e.target.checked)}
                className="rounded bg-[#161616] border-[#2E2E2E] text-white focus:ring-0"
              />
              <span>PoE+ Required (802.3at APs &amp; VoIP)</span>
            </label>
            <label className="flex items-center space-x-2.5 text-neutral-200 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={formData.cloudIntegration}
                onChange={(e) => handleFieldChange('cloudIntegration', e.target.checked)}
                className="rounded bg-[#161616] border-[#2E2E2E] text-white focus:ring-0"
              />
              <span>Cloud VPC Uplink (AWS / Azure)</span>
            </label>
            <label className="flex items-center space-x-2.5 text-neutral-200 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={formData.qosEnabled}
                onChange={(e) => handleFieldChange('qosEnabled', e.target.checked)}
                className="rounded bg-[#161616] border-[#2E2E2E] text-white focus:ring-0"
              />
              <span>QoS Low-Latency Queueing</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. IPv4 Addressing & Department Sizing */}
      <div className="border border-[#262626] rounded-lg p-6 bg-[#111111] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#212121] pb-3 gap-2">
          <div>
            <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
              2. IPv4 Root CIDR &amp; Department Host Sizing
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Total hosts requested across segments: <span className="text-white font-semibold">{totalRequestedHosts}</span>
            </p>
          </div>
          <button
            onClick={addDepartment}
            className="px-3.5 py-1.5 bg-[#181818] hover:bg-[#222222] text-neutral-200 border border-[#2E2E2E] rounded-md text-xs sm:text-sm font-medium transition-colors self-start"
          >
            + Add Department
          </button>
        </div>

        {/* Root CIDR Input */}
        <div className="max-w-md space-y-1.5">
          <label className="text-neutral-300 font-medium text-sm">Root IPv4 Network Block (CIDR)</label>
          <input
            type="text"
            value={formData.rootCidr}
            onChange={(e) => handleFieldChange('rootCidr', e.target.value)}
            className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-white font-mono text-sm focus:border-neutral-400 focus:outline-none"
            placeholder="192.168.0.0/24, 10.10.0.0/20, or 172.16.0.0/16"
          />
          <p className="text-xs text-neutral-400">
            RFC 1918 Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
          </p>
        </div>

        {/* Departments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#212121] text-neutral-400">
                <th className="pb-2 w-10">#</th>
                <th className="pb-2">Department / Segment</th>
                <th className="pb-2 w-32">Hosts Required</th>
                <th className="pb-2 w-24">VLAN ID</th>
                <th className="pb-2">Purpose / Description</th>
                <th className="pb-2 text-right w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {formData.departments.map((dept, index) => (
                <tr key={index} className="hover:bg-[#151515]">
                  <td className="py-2.5 text-neutral-500">{index + 1}</td>
                  <td className="py-2.5 pr-2">
                    <input
                      type="text"
                      value={dept.name}
                      onChange={(e) => handleDepartmentChange(index, 'name', e.target.value)}
                      className="w-full bg-[#161616] border border-[#262626] rounded-md px-2.5 py-1.5 text-white text-sm"
                    />
                  </td>
                  <td className="py-2.5 pr-2">
                    <input
                      type="number"
                      min="1"
                      value={dept.hosts}
                      onChange={(e) => handleDepartmentChange(index, 'hosts', Number(e.target.value))}
                      className="w-full bg-[#161616] border border-[#262626] rounded-md px-2.5 py-1.5 text-white font-medium text-sm"
                    />
                  </td>
                  <td className="py-2.5 pr-2">
                    <input
                      type="number"
                      min="1"
                      max="4094"
                      value={dept.vlanId}
                      onChange={(e) => handleDepartmentChange(index, 'vlanId', Number(e.target.value))}
                      className="w-full bg-[#161616] border border-[#262626] rounded-md px-2.5 py-1.5 text-white font-mono text-sm"
                    />
                  </td>
                  <td className="py-2.5 pr-2">
                    <input
                      type="text"
                      value={dept.description}
                      onChange={(e) => handleDepartmentChange(index, 'description', e.target.value)}
                      className="w-full bg-[#161616] border border-[#262626] rounded-md px-2.5 py-1.5 text-neutral-300 text-sm"
                    />
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => removeDepartment(index)}
                      className="px-2.5 py-1 text-neutral-400 hover:text-white hover:bg-[#222222] rounded-md transition-colors text-xs"
                      title="Remove department"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleValidateAndApply}
          className="px-6 py-2.5 bg-white text-black font-semibold text-sm rounded-md hover:bg-neutral-200 transition-colors"
        >
          Generate Network Design &rarr;
        </button>
      </div>
    </div>
  );
}
