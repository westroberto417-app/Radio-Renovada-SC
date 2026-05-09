import React, { useState, useEffect } from 'react';
import { Home, MessageSquare, Music, Newspaper, MoreHorizontal, User, Megaphone } from 'lucide-react';
import { useStore, Tab } from '../store/useStore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const tabs = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'pedir', label: 'Pedir Tema', icon: Music },
  { id: 'noticias', label: 'Noticias', icon: Newspaper },
  { id: 'aplicacion', label: 'Publicidad', icon: Megaphone },
  { id: 'mas', label: 'Más', icon: MoreHorizontal },
];

export const BottomNav = () => {
  const { activeTab, setActiveTab } = useStore();
  const [requestsCount, setRequestsCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/requests');
        if (res.ok) {
          const data = await res.json();
          setRequestsCount(data.length);
        }
      } catch (e) {
        // Silently fail to not clutter console
      }
    };
    
    fetchCount();
    const interval = setInterval(fetchCount, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-50 pointer-events-none">
      <nav className="pointer-events-auto h-16 bg-[#0b0c10]/80 backdrop-blur-lg border border-white/10 rounded-full flex items-center justify-around gap-2 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] ring-1 ring-[#ff007f]/20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[50px] sm:min-w-[56px] transition-all duration-200 gap-1",
                isActive ? "text-[#ff007f] scale-105" : "text-white/40 hover:text-white/70"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-1 w-6 h-0.5 bg-[#ff007f] rounded-full shadow-[0_0_8px_#ff007f]"
                  transition={{ type: "tween", duration: 0.3 }}
                />
              )}
              
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Badge for "Más" Tab */}
                {tab.id === 'mas' && requestsCount > 0 && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0b0c10] flex items-center justify-center"
                    >
                      <span className="text-[8px] font-bold text-white shadow-none leading-none pt-px">
                        {requestsCount > 9 ? '9+' : requestsCount}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
              
              <span className="text-[8px] font-black uppercase tracking-widest">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
