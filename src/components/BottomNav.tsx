import React from 'react';
import { Home, MessageSquare, Music, Newspaper, MoreHorizontal, User } from 'lucide-react';
import { useStore, Tab } from '../store/useStore';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const tabs = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'pedir', label: 'Pedir Tema', icon: Music },
  { id: 'noticias', label: 'Noticias', icon: Newspaper },
  { id: 'mas', label: 'Más', icon: MoreHorizontal },
];

export const BottomNav = () => {
  const { activeTab, setActiveTab } = useStore();

  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-50 pointer-events-none">
      <nav className="pointer-events-auto h-16 bg-[#0b0c10]/70 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-around gap-2 px-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] ring-1 ring-[#ff007f]/30">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[56px] transition-all duration-300 gap-0.5",
                isActive ? "text-[#ff007f] scale-110" : "text-white/40 hover:text-white/70"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-1 w-8 h-0.5 bg-[#ff007f] rounded-full shadow-[0_0_10px_#ff007f]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[8px] font-black uppercase tracking-widest">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
