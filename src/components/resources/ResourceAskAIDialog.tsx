import React, { useState } from 'react';
import { Bot, Sparkles, Send, X, BookOpen, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { LearningResource } from '../../types/index.js';

interface ResourceAskAIDialogProps {
  resource: LearningResource;
  currentPage?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ResourceAskAIDialog: React.FC<ResourceAskAIDialogProps> = ({
  resource,
  currentPage = 1,
  isOpen,
  onClose,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; citations?: string[] }>>([
    {
      role: 'assistant',
      text: `Hello Aspirant! I am your IKSHOVIA AI Tutor, actively grounded in **${resource.title}** (Page ${currentPage}). Ask me any conceptual doubt, request a plain-language summary, or generate high-yield exam practice questions directly from this document.`,
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    if (!customPrompt) setPrompt('');
    setLoading(true);

    try {
      const res = await api.askAITutor({
        prompt: userMsg,
        context: {
          resourceId: resource.id,
          resourceTitle: resource.title,
          subjectName: resource.subject,
          pageNumber: currentPage,
        },
      });

      const responseText = res?.text || res?.answer || res?.response || 'Could not retrieve AI response.';
      setMessages((prev) => [...prev, { role: 'assistant', text: responseText }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **AI Tutor Service Notice**: Could not complete query at this time (${err.message || 'Network error'}). Please try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickChips = [
    { label: `Explain Page ${currentPage} Simply`, prompt: `Explain the key concepts of Page ${currentPage} from "${resource.title}" in clear, plain language with analogies.` },
    { label: 'Summarize Key Exam Points', prompt: `Summarize the high-yield Prelims & Mains exam takeaways from "${resource.title}" (Page ${currentPage}).` },
    { label: 'Generate 1 Prelims MCQ', prompt: `Generate 1 challenging civil services Prelims MCQ based on the concepts on Page ${currentPage} of "${resource.title}" with 4 options and detailed explanation.` },
    { label: 'Mains 150-Word Structure', prompt: `Provide a 150-word structured Mains answer format (Intro, Body Points, Conclusion) based on "${resource.title}".` },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full h-[88vh] max-h-[700px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white truncate">IKSHOVIA Grounded AI Tutor</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/30 text-amber-300 border border-amber-400/30">
                  Page {currentPage}
                </span>
              </div>
              <p className="text-xs text-stone-300 truncate mt-0.5">
                Grounded in: <span className="text-stone-100 font-medium">{resource.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition hover:bg-stone-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Chips */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0 mr-1">Quick:</span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip.prompt)}
              disabled={loading}
              className="px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg whitespace-nowrap transition shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-100/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-stone-800 border border-stone-200 shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.text}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-stone-400 text-xs py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              <span>Analyzing grounded chunks & generating answer...</span>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-stone-200 bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder={`Ask about "${resource.title}"...`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};
