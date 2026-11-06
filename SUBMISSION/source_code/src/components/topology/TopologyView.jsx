'use client';

import React, { useState, useCallback } from 'react';
import { useNetwork } from '@/context/NetworkContext';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function TopologyView() {
  const { planResult, activeScenario } = useNetwork();
  const [selectedNode, setSelectedNode] = useState(null);

  if (!planResult) {
    return (
      <div className="p-8 text-center text-neutral-400 text-sm">
        No active topology calculated.
      </div>
    );
  }

  const { topology } = planResult;
  const initialNodes = topology.graph?.nodes || [];
  const initialEdges = topology.graph?.edges || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes and edges whenever scenario changes
  React.useEffect(() => {
    if (topology.graph) {
      setNodes(topology.graph.nodes);
      setEdges(topology.graph.edges);
      setSelectedNode(null);
    }
  }, [topology, setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#212121] pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white">
              Interactive Network Topology
            </h3>
            <span className="text-xs text-neutral-400 bg-[#161616] border border-[#2B2B2B] px-2 py-0.5 rounded font-mono">
              React Flow
            </span>
          </div>
          <p className="text-sm text-neutral-300 mt-1">
            Interconnect graph representing {activeScenario.endpoints} endpoints across {activeScenario.buildingsCount || 1} building(s).
          </p>
        </div>

        <div className="text-xs text-neutral-300 border border-[#262626] bg-[#111111] px-3.5 py-1.5 rounded-md font-medium">
          Drag &bull; Pan &bull; Click Nodes to Inspect
        </div>
      </div>

      {/* Main Flow Canvas with Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas Area */}
        <div className="lg:col-span-3 h-[580px] bg-[#0A0A0A] border border-[#262626] rounded-lg overflow-hidden relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            colorMode="dark"
            attributionPosition="bottom-left"
          >
            <Background color="#1F1F1F" gap={20} size={1} />
            <Controls className="bg-[#141414] border-[#2A2A2A] fill-neutral-300" />
            <MiniMap
              nodeStrokeColor="#555555"
              nodeColor="#1E1E1E"
              maskColor="rgba(10, 10, 10, 0.75)"
              className="bg-[#111111] border border-[#262626] rounded-md"
            />
          </ReactFlow>

          <div className="absolute top-3 left-3 bg-[#111111]/90 border border-[#262626] rounded-md px-3.5 py-1.5 text-xs text-neutral-200 font-medium pointer-events-none">
            {topology.architectureName}
          </div>
        </div>

        {/* Device & Link Inspector Panel */}
        <div className="border border-[#262626] rounded-lg p-5 bg-[#111111] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#212121] pb-3">
              <h4 className="text-sm font-semibold text-white">
                Device Inspector
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">Click any node to view configuration details</p>
            </div>

            {selectedNode ? (
              <div className="space-y-3 text-sm">
                <div className="bg-[#161616] p-3 rounded-md border border-[#242424] space-y-1">
                  <span className="text-xs text-neutral-400 block uppercase font-medium">Node Identifier</span>
                  <span className="text-white font-mono font-semibold block">{selectedNode.id}</span>
                </div>

                <div className="bg-[#161616] p-3 rounded-md border border-[#242424] space-y-1">
                  <span className="text-xs text-neutral-400 block uppercase font-medium">Device Label &amp; Specs</span>
                  <p className="text-neutral-200 font-mono text-xs whitespace-pre-line leading-relaxed">
                    {selectedNode.data.label}
                  </p>
                </div>

                {selectedNode.data.deviceType && (
                  <div className="bg-[#161616] p-3 rounded-md border border-[#242424] space-y-1">
                    <span className="text-xs text-neutral-400 block uppercase font-medium">Role in Architecture</span>
                    <span className="text-white uppercase font-semibold text-xs">
                      {selectedNode.data.deviceType}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[#141414] rounded-md border border-[#212121] text-center text-xs text-neutral-400 space-y-1">
                <p>No device selected.</p>
                <p className="text-neutral-500">Click any router, switch, or cloud node in the canvas to inspect its role and parameters.</p>
              </div>
            )}
          </div>

          {/* Topology Standards Legend */}
          <div className="border-t border-[#212121] pt-3 space-y-2 text-xs">
            <span className="text-neutral-400 font-semibold uppercase block">Applied Standards:</span>
            <ul className="space-y-1 text-neutral-300">
              {topology.switchingStandards.map((std, i) => (
                <li key={i} className="flex items-center space-x-2">
                  <span className="text-neutral-500">&bull;</span>
                  <span className="truncate">{std}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
