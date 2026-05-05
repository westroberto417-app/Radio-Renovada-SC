import React, { useState, useEffect } from 'react';
import { Menu, Bell, Maximize, Minimize, Users, X, Megaphone, Clock, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { getArgentinaTime } from '../lib/utils';

export const TopBar = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(getArgentinaTime());
  const { setActiveTab } = useStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getArgentinaTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const menuItems = [
    { label: 'Reflexión', icon: Sparkles, action: () => { setActiveTab('reflexion'); setIsMenuOpen(false); } },
    { label: 'Publicidad', icon: Megaphone, action: () => { setActiveTab('aplicacion'); setIsMenuOpen(false); } },
    { label: 'Súmate también', icon: Users, action: () => { setActiveTab('sumate'); setIsMenuOpen(false); } }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-20 bg-black/20 backdrop-blur-md px-6 flex justify-between items-center z-[60] border-b border-white/5">
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-3 text-white/80 hover:text-white transition-all bg-white/5 rounded-2xl border border-white/5 hover:border-[#ff007f]/30"
        >
          <Menu size={24} />
        </button>

        <div className="flex flex-col items-center pointer-events-none">
          <span className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase italic mb-0.5 drop-shadow-md">
            Radio Corrientes Viva
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff007f] shadow-[0_0_10px_#ff007f] animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.2em] text-[#ff007f] uppercase italic">
              Al Aire
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end mr-4">
            <div className="flex items-center gap-2 text-white/30 mb-1">
              <Clock size={12} className="text-[#00f2ff]" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">San Miguel</span>
            </div>
            <span className="text-2xl font-black text-white italic leading-none tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(0,242,255,0.4)]">
              {currentTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleFullscreen}
              className="p-2.5 text-white/80 hover:text-white transition-all hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
              title="Pantalla Completa"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            <button className="p-2.5 text-white/80 hover:text-white transition-all hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10">
              <Bell size={20} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0a0b1e] border-r border-white/5 shadow-2xl z-[70] p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-black tracking-widest text-[#ff007f] uppercase text-xs">Menú</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {menuItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all text-left text-sm font-medium text-white/80 hover:text-white group"
                  >
                    <item.icon size={18} className="text-[#ff007f] group-hover:scale-110 transition-transform" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-6 pb-2 text-center text-[7px] text-white/10 uppercase tracking-widest font-black">
                App creada por West y<br />Google AI Studio
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
