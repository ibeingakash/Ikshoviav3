import React, { useState, useEffect } from 'react';
import { GitGraph, BookOpen, Layers, ArrowRight, Sparkles } from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';

interface GraphNode {
  id: string;
  title: string;
  subjectName: string;
  masteryScore: number;
  status: 'Mastered' | 'Strong' | 'Developing' | 'Weak' | 'Unexplored';
  difficulty: string;
  importance: string;
}

export const KnowledgeGraphView: React.FC = () => {
  const { navigateToConcept } = useLearner();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getKnowledgeGraph().then(data => {
      setNodes(data.nodes || []);
      setRelationships(data.relationships || []);
      if (data.nodes?.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
      setLoading(false);
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Mastered':
        return 'bg-emerald-950 text-emerald-300 border-emerald-600';
      case 'Strong':
        return 'bg-blue-950 text-blue-300 border-blue-600';
      case 'Developing':
        return 'bg-amber-950 text-amber-300 border-amber-600';
      case 'Weak':
        return 'bg-rose-950 text-rose-300 border-rose-600';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-6xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <GitGraph className="w-6 h-6 text-indigo-400" />
            <span>Interactive Concept Knowledge Graph</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Visual map of prerequisite dependencies, conceptual relationships, and live mastery statuses.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered</span>
          <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500" /> Developing</span>
          <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500" /> Weak</span>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
          Rendering knowledge network...
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Graph Nodes Grid (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[450px] relative overflow-hidden shadow-2xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Concept Network Map ({nodes.length} Nodes)</span>
              <span className="text-[10px] text-indigo-400 font-mono">Click node to inspect</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nodes.map(n => {
                const isSelected = selectedNode?.id === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => setSelectedNode(n)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${getStatusColor(
                      n.status
                    )} ${isSelected ? 'ring-2 ring-indigo-400 shadow-xl scale-[1.02]' : 'hover:scale-[1.01]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                        {n.subjectName}
                      </span>
                      <span className="text-xs font-black font-mono">{n.masteryScore}%</span>
                    </div>

                    <h3 className="text-xs font-bold mt-1 line-clamp-1">{n.title}</h3>

                    <div className="mt-3 flex items-center justify-between text-[10px]">
                      <span className="font-mono">{n.status}</span>
                      <span className="bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/60">
                        {n.importance}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node Inspector Panel (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            {selectedNode ? (
              <>
                <div className="border-b border-slate-800 pb-3 space-y-1">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    Concept Inspector
                  </div>
                  <h2 className="text-lg font-bold text-white">{selectedNode.title}</h2>
                  <div className="text-xs text-slate-400">{selectedNode.subjectName}</div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-400">Mastery Level</span>
                      <span className="text-indigo-300 font-mono font-bold">
                        {selectedNode.masteryScore}% ({selectedNode.status})
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${selectedNode.masteryScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-slate-300 text-xs">
                    <div>
                      <strong className="text-slate-400">Difficulty: </strong>
                      {selectedNode.difficulty}
                    </div>
                    <div>
                      <strong className="text-slate-400">Importance: </strong>
                      {selectedNode.importance}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigateToConcept(selectedNode.id)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <span>Study Concept Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Select a concept node to inspect prerequisites and relationships.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
