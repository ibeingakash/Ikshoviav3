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
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 bg-slate-950 text-white rounded-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-rose-400" />
            <span>Current Affairs Control & Intelligence Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage ingest providers, deduplication logs, Gemini AI enrichment, BPSC Bihar relevance & publishing workflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerIngestion}
            disabled={ingesting}
            className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {ingesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>Run Provider Ingestion</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Articles</span>
            <div className="text-xl font-black text-white mt-1">{metrics.total}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Published</span>
            <div className="text-xl font-black text-emerald-300 mt-1">{metrics.published}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Review Required</span>
            <div className="text-xl font-black text-amber-300 mt-1">{metrics.reviewRequired}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Ingested</span>
            <div className="text-xl font-black text-indigo-300 mt-1">{metrics.ingested}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Rejected</span>
            <div className="text-xl font-black text-rose-300 mt-1">{metrics.rejected}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {['ALL', 'INGESTED', 'REVIEW_REQUIRED', 'PUBLISHED', 'REJECTED'].map(st => (
          <button
            key={st}
            onClick={() => setSelectedStatusFilter(st)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              selectedStatusFilter === st
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* List Table / Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-rose-400" />
          <span>Loading Current Affairs records from PostgreSQL...</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
          No current affairs articles found matching status filter: {selectedStatusFilter}
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map(art => (
            <div key={art.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    art.status === 'PUBLISHED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                    art.status === 'REVIEW_REQUIRED' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {art.status || 'PUBLISHED'}
                  </span>
                  <span className="text-[11px] font-bold text-rose-300">{art.category}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{art.date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEnrichArticle(art.id)}
                    disabled={enrichingId === art.id}
                    className="text-xs font-bold bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-800 px-3 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${enrichingId === art.id ? 'animate-spin' : ''}`} />
                    <span>{enrichingId === art.id ? 'Enriching...' : 'AI Enrich'}</span>
                  </button>

                  {art.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => handlePublish(art.id)}
                      className="text-xs font-bold bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 px-3 py-1 rounded-lg flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Publish</span>
                    </button>
                  )}

                  {art.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleReject(art.id)}
                      className="text-xs font-bold bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 px-3 py-1 rounded-lg flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-1">{art.title}</h3>
                <p className="text-xs text-slate-300 line-clamp-2">{art.summary}</p>
              </div>

              {art.biharRelevance && (
                <div className="bg-amber-950/40 p-2 rounded-lg border border-amber-900/50 text-[11px] text-amber-300">
                  <strong className="text-amber-200">Bihar Relevance:</strong> {art.biharRelevance}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
