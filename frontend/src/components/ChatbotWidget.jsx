import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, Bot, User, Sparkles, 
  Trash2, ArrowRight, Compass, ShieldCheck, MapPin, ExternalLink, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatbotService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "👋 **Hello! I'm Aura, your AI Travel Copilot.**\n\nAsk me about destination ideas, 5-day weather forecasts, packing lists, transit routes, itemized cost estimates, or local cuisines!",
      suggestions: [
        "Suggest trips under ₹15,000",
        "Weather in Munnar",
        "3-Day plan for Munnar",
        "Houseboats in Alleppey"
      ],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const navigate = useNavigate();
  
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendQuery = async (queryText) => {
    const textToSend = queryText.trim();
    if (!textToSend || loading) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatbotService.sendMessage(textToSend);
      const botMsg = {
        sender: 'bot',
        text: res.response || "Here is what I found for your journey.",
        suggestions: res.suggestions && res.suggestions.length > 0 ? res.suggestions : [
          "Suggest hill stations",
          "Places under ₹15,000",
          "Weather in Munnar"
        ],
        action: res.action,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        sender: 'bot',
        text: "⚠️ I had trouble connecting to the travel knowledge base. Please check your connection or try asking about **Munnar**, **Alleppey**, or **Varkala**!",
        suggestions: ["Suggest places under ₹15,000", "Weather in Munnar", "Houseboats in Alleppey"],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    sendQuery(input);
  };

  const handleActionClick = (action) => {
    if (!action || !action.url) return;
    setIsOpen(false);
    navigate(action.url);
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: "👋 Chat cleared! How can I assist your travel plans now?",
        suggestions: ["Places under ₹15,000", "Weather in Munnar", "3-Day plan for Munnar", "Houseboats in Alleppey"],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Helper to format basic markdown (bold, bullet points, headers)
  const formatText = (content) => {
    if (!content) return null;
    const lines = content.split('\n');

    return lines.map((line, lIdx) => {
      // Check for bullet point
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('*') || line.trim().startsWith('-');
      const cleanLine = isBullet ? line.replace(/^[\s•*-]+/, '') : line;

      // Parse bold **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-extrabold text-cyan-200">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lIdx} className="flex items-start space-x-1.5 my-0.5 ml-1">
            <span className="text-cyan-400 font-bold text-xs leading-5">•</span>
            <span className="flex-1 leading-relaxed">{formattedParts}</span>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={lIdx} className="h-2" />;
      }

      return (
        <p key={lIdx} className="leading-relaxed my-0.5">
          {formattedParts}
        </p>
      );
    });
  };

  // Get active suggestions from latest bot message or defaults
  const currentSuggestions = messages.length > 0 && messages[messages.length - 1].sender === 'bot' && messages[messages.length - 1].suggestions
    ? messages[messages.length - 1].suggestions
    : ["Places under ₹15,000", "Weather in Munnar", "3-Day plan for Munnar", "Houseboats in Alleppey"];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* ── 1. Floating Action Button ── */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative group"
        >
          {/* Unread / Attention tooltip */}
          {hasUnread && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setIsOpen(true)}
              className="absolute -top-12 right-0 bg-[#0e1e38] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-cyan-500/40 shadow-xl whitespace-nowrap flex items-center space-x-1.5 cursor-pointer hover:border-cyan-400 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
              <span>Ask AI Travel Copilot</span>
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[#0e1e38] border-b border-r border-cyan-500/40 transform rotate-45"></div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_8px_30px_rgba(37,99,235,0.45)] transition-all duration-300 relative border border-white/20 hover:shadow-cyan-500/30"
            aria-label="Open AI Travel Chatbot"
          >
            <Bot className="h-6 w-6 text-white animate-bounce-subtle" />
            <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-emerald-400 rounded-full border-2 border-[#07111f] shadow-sm"></span>
          </motion.button>
        </motion.div>
      )}

      {/* ── 2. Expandable Chat Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 30 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="w-[360px] sm:w-[420px] h-[600px] max-h-[85vh] rounded-3xl bg-[#0b1528] border border-slate-700/80 shadow-[0_20px_60px_rgba(2,8,23,0.7)] flex flex-col overflow-hidden text-left"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0f2142] via-[#122850] to-[#0c1c38] px-5 py-4 flex items-center justify-between text-white border-b border-slate-700/70 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="p-2.5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-inner text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-[#0b1528]"></span>
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-black text-sm text-white tracking-tight">Aura Travel Copilot</h3>
                    <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-400/30">AI 2.0</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center mt-0.5 font-medium">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                    Instant Destination & Cost Advisor
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close Chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Conversation History Stream */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#07111f]/60 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/30 text-cyan-300 flex items-center justify-center mr-2 flex-shrink-0 border border-cyan-500/30 shadow-sm mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[84%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs shadow-md ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none'
                          : 'bg-[#12203a] text-slate-200 border border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      <div className="text-xs">{formatText(msg.text)}</div>

                      {/* Interactive Action Button if attached */}
                      {msg.action && (
                        <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center">
                          <button
                            onClick={() => handleActionClick(msg.action)}
                            className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow transition-all hover:scale-[1.02] active:scale-95"
                          >
                            <span>{msg.action.label || "Open Link"}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      <span
                        className={`text-[8px] block text-right mt-1.5 font-semibold ${
                          msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing / Loading Animation */}
              {loading && (
                <div className="flex items-start">
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/30 text-cyan-300 flex items-center justify-center mr-2 flex-shrink-0 border border-cyan-500/30 shadow-sm mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-[#12203a] rounded-2xl rounded-tl-none border border-slate-700/80 px-4 py-3 flex space-x-1.5 items-center shadow-md">
                    <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Quick Contextual Suggestions Pills */}
            <div className="bg-[#0b1528] px-4 py-2.5 border-t border-slate-800/90 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {currentSuggestions.slice(0, 4).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendQuery(q)}
                  disabled={loading}
                  className="text-[10px] font-bold bg-[#142542] hover:bg-[#1a3159] border border-slate-700/80 hover:border-cyan-500/60 px-2.5 py-1 rounded-lg text-slate-300 hover:text-cyan-200 transition-all flex items-center space-x-1 shadow-sm disabled:opacity-50"
                >
                  <Sparkles className="h-2.5 w-2.5 text-cyan-400 shrink-0" />
                  <span>{q}</span>
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-[#0c182e] border-t border-slate-700/80 flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about budgets, weather, routes, packing..."
                className="flex-grow bg-[#07111f] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow disabled:opacity-40 disabled:pointer-events-none hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
