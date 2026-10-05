import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, User, Send, Sparkles, Trash2, ArrowRight, 
  Compass, MapPin, Sun, CloudRain, Car, Hotel, 
  Utensils, ShieldAlert, BookOpen, Layers, HelpCircle, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatbotService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "👋 **Welcome to the AuraTravel AI Assistant!**\n\nI can help you explore ideal destinations within your budget, generate day-wise schedules, provide 5-day weather advisories and packing lists, estimate itemized trip costs, and find top-rated hotels and dining.\n\nClick any topic starter below or type your question!",
      suggestions: [
        "Suggest trips under ₹15,000",
        "Weather in Munnar",
        "3-Day plan for Munnar",
        "Houseboats in Alleppey",
        "Cost estimate for Varkala"
      ],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const starterCards = [
    {
      title: "Budget Getaways",
      prompt: "Suggest best travel destinations in India under ₹15,000 budget",
      icon: Layers,
      color: "from-blue-600 to-cyan-500"
    },
    {
      title: "3-Day Itinerary",
      prompt: "Give me a 3-day personalized itinerary for Munnar with family",
      icon: Compass,
      color: "from-emerald-600 to-teal-500"
    },
    {
      title: "Weather & Packing",
      prompt: "What is the weather in Munnar and what should I pack?",
      icon: Sun,
      color: "from-amber-500 to-orange-500"
    },
    {
      title: "Transit & Routes",
      prompt: "How to reach Munnar and what are the transport fares?",
      icon: Car,
      color: "from-indigo-600 to-purple-500"
    },
    {
      title: "Itemized Cost",
      prompt: "Estimate cost for 2 people visiting Wayanad for 3 days",
      icon: Sparkles,
      color: "from-rose-600 to-pink-500"
    },
    {
      title: "Hotels & Stays",
      prompt: "Show recommended hotels and resorts in Munnar",
      icon: Hotel,
      color: "from-cyan-600 to-blue-500"
    }
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
        text: "⚠️ I had trouble retrieving travel details. Please check your connection or ask about popular destinations like **Munnar**, **Alleppey**, or **Varkala**!",
        suggestions: ["Places under ₹15,000", "Weather in Munnar", "Houseboats in Alleppey"],
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

  const clearChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: "👋 Conversation refreshed! What destination or travel question can I help you with?",
        suggestions: ["Places under ₹15,000", "Weather in Munnar", "3-Day plan for Munnar", "Houseboats in Alleppey"],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Helper to format basic markdown
  const formatText = (content) => {
    if (!content) return null;
    const lines = content.split('\n');

    return lines.map((line, lIdx) => {
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('*') || line.trim().startsWith('-');
      const cleanLine = isBullet ? line.replace(/^[\s•*-]+/, '') : line;

      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-extrabold text-cyan-200">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lIdx} className="flex items-start space-x-2 my-1 ml-1 text-slate-200">
            <span className="text-cyan-400 font-bold text-sm leading-relaxed">•</span>
            <span className="flex-1 leading-relaxed text-xs md:text-sm">{formattedParts}</span>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={lIdx} className="h-2.5" />;
      }

      return (
        <p key={lIdx} className="leading-relaxed my-1 text-xs md:text-sm">
          {formattedParts}
        </p>
      );
    });
  };

  const currentSuggestions = messages.length > 0 && messages[messages.length - 1].sender === 'bot' && messages[messages.length - 1].suggestions
    ? messages[messages.length - 1].suggestions
    : ["Places under ₹15,000", "Weather in Munnar", "3-Day plan for Munnar", "Houseboats in Alleppey"];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans">
      
      {/* ── 1. Hero Header Banner ── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2144] via-[#102752] to-[#0a1832] p-6 md:p-8 border border-slate-700/80 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <Bot className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  AuraTravel AI Copilot
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-md">
                  Active Concierge
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 mt-1">
                Your intelligent companion for trip pacing, cost breakdowns, weather advisories, and route discovery.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#142646] hover:bg-[#1a335c] text-slate-300 hover:text-white rounded-xl border border-slate-700/80 text-xs font-bold transition-all shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Clear Chat</span>
            </button>
            <button
              onClick={() => navigate('/plan-trip')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Open AI Planner</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Two-Column Layout (Chat Area + Quick Travel Info) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Main Conversation Window (3 Columns) */}
        <div className="lg:col-span-3 rounded-3xl bg-[#0b1528] border border-slate-700/80 shadow-2xl flex flex-col h-[700px] overflow-hidden">
          
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 bg-[#07111f]/40">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/30 text-cyan-300 flex items-center justify-center mr-3 flex-shrink-0 border border-cyan-500/30 shadow-sm mt-0.5">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div className={`max-w-[85%] md:max-w-[78%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-5 py-4 shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none'
                        : 'bg-[#12203a] text-slate-100 border border-slate-700/80 rounded-tl-none'
                    }`}
                  >
                    <div>{formatText(msg.text)}</div>

                    {/* Interactive Action Button if attached */}
                    {msg.action && (
                      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center">
                        <button
                          onClick={() => navigate(msg.action.url)}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow transition-all hover:scale-[1.02] active:scale-95"
                        >
                          <span>{msg.action.label || "Take Action"}</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <span
                      className={`text-[9px] block text-right mt-2 font-semibold ${
                        msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center ml-3 flex-shrink-0 shadow-sm mt-0.5">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start">
                <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/30 text-cyan-300 flex items-center justify-center mr-3 flex-shrink-0 border border-cyan-500/30 shadow-sm mt-0.5">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="bg-[#12203a] rounded-2xl rounded-tl-none border border-slate-700/80 px-5 py-4 flex space-x-2 items-center shadow-md">
                  <div className="h-2.5 w-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2.5 w-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2.5 w-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Contextual Suggestions Pills Bar */}
          <div className="bg-[#0b1528] px-5 py-3 border-t border-slate-800/90 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center mr-1">
              <Sparkles className="h-3 w-3 text-cyan-400 mr-1" />
              Suggested:
            </span>
            {currentSuggestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => sendQuery(q)}
                disabled={loading}
                className="text-xs font-bold bg-[#142542] hover:bg-[#1a3159] border border-slate-700/80 hover:border-cyan-500/60 px-3 py-1.5 rounded-xl text-slate-300 hover:text-cyan-200 transition-all flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
              >
                <span>{q}</span>
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-4 bg-[#0c182e] border-t border-slate-700/80 flex items-center space-x-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about travel budgets, weather, packing checklists, itineraries, transit..."
              className="flex-grow bg-[#07111f] border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg disabled:opacity-40 disabled:pointer-events-none hover:scale-105 active:scale-95 transition-all shrink-0 font-bold flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Send</span>
            </button>
          </form>
        </div>

        {/* Right Sidebar: Topic Starters & Emergency Help (1 Column) */}
        <div className="space-y-6">
          
          {/* Quick Prompts Box */}
          <div className="rounded-3xl bg-[#0b1528] border border-slate-700/80 p-5 shadow-xl space-y-3">
            <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Prompt Starters</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any sample query to begin conversational planning:
            </p>

            <div className="space-y-2 pt-1">
              {starterCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => sendQuery(card.prompt)}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-2xl bg-[#0e1c36] hover:bg-[#14284d] border border-slate-800/80 hover:border-cyan-500/50 transition-all group flex items-start space-x-3 shadow-sm"
                  >
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} text-white shrink-0 shadow-sm`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-200 truncate">
                        {card.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {card.prompt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Traveler SOS & Support Box */}
          <div className="rounded-3xl bg-gradient-to-br from-[#121c2e] to-[#0c1626] border border-slate-700/80 p-5 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-rose-400">
              <ShieldAlert className="h-4 w-4" />
              <h4 className="font-black text-xs uppercase tracking-wider">Emergency Hotlines</h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">All-in-One SOS</span>
                <span className="font-black text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">112</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Tourist Helpline</span>
                <span className="font-black text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">1800-11-1363</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400 font-medium">Police / Medical</span>
                <span className="font-black text-slate-200">100 / 102</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/support')}
              className="w-full mt-2 inline-flex items-center justify-center space-x-1.5 py-2 bg-[#1a2b48] hover:bg-[#20365c] text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700/80 transition-all"
            >
              <span>Dispute & Complaints Desk</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
