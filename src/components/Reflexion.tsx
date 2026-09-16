import React, { useState, useEffect, useCallback, useTransition, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Quote, RefreshCcw, Share2, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { generateReflectionsList, getContentStatus, getStoredTimestamp, Reflection } from '../services/contentService';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

// Helper colors for categories
const getTagStyles = (tag: string) => {
  const cleanTag = (tag || "FE").toUpperCase();
  switch (cleanTag) {
    case 'FE':
      return 'bg-pink-500/10 border-pink-500/20 text-pink-400 text-glow-pink';
    case 'ORACIÓN':
      return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 text-glow-cyan';
    case 'AMOR DE DIOS':
      return 'bg-red-500/10 border-red-500/20 text-red-400 text-glow-red';
    case 'ESPERANZA':
      return 'bg-amber-500/10 border-amber-500/20 text-amber-400 text-glow-amber';
    case 'VICTORIA':
      return 'bg-purple-500/10 border-purple-500/20 text-purple-400 text-glow-purple';
    case 'PROPÓSITO':
      return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 text-glow-indigo';
    case 'PALABRA DE DIOS':
      return 'bg-orange-500/10 border-orange-500/20 text-orange-400 text-glow-orange';
    case 'GRACIA':
      return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-glow-emerald';
    default:
      return 'bg-teal-500/10 border-teal-500/20 text-teal-400 text-glow-teal';
  }
};

interface ReflectionCardProps {
  refItem: Reflection;
  index: number;
  isOpen: boolean;
  isSpeechPlaying: boolean;
  isLiked: boolean;
  onToggleOpen: (index: number) => void;
  onToggleSpeech: (index: number, ref: Reflection) => void;
  onToggleLike: (index: number) => void;
  onShare: (ref: Reflection) => void;
}

// Memoized reflection item to ensure high performance on low-RAM devices
const ReflectionCard = memo(({
  refItem,
  index,
  isOpen,
  isSpeechPlaying,
  isLiked,
  onToggleOpen,
  onToggleSpeech,
  onToggleLike,
  onShare
}: ReflectionCardProps) => {
  const baseLikes = 240 + (index * 13);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border transition-all duration-300 backdrop-blur-md will-change-transform",
        isOpen 
          ? "bg-zinc-950/70 border-white/15 shadow-2xl" 
          : "bg-zinc-950/40 border-white/5 hover:border-white/10 shadow-md"
      )}
    >
      {/* Header Row Trigger */}
      <div
        onClick={() => onToggleOpen(index)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleOpen(index);
          }
        }}
        role="button"
        tabIndex={0}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none select-none cursor-pointer"
      >
        <div className="flex items-center gap-3.5 flex-1 pr-3 min-w-0">
          <span className="font-mono text-xs font-bold text-white/30">
            {String(index + 1).padStart(2, '0')}
          </span>
          
          <div className="min-w-0">
            <span className={cn(
              "inline-block text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border mr-2 uppercase tracking-wider mb-1",
              getTagStyles(refItem.tag)
            )}>
              {refItem.tag || "FE"}
            </span>
            <h3 className={cn(
              "text-sm sm:text-base font-bold tracking-tight truncate transition-colors",
              isOpen ? "text-white" : "text-white/80 hover:text-white"
            )}>
              {refItem.title}
            </h3>
          </div>
        </div>

        {/* Expand & Audio Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSpeech(index, refItem);
            }}
            className={cn(
              "p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer",
              isSpeechPlaying 
                ? "bg-[#ff007f]/20 text-[#ff007f] border-[#ff007f]/40 animate-pulse" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-[#00f2ff] hover:border-[#00f2ff]/30"
            )}
            title={isSpeechPlaying ? "Silenciar reflexión" : "Escuchar reflexión"}
          >
            {isSpeechPlaying ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>

          {isSpeechPlaying && (
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 bg-[#00f2ff] rounded-full animate-[bounce_0.8s_infinite_100ms] h-full" />
              <span className="w-0.5 bg-[#00f2ff] rounded-full animate-[bounce_0.8s_infinite_300ms] h-1.5" />
              <span className="w-0.5 bg-[#00f2ff] rounded-full animate-[bounce_0.8s_infinite_200ms] h-2.5" />
            </div>
          )}
          <ChevronDown 
            size={16} 
            className={cn(
              "text-white/30 transition-transform duration-300",
              isOpen && "transform rotate-180 text-white"
            )} 
          />
        </div>
      </div>

      {/* Expandable Panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="px-4 pb-5 sm:px-6 sm:pb-6 border-t border-white/5 pt-4 space-y-5">
              {/* Verse Box */}
              <div className="relative rounded-2xl overflow-hidden h-40 sm:h-48 shadow-inner border border-white/5 bg-zinc-900">
                <img 
                  src={refItem.imageUrl} 
                  alt={refItem.title} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <Quote className="text-[#ff007f]/40 mb-1.5" size={20} />
                  <blockquote className="text-white text-xs sm:text-sm font-extrabold italic leading-relaxed drop-shadow pr-2 line-clamp-3">
                    "{refItem.quote}"
                  </blockquote>
                  <cite className="text-[#00f2ff] text-[10px] font-black uppercase tracking-wider block mt-1.5 drop-shadow">
                    — {refItem.author}
                  </cite>
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-3">
                {refItem.message.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                  <p key={i} className="text-white/75 text-xs sm:text-sm font-light leading-relaxed italic border-l-2 border-[#00f2ff]/30 pl-3.5">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Action Bar */}
              <div className="pt-3 flex items-center justify-between border-t border-white/5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleLike(index)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer",
                      isLiked 
                        ? "text-[#ff007f] bg-pink-500/10" 
                        : "text-white/30 hover:text-[#ff007f]"
                    )}
                  >
                    <Heart size={12} fill={isLiked ? "currentColor" : "none"} /> 
                    {baseLikes + (isLiked ? 1 : 0)}
                  </button>

                  <button
                    onClick={() => onShare(refItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-white/30 hover:text-[#00f2ff] transition-colors cursor-pointer"
                  >
                    <Share2 size={12} /> Compartir
                  </button>
                </div>

                <button
                  onClick={() => onToggleSpeech(index, refItem)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 border rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer",
                    isSpeechPlaying 
                      ? "bg-[#00f2ff]/20 border-[#00f2ff]/40 text-[#00f2ff] animate-pulse" 
                      : "bg-white/5 border-white/10 text-white/50 hover:text-[#00f2ff] hover:border-[#00f2ff]/30"
                  )}
                >
                  {isSpeechPlaying ? (
                    <>
                      <VolumeX size={12} />
                      <span>Silenciar</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={12} />
                      <span>Escuchar</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ReflectionCard.displayName = 'ReflectionCard';

export const Reflexion = () => {
  const { setIsDucked } = useStore();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  
  // Track liked items in local storage
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem('reflections_likes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const fetchReflections = useCallback(async (force = false, silent = false) => {
    if (!silent) setLoading(true);
    
    // Cancel any active speech output
    window.speechSynthesis.cancel();
    setPlayingIndex(null);
    setIsDucked(false);

    try {
      const data = await generateReflectionsList(force);
      startTransition(() => {
        setReflections(data);
        if (!silent) setLoading(false);
      });
    } catch {
      if (!silent) setLoading(false);
    }
  }, [setIsDucked]);

  const toggleLike = useCallback((index: number) => {
    setLikedMap(prev => {
      const newMap = { ...prev, [index]: !prev[index] };
      try {
        localStorage.setItem('reflections_likes', JSON.stringify(newMap));
      } catch {}
      return newMap;
    });
  }, []);

  const handleShare = useCallback(async (ref: Reflection) => {
    const shareData = {
      title: ref.title,
      text: `"${ref.quote}" — ${ref.author}\n\r${ref.message}\n\rEscucha Radio Corrientes Viva!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      }
    } catch (err) {
      console.error('Error sharing reflection:', err);
    }
  }, []);

  const toggleSpeech = useCallback((index: number, ref: Reflection) => {
    if (playingIndex === index) {
      window.speechSynthesis.cancel();
      setPlayingIndex(null);
      setIsDucked(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanQuote = ref.quote.replace(/[“‘’”'"]/g, '');
      const cleanMessage = ref.message.replace(/[📷📻🎵]/g, '');
      const textToSpeak = `Reflexión titulada: ${ref.title}. Versículo bíblico en ${ref.author}. Dice así: ${cleanQuote}. Mensaje de edificación para ti: ${cleanMessage}`;
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'es-AR';
      utterance.rate = 1.0;
      
      utterance.onend = () => {
        setPlayingIndex(null);
        setIsDucked(false);
      };
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        setPlayingIndex(null);
        setIsDucked(false);
      };

      const voices = window.speechSynthesis.getVoices();
      const suitableVoice = voices.find(v => v.lang.startsWith('es-AR')) || 
                           voices.find(v => v.lang.startsWith('es-419')) || 
                           voices.find(v => v.lang.startsWith('es-')) ||
                           voices.find(v => v.lang.slice(0, 2) === 'es');
      if (suitableVoice) {
        utterance.voice = suitableVoice;
      }

      setIsDucked(true);
      setPlayingIndex(index);
      window.speechSynthesis.speak(utterance);
    }
  }, [playingIndex, setIsDucked]);

  const toggleOpen = useCallback((index: number) => {
    setOpenIndex(prev => prev === index ? null : index);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchReflections();
    
    return () => {
      window.speechSynthesis.cancel();
      setIsDucked(false);
    };
  }, [fetchReflections, setIsDucked]);

  // Optimized Polling with Timestamp Check (every 60s & on visibility change)
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    const checkTimestampAndPoll = async () => {
      if (document.hidden) return; // Do not waste RAM / CPU when backgrounded
      
      const status = await getContentStatus();
      if (!status) return;

      const cacheKey = 'content_reflections_list';
      const lastLocalTime = getStoredTimestamp(cacheKey);
      
      // If server has newer reflections, silently update
      if (status.reflectionsLastUpdate > lastLocalTime) {
        fetchReflections(true, true);
      }
    };

    timerId = setInterval(checkTimestampAndPoll, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkTimestampAndPoll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerId) clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchReflections]);

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6 flex flex-col items-center max-w-4xl mx-auto">
      <div className="w-full space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#ff007f]/10 border border-[#ff007f]/20 px-3.5 py-1 rounded-full">
            <Sparkles size={12} className="text-[#ff007f]" />
            <span className="text-[10px] font-black text-[#ff007f] uppercase tracking-widest text-glow-pink">Pausa espiritual para el alma</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white italic tracking-tight uppercase leading-none">
            Reflexiones <br />
            <span className="text-[#00f2ff] text-glow-cyan">Bíblicas</span>
          </h2>
          <p className="text-white/50 text-xs font-light max-w-md mx-auto italic">
            10 enseñanzas basadas en las Sagradas Escrituras (RVR1960), renovadas dinámicamente cada 3 a 4 horas.
          </p>
        </div>

        {loading && reflections.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-zinc-950/40 border border-white/5 rounded-[2rem]">
            <RefreshCcw className="text-[#00f2ff] animate-spin mb-3" size={28} />
            <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Cargando enseñanzas...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={11} className="text-[#00f2ff]" />
                Edición de Hoy
              </span>
              <button 
                onClick={() => fetchReflections(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-white/70 uppercase tracking-widest hover:text-[#ff007f] bg-white/5 border border-white/10 rounded-xl hover:border-[#ff007f]/30 transition-all disabled:opacity-30 cursor-pointer"
              >
                <RefreshCcw size={11} className={cn(loading && "animate-spin text-[#ff007f]")} />
                {loading ? "Actualizando..." : "Renovar"}
              </button>
            </div>

            <div className="space-y-3">
              {reflections.map((ref, index) => (
                <ReflectionCard
                  key={index}
                  refItem={ref}
                  index={index}
                  isOpen={openIndex === index}
                  isSpeechPlaying={playingIndex === index}
                  isLiked={!!likedMap[index]}
                  onToggleOpen={toggleOpen}
                  onToggleSpeech={toggleSpeech}
                  onToggleLike={toggleLike}
                  onShare={handleShare}
                />
              ))}
            </div>

            <p className="text-center text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] pt-4">
              Ministerio Espiritual • Radio Corrientes Viva
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
