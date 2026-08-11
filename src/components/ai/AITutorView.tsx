import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Plus,
  Sparkles,
  MessageSquare,
  Trash2,
  Brain,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { ChatConversation, ChatMessage } from '../../types/index.js';

export const AITutorView: React.FC = () => {
  const { user } = useAuth();
  const { selectedConceptId, learnerModel, appTheme } = useLearner();
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
  }, [activeConv?.messages]);

  const handleSendMessage = async (customPrompt?: string, quickAction?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || sending) return;

    if (!customPrompt) setInputPrompt('');
    setSending(true);

    try {
      let targetConvId = activeConvId;
      if (!targetConvId) {
        const newConv = await api.getConversations();
        targetConvId = newConv[0].id;
        setActiveConvId(targetConvId);
      }

      const res = await api.sendChatMessage(targetConvId, textToSend, selectedConceptId || undefined, quickAction);
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
    const newC = await api.getConversations();
    setConversations(newC);
    setActiveConvId(newC[0].id);
  };

  const quickActions = [
    { label: 'Explain Concept', action: 'Explain' },
    { label: 'Simplify Topic', action: 'Simplify' },
    { label: 'Give Exam Examples', action: 'Example' },
    { label: 'Compare Terms', action: 'Compare' },
    { label: 'Test Me with MCQ', action: 'Test Me' },
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
            <Bot className="w-6 h-6 text-amber-600" />
            <span>IKSHOVIA AI Civil Services Personal Tutor</span>
          </h1>
          <p className={`text-xs mt-0.5 ${isParchment ? 'text-slate-600' : 'text-slate-400'}`}>
            Context-aware tutor tailored to {user?.onboarding?.targetExam || 'UPSC CSE'}, your mastery score ({learnerModel?.overallScore || 70}%), and weak concepts.
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-210px)] min-h-[500px]">
        {/* Sidebar Conversations (3 cols) */}
        <div className={`hidden lg:flex lg:col-span-3 rounded-2xl p-3 flex-col gap-2 overflow-y-auto border ${
          isParchment ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-200'
        }`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 flex items-center justify-between ${
            isParchment ? 'text-amber-900 font-serif' : 'text-slate-500'
          }`}>
            <span>Conversations</span>
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
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span className="truncate flex-1">{c.title}</span>
              </button>
            ))}
          </div>

          {/* AI Context Box */}
          <div className={`border rounded-xl p-3 text-[11px] space-y-1.5 ${
            isParchment ? 'bg-amber-50/80 border-amber-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}>
            <div className="font-bold text-amber-900 flex items-center gap-1 font-serif">
              <Brain className="w-3.5 h-3.5 text-amber-600" />
              <span>Learner Model Active</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">
              Tutor is aware of your confidence bias ({learnerModel?.confidenceBias}) and recent mistakes.
            </p>
          </div>
        </div>

        {/* Chat Feed (9 cols) */}
        <div className={`lg:col-span-9 rounded-2xl flex flex-col overflow-hidden border shadow-sm ${
          isParchment ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200 shadow-xl'
        }`}>
          {/* Quick Action Bar */}
          <div className={`p-3 border-b flex items-center gap-2 overflow-x-auto scrollbar-none ${
            isParchment ? 'bg-amber-50/60 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1 font-serif">
              <Sparkles className="w-3 h-3 text-amber-600" /> Quick AI:
            </span>
            {quickActions.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(`Execute quick action: ${qa.action}`, qa.action)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap border ${
                  isParchment
                    ? 'bg-white hover:bg-amber-100 border-amber-300 text-amber-950'
                    : 'bg-slate-800 hover:bg-indigo-900/60 border-slate-700 text-slate-300'
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
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center shrink-0 text-white shadow-sm border border-amber-400">
                      <Bot className="w-4.5 h-4.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#0F1E36] text-amber-300 rounded-tr-none font-medium shadow-sm'
                        : isParchment
                        ? 'bg-amber-50/90 text-slate-900 border border-amber-200/90 rounded-tl-none font-serif shadow-sm'
                        : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none font-sans whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-950 font-bold text-xs shadow-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div className="flex items-center gap-2 text-xs text-amber-700 p-2 font-bold font-serif">
                <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
                IKSHOVIA AI is generating personalized Civil Services response...
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
              placeholder="Ask AI anything (e.g., Explain Article 21, Compare WPI vs CPI, Give BPSC/UPSC example)..."
              className={`flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none border ${
                isParchment
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                  : 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-600'
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
