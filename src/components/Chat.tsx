import React, { useState } from 'react';
import { Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, user: 'Admin', text: '¡Bienvenidos a Radio Corrientes Viva!', time: '10:00' },
    { id: 2, user: 'JuanPerez', text: 'Excelente programación hoy.', time: '10:05' },
    { id: 3, user: 'MariaG', text: '¿Pueden poner algo de rock nacional?', time: '10:10' },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setMessages([...messages, {
      id: Date.now(),
      user: 'Oyente',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-screen pt-24 pb-28 px-6 overflow-hidden bg-transparent">
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 custom-scrollbar pr-2">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                <User size={20} className="text-white/20" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#ff007f] uppercase tracking-widest">{msg.user}</span>
                  <span className="text-[10px] font-mono text-white/20">{msg.time}</span>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none text-sm text-white/80 leading-relaxed italic backdrop-blur-sm">
                  "{msg.text}"
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSend} className="relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="TU MENSAJE..."
          className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 px-6 pr-16 text-xs font-bold uppercase tracking-widest text-white placeholder:text-white/10 focus:border-[#ff007f]/50 transition-all backdrop-blur-md"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#ff007f] rounded-xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,0,127,0.3)]"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
