import React, { useState, useEffect } from 'react';
import { Newspaper, Play, Sparkles, CheckCircle2, XCircle, RefreshCw, Filter, Layers, Tag, MapPin, Eye, Edit3, Plus, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api.js';
import { CurrentAffairArticle } from '../../types/index.js';

export const CurrentAffairsAdminView: React.FC = () => {
  const [metrics, setMetrics] = useState<{ total: number; published: number; reviewRequired: number; ingested: number; rejected: number } | null>(null);
  const [articles, setArticles] = useState<CurrentAffairArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  const [editingArticle, setEditingArticle] = useState<CurrentAffairArticle | null>(null);

  const fetchMetricsAndList = async () => {
    setLoading(true);
    try {
      const [m, list] = await Promise.all([
        api.adminGetCurrentAffairsMetrics(),
        api.adminListCurrentAffairs({ status: selectedStatusFilter === 'ALL' ? undefined : selectedStatusFilter }),
      ]);
      setMetrics(m);
      setArticles(list);
    } catch (err) {
      console.error('Failed to load admin current affairs data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetricsAndList();
  }, [selectedStatusFilter]);

  const handleTriggerIngestion = async () => {
    setIngesting(true);
    try {
      const res = await api.adminTriggerIngestion();
      alert(`Ingestion Pipeline Complete:\n- Fetched: ${res.fetchedCount}\n- Created: ${res.createdCount}\n- Duplicates Skipped: ${res.duplicateCount}`);
      await fetchMetricsAndList();
    } catch (err: any) {
      alert(`Ingestion failed: ${err.message}`);
    } finally {
      setIngesting(false);
    }
  };

  const handleEnrichArticle = async (id: string) => {
    setEnrichingId(id);
    try {
      const res = await api.adminEnrichCurrentAffair(id);
      if (res.success) {
        alert(`Article enriched successfully by Gemini AI Gateway!\nGenerated MCQ ID: ${res.generatedQuestionId || 'N/A'}`);
      } else {
        alert(`Enrichment notice: ${res.error || 'Check review state'}`);
      }
      await fetchMetricsAndList();
    } catch (err: any) {
      alert(`AI Enrichment failed: ${err.message}`);
    } finally {
      setEnrichingId(null);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.adminPublishCurrentAffair(id);
      await fetchMetricsAndList();
    } catch (err: any) {
      alert(`Publish failed: ${err.message}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.adminRejectCurrentAffair(id);
      await fetchMetricsAndList();
    } catch (err: any) {
      alert(`Reject failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-200/80 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-[#35156B]" />
            <span>Current Affairs Intelligence Studio</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            Manage ingest providers, deduplication logs, Gemini AI enrichment, BPSC Bihar relevance & publishing workflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerIngestion}
            disabled={ingesting}
            className="text-xs font-bold bg-[#0C1024] hover:bg-[#121027] text-amber-300 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 border border-amber-500/30 cursor-pointer shadow-2xs"
          >
            {ingesting ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Play className="w-4 h-4 fill-amber-400 text-amber-400" />}
            <span>Run Provider Ingestion</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white border border-stone-200/90 p-3.5 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">Total Articles</span>
            <div className="text-xl font-serif-editorial font-bold text-[#111426] mt-1">{metrics.total}</div>
          </div>
          <div className="bg-white border border-stone-200/90 p-3.5 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-mono">Published</span>
            <div className="text-xl font-serif-editorial font-bold text-emerald-800 mt-1">{metrics.published}</div>
          </div>
          <div className="bg-white border border-stone-200/90 p-3.5 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-mono">Review Required</span>
            <div className="text-xl font-serif-editorial font-bold text-amber-800 mt-1">{metrics.reviewRequired}</div>
          </div>
          <div className="bg-white border border-stone-200/90 p-3.5 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-bold text-[#35156B] uppercase tracking-wider font-mono">Ingested</span>
            <div className="text-xl font-serif-editorial font-bold text-[#35156B] mt-1">{metrics.ingested}</div>
          </div>
          <div className="bg-white border border-stone-200/90 p-3.5 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider font-mono">Rejected</span>
            <div className="text-xl font-serif-editorial font-bold text-rose-800 mt-1">{metrics.rejected}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-2 overflow-x-auto scrollbar-none">
        {['ALL', 'INGESTED', 'REVIEW_REQUIRED', 'PUBLISHED', 'REJECTED'].map(st => (
          <button
            key={st}
            onClick={() => setSelectedStatusFilter(st)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-mono ${
              selectedStatusFilter === st
                ? 'bg-[#35156B] text-amber-300 shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100/80 border border-stone-200/90'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* List Table / Cards */}
      {loading ? (
        <div className="py-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-[#35156B]" />
          <span>Loading Current Affairs records from PostgreSQL...</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-stone-200/90 text-stone-400 text-xs">
          No current affairs articles found matching status filter: {selectedStatusFilter}
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map(art => (
            <div key={art.id} className="bg-white border border-stone-200/90 p-4 rounded-xl space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border font-mono ${
                    art.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    art.status === 'REVIEW_REQUIRED' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-stone-100 text-stone-700 border-stone-200'
                  }`}>
                    {art.status || 'PUBLISHED'}
                  </span>
                  <span className="text-[11px] font-bold text-[#35156B]">{art.category}</span>
                  <span className="text-[10px] text-stone-400 font-mono">{art.date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEnrichArticle(art.id)}
                    disabled={enrichingId === art.id}
                    className="text-xs font-bold bg-purple-50 text-[#35156B] hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded-xl flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-[#35156B] ${enrichingId === art.id ? 'animate-spin' : ''}`} />
                    <span>{enrichingId === art.id ? 'Enriching...' : 'AI Enrich'}</span>
                  </button>

                  {art.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => handlePublish(art.id)}
                      className="text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Publish</span>
                    </button>
                  )}

                  {art.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleReject(art.id)}
                      className="text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-serif-editorial font-bold text-[#111426] mb-1">{art.title}</h3>
                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{art.summary}</p>
              </div>

              {art.biharRelevance && (
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 text-[11px] text-amber-900">
                  <strong className="text-amber-800 font-bold font-mono">Bihar Relevance:</strong> {art.biharRelevance}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
