import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getChatResponse, ChatMessage } from '../services/contentService';
import { cn, getArgentinaTime } from '../lib/utils';

export const Chat = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, user: 'Radio Corrientes Viva', text: '¡Bienvenidos a la radio chamigo! ¿Qué estás escuchando hoy?', time: getArgentinaTime(), isAI: true },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;
    
    const userMessage = {
      id: Date.now(),
      user: 'Tú',
      text: message,
      time: getArgentinaTime(),
      isAI: false
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Prepare history for API
    const history: ChatMessage[] = messages
      .filter(m => m.id !== 1) // Skip initial greeting for API if you want
      .map(m => ({
        role: m.isAI ? "model" as const : "user" as const,
        parts: [{ text: m.text }]
      }));

    const aiResponseText = await getChatResponse(message, history);

    setIsTyping(false);
    setMessages(prev => [...prev, {
      id: Date.now(),
      user: 'Radio Corrientes Viva',
      text: aiResponseText || "¡Opa! Me perdí un segundo, pero aquí sigo. ¿Qué decías?",
      time: getArgentinaTime(),
      isAI: true
    }]);
  };

  return (
    <div className="flex flex-col h-screen pt-24 pb-28 px-6 overflow-hidden bg-transparent">
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 custom-scrollbar pr-2">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn("flex gap-4", msg.isAI ? "flex-row" : "flex-row-reverse")}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                msg.isAI ? "bg-[#ff007f]/10 border-[#ff007f]/20" : "bg-white/5 border-white/5"
              )}>
                {msg.isAI ? <Sparkles size={20} className="text-[#ff007f]" /> : <User size={20} className="text-white/20" />}
              </div>
              <div className={cn("space-y-2 flex-1", !msg.isAI && "text-right")}>
                <div className={cn("flex items-center justify-between gap-4", !msg.isAI && "flex-row-reverse")}>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    msg.isAI ? "text-[#ff007f]" : "text-white/40"
                  )}>{msg.user}</span>
                  <span className="text-[10px] font-mono text-white/20">{msg.time}</span>
                </div>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed italic backdrop-blur-sm border",
                  msg.isAI 
                    ? "bg-[#ff007f]/5 border-[#ff007f]/10 rounded-tl-none text-white/90" 
                    : "bg-white/5 border-white/10 rounded-tr-none text-white/70"
                )}>
                  "{msg.text}"
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 items-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#ff007f]/10 border border-[#ff007f]/20 flex items-center justify-center shrink-0">
                <Sparkles size={20} className="text-[#ff007f] animate-pulse" />
              </div>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#ff007f]/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-[#ff007f]/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-[#ff007f]/40 rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isTyping ? "ESCUCHANDO..." : "TU MENSAJE..."}
          disabled={isTyping}
          className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 px-6 pr-16 text-xs font-bold uppercase tracking-widest text-white placeholder:text-white/10 focus:border-[#ff007f]/50 transition-all backdrop-blur-md disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isTyping || !message.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#ff007f] rounded-xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,0,127,0.3)] disabled:opacity-50 disabled:scale-100"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

