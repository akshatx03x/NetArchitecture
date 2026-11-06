'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { campusLANPreset } from '@/lib/presets/campusLAN';
import { metroMANPreset } from '@/lib/presets/metroMAN';
import { globalWANPreset } from '@/lib/presets/globalWAN';
import { planNetwork } from '@/lib/engines/networkEngine';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [activeScenarioId, setActiveScenarioId] = useState('campus-lan');
  const [customScenarios, setCustomScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(campusLANPreset);
  const [activeTab, setActiveTab] = useState('home'); // home, scenarios, builder, results, configs, docs
  const [planResult, setPlanResult] = useState(null);
  const [planError, setPlanError] = useState(null);

  // Load custom scenarios from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('netarchitect_custom_scenarios');
      if (saved) {
        setCustomScenarios(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load scenarios from localStorage', e);
    }
  }, []);

  // Compute plan on scenario change
  useEffect(() => {
    try {
      setPlanError(null);
      const result = planNetwork(activeScenario);
      setPlanResult(result);
    } catch (err) {
      setPlanError(err);
      setPlanResult(null);
    }
  }, [activeScenario]);

  const selectPreset = (presetId) => {
    setActiveScenarioId(presetId);
    if (presetId === 'campus-lan') {
      setActiveScenario(campusLANPreset);
    } else if (presetId === 'metro-man') {
      setActiveScenario(metroMANPreset);
    } else if (presetId === 'global-wan') {
      setActiveScenario(globalWANPreset);
    } else {
      const found = customScenarios.find(s => s.id === presetId);
      if (found) {
        setActiveScenario(found);
      }
    }
  };

  const saveCustomScenario = (scenarioData) => {
    const newId = scenarioData.id || `custom-${Date.now()}`;
    const scenarioToSave = { ...scenarioData, id: newId };
    
    const updated = [...customScenarios.filter(s => s.id !== newId), scenarioToSave];
    setCustomScenarios(updated);
    setActiveScenarioId(newId);
    setActiveScenario(scenarioToSave);

    try {
      localStorage.setItem('netarchitect_custom_scenarios', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save scenario to localStorage', e);
    }
  };

  const deleteCustomScenario = (id) => {
    const updated = customScenarios.filter(s => s.id !== id);
    setCustomScenarios(updated);
    try {
      localStorage.setItem('netarchitect_custom_scenarios', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update localStorage', e);
    }
    if (activeScenarioId === id) {
      selectPreset('campus-lan');
    }
  };

  const contextValue = useMemo(() => ({
    activeScenarioId,
    activeScenario,
    activeTab,
    setActiveTab,
    planResult,
    planError,
    customScenarios,
    selectPreset,
    saveCustomScenario,
    deleteCustomScenario,
    recalculate: () => {
      try {
        setPlanError(null);
        setPlanResult(planNetwork(activeScenario));
      } catch (e) {
        setPlanError(e);
      }
    }
  }), [activeScenarioId, activeScenario, activeTab, planResult, planError, customScenarios]);

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

