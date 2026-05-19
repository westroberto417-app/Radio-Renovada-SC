import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Info, X, Sparkles, Moon, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Visualizer } from './Visualizer';
import { getMarqueeText } from '../services/contentService';
import { cn } from '../lib/utils';

const RadioLogo = ({ isPlaying }: { isPlaying: boolean }) => {
  const [logoError, setLogoError] = useState(false);
  const logoUrl = "/logo.png"; // Ruta esperada para el logo del usuario

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white overflow-hidden">
      <div className="relative z-10 flex flex-col items-center w-full h-full justify-center">
        <div 
          className={cn(
            "w-full h-full flex items-center justify-center p-6 transition-all",
            isPlaying ? "animate-logo-pulse" : "opacity-100 scale-100"
          )}
        >
          {!logoError ? (
            <img 
              src={logoUrl} 
              alt="Radio Logo" 
              className="w-full h-full object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-32 h-32 bg-[#ff007f]/20 rounded-full flex items-center justify-center border border-[#ff007f]/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Inicio = () => {
  const { isPlaying, setIsPlaying, currentTrack, volume, setVolume, isMuted, setIsMuted, isInstallable, installPrompt, setInstallPrompt } = useStore();
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [marqueeText, setMarqueeText] = useState("Escuchando Radio Corrientes Viva...");

  useEffect(() => {
    const fetchMarquee = async () => {
      const text = await getMarqueeText();
      setMarqueeText(text);
    };
    fetchMarquee();
    const interval = setInterval(fetchMarquee, 3 * 60 * 1000); // refresh every 3 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sleepTimer) {
      const timer = setTimeout(() => {
        setIsPlaying(false);
        setSleepTimer(null);
      }, sleepTimer * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [sleepTimer]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-28 px-8 overflow-hidden relative">
      {/* Main Content Grid */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        
        {/* Circular Player with Glowing Ring */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-8">
          {/* Neon Ring */}
          <div 
            className={cn(
              "absolute inset-0 border-4 border-[#ff007f] rounded-full transition-all",
              isPlaying ? "animate-ring-pulse" : "opacity-50"
            )}
          />
          
          <div
            className={cn(
              "relative w-[92%] h-[92%] rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden transition-all",
              isPlaying ? "scale-[1.02]" : "scale-100"
            )}
          >
            <RadioLogo isPlaying={isPlaying} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
        </div>

        {/* Linear Waveform Visualizer */}
        <div className="w-full h-12 flex items-center justify-center gap-1 mb-8 px-4">
           {Array.from({ length: 20 }).map((_, i) => (
             <div
               key={i}
               style={{
                 '--eq-height': `${40 + Math.random() * 60}%`,
                 '--eq-dur': `${0.8 + Math.random() * 0.5}s`,
                 height: isPlaying ? '20%' : '10%',
               } as React.CSSProperties}
               className={cn(
                 "w-[4px] bg-[#ff007f] rounded-full transition-all",
                 isPlaying ? "animate-eq" : ""
               )}
             />
           ))}
        </div>

        {/* Track Info */}
        <div className="text-center mb-10 space-y-1 w-full scale-110">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#ff007f] font-black uppercase tracking-[0.4em] text-[10px] mb-2 glow-pink"
          >
            {(!currentTrack.artist || currentTrack.artist === 'Radio Corrientes Viva') ? 'Disfruta de la buena musica' : 'Ahora Suena'}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black leading-[0.9] tracking-tighter uppercase mb-1"
          >
            {currentTrack.title}
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-light text-white/60 tracking-tight"
          >
            {currentTrack.artist}
          </motion.h2>
          
          <div className="flex items-center justify-center gap-4 mt-3">
             <span className="text-[10px] font-mono text-white/30">128 kbps</span>
             <div className="w-1 h-1 rounded-full bg-white/20" />
             <span className="text-[10px] font-black text-[#ff007f] tracking-widest uppercase">Streaming HD</span>
          </div>
        </div>

        {/* Media Controls */}
        <div className="flex items-center gap-8 mb-6 relative">
          {/* Sleep Timer */}
          <div className="relative">
            <button 
              onClick={() => setShowTimerMenu(!showTimerMenu)}
              className={cn(
                "p-2 transition-all rounded-full",
                sleepTimer ? "text-[#ff007f] bg-[#ff007f]/10 shadow-[0_0_10px_#ff007f]" : "text-white/40 hover:text-white"
              )}
              title="Temporizador de apagado"
            >
              <Moon size={28} fill={sleepTimer ? "currentColor" : "none"} />
            </button>
            <AnimatePresence>
              {showTimerMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-zinc-900 border border-white/10 rounded-2xl p-2 w-32 shadow-2xl z-50 backdrop-blur-xl"
                >
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setSleepTimer(mins);
                        setShowTimerMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-[#ff007f] hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {mins} MINUTOS
                    </button>
                  ))}
                  {sleepTimer && (
                    <button
                      onClick={() => {
                        setSleepTimer(null);
                        setShowTimerMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#ff007f] hover:bg-[#ff007f]/10 rounded-lg transition-colors border-t border-white/5 mt-1"
                    >
                      CANCELAR
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                setIsPlaying(true);
              }
            }}
            className="w-24 h-24 bg-[#ff007f] rounded-full flex items-center justify-center text-white neon-pink transition-all shadow-[0_0_30px_rgba(255,0,127,0.5)]"
          >
            {isPlaying ? <Pause size={42} fill="white" /> : <Play size={42} fill="white" className="ml-1" />}
          </motion.button>

          <button 
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: 'Radio Corrientes Viva',
                    text: 'Escucha la mejor música en Radio Corrientes Viva',
                    url: window.location.href,
                  });
                } catch (err) {
                  console.error('Error sharing:', err);
                  navigator.clipboard.writeText(window.location.href);
                  alert('Enlace copiado al portapapeles');
                }
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Enlace copiado al portapapeles');
              }
            }}
            className="p-2 text-white/40 hover:text-white transition-all"
          >
            <Share2 size={28} />
          </button>
        </div>

        {/* Background active hint */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-8 flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Transmisión Activa</span>
              <button 
                onClick={() => setShowExitModal(true)}
                className="ml-2 text-[9px] font-black uppercase tracking-widest text-[#ff007f] hover:underline"
              >
                Detener
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exit Modal */}
        <AnimatePresence>
          {showExitModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 w-full max-w-xs text-center space-y-6 shadow-2xl ring-1 ring-[#ff007f]/20"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">¿Deseas salir?</h3>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Elige una opción para continuar</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowExitModal(false)}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all border border-white/5"
                  >
                    Continuar Escuchando
                  </button>
                  <button
                    onClick={() => setShowExitModal(false)}
                    className="w-full py-4 bg-[#ff007f]/10 hover:bg-[#ff007f]/20 rounded-2xl text-[10px] font-black text-[#ff007f] uppercase tracking-widest transition-all border border-[#ff007f]/20"
                  >
                    Minimizar
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      window.location.reload(); // Simple exit behavior for web env
                    }}
                    className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest transition-all border border-red-500/20"
                  >
                    Salir de la App
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume & Details Bar */}
        <div className="w-full flex items-center gap-4 px-2 mb-6">
           <button onClick={() => setIsMuted(!isMuted)} className="text-white/40">
             {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
           </button>
           <div className="flex-1 h-[2px] bg-white/10 relative rounded-full">
              <motion.div 
                animate={{ width: `${volume * 100}%` }}
                className="absolute left-0 top-0 h-full bg-white rounded-full shadow-[0_0_8px_white]"
              />
              <motion.div 
                animate={{ left: `${volume * 100}%` }}
                className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-zinc-900"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
           </div>
        </div>

        {/* Marquee Schedule */}
        <div className="w-full mt-4 mb-2">
          <h3 className="text-[10px] md:text-xs uppercase tracking-widest text-white/50 font-bold mb-3 px-3 flex items-center gap-2">
            <Sparkles size={14} className="text-white/40" />
            Programación Sonando
          </h3>
          <div className="w-full overflow-hidden bg-white/5 border border-white/10 rounded-xl flex items-center h-12 relative backdrop-blur-md">
            <div className="absolute left-2 z-10 bg-[#06070a] pl-2.5 pr-3 py-1.5 flex items-center gap-2 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff007f] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff007f]"></span>
              </span>
              <span className="text-[10px] uppercase font-black tracking-widest text-white/90">Al Aire</span>
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#0b0c10] via-[#0b0c10]/90 to-transparent z-[5]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0b0c10] to-transparent z-[5]" />
            
            <div className="w-full overflow-hidden flex items-center">
              <div 
                key={marqueeText}
                className="animate-marquee whitespace-nowrap pl-28"
              >
                <span className="text-sm font-medium text-white/90 tracking-wide">{marqueeText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PWA Install Promo CTA */}
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#ff007f]/20 to-[#7c3aed]/20 border border-[#ff007f]/30 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ff007f]/20 flex items-center justify-center text-[#ff007f]">
                <Sparkles size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-white uppercase tracking-tighter italic">Instalar Aplicación</p>
                <p className="text-[9px] text-white/40 font-medium uppercase tracking-widest">Acceso directo en tu móvil</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                if (installPrompt) {
                  installPrompt.prompt();
                  const { outcome } = await installPrompt.userChoice;
                  if (outcome === 'accepted') {
                    setInstallPrompt(null);
                  }
                }
              }}
              className="px-4 py-2 bg-[#ff007f] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ff007f]/80 transition-all shadow-lg shadow-[#ff007f]/20"
            >
              Instalar
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const Radio = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
  </svg>
);

