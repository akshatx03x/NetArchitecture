'use client';

import React, { useState } from 'react';
import { useNetwork } from '@/context/NetworkContext';
import { downloadTextFile } from '@/lib/utils/exportUtils';

export default function DecisionsView() {
  const { planResult, activeScenario } = useNetwork();
  const [expandedDecisions, setExpandedDecisions] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  if (!planResult || !planResult.explanations) {
    return (
      <div className="p-8 text-center text-neutral-400 text-sm">
        No decision logs generated.
      </div>
    );
  }

  const decisions = planResult.explanations;
  const categories = ['ALL', ...new Set(decisions.map(d => d.category))];

  const filteredDecisions = selectedCategory === 'ALL'
    ? decisions
    : decisions.filter(d => d.category === selectedCategory);

  const toggleExpand = (id) => {
    setExpandedDecisions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const all = {};
    decisions.forEach(d => all[d.id] = true);
    setExpandedDecisions(all);
  };

  const collapseAll = () => {
    setExpandedDecisions({});
  };

  const handleExportMarkdown = () => {
    if (planResult.rawExplanations?.exportMarkdown) {
      const md = planResult.rawExplanations.exportMarkdown();
      downloadTextFile(`${activeScenario.name.replace(/\s+/g, '_')}_Decision_Record.md`, md, 'text/markdown;charset=utf-8');
    }
  };

  const handleExportJson = () => {
    if (planResult.rawExplanations?.exportJson) {
      const json = planResult.rawExplanations.exportJson();
      downloadTextFile(`${activeScenario.name.replace(/\s+/g, '_')}_Decisions.json`, json, 'application/json;charset=utf-8');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#212121] pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white">
              Explainable Decision Engine
            </h3>
            <span className="text-xs text-neutral-400 bg-[#161616] border border-[#2B2B2B] px-2 py-0.5 rounded font-medium">
              25 Marks Academic Core
            </span>
          </div>
          <p className="text-sm text-neutral-300 mt-1">
            Every architectural decision is mathematically derived, standard-backed (IEEE/RFC), and accompanied by rejected alternatives.
          </p>
        </div>

        {/* Export Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportMarkdown}
            className="px-3.5 py-1.5 bg-[#181818] hover:bg-[#222222] text-neutral-200 border border-[#2B2B2B] rounded-md text-xs sm:text-sm transition-colors font-medium"
          >
            Export ADR (.md)
          </button>
          <button
            onClick={handleExportJson}
            className="px-3.5 py-1.5 bg-[#181818] hover:bg-[#222222] text-neutral-200 border border-[#2B2B2B] rounded-md text-xs sm:text-sm transition-colors font-medium"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Filter and Accordion Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-[#262626] rounded-lg p-3.5 bg-[#111111]">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mr-1">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs sm:text-sm transition-colors ${
                selectedCategory === cat
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#161616] text-neutral-300 hover:text-white border border-[#2B2B2B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Global Expand/Collapse */}
        <div className="flex items-center space-x-2 text-xs sm:text-sm">
          <button
            onClick={expandAll}
            className="text-neutral-300 hover:text-white px-2.5 py-1 bg-[#161616] rounded-md border border-[#2B2B2B]"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-neutral-300 hover:text-white px-2.5 py-1 bg-[#161616] rounded-md border border-[#2B2B2B]"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Decision Cards List */}
      <div className="space-y-4">
        {filteredDecisions.map((d) => {
          const isExpanded = expandedDecisions[d.id] ?? true;
          return (
            <div
              key={d.id}
              className="border border-[#262626] rounded-lg bg-[#111111] overflow-hidden"
            >
              {/* Card Header */}
              <div
                onClick={() => toggleExpand(d.id)}
                className="px-6 py-4 cursor-pointer flex items-center justify-between bg-[#141414] hover:bg-[#181818] border-b border-[#212121] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2.5 py-0.5 rounded text-xs bg-[#1E1E1E] text-neutral-300 border border-[#2B2B2B] uppercase font-semibold">
                      {d.category}
                    </span>
                    <span className="text-xs text-neutral-400">
                      Standard: <span className="font-mono text-neutral-300">{d.standardsReference}</span>
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-white pt-0.5">
                    {d.decision}
                  </h4>
                </div>

                <div className="flex items-center space-x-2 text-xs sm:text-sm text-neutral-300 font-medium">
                  <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                  <span className="text-neutral-500">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Card Expanded Content */}
              {isExpanded && (
                <div className="p-6 space-y-5 text-sm">
                  {/* Technical Explanation Paragraph */}
                  <div className="bg-[#161616] p-4 rounded-lg border border-[#242424] space-y-1.5">
                    <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold block">
                      Engineering Justification:
                    </span>
                    <p className="text-neutral-200 leading-relaxed text-sm">
                      {d.technicalExplanation}
                    </p>
                  </div>

                  {/* Math & Rule Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#161616] p-4 rounded-lg border border-[#242424] space-y-1.5">
                      <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold block">
                        Applied Deterministic Rule:
                      </span>
                      <p className="text-neutral-300 text-sm leading-relaxed">
                        {d.appliedAlgorithm}
                      </p>
                    </div>

                    <div className="bg-[#161616] p-4 rounded-lg border border-[#242424] space-y-1.5">
                      <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold block">
                        Mathematical Derivation &amp; Margins:
                      </span>
                      <p className="text-neutral-200 text-sm leading-relaxed font-mono">
                        {d.mathematicalCalculation}
                      </p>
                    </div>
                  </div>

                  {/* Input Parameters Analyzed */}
                  <div className="bg-[#141414] p-3.5 rounded-lg border border-[#212121] space-y-1.5">
                    <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold block">
                      Input Parameters Analyzed:
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(d.inputParameters).map(([k, v]) => (
                        <span key={k} className="px-2.5 py-1 rounded bg-[#1A1A1A] text-neutral-200 border border-[#262626] text-xs">
                          <span className="text-neutral-400">{k}:</span> <span className="text-white font-mono font-semibold">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Alternatives Rejected Table */}
                  {d.alternativesRejected && d.alternativesRejected.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold block">
                        Alternatives Considered &amp; Technical Rejection Reasons:
                      </span>
                      <div className="overflow-x-auto border border-[#262626] rounded-lg">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="bg-[#141414] border-b border-[#212121] text-neutral-400">
                              <th className="py-2.5 px-3.5 w-1/3">Alternative Option</th>
                              <th className="py-2.5 px-3.5">Rejection Justification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E1E1E]">
                            {d.alternativesRejected.map((alt, i) => (
                              <tr key={i} className="hover:bg-[#161616]">
                                <td className="py-2.5 px-3.5 text-neutral-200 font-medium">
                                  {alt.technology || alt.protocol}
                                </td>
                                <td className="py-2.5 px-3.5 text-neutral-300 leading-relaxed text-sm">
                                  {alt.reason}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Assumptions & Warnings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {d.assumptions && d.assumptions.length > 0 && (
                      <div className="bg-[#141414] p-4 rounded-lg border border-[#212121] space-y-1.5">
                        <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold block">
                          Engineering Assumptions:
                        </span>
                        <ul className="space-y-1.5 text-neutral-300 text-sm list-disc list-inside">
                          {d.assumptions.map((asm, i) => (
                            <li key={i}>{asm}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {d.warnings && d.warnings.length > 0 && (
                      <div className="bg-[#141414] p-4 rounded-lg border border-[#212121] space-y-1.5">
                        <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold block">
                          SLA &amp; Engineering Caveats:
                        </span>
                        <ul className="space-y-1.5 text-neutral-300 text-sm list-disc list-inside">
                          {d.warnings.map((wrn, i) => (
                            <li key={i}>{wrn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
