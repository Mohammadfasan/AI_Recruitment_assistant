import React, { useState, useEffect, useRef } from 'react';
import { chatWithAssistant } from '../../services/aiApi';
import { MessageSquare, X, Send, Trash2, Bot, Sparkles, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AiChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('recruiter_chat_history');
    return saved ? JSON.parse(saved) : [
      {
        sender: 'ai',
        text: "Hi! I'm your AI Recruitment Assistant. You can ask me about candidate summaries, skill gaps, or interview guidelines. How can I help you today?"
      }
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('recruiter_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputValue.trim();
    if (!query) return;

    // Add user message
    const userMessage = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Call AI endpoint. Pass optional candidate or job context if we have them,
      // but globally we can send just the query.
      const res = await chatWithAssistant(query);
      if (res.success && res.data) {
        const aiMessage = { sender: 'ai', text: res.data.answer };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error(err);
      toast.error('AI Assistant is currently offline.');
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: "Sorry, I couldn't reach the AI service right now. Please verify that both the backend and python services are online."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const clearHistory = () => {
    const initial = [
      {
        sender: 'ai',
        text: "Hi! I'm your AI Recruitment Assistant. You can ask me about candidate summaries, skill gaps, or interview guidelines. How can I help you today?"
      }
    ];
    setMessages(initial);
    localStorage.removeItem('recruiter_chat_history');
    toast.success('Chat history cleared!');
  };

  const suggestedPrompts = [
    "What are the top skills in our candidate pool?",
    "How can I calculate matching score?",
    "Generate interview questions for React Developer",
    "List candidates that have been shortlisted"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 print:hidden">
      {/* Floating Toggle Icon Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-650 to-indigo-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer relative group"
        >
          <MessageCircle className="w-6.5 h-6.5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" />
        </button>
      )}

      {/* Chat Console Floating Box */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-700 to-indigo-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <div>
                <h4 className="text-xs font-bold tracking-wide">RecruitAI Assistant</h4>
                <p className="text-[9px] text-indigo-200 font-semibold flex items-center">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Gemini Gemini-Powered
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <button
                onClick={clearHistory}
                title="Clear Chat Logs"
                className="p-1 hover:bg-white/10 text-indigo-200 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 text-indigo-205 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs">
            {messages.map((msg, index) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={index} className={`flex ${isAi ? 'justify-start' : 'justify-end'} items-end space-x-2`}>
                  {isAi && (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0 mb-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl shadow-xs leading-relaxed whitespace-pre-wrap ${
                      isAi
                        ? 'bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-bl-none'
                        : 'bg-indigo-600 text-white rounded-br-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Loading / Typing Animation */}
            {loading && (
              <div className="flex justify-start items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white dark:bg-zinc-800 border border-zinc-200/50 rounded-2xl rounded-bl-none px-3.5 py-3 shadow-xs">
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            {/* Suggested prompts if only welcome message exists */}
            {messages.length === 1 && !loading && (
              <div className="pt-4 space-y-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Suggested Topics</span>
                <div className="flex flex-col space-y-1.5">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="w-full text-left px-3 py-2 bg-white hover:bg-zinc-50 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[11px] font-semibold text-zinc-700 dark:text-zinc-350 transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Form Input */}
          <form onSubmit={handleFormSubmit} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center space-x-2 shrink-0">
            <input
              type="text"
              placeholder="Ask AI recruiter..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-3 py-2 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-450 text-white rounded-xl transition-all cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};

export default AiChatBot;
