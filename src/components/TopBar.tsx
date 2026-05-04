import React from 'react';
import { Menu, Bell, Radio, Maximize, Minimize } from 'lucide-react';

export const TopBar = () => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

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

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-transparent px-6 flex justify-between items-center z-50">
      <button className="p-2 text-white/80 hover:text-white transition-colors">
        <Menu size={24} />
      </button>

      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black tracking-[0.3em] text-white/50 uppercase italic mb-0.5">
          Radio Corrientes Viva
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff007f] shadow-[0_0_8px_#ff007f] animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-[#ff007f] uppercase">
            En Vivo
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleFullscreen}
          className="p-2 text-white/80 hover:text-white transition-colors"
          title="Pantalla Completa"
        >
          {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
        </button>
        <button className="p-2 text-white/80 hover:text-white transition-colors">
          <Bell size={22} />
        </button>
      </div>
    </header>
  );
};
