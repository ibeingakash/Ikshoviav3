import React, { useState } from 'react';
import {
  X,
  Calendar,
  Building2,
  Compass,
  FileText,
  BookOpen,
  Tag,
  Target,
  Layers,
  MapPin,
  Scale,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Share2,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CurrentAffairArticle } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';
import { formatDateHuman } from '../../lib/dateUtils.js';

interface ArticleReaderModalProps {
  article: CurrentAffairArticle | null;
  onClose: () => void;
  onBookmark?: (id: string) => void;
  isBookmarked?: boolean;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  onClose,
  onBookmark,
  isBookmarked = false,
}) => {
  const { askTutorWithContext } = useLearner();
  const [copied, setCopied] = useState(false);

  if (!article) return null;

  const handleAskTutor = () => {
    askTutorWithContext(
      `Please provide a comprehensive UPSC / BPSC analytical brief for: "${article.title}". Include core conceptual foundations, Prelims trap points, and a model Mains 15-mark answer framework.`,
      {
        subjectName: article.relatedSubject || article.category,
        pageContext: `Current Affairs: ${article.title}. Category: ${article.category}. GS Paper: ${article.gsPaper || 'General Studies'}. Why in news: ${article.whyInNews || article.summary}. Key facts: ${(article.keyFacts || []).join('; ')}. Prelims pointers: ${(article.prelimsPointers || []).join('; ')}.`,
        conceptTitle: article.title,
        conceptSummary: article.whyInNews || article.summary,
      }
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${article.title} — Verified Current Affairs on IKSHOVIA`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Science & Tech':
        return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'Economy':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'Polity & Governance':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      case 'Environment':
        return 'bg-teal-50 text-teal-900 border-teal-200';
      case 'International Relations':
        return 'bg-indigo-50 text-indigo-900 border-indigo-200';
      case 'Bihar Current Affairs':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl relative my-auto">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-100 bg-stone-50/80 rounded-t-3xl sticky top-0 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-extrabold uppercase border px-3 py-0.5 rounded-full ${getCategoryColor(article.category)}`}>
              {article.category}
            </span>
            {article.gsPaper && (
              <span className="text-[11px] font-bold bg-stone-200 text-stone-800 px-2.5 py-0.5 rounded-full">
                {article.gsPaper}
              </span>
            )}
            {article.examRelevance && (
              <span className="text-[11px] font-extrabold bg-[#35156B]/10 text-[#35156B] px-2.5 py-0.5 rounded-full">
                {article.examRelevance}
              </span>
            )}
            {article.articleType === 'EDITORIAL' && (
              <span className="text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-full">
                Editorial Analysis
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onBookmark && (
              <button
                onClick={() => onBookmark(article.id)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isBookmarked
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
                title="Bookmark for Spaced Repetition"
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200 cursor-pointer"
              title="Copy Reference"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto font-sans leading-relaxed">
          
          {/* Headline & Metadata */}
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 font-mono mb-2.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {formatDateHuman(article.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-stone-700">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                {article.source}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                article.sourceType === 'SUPPLEMENTARY_REFERENCE' || article.sourceType === 'EDUCATIONAL_ANALYSIS' || (article.source && (article.source.includes('Drishti') || article.source.includes('Synthesis') || article.source.includes('Reference')))
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : article.sourceType === 'PRIMARY_GOVT' || article.sourceType === 'OFFICIAL_PORTAL' || (article.source && (article.source.includes('PIB') || article.source.includes('ISRO') || article.source.includes('RBI') || article.source.includes('Supreme Court') || article.source.includes('Ministry') || (article.source.includes('Bihar') && !article.source.includes('Synthesis') && !article.source.includes('Reference'))))
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-sky-50 text-sky-900 border-sky-200'
              }`}>
                {article.sourceType === 'SUPPLEMENTARY_REFERENCE' || article.sourceType === 'EDUCATIONAL_ANALYSIS' || (article.source && (article.source.includes('Drishti') || article.source.includes('Synthesis') || article.source.includes('Reference')))
                  ? 'Reference / Synthesis'
                  : article.sourceType === 'PRIMARY_GOVT' || article.sourceType === 'OFFICIAL_PORTAL' || (article.source && (article.source.includes('PIB') || article.source.includes('ISRO') || article.source.includes('RBI') || article.source.includes('Supreme Court') || article.source.includes('Ministry') || (article.source.includes('Bihar') && !article.source.includes('Synthesis') && !article.source.includes('Reference'))))
                  ? 'Primary Official'
                  : 'News / Secondary'}
              </span>
              {article.sourceUrl && (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#35156B] hover:underline flex items-center gap-1 font-sans ml-1 text-[11px]"
                >
                  <span>{article.sourceType === 'PRIMARY_GOVT' || article.sourceType === 'OFFICIAL_PORTAL' ? 'Official Gazette / Release' : 'Source Document'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#111426] font-serif leading-snug">
              {article.title}
            </h1>
          </div>

          {/* Why in News? */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl space-y-1.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-700" />
              <span>Why in News?</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed">
              {article.whyInNews || article.summary}
            </p>
          </div>

          {/* What Happened / Background */}
          {article.whatHappened && article.whatHappened !== article.whyInNews && (
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5 border-b border-stone-100 pb-1.5">
                <FileText className="w-4 h-4 text-[#35156B]" />
                <span>What Happened & Key Context</span>
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {article.whatHappened}
              </p>
            </div>
          )}

          {article.background && (
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-1.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-stone-600" />
                <span>Background & Significance</span>
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {article.background}
              </p>
            </div>
          )}

          {/* Structured Editorial Intelligence (If Present) */}
          {article.editorialAnalysis && (
            <div className="space-y-4 bg-purple-50/40 border border-purple-200/70 p-5 rounded-2xl">
              <div className="flex items-center gap-2 border-b border-purple-200 pb-2">
                <Scale className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-950">
                  Structured Editorial Analysis & Debate
                </h3>
              </div>

              {article.editorialAnalysis.coreArgument && (
                <div>
                  <span className="text-[11px] font-bold text-purple-900 block mb-1 uppercase tracking-wide">Core Editorial Thesis:</span>
                  <p className="text-xs sm:text-sm text-stone-800 italic bg-white p-3 rounded-xl border border-purple-100 shadow-2xs font-serif">
                    "{article.editorialAnalysis.coreArgument}"
                  </p>
                </div>
              )}

              {/* Arguments For & Against */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {article.editorialAnalysis.argumentsFor && article.editorialAnalysis.argumentsFor.length > 0 && (
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Arguments in Favor</span>
                    </span>
                    <ul className="space-y-1 text-xs text-stone-700">
                      {article.editorialAnalysis.argumentsFor.map((arg, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-700 font-bold">•</span>
                          <span>{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {article.editorialAnalysis.argumentsAgainst && article.editorialAnalysis.argumentsAgainst.length > 0 && (
                  <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-950 uppercase tracking-wide flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                      <span>Challenges & Counter-Arguments</span>
                    </span>
                    <ul className="space-y-1 text-xs text-stone-700">
                      {article.editorialAnalysis.argumentsAgainst.map((arg, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-700 font-bold">•</span>
                          <span>{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Constitutional & Policy Dimensions */}
              {article.editorialAnalysis.constitutionalDimensions && article.editorialAnalysis.constitutionalDimensions.length > 0 && (
                <div className="space-y-1 bg-white p-3.5 rounded-xl border border-purple-100">
                  <span className="text-[11px] font-bold text-purple-950 uppercase tracking-wider block">
                    Constitutional & Statutory Articles Linked:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {article.editorialAnalysis.constitutionalDimensions.map((cd, i) => (
                      <span key={i} className="text-xs bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg font-medium">
                        {cd}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Key Facts & Parameters */}
          {article.keyFacts && article.keyFacts.length > 0 && (
            <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-stone-600" />
                <span>Key Facts & Parameters</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
                {article.keyFacts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#35156B] mt-2 shrink-0" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prelims & Mains Value Addition Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prelims Takeaways */}
            {article.prelimsPointers && article.prelimsPointers.length > 0 && (
              <div className="bg-[#35156B]/5 border border-[#35156B]/20 p-4 rounded-2xl space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#35156B] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#35156B]" />
                  <span>Prelims High-Yield Pointers</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-stone-700">
                  {article.prelimsPointers.map((ptr, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#35156B] font-bold">•</span>
                      <span>{ptr}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mains Value Addition */}
            {article.mainsDimensions && Object.keys(article.mainsDimensions).length > 0 && (
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#35156B]" />
                  <span>Mains Dimensions</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {Object.entries(article.mainsDimensions).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-bold text-[#35156B] uppercase block text-[10px]">{k.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-stone-700">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bihar Specific Relevance */}
          {article.biharRelevance && (
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl space-y-1">
              <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                <span>BPSC & Bihar State Specific Angle:</span>
              </h3>
              <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed pl-5">
                {article.biharRelevance}
              </p>
            </div>
          )}

          {/* Connected PYQ Linkages */}
          {article.editorialAnalysis?.pyqLinkages && article.editorialAnalysis.pyqLinkages.length > 0 && (
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#35156B]" />
                <span>Connected Previous Year Questions (PYQs)</span>
              </h3>
              <div className="space-y-2">
                {article.editorialAnalysis.pyqLinkages.map((pyq, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#35156B]">
                      <span>{pyq.exam} {pyq.year} • {pyq.paper}</span>
                      <span className="text-stone-500 font-normal">{pyq.topic}</span>
                    </div>
                    <p className="text-xs text-stone-800 font-serif italic">
                      "{pyq.questionText}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Sticky Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/80 rounded-b-3xl flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAskTutor}
              className="text-xs font-bold text-amber-300 bg-[#35156B] hover:bg-[#4B1F78] px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Discuss with AI Tutor</span>
            </button>

            {copied && (
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Copied reference to clipboard!
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-xs font-bold text-stone-600 bg-white hover:bg-stone-100 border border-stone-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Close Reader
          </button>
        </div>

      </div>
    </div>
  );
};
