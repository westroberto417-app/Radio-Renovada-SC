import React, { useState, useEffect, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, Sparkles, Moon, Share2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { getMarqueeText } from '../services/contentService';
import { Visualizer } from './Visualizer';
import { cn } from '../lib/utils';

const RadioLogo = memo(({ isPlaying }: { isPlaying: boolean }) => {
  const [logoError, setLogoError] = useState(false);
  const [albumArtError, setAlbumArtError] = useState(false);
  const logoUrl = "/logo.png"; // Ruta esperada para el logo del usuario
  const currentTrack = useStore((state) => state.currentTrack);

  const isGeneric = !currentTrack.title || 
                    currentTrack.title === 'Radio Corrientes Viva' || 
                    currentTrack.title === 'Transmitiendo en Vivo' || 
                    currentTrack.artist === 'Radio Corrientes Viva' || 
                    currentTrack.artist === 'En Vivo';

  const showAlbumArt = currentTrack.albumArt && !isGeneric && !albumArtError;

  useEffect(() => {
    setAlbumArtError(false);
  }, [currentTrack.albumArt]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {showAlbumArt ? (
          <motion.div
            key="album-art"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            {/* Blurry glow background using the album cover itself */}
            <div 
              className="absolute inset-0 bg-cover bg-center blur-md opacity-30 scale-110"
              style={{ backgroundImage: `url(${currentTrack.albumArt})` }}
            />
            
            {/* Album cover art */}
            <img 
              src={currentTrack.albumArt} 
              alt={currentTrack.title}
              className="w-full h-full object-cover relative z-10"
              onError={() => setAlbumArtError(true)}
              referrerPolicy="no-referrer"
            />

            {/* Title Overlay badge inside the disc */}
            <div className="absolute bottom-4 left-3 right-3 z-30 bg-black/75 border border-white/10 backdrop-blur-md p-2 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-[7px] uppercase tracking-[0.25em] font-black text-[#ff007f] mb-0.5 animate-pulse">
                Sonar Acoplado
              </span>
              <p className="text-[10px] font-black uppercase tracking-wider text-white truncate max-w-[150px]">
                {currentTrack.title}
              </p>
            </div>
            
            {/* Small floating logo watermark */}
            <div className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/10 p-1.5 backdrop-blur-md">
              <img src={logoUrl} alt="Mini Logo" className="w-full h-full object-contain" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="radio-logo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 w-full h-full flex items-center justify-center p-6"
          >
            {!logoError ? (
              <img 
                src={logoUrl} 
                alt="Radio Logo" 
                className={cn(
                  "w-full h-full object-contain transition-all",
                  isPlaying ? "animate-logo-pulse" : "opacity-100 scale-100"
                )}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

RadioLogo.displayName = 'RadioLogo';

// Memoized Volume Control Subcomponent
const VolumeControl = memo(() => {
  const volume = useStore((state) => state.volume);
  const setVolume = useStore((state) => state.setVolume);
  const isMuted = useStore((state) => state.isMuted);
  const setIsMuted = useStore((state) => state.setIsMuted);

  return (
    <div className="w-full flex items-center gap-4 px-2 mb-6 font-sans">
      <button onClick={() => setIsMuted(!isMuted)} className="text-white/40 cursor-pointer hover:text-white transition-colors">
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <div className="flex-1 h-[2px] bg-white/10 relative rounded-full">
        <div 
          style={{ width: `${volume * 100}%` }}
          className="absolute left-0 top-0 h-full bg-white rounded-full shadow-[0_0_8px_white]"
        />
        <div 
          style={{ left: `${volume * 100}%` }}
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
  );
});

VolumeControl.displayName = 'VolumeControl';

export const Inicio = memo(() => {
  const isPlaying = useStore((state) => state.isPlaying);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const currentTrack = useStore((state) => state.currentTrack);
  const isInstallable = useStore((state) => state.isInstallable);
  const installPrompt = useStore((state) => state.installPrompt);
  const setInstallPrompt = useStore((state) => state.setInstallPrompt);

  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [marqueeText, setMarqueeText] = useState("Escuchando Radio Corrientes Viva...");
  const [isClearing, setIsClearing] = useState(false);

  const handleForceRefresh = async () => {
    setIsClearing(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.href = window.location.origin + window.location.pathname + '?refresh=' + Date.now();
  };

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
  }, [sleepTimer, setIsPlaying]);

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

        {/* Dynamic Frequency-Reactive Audio Visualizer */}
        <div className="w-full mb-8 px-2">
          <Visualizer variant="compact" showControls={true} />
        </div>

        {/* Track Info */}
        <div className="text-center mb-10 space-y-1 w-full scale-110 font-sans">
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
                "p-2 transition-all rounded-full cursor-pointer",
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
                      className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-[#ff007f] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
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
                      className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#ff007f] hover:bg-[#ff007f]/10 rounded-lg transition-colors border-t border-white/5 mt-1 cursor-pointer"
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
              setIsPlaying(!isPlaying);
            }}
            className="w-24 h-24 bg-[#ff007f] rounded-full flex items-center justify-center text-white neon-pink transition-all shadow-[0_0_30px_rgba(255,0,127,0.5)] cursor-pointer"
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
                }
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="p-2 text-white/40 hover:text-white transition-all cursor-pointer"
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
              className="mb-8 flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md font-sans"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Transmisión Activa</span>
              <button 
                onClick={() => setShowExitModal(true)}
                className="ml-2 text-[9px] font-black uppercase tracking-widest text-[#ff007f] hover:underline cursor-pointer"
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 font-sans"
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
                    className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all border border-white/5 cursor-pointer"
                  >
                    Continuar Escuchando
                  </button>
                  <button
                    onClick={() => setShowExitModal(false)}
                    className="w-full py-4 bg-[#ff007f]/10 hover:bg-[#ff007f]/20 rounded-2xl text-[10px] font-black text-[#ff007f] uppercase tracking-widest transition-all border border-[#ff007f]/20 cursor-pointer"
                  >
                    Minimizar
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      window.location.reload(); // Simple exit behavior for web env
                    }}
                    className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest transition-all border border-red-500/20 cursor-pointer"
                  >
                    Salir de la App
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume & Details Bar */}
        <VolumeControl />

        {/* Marquee Schedule */}
        <div className="w-full mt-4 mb-2 font-sans">
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

        {/* Custom Visible Mobile Install Box (Only shown in browser mode, hidden when already running standalone) */}
        {!window.matchMedia('(display-mode: standalone)').matches && !(navigator as any).standalone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mt-4 p-5 rounded-[2rem] bg-zinc-950/80 border border-[#ff007f]/40 backdrop-blur-md shadow-2xl flex flex-col gap-4 relative overflow-hidden font-sans"
          >
            {/* Subtle Glow background */}
            <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-[#ff007f]/15 blur-2xl pointer-events-none" />

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border border-white/20">
                <img 
                  src="/pwa-maskable-192x192.png" 
                  alt="Icono de la App" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Instalar App Oficial
                  </h4>
                  <span className="bg-[#ff007f] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-[0_0_8px_#ff007f]">
                    WebAPK
                  </span>
                </div>
                <p className="text-[10px] text-white/70 font-medium leading-tight">
                  Instala con el icono oficial en tu pantalla de inicio y ábrela en pantalla completa sin barras del navegador.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-3.5 flex flex-col gap-3 text-left">
              <button 
                onClick={async () => {
                  if (installPrompt) {
                    try {
                      await installPrompt.prompt();
                      const { outcome } = await installPrompt.userChoice;
                      if (outcome === 'accepted') {
                        setInstallPrompt(null);
                      }
                    } catch (e) {
                      console.error("Install prompt error:", e);
                    }
                  } else {
                    // Instruction if browser hasn't triggered event or on Android menu
                    alert("Para instalar en Android:\n1. Toca el menú de 3 puntos (⋮) arriba a la derecha en Chrome.\n2. Busca y selecciona 'Instalar aplicación' (o 'Instalar Radio Corrientes Viva').\n\nEn iPhone (Safari):\n1. Toca el botón Compartir [↑].\n2. Elige 'Agregar a inicio'.");
                  }
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#ff007f] to-[#7c3aed] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-[0_0_20px_rgba(255,0,127,0.4)] active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                ¡Instalar App Oficial en tu Celular!
              </button>

              <div className="text-[10px] text-white/70 space-y-2.5 font-medium leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/5">
                <p className="text-[#00f2ff] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-ping" />
                  Instrucciones de Instalación:
                </p>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 shrink-0">Android (Chrome):</span>
                  <span>Abre en una pestaña normal (no incógnito), toca el menú <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded font-mono">⋮</span> arriba a la derecha y selecciona <strong className="text-white bg-[#ff007f]/30 px-1.5 py-0.5 rounded">“Instalar aplicación”</strong> (NO “Agregar a la pantalla principal”).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-400 shrink-0">iPhone (Safari):</span>
                  <span>Toca el botón <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded font-mono">Compartir [↑]</span> abajo y selecciona <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">“Agregar a inicio”</strong>.</span>
                </div>
                <div className="pt-2 border-t border-white/10 text-white/50 text-[9px] space-y-1">
                  <p>💡 <strong className="text-white/80">Nota importante:</strong> En tu teléfono Xiaomi / Android, desinstala el acceso con la letra "R" para que el sistema te permita instalar la aplicación real con su logo oficial.</p>
                  <p>🔒 <strong className="text-white/80">Modo incógnito:</strong> Google Chrome desactiva la instalación de aplicaciones en modo incógnito por seguridad.</p>
                </div>
              </div>

              <button
                onClick={handleForceRefresh}
                disabled={isClearing}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-white/10 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <RefreshCw size={14} className={cn(isClearing && "animate-spin text-[#ff007f]")} />
                {isClearing ? "Actualizando y limpiando caché..." : "Limpiar Caché y Forzar Actualización"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
});

Inicio.displayName = 'Inicio';
