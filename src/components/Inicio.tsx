import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Info, X, Sparkles, Moon, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Visualizer } from './Visualizer';
import { getArtistInfo } from '../services/geminiService';
import { cn } from '../lib/utils';

const RadioLogo = ({ isPlaying }: { isPlaying: boolean }) => {
  const [logoError, setLogoError] = useState(false);
  const logoUrl = "/logo.png"; // Ruta esperada para el logo del usuario

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white overflow-hidden">
      <div className="relative z-10 flex flex-col items-center w-full h-full justify-center">
        <motion.div 
          animate={isPlaying ? { 
            scale: [1, 1.1, 1, 1.05, 1],
            filter: ["brightness(1)", "brightness(1.5)", "brightness(1)", "brightness(1.2)", "brightness(1)"]
          } : { scale: 1 }}
          transition={{ 
            duration: 0.6, 
            repeat: Infinity, 
            ease: "easeOut",
            times: [0, 0.2, 0.4, 0.6, 0.8]
          }}
          className="w-full h-full flex items-center justify-center p-6"
        >
          {!logoError ? (
            <img 
              src={logoUrl} 
              alt="Radio Logo" 
              className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,0,127,0.7)]"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-32 h-32 bg-[#ff007f]/20 rounded-full flex items-center justify-center backdrop-blur-md border border-[#ff007f]/50 shadow-[0_0_20px_rgba(255,0,127,0.4)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-[0_0_15px_rgba(255,0,127,0.8)]">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export const Inicio = () => {
  const { isPlaying, setIsPlaying, currentTrack, volume, setVolume, isMuted, setIsMuted } = useStore();
  const [showInfo, setShowInfo] = useState(false);
  const [aiInfo, setAiInfo] = useState<{ bio: string; trivia: string[] } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    if (sleepTimer) {
      const timer = setTimeout(() => {
        const audio = document.querySelector('audio');
        audio?.pause();
        setIsPlaying(false);
        setSleepTimer(null);
      }, sleepTimer * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [sleepTimer]);

  const fetchAiInfo = async () => {
    setShowInfo(true);
    if (!aiInfo) {
      setLoadingAi(true);
      const info = await getArtistInfo(currentTrack.title);
      setAiInfo(info);
      setLoadingAi(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-28 px-8 overflow-hidden relative">
      {/* Main Content Grid */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        
        {/* Circular Player with Glowing Ring */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-8">
          {/* Neon Ring */}
          <motion.div 
            animate={isPlaying ? { 
              scale: [1, 1.03, 1],
              opacity: [0.8, 1, 0.8],
              boxShadow: [
                "0 0 20px #ff007f, inset 0 0 20px #ff007f",
                "0 0 40px #ff007f, inset 0 0 30px #ff007f",
                "0 0 20px #ff007f, inset 0 0 20px #ff007f"
              ]
            } : {}}
            transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 border-4 border-[#ff007f] rounded-full opacity-80" 
          />
          
          <motion.div
            animate={isPlaying ? { 
              scale: [1, 1.015, 1, 1.008, 1],
            } : { scale: 1 }}
            transition={{ 
              duration: 0.6, 
              repeat: Infinity, 
              ease: "easeOut" 
            }}
            className="relative w-[92%] h-[92%] rounded-full bg-zinc-900 overflow-hidden"
          >
            <RadioLogo isPlaying={isPlaying} />
            
            {currentTrack.albumArt && (
              <img 
                src={currentTrack.albumArt} 
                alt="Live Artist"
                className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay transition-all duration-1000"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </motion.div>
        </div>

        {/* Linear Waveform Visualizer */}
        <div className="w-full h-16 flex items-center justify-center gap-[4px] mb-8 overflow-hidden px-4">
           {Array.from({ length: 40 }).map((_, i) => (
             <motion.div
               key={i}
               animate={isPlaying ? { 
                 height: [10, 30 + Math.random() * 40, 10] 
               } : { height: 4 }}
               transition={{ 
                 duration: 0.5 + Math.random() * 0.5, 
                 repeat: Infinity, 
                 ease: "easeInOut" 
               }}
               className="w-[3px] bg-[#ff007f] rounded-full glow-pink"
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
              const audio = document.querySelector('audio');
              if (isPlaying) {
                audio?.pause();
                setIsPlaying(false);
              } else {
                audio?.play().then(() => setIsPlaying(true)).catch((err) => {
                  console.error("Play error:", err);
                  setIsPlaying(false);
                });
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
                      const audio = document.querySelector('audio');
                      audio?.pause();
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
        <div className="w-full flex items-center gap-4 px-2">
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
           <button onClick={fetchAiInfo} className="text-white/40">
             <Sparkles size={18} />
           </button>
        </div>
      </div>

      {/* AI Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-12 sm:items-center sm:pb-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#151619] border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 overflow-hidden"
            >
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-6 right-6 p-2 text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#ff007f]/10 rounded-xl text-[#ff007f]">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Info del Artista (IA)</h3>
              </div>

              {loadingAi ? (
                <div className="py-12 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-2 border-[#ff007f]/20 border-t-[#ff007f] rounded-full animate-spin" />
                  <p className="text-xs text-white/40 uppercase font-bold tracking-widest animate-pulse">Consultando a Gemini...</p>
                </div>
              ) : aiInfo ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-[#ff007f] uppercase tracking-widest">Biografía</p>
                    <p className="text-sm text-white/70 leading-relaxed">{aiInfo.bio}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-[#ff007f] uppercase tracking-widest">Curiosidades</p>
                    <ul className="space-y-2">
                       {aiInfo.trivia.map((t, i) => (
                         <li key={i} className="text-sm text-white/50 flex gap-3">
                           <span className="text-[#ff007f]">•</span> {t}
                         </li>
                       ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-white/30 italic">No se pudo cargar la información en este momento.</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Radio = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
  </svg>
);

