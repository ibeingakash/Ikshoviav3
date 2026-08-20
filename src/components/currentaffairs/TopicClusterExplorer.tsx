import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
  Newspaper,
  ShieldCheck,
  Calendar,
  ExternalLink,
  GraduationCap,
  Scale,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';
import { CurrentAffairArticle } from '../../types/index.js';

interface TopicClusterSummary {
  id: string;
  title: string;
  category: string;
  articlesCount: number;
  editorialsCount: number;
  lastUpdated: string;
  articles: Array<{
    id: string;
    title: string;
    source: string;
    articleType: string;
    date: string;
    gsPaper?: string;
  }>;
}

export const TopicClusterExplorer: React.FC = () => {
  const { askTutorWithContext } = useLearner();
  const [clusters, setClusters] = useState<TopicClusterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [clusterDetails, setClusterDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const list = await api.getTopicClusters();
      setClusters(list);
      if (list.length > 0 && !selectedClusterId) {
        setSelectedClusterId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch topic clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  useEffect(() => {
    if (!selectedClusterId) return;
    setLoadingDetails(true);
    api.getTopicClusterDetails(selectedClusterId)
      .then(res => {
        setClusterDetails(res);
        setLoadingDetails(false);
      })
      .catch(err => {
        console.error('Failed to load topic cluster details:', err);
        setLoadingDetails(false);
      });
  }, [selectedClusterId]);

  const handleAskTutorSynthesis = () => {
    if (!clusterDetails) return;
    askTutorWithContext(
      `Please provide a comprehensive multi-perspective 360-degree synthesis for the topic: "${clusterDetails.title}". Compare the viewpoints of The Hindu, Indian Express, and the official government policy position.`,
      {
        subjectName: clusterDetails.category,
        pageContext: `Topic Cluster: ${clusterDetails.title}. Includes ${clusterDetails.articles?.length || 0} articles spanning The Hindu, Indian Express, and official government announcements.`,
        conceptTitle: clusterDetails.title,
        conceptSummary: clusterDetails.title,
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-stone-50 border border-stone-200/90 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-950 px-2.5 py-0.5 rounded-full border border-purple-200">
              Cross-Source Synthesis
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-stone-900">
            Multi-Source Topic Clusters & Side-by-Side Debate
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            Compare analytical coverage of major policy issues across The Hindu, The Indian Express, and Primary Government Releases in one unified view.
          </p>
        </div>

        <button
          onClick={handleAskTutorSynthesis}
          disabled={!clusterDetails}
          className="text-xs font-bold text-white bg-[#35156B] hover:bg-[#4B1F78] px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Synthesize with AI Tutor</span>
        </button>
      </div>

      {loading && (
        <div className="py-16 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2 font-medium">
          <Sparkles className="w-6 h-6 animate-spin text-[#35156B]" />
          <span>Aggregating multi-source news clusters...</span>
        </div>
      )}

      {!loading && clusters.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3">
          <Layers className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-900">No topic clusters available yet</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Topic clusters are automatically formed when related articles are ingested from multiple sources.
          </p>
        </div>
      )}

      {!loading && clusters.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Cluster List */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Active Topic Clusters ({clusters.length})
            </span>
            <div className="space-y-2.5">
              {clusters.map(cl => (
                <div
                  key={cl.id}
                  onClick={() => setSelectedClusterId(cl.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                    selectedClusterId === cl.id
                      ? 'bg-white border-[#35156B] shadow-xs ring-1 ring-[#35156B]'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                      {cl.category}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {cl.articlesCount} items
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-stone-900 font-serif leading-snug line-clamp-2">
                    {cl.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                    <span>{cl.editorialsCount} Editorials</span>
                    <span className="flex items-center gap-0.5 text-[#35156B] font-bold">
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Multi-Perspective Side-by-Side Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {loadingDetails && (
              <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-xs text-stone-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#35156B]" />
                <span>Loading multi-perspective debate breakdown...</span>
              </div>
            )}

            {!loadingDetails && clusterDetails && (
              <div className="space-y-6">
                {/* Cluster Detail Header */}
                <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {clusterDetails.category}
                    </span>
                    <span className="text-xs text-stone-500">
                      Aggregated from {clusterDetails.articles?.length || 0} primary & secondary sources
                    </span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-[#111426]">
                    {clusterDetails.title}
                  </h2>
                </div>

                {/* Side-by-Side Comparison: The Hindu vs The Indian Express */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-[#35156B]" />
                      <span>Multi-Source Editorial Perspectives</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* The Hindu Perspective */}
                    <div className="bg-blue-50/40 border border-blue-200 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                        <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                          <Newspaper className="w-3.5 h-3.5 text-blue-800" />
                          <span>The Hindu Analysis</span>
                        </span>
                        <span className="text-[10px] font-mono text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                          Editorial View
                        </span>
                      </div>

                      {clusterDetails.theHinduAnalysis ? (
                        <div className="space-y-2 text-xs">
                          <h4 className="font-bold text-stone-900 font-serif leading-snug">
                            {clusterDetails.theHinduAnalysis.title}
                          </h4>
                          <p className="text-stone-700 leading-relaxed">
                            {clusterDetails.theHinduAnalysis.editorialAnalysis?.coreArgument || clusterDetails.theHinduAnalysis.summary}
                          </p>
                          {clusterDetails.theHinduAnalysis.editorialAnalysis?.argumentsFor && (
                            <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200/60 space-y-1">
                              <span className="text-[10px] font-bold text-blue-900 uppercase block">Key Stance:</span>
                              <p className="text-[11px] text-stone-700">
                                {clusterDetails.theHinduAnalysis.editorialAnalysis.argumentsFor[0]}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 italic">
                          No direct editorial from The Hindu in this cluster yet.
                        </p>
                      )}
                    </div>

                    {/* The Indian Express Perspective */}
                    <div className="bg-emerald-50/40 border border-emerald-200 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <Newspaper className="w-3.5 h-3.5 text-emerald-800" />
                          <span>The Indian Express Analysis</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Explained / Ideas
                        </span>
                      </div>

                      {clusterDetails.indianExpressAnalysis ? (
                        <div className="space-y-2 text-xs">
                          <h4 className="font-bold text-stone-900 font-serif leading-snug">
                            {clusterDetails.indianExpressAnalysis.title}
                          </h4>
                          <p className="text-stone-700 leading-relaxed">
                            {clusterDetails.indianExpressAnalysis.editorialAnalysis?.coreArgument || clusterDetails.indianExpressAnalysis.summary}
                          </p>
                          {clusterDetails.indianExpressAnalysis.editorialAnalysis?.argumentsFor && (
                            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60 space-y-1">
                              <span className="text-[10px] font-bold text-emerald-900 uppercase block">Key Stance:</span>
                              <p className="text-[11px] text-stone-700">
                                {clusterDetails.indianExpressAnalysis.editorialAnalysis.argumentsFor[0]}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 italic">
                          No direct editorial from The Indian Express in this cluster yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Government Release / Official Action */}
                {clusterDetails.primaryGovtAnnouncements?.length > 0 && (
                  <div className="bg-amber-50/50 border border-amber-200 p-4 sm:p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-700" />
                        <span>Official Government Notifications & Factual Record</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      {clusterDetails.primaryGovtAnnouncements.map((gov: any) => (
                        <div key={gov.id} className="bg-white/90 p-3 rounded-xl border border-amber-200/80 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900">{gov.title}</span>
                            <span className="text-[10px] text-stone-500 font-mono">{gov.source}</span>
                          </div>
                          <p className="text-stone-700 leading-relaxed">{gov.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Combined Past Year Exam Linkages (PYQs) */}
                {clusterDetails.combinedPyqs?.length > 0 && (
                  <div className="bg-stone-50 border border-stone-200 p-4 sm:p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-[#35156B]" />
                        <span>Aggregated PYQ Linkages for this Topic</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      {clusterDetails.combinedPyqs.map((pyq: any, i: number) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-stone-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#35156B]">
                            <span>{pyq.exam} ({pyq.year}) — {pyq.paper || pyq.topic}</span>
                          </div>
                          <p className="text-stone-800 font-medium">{pyq.questionText}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
