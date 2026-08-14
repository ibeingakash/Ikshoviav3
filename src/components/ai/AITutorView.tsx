import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { ChatConversation, ChatMessage } from '../../types/index.js';

const parseInlineText = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`b-${i}`} className="font-bold text-stone-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`c-${i}`} className="bg-amber-50 text-amber-900 px-1 py-0.5 rounded text-[11px] font-mono border border-amber-200/60">{part.slice(1, -1)}</code>;
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
            <pre key={`code-${idx}`} className="bg-[#0B132B] text-amber-200 p-3.5 rounded-xl overflow-x-auto text-xs font-mono border border-slate-800 my-2">
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

          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            inTable = true;
            tableBuffer.push(trimmed);
            continue;
          } else if (inTable) {
            inTable = false;
            elements.push(renderMarkdownTable(tableBuffer, `tbl-${idx}-${lIdx}`));
            tableBuffer = [];
          }

          if (!trimmed) {
            elements.push(<div key={`empty-${idx}-${lIdx}`} className="h-1" />);
            continue;
          }

          if (trimmed.startsWith('### ')) {
            elements.push(
              <h4 key={`h4-${idx}-${lIdx}`} className="text-sm font-bold text-stone-900 mt-2 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{parseInlineText(trimmed.slice(4))}</span>
              </h4>
            );
            continue;
          }
          if (trimmed.startsWith('## ')) {
            elements.push(
              <h3 key={`h3-${idx}-${lIdx}`} className="text-base font-serif-editorial font-bold text-stone-900 mt-3 mb-1">
                {parseInlineText(trimmed.slice(3))}
              </h3>
            );
            continue;
          }
          if (trimmed.startsWith('# ')) {
            elements.push(
              <h2 key={`h2-${idx}-${lIdx}`} className="text-lg font-serif-editorial font-bold text-[#111827] mt-3 mb-1">
                {parseInlineText(trimmed.slice(2))}
              </h2>
            );
            continue;
          }

          if (trimmed.startsWith('> ')) {
            elements.push(
              <blockquote key={`bq-${idx}-${lIdx}`} className="border-l-2 border-amber-600 pl-3 py-1 my-1.5 text-xs text-amber-950 italic bg-amber-50/60 rounded-r">
                {parseInlineText(trimmed.slice(2))}
              </blockquote>
            );
            continue;
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            elements.push(
              <li key={`li-${idx}-${lIdx}`} className="ml-4 list-disc text-xs sm:text-sm leading-relaxed text-stone-700 my-0.5">
                {parseInlineText(trimmed.slice(2))}
              </li>
            );
            continue;
          }

          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            elements.push(
              <div key={`num-${idx}-${lIdx}`} className="ml-2 flex items-start gap-1.5 text-xs sm:text-sm leading-relaxed text-stone-700 my-0.5">
                <span className="font-bold text-amber-800 font-mono text-xs">{numMatch[1]}.</span>
                <span>{parseInlineText(numMatch[2])}</span>
              </div>
            );
            continue;
          }

          elements.push(
            <p key={`p-${idx}-${lIdx}`} className="text-xs sm:text-sm leading-relaxed text-stone-800">
              {parseInlineText(trimmed)}
            </p>
          );
        }

        if (inTable && tableBuffer.length > 0) {
          elements.push(renderMarkdownTable(tableBuffer, `tbl-end-${idx}`));
        }

        return <div key={`block-${idx}`} className="space-y-1">{elements}</div>;
      })}
    </div>
  );
};

const renderMarkdownTable = (tableLines: string[], keyIdx: string | number) => {
  if (tableLines.length < 2) return null;
  const headerLine = tableLines[0];
  const bodyLines = tableLines.filter(l => !l.includes('---'));
  const headers = headerLine.split('|').map(c => c.trim()).filter(c => c.length > 0);

  return (
    <div key={keyIdx} className="overflow-x-auto my-3 rounded-xl border border-stone-200 shadow-2xs">
      <table className="min-w-full text-xs text-left">
        <thead className="bg-amber-50/80 text-amber-900 font-bold border-b border-stone-200">
          <tr>
            {headers.map((h, i) => (
              <th key={`th-${i}`} className="px-3 py-2 border-r border-stone-200 last:border-0">{parseInlineText(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {bodyLines.slice(1).map((rowStr, rIdx) => {
            const cells = rowStr.split('|').map(c => c.trim()).filter(c => c.length > 0);
            return (
              <tr key={`tr-${rIdx}`} className="hover:bg-stone-50/60">
                {cells.map((cell, cIdx) => (
                  <td key={`td-${rIdx}-${cIdx}`} className="px-3 py-2 border-r border-stone-100 last:border-0 text-stone-700">{parseInlineText(cell)}</td>
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
    aiContext,
    setAiContext,
    pendingAiPrompt,
    setPendingAiPrompt,
  } = useLearner();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [inputPrompt, setInputPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [convError, setConvError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const activeConv = safeConversations.find(c => c.id === activeConvId) || safeConversations[0] || null;

  const loadConversations = async () => {
    setLoadingConvs(true);
    setConvError(null);
    try {
      const convs = await api.getConversations();
      const validArray = Array.isArray(convs) ? convs : [];
      setConversations(validArray);
      if (validArray.length > 0) {
        setActiveConvId(validArray[0].id);
      } else {
        setActiveConvId('');
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setConvError(err.message || 'Unable to load conversations.');
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages, sending]);

  useEffect(() => {
    if (pendingAiPrompt && !sending) {
      const p = pendingAiPrompt;
      setPendingAiPrompt(null);
      handleSendMessage(p.prompt, p.quickAction);
    }
  }, [pendingAiPrompt]);

  const handleNewConversation = async (): Promise<ChatConversation | null> => {
    try {
      setConvError(null);
      const newConv = await api.createConversation('New AI Tutor Session');
      setConversations(prev => [newConv, ...(Array.isArray(prev) ? prev : [])]);
      setActiveConvId(newConv.id);
      return newConv;
    } catch (err: any) {
      console.error('Failed to create new conversation:', err);
      setConvError('Unable to create new conversation.');
      return null;
    }
  };

  const handleSendMessage = async (customPrompt?: string, quickAction?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || sending) return;

    if (!customPrompt) setInputPrompt('');
    setSending(true);

    try {
      let targetConvId = activeConvId;
      if (!targetConvId && safeConversations.length > 0) {
        targetConvId = safeConversations[0].id;
      }

      if (!targetConvId) {
        const created = await handleNewConversation();
        if (!created) {
          setSending(false);
          return;
        }
        targetConvId = created.id;
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
          (Array.isArray(prev) ? prev : []).map(c => (c.id === res.conversation.id ? res.conversation : c))
        );
      } else {
        const refreshed = await api.getConversations();
        setConversations(Array.isArray(refreshed) ? refreshed : []);
      }
    } catch (err) {
      console.error('Failed to send AI tutor message:', err);
    } finally {
      setSending(false);
    }
  };

  const compactQuickActions = [
    { label: 'Explain Concept', action: 'EXPLAIN' },
    { label: 'Simplify', action: 'SIMPLIFY' },
    { label: 'Give Examples', action: 'EXAMPLE' },
    { label: 'Compare', action: 'COMPARE' },
    { label: 'Test Me', action: 'TEST' },
    { label: 'Why Was I Wrong?', action: 'DIAGNOSE_MISTAKE' },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-12 max-w-6xl mx-auto font-sans-editorial">
      
      {/* Top Header & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif-editorial font-bold text-[#111827] flex items-center gap-2">
              <Bot className="w-6 h-6 text-amber-700" />
              <span>Personal AI Tutor</span>
            </h1>
          </div>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Context: <strong className="text-stone-800">{user?.onboarding?.targetExam || 'UPSC CSE 2026'}</strong> • Source-Grounded Learning Assistant
          </p>
        </div>

        {aiContext && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/90 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-900">
            <span className="truncate max-w-xs">Topic Context: {aiContext.conceptTitle || aiContext.questionText}</span>
            <button
              onClick={() => setAiContext(null)}
              className="text-stone-400 hover:text-rose-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace Layout: Sessions Sidebar + Workspace Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[520px]">
        
        {/* Left: Conversation Sidebar */}
        <div className="lg:col-span-3 bg-white border border-stone-200/90 rounded-2xl p-3.5 space-y-3 shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                SESSIONS
              </span>
              <button
                onClick={handleNewConversation}
                className="p-1 rounded-lg bg-[#0B132B] text-amber-400 hover:bg-[#121D3B] border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="New Session"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {safeConversations.map(c => {
                const isActive = c.id === activeConvId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold'
                        : 'bg-white border-transparent text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="truncate">{c.title || 'Study Session'}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                      {new Date(c.updatedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 text-[10px] text-stone-400 text-center font-mono">
            Source-Grounded AI Engine
          </div>
        </div>

        {/* Right: Main Tutor Workspace Chat */}
        <div className="lg:col-span-9 bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
          
          {/* Messages Area */}
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {activeConv?.messages && activeConv.messages.length > 0 ? (
              activeConv.messages.map((m: ChatMessage) => {
                const isUser = m.role === 'user';
                const { mainText, followUps } = isUser ? { mainText: m.text, followUps: [] } : extractSuggestedFollowUps(m.text);

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#0B132B] text-white rounded-br-2xs shadow-2xs'
                          : 'bg-[#FBF9F5] border border-stone-200/90 text-stone-800 rounded-bl-2xs shadow-2xs'
                      }`}
                    >
                      {isUser ? (
                        <p>{m.text}</p>
                      ) : (
                        <FormattedMarkdownMessage text={mainText} />
                      )}
                    </div>

                    {/* Follow-up Pill Recommendations */}
                    {!isUser && followUps.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 pl-1">
                        {followUps.map((fu, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => handleSendMessage(fu)}
                            className="text-[11px] font-semibold bg-white hover:bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1 rounded-full transition-all cursor-pointer shadow-2xs"
                          >
                            {fu}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-base font-serif-editorial font-bold text-stone-900">IKSHOVIA Personal Learning Tutor</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  Start your first learning session. Ask any question about Polity, Economy, History, or Current Affairs.
                </p>
              </div>
            )}

            {sending && (
              <div className="flex items-center gap-2 text-xs text-amber-800 font-bold bg-amber-50/60 p-3 rounded-xl border border-amber-100 max-w-xs">
                <div className="w-3.5 h-3.5 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                <span>Analyzing Syllabus Sources...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Actions Row & Composer */}
          <div className="space-y-3 pt-3 border-t border-stone-100">
            
            {/* Suggested Actions */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
              <span className="text-[10px] font-mono font-bold text-stone-400 shrink-0 uppercase">QUICK:</span>
              {compactQuickActions.map(qa => (
                <button
                  key={qa.action}
                  onClick={() => handleSendMessage(undefined, qa.action)}
                  className="text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer border border-stone-200"
                >
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Input Composer Box */}
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl p-2 focus-within:border-amber-500 transition-colors">
              <input
                type="text"
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask your query or concept doubt..."
                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none px-2"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={sending || !inputPrompt.trim()}
                className="p-2.5 bg-[#0B132B] hover:bg-[#121D3B] disabled:opacity-50 text-amber-400 rounded-lg transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
