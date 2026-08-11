import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Plus,
  Sparkles,
  MessageSquare,
  Brain,
  X,
  HelpCircle,
  FileText,
  BarChart2,
  BookOpen,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { ChatConversation, ChatMessage } from '../../types/index.js';

const parseInlineText = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-amber-300">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded text-[11px] font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const FormattedMarkdownMessage: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const blocks = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {blocks.map((block, idx) => {
        if (block.startsWith('```')) {
          const lines = block.slice(3, -3).trim().split('\n');
          const code = lines.join('\n');
          return (
            <pre key={idx} className="bg-slate-900 text-amber-200 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-slate-800 my-2">
              <code>{code}</code>
            </pre>
          );
        }

        const lines = block.split('\n');
        const elements: React.ReactNode[] = [];
        let inTable = false;
        let tableBuffer: string[] = [];

        for (let lIdx = 0; lIdx < lines.length; lIdx++) {
          const line = lines[lIdx];
          const trimmed = line.trim();

          // Table detection
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            inTable = true;
            tableBuffer.push(trimmed);
            continue;
          } else if (inTable) {
            inTable = false;
            elements.push(renderMarkdownTable(tableBuffer, lIdx));
            tableBuffer = [];
          }

          if (!trimmed) {
            elements.push(<div key={lIdx} className="h-1" />);
            continue;
          }

          if (trimmed.startsWith('### ')) {
            elements.push(
              <h4 key={lIdx} className="text-sm font-bold text-amber-400 font-serif mt-2 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{parseInlineText(trimmed.slice(4))}</span>
              </h4>
            );
            continue;
          }
          if (trimmed.startsWith('## ')) {
            elements.push(
              <h3 key={lIdx} className="text-base font-bold text-amber-300 font-serif mt-3 mb-1">
                {parseInlineText(trimmed.slice(3))}
              </h3>
            );
            continue;
          }
          if (trimmed.startsWith('# ')) {
            elements.push(
              <h2 key={lIdx} className="text-lg font-extrabold text-amber-200 font-serif mt-3 mb-1">
                {parseInlineText(trimmed.slice(2))}
              </h2>
            );
            continue;
          }

          if (trimmed.startsWith('> ')) {
            elements.push(
              <blockquote key={lIdx} className="border-l-2 border-amber-500 pl-3 py-1 my-1.5 text-xs text-amber-200/90 italic bg-amber-950/20 rounded-r">
                {parseInlineText(trimmed.slice(2))}
              </blockquote>
            );
            continue;
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            elements.push(
              <li key={lIdx} className="ml-4 list-disc text-xs sm:text-sm leading-relaxed text-slate-200 my-0.5">
                {parseInlineText(trimmed.slice(2))}
              </li>
            );
            continue;
          }

          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            elements.push(
              <div key={lIdx} className="ml-2 flex items-start gap-1.5 text-xs sm:text-sm leading-relaxed text-slate-200 my-0.5">
                <span className="font-bold text-amber-400 font-mono text-xs">{numMatch[1]}.</span>
                <span>{parseInlineText(numMatch[2])}</span>
              </div>
            );
            continue;
          }

          elements.push(
            <p key={lIdx} className="text-xs sm:text-sm leading-relaxed text-slate-200">
              {parseInlineText(trimmed)}
            </p>
          );
        }

        if (inTable && tableBuffer.length > 0) {
          elements.push(renderMarkdownTable(tableBuffer, idx + 999));
        }

        return <div key={idx} className="space-y-1">{elements}</div>;
      })}
    </div>
  );
};

const renderMarkdownTable = (tableLines: string[], keyIdx: number) => {
  if (tableLines.length < 2) return null;
  const headerLine = tableLines[0];
  const bodyLines = tableLines.filter(l => !l.includes('---'));
  const headers = headerLine.split('|').map(c => c.trim()).filter(c => c.length > 0);

  return (
    <div key={keyIdx} className="overflow-x-auto my-3 rounded-lg border border-slate-700/60 shadow-sm">
      <table className="min-w-full text-xs text-left">
        <thead className="bg-amber-950/50 text-amber-300 font-bold border-b border-slate-700/60">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 border-r border-slate-700/40 last:border-0">{parseInlineText(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {bodyLines.slice(1).map((rowStr, rIdx) => {
            const cells = rowStr.split('|').map(c => c.trim()).filter(c => c.length > 0);
            return (
              <tr key={rIdx} className="hover:bg-slate-800/30">
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 border-r border-slate-800/40 last:border-0 text-slate-200">{parseInlineText(cell)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const extractSuggestedFollowUps = (text: string): { mainText: string; followUps: string[] } => {
  const followUpIndex = text.indexOf('**Suggested Follow-Ups:**');
  if (followUpIndex === -1) {
    return { mainText: text, followUps: [] };
  }

  const mainText = text.slice(0, followUpIndex).trim();
  const followUpLines = text.slice(followUpIndex).split('\n');
  const followUps: string[] = [];

  for (const line of followUpLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      let promptText = trimmed.slice(2).trim();
      if (promptText.startsWith('[') && promptText.endsWith(']')) {
        promptText = promptText.slice(1, -1).trim();
      }
      if (promptText) {
        followUps.push(promptText);
      }
    }
  }

  return { mainText, followUps };
};

export const AITutorView: React.FC = () => {
  const { user } = useAuth();
  const {
    selectedConceptId,
    learnerModel,
    appTheme,
    aiContext,
    setAiContext,
    pendingAiPrompt,
    setPendingAiPrompt,
  } = useLearner();
  const isParchment = appTheme === 'upsc-parchment';
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [inputPrompt, setInputPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api.getConversations().then(convs => {
      setConversations(convs);
      if (convs.length > 0) {
        setActiveConvId(convs[0].id);
      }
    });
  }, []);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages, sending]);

  // Handle pending prompt auto-send if triggered from PracticeView or LearnView
  useEffect(() => {
    if (pendingAiPrompt && !sending) {
      const p = pendingAiPrompt;
      setPendingAiPrompt(null);
      handleSendMessage(p.prompt, p.quickAction);
    }
  }, [pendingAiPrompt]);

  const handleSendMessage = async (customPrompt?: string, quickAction?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || sending) return;

    if (!customPrompt) setInputPrompt('');
    setSending(true);

    try {
      let targetConvId = activeConvId;
      if (!targetConvId && conversations.length > 0) {
        targetConvId = conversations[0].id;
      }

      if (!targetConvId) {
        const newConvs = await api.getConversations();
        targetConvId = newConvs[0].id;
        setActiveConvId(targetConvId);
      }

      const res = await api.sendChatMessage(
        targetConvId,
        textToSend,
        selectedConceptId || undefined,
        quickAction,
        aiContext || undefined
      );

      if (res.conversation) {
        setConversations(prev =>
          prev.map(c => (c.id === res.conversation.id ? res.conversation : c))
        );
      }
    } catch (err) {
      console.error('Failed to send AI tutor message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const res = await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, title: 'New AI Tutor Session' }),
      });
      const newConv = await res.json();
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(newConv.id);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  const quickActions = [
    { label: 'Explain Concept', action: 'EXPLAIN' },
    { label: 'Simplify Topic', action: 'SIMPLIFY' },
    { label: 'Give Exam Examples', action: 'EXAMPLE' },
    { label: 'Compare Terms', action: 'COMPARE' },
    { label: 'Test Me with MCQ', action: 'TEST' },
    { label: 'Why Was I Wrong?', action: 'WHY_WRONG' },
    { label: 'Revision Notes', action: 'NOTES' },
    { label: 'PYQ Angle', action: 'PYQ' },
    { label: 'Mains Angle', action: 'MAINS' },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-12 max-w-6xl mx-auto">
      {/* View Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
        isParchment ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div>
          <h1 className={`text-2xl font-extrabold flex items-center gap-2 font-serif ${
            isParchment ? 'text-[#0F1E36]' : 'text-white'
          }`}>
            <Bot className="w-6 h-6 text-amber-500" />
            <span>IKSHOVIA AI Civil Services Personal Tutor</span>
          </h1>
          <p className={`text-xs mt-0.5 ${isParchment ? 'text-slate-600' : 'text-slate-400'}`}>
            Context-aware tutor tailored to {user?.onboarding?.targetExam || 'UPSC CSE'}, your mastery score ({learnerModel?.overallScore || 70}%), and real-time active context.
          </p>
        </div>

        <button
          onClick={handleNewConversation}
          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 self-start shadow-sm"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Session</span>
        </button>
      </div>

      {/* Main Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-210px)] min-h-[520px]">
        {/* Sidebar Conversations (3 cols) */}
        <div className={`hidden lg:flex lg:col-span-3 rounded-2xl p-3 flex-col gap-2 overflow-y-auto border ${
          isParchment ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-200'
        }`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 flex items-center justify-between ${
            isParchment ? 'text-amber-900 font-serif' : 'text-slate-500'
          }`}>
            <span>Sessions History</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
              {conversations.length}
            </span>
          </div>

          <div className="space-y-1 flex-1">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                  c.id === activeConvId
                    ? isParchment
                      ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-bold'
                      : 'bg-indigo-950 border-indigo-700 text-indigo-200 font-bold'
                    : isParchment
                    ? 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                    : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span className="truncate flex-1">{c.title}</span>
              </button>
            ))}
          </div>

          {/* AI Context Box */}
          <div className={`border rounded-xl p-3 text-[11px] space-y-1.5 ${
            isParchment ? 'bg-amber-50/80 border-amber-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}>
            <div className="font-bold text-amber-500 flex items-center gap-1 font-serif">
              <Brain className="w-3.5 h-3.5 text-amber-500" />
              <span>Learner Model Active</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Adjusts tone according to mastery level ({learnerModel?.overallScore || 70}%) & confidence bias ({learnerModel?.confidenceBias || 'BALANCED'}).
            </p>
          </div>
        </div>

        {/* Chat Feed (9 cols) */}
        <div className={`lg:col-span-9 rounded-2xl flex flex-col overflow-hidden border shadow-sm ${
          isParchment ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200 shadow-xl'
        }`}>
          {/* Active Context Banner if available */}
          {aiContext && (
            <div className="bg-amber-950/40 border-b border-amber-800/50 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2 overflow-hidden">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span className="font-bold shrink-0">Active Context:</span>
                <span className="truncate text-amber-300 font-medium">
                  {aiContext.questionText
                    ? `Practice Question: "${aiContext.questionText.slice(0, 50)}..."`
                    : aiContext.conceptTitle
                    ? `${aiContext.subjectName || 'GS'} → ${aiContext.conceptTitle}`
                    : 'Custom Study Context'}
                </span>
              </div>
              <button
                onClick={() => setAiContext(null)}
                className="text-amber-400 hover:text-amber-200 flex items-center gap-1 shrink-0 ml-2 text-[11px] font-bold"
              >
                <span>Clear</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Action Bar */}
          <div className={`p-2.5 border-b flex items-center gap-2 overflow-x-auto scrollbar-none ${
            isParchment ? 'bg-amber-50/60 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1 font-serif">
              <Sparkles className="w-3 h-3 text-amber-500" /> Actions:
            </span>
            {quickActions.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(`Execute quick action: ${qa.label}`, qa.action)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap border ${
                  isParchment
                    ? 'bg-white hover:bg-amber-100 border-amber-300 text-amber-950'
                    : 'bg-slate-800 hover:bg-amber-950/60 hover:border-amber-700/60 border-slate-700 text-slate-300'
                }`}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {activeConv?.messages.map(msg => {
              const isUser = msg.role === 'user';
              const { mainText, followUps } = isUser
                ? { mainText: msg.text, followUps: [] }
                : extractSuggestedFollowUps(msg.text);

              return (
                <div key={msg.id} className="space-y-2">
                  <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center shrink-0 text-white shadow-sm border border-amber-400">
                        <Bot className="w-4.5 h-4.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[82%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#0F1E36] text-amber-300 rounded-tr-none font-medium shadow-sm'
                          : isParchment
                          ? 'bg-amber-50/90 text-slate-900 border border-amber-200/90 rounded-tl-none font-serif shadow-sm'
                          : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none font-sans'
                      }`}
                    >
                      {isUser ? msg.text : <FormattedMarkdownMessage text={mainText} />}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-950 font-bold text-xs shadow-sm">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>

                  {/* Render Suggested Follow-Up Pill Buttons */}
                  {!isUser && followUps.length > 0 && (
                    <div className="ml-11 flex flex-wrap gap-2 pt-1">
                      <span className="w-full text-[10px] font-bold text-amber-500 uppercase tracking-wider font-serif">
                        Click to ask follow-up:
                      </span>
                      {followUps.map((fu, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => handleSendMessage(fu)}
                          className="text-xs bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-amber-100 border border-amber-800/60 hover:border-amber-600 px-3 py-1.5 rounded-xl transition-all text-left flex items-center gap-1.5 shadow-sm"
                        >
                          <span>{fu}</span>
                          <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div className="flex items-center gap-2 text-xs text-amber-400 p-3 bg-amber-950/30 rounded-xl border border-amber-800/40 font-bold font-serif animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                <span>IKSHOVIA AI is generating personalized Civil Services tutor response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className={`p-3 border-t flex items-center gap-2 ${
            isParchment ? 'bg-amber-50/40 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <input
              type="text"
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask AI anything (e.g., Explain Article 21, What is CRISPR?, Compare WPI vs CPI)..."
              className={`flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none border ${
                isParchment
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                  : 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-amber-500'
              }`}
            />
            <button
              id="send-ai-chat-btn"
              onClick={() => handleSendMessage()}
              disabled={sending || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
