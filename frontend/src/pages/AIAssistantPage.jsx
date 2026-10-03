import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Bot, Send, Plus, Trash2, MessageSquare, Sparkles, AlertCircle, RefreshCw,
  Loader2, User, CheckCircle2, Shield, Calendar, Layers, Activity, HelpCircle,
  ChevronRight, ArrowRight, CornerDownLeft
} from 'lucide-react';

const STARTER_QUESTIONS = [
  "Summarize my overall financial performance this month.",
  "Where am I spending the most money?",
  "Show me unusual expenses or statistical outliers.",
  "How are my category budgets and financial goals progressing?",
  "Compare my current month income and expenses with last month."
];

const AIAssistantPage = () => {
  const { logout } = useAuth();
  const messagesEndRef = useRef(null);

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Input & Status State
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [activeProvider, setActiveProvider] = useState('AI Assistant');

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch list of user conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/ai/conversations');
      if (res.data.success) {
        setConversations(res.data.data);
        if (res.data.data.length > 0 && !activeConversationId) {
          loadConversation(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  // Load messages for specific conversation
  const loadConversation = async (conversationId) => {
    setActiveConversationId(conversationId);
    setLoading(true);
    setApiError('');
    try {
      const res = await api.get(`/ai/conversations/${conversationId}`);
      if (res.data.success) {
        setMessages(res.data.data.messages || []);
      }
    } catch (err) {
      console.error('Load conversation error:', err);
      setApiError('Failed to load conversation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle creating new conversation
  const handleNewConversation = async () => {
    setActiveConversationId(null);
    setMessages([]);
    setApiError('');
  };

  // Delete conversation
  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/ai/conversations/${id}`);
      if (res.data.success) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) {
          handleNewConversation();
        }
      }
    } catch (err) {
      console.error('Delete conversation error:', err);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    setInputMessage('');
    setApiError('');

    // Optimistically push user message to UI
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: query,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const payload = {
        message: query,
        conversation_id: activeConversationId
      };

      const res = await api.post('/ai/chat', payload);
      if (res.data.success) {
        const data = res.data.data;
        if (!activeConversationId) {
          setActiveConversationId(data.conversation_id);
          fetchConversations(); // refresh list
        }

        if (data.provider) {
          setActiveProvider(data.provider.toUpperCase());
        }

        const assistantMsg = {
          id: data.assistant_message?.id || (Date.now() + 1),
          role: 'assistant',
          content: data.message,
          intent: data.intent,
          sources: data.sources,
          created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setApiError('Failed to process message.');
      }
    } catch (err) {
      console.error('Send message error:', err);
      const msg = err.response?.data?.message || 'AI service is temporarily unavailable. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600/20 p-2 rounded-xl border border-purple-500/30 text-purple-400">
              <Bot className="w-6 h-6" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">AI Expense SaaS</span>
            <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20 font-medium">Phase 8 AI Assistant</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-sm text-slate-300 hover:text-white transition">Dashboard</Link>
            <Link to="/expenses" className="text-sm text-slate-300 hover:text-white transition">Expenses</Link>
            <Link to="/income" className="text-sm text-slate-300 hover:text-white transition">Income</Link>
            <Link to="/categories" className="text-sm text-slate-300 hover:text-white transition">Categories</Link>
            <Link to="/budgets" className="text-sm text-slate-300 hover:text-white transition">Budgets</Link>
            <Link to="/goals" className="text-sm text-slate-300 hover:text-white transition">Goals</Link>
            <Link to="/analytics" className="text-sm text-slate-300 hover:text-white transition">Analytics</Link>
            <Link to="/ai-assistant" className="text-sm font-semibold text-purple-400 border-b-2 border-purple-400 pb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Assistant
            </Link>
            <Link to="/profile" className="text-sm text-slate-300 hover:text-white transition">Profile</Link>
            <button
              onClick={logout}
              className="text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-xl transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6 h-[calc(100vh-5rem)]">
        
        {/* Sidebar: Conversation History */}
        <aside className="w-full md:w-72 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col shadow-xl flex-shrink-0">
          <button
            onClick={handleNewConversation}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 mb-4"
          >
            <Plus className="w-4 h-4" />
            New Financial Chat
          </button>

          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Past Conversations</div>

          <div className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {fetchingHistory ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map(n => <div key={n} className="h-10 bg-slate-800/50 animate-pulse rounded-xl" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-8 px-2">
                No past conversations found. Start a new session above!
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`group p-3 rounded-2xl cursor-pointer text-xs transition flex items-center justify-between border ${
                    activeConversationId === conv.id
                      ? 'bg-purple-600/15 border-purple-500/40 text-white font-semibold'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    title="Delete Conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <section className="flex-grow bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-xl overflow-hidden">
          
          {/* Header Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base flex items-center gap-2">
                  AI Financial Assistant
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                    Provider: {activeProvider}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Contextual financial explanations grounded in verified Pandas analytics</p>
              </div>
            </div>

            <button
              onClick={handleNewConversation}
              className="text-xs text-slate-400 hover:text-slate-200 border border-slate-800 px-3 py-1.5 rounded-xl transition"
            >
              Clear View
            </button>
          </div>

          {/* Message Thread Window */}
          <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-4">
            
            {/* Starter Banner if no messages */}
            {messages.length === 0 && !loading && (
              <div className="max-w-2xl mx-auto text-center space-y-6 py-6">
                <div className="p-4 bg-purple-600/10 text-purple-400 rounded-3xl border border-purple-500/20 w-fit mx-auto">
                  <Bot className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Ask your AI Financial Assistant</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    Get natural language summaries, period comparisons, budget progress analysis, and unusual spending breakdown based strictly on your verified data.
                  </p>
                </div>

                {/* Quick Questions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {STARTER_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="p-3 bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 rounded-2xl text-xs text-slate-300 hover:text-white transition flex items-center justify-between group"
                    >
                      <span className="leading-snug">{q}</span>
                      <CornerDownLeft className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Messages */}
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl rounded-3xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none shadow-lg'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl space-y-2'
                }`}>
                  {/* Assistant Meta Badges */}
                  {msg.role === 'assistant' && (
                    <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800/80 text-[10px]">
                      {msg.intent && (
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded uppercase font-semibold">
                          Intent: {msg.intent}
                        </span>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <span className="text-slate-400 font-mono">
                          Sources: {msg.sources.join(', ')}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans text-slate-100">
                    {msg.content}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-950/80 border border-slate-800 text-slate-400 rounded-3xl rounded-tl-none p-4 text-xs flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-bounce" />
                  <span>Analyzing verified financial data & generating context response...</span>
                </div>
              </div>
            )}

            {/* Error Callout Banner */}
            {apiError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{apiError}</span>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-[11px] font-semibold transition"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances, budgets, goals, anomalies, or trends..."
                disabled={loading}
                className="flex-grow bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs px-5 py-3 rounded-2xl transition flex items-center gap-2 shadow-lg shadow-purple-600/20 flex-shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 px-1">
              <span>Press Enter to send &bull; Shift + Enter for new line</span>
              <span>Protected by user isolation & AI prompt injection controls</span>
            </div>
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-3 text-center text-xs text-slate-500">
        AI Expense & Business Analytics SaaS &bull; Phase 8 AI Financial Assistant Module
      </footer>
    </div>
  );
};

export default AIAssistantPage;
