import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Quote, RefreshCcw, Share2, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { generateReflectionsList, Reflection } from '../services/contentService';
import { cn } from '../lib/utils';

export const Reflexion = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First reflection open by default
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  
  // Track liked items in local storage
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem('reflections_likes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [refreshCount, setRefreshCount] = useState(() => {
    return parseInt(localStorage.getItem('reflection_refresh_count') || '0');
  });

  const fetchReflections = async (force = false) => {
    if (force && refreshCount >= 5) return; // Limit manual fetches to 5 per hour to keep API healthy
    setLoading(true);
    
    // Cancel any active speech output
    window.speechSynthesis.cancel();
    setPlayingIndex(null);

    const data = await generateReflectionsList(force);
    setReflections(data);
    
    if (force) {
      const newCount = refreshCount + 1;
      setRefreshCount(newCount);
      try {
        localStorage.setItem('reflection_refresh_count', newCount.toString());
      } catch (e) {}
    }
    setLoading(false);
  };

  const toggleLike = (index: number) => {
    const newMap = { ...likedMap, [index]: !likedMap[index] };
    setLikedMap(newMap);
    try {
      localStorage.setItem('reflections_likes', JSON.stringify(newMap));
    } catch (e) {}
  };

  const handleShare = async (ref: Reflection) => {
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
        // Simple elegant custom banner/alert logic is handled automatically but clip works as well
      }
    } catch (err) {
      console.error('Error sharing reflection:', err);
    }
  };

  const toggleSpeech = (index: number, ref: Reflection) => {
    if (playingIndex === index) {
      window.speechSynthesis.cancel();
      setPlayingIndex(null);
    } else {
      window.speechSynthesis.cancel();
      // Craft the narration nicely
      const cleanQuote = ref.quote.replace(/[“‘’”'"]/g, '');
      const cleanMessage = ref.message.replace(/[📷📻🎵]/g, '');
      const textToSpeak = `Reflexión titulada: ${ref.title}. Versículo bíblico en ${ref.author}. Dice así: ${cleanQuote}. Mensaje de edificación para ti: ${cleanMessage}`;
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'es-AR';
      utterance.rate = 1.0;
      
      utterance.onend = () => {
        setPlayingIndex(null);
      };
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        setPlayingIndex(null);
      };

      // Set suitable Latin/Argentinian Spanish Voice
      const voices = window.speechSynthesis.getVoices();
      const suitableVoice = voices.find(v => v.lang.startsWith('es-AR')) || 
                           voices.find(v => v.lang.startsWith('es-419')) || 
                           voices.find(v => v.lang.startsWith('es-')) ||
                           voices.find(v => v.lang.slice(0, 2) === 'es');
      if (suitableVoice) {
        utterance.voice = suitableVoice;
      }

      setPlayingIndex(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    fetchReflections();
    
    // Stop speaking when leaving the screen
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

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

  return (
    <div className="min-h-screen pt-24 pb-32 px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-[#ff007f]/10 border border-[#ff007f]/20 px-4 py-1.5 rounded-full"
          >
            <Sparkles size={14} className="text-[#ff007f]" />
            <span className="text-[10px] font-black text-[#ff007f] uppercase tracking-widest text-glow-pink">Pausa espiritual para el alma</span>
          </motion.div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
            Reflexiones <br />
            <span className="text-[#00f2ff] text-glow-cyan">Bíblicas</span>
          </h2>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider max-w-sm mx-auto">
            10 enseñanzas evangélicas renovadas periódicamente para guiar y reconfortar tu andar en Cristo Jesús.
          </p>
          {refreshCount >= 5 && (
            <p className="text-[10px] font-black text-[#ff007f] uppercase tracking-widest animate-pulse">
              Has alcanzado el límite de renovaciones del sistema. Vuelve más tarde.
            </p>
          )}
        </div>

        {loading && reflections.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-zinc-950/40 border border-white/5 rounded-[2.5rem]">
            <RefreshCcw className="text-[#00f2ff] animate-spin mb-4" size={32} />
            <span className="text-xs font-black text-white/30 uppercase tracking-[0.3em]">Cargando enseñanzas...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end pr-2">
              <button 
                onClick={() => fetchReflections(true)}
                disabled={refreshCount >= 5 || loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-[#ff007f] bg-white/5 border border-white/10 rounded-xl hover:border-[#ff007f]/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCcw size={11} className={cn(loading && "animate-spin")} />
                Renovar Mensajes {refreshCount < 5 && `(${5 - refreshCount} libres)`}
              </button>
            </div>

            <div className="space-y-3">
              {reflections.map((ref, index) => {
                const isOpen = openIndex === index;
                const isSpeechPlaying = playingIndex === index;
                const isLiked = !!likedMap[index];
                const baseLikes = 240 + (index * 13);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={cn(
                      "overflow-hidden rounded-3xl border transition-all duration-300 backdrop-blur-md",
                      isOpen 
                        ? "bg-zinc-950/65 border-white/10 shadow-2xl" 
                        : "bg-zinc-950/35 border-white/5 hover:border-white/10 shadow-md"
                    )}
                  >
                    {/* Header Row Trigger */}
                    <button
                      onClick={() => {
                        setOpenIndex(isOpen ? null : index);
                      }}
                      className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none focus:ring-0 select-none cursor-pointer"
                    >
                      <div className="flex items-center gap-4 flex-1 pr-4 min-w-0">
                        {/* Number Indicator */}
                        <span className="font-mono text-xs font-bold text-white/20">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        
                        {/* Title & Tag */}
                        <div className="min-w-0">
                          <span className={cn(
                            "inline-block text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border text-glow mr-3 uppercase tracking-wider mb-1",
                            getTagStyles(ref.tag)
                          )}>
                            {ref.tag || "FE"}
                          </span>
                          <h3 className={cn(
                            "text-base md:text-lg font-bold tracking-tight truncate transition-colors",
                            isOpen ? "text-white" : "text-white/80 hover:text-white"
                          )}>
                            {ref.title}
                          </h3>
                        </div>
                      </div>

                      {/* Expand Chevron */}
                      <div className="flex items-center gap-3">
                        {isSpeechPlaying && (
                          <div className="flex items-center gap-0.5 h-3">
                            <span className="w-0.5 bg-[#00f2ff] rounded-full animate-[bounce_0.8s_infinite_100ms] h-full" />
                            <span className="w-0.5 bg-[#00f2ff] rounded-full animate-[bounce_0.8s_infinite_300ms] h-1.5" />
                            <span className="w-0.5 bg-[#00f2ff] rounded-full animate-[bounce_0.8s_infinite_200ms] h-2.5" />
                          </div>
                        )}
                        <ChevronDown 
                          size={18} 
                          className={cn(
                            "text-white/30 transition-transform duration-300",
                            isOpen && "transform rotate-180 text-white"
                          )} 
                        />
                      </div>
                    </button>

                    {/* Expandable Panel */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                        >
                          {/* Inner Card Section */}
                          <div className="px-5 pb-6 md:px-8 md:pb-8 border-t border-white/5 pt-5 space-y-6">
                            
                            {/* Graphic Verse Header */}
                            <div className="relative rounded-2xl overflow-hidden h-44 md:h-52 shadow-inner border border-white/5">
                              <img 
                                src={ref.imageUrl} 
                                alt={ref.title} 
                                className="w-full h-full object-cover opacity-50"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent" />
                              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                <Quote className="text-[#ff007f]/40 mb-2" size={24} />
                                <blockquote className="text-white text-sm md:text-base font-extrabold italic leading-relaxed drop-shadow-md pr-4">
                                  "{ref.quote}"
                                </blockquote>
                                <cite className="text-[#00f2ff] text-[10px] font-black uppercase tracking-wider block mt-2 drop-shadow-md">
                                  — {ref.author}
                                </cite>
                              </div>
                            </div>

                            {/* Message Body Text */}
                            <div className="space-y-4">
                              {ref.message.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                                <p key={i} className="text-white/70 text-sm md:text-base font-medium leading-relaxed italic border-l border-[#00f2ff]/20 pl-4">
                                  {paragraph}
                                </p>
                              ))}
                            </div>

                            {/* Action Control Row */}
                            <div className="pt-4 flex items-center justify-between border-t border-white/5">
                              <div className="flex items-center gap-1">
                                {/* Like Indicator */}
                                <button
                                  onClick={() => toggleLike(index)}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer",
                                    isLiked 
                                      ? "text-[#ff007f] bg-pink-500/10" 
                                      : "text-white/30 hover:text-[#ff007f]"
                                  )}
                                >
                                  <Heart size={13} fill={isLiked ? "currentColor" : "none"} /> 
                                  {baseLikes + (isLiked ? 1 : 0)}
                                </button>

                                {/* Share button */}
                                <button
                                  onClick={() => handleShare(ref)}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-white/30 hover:text-[#00f2ff] transition-colors cursor-pointer"
                                >
                                  <Share2 size={13} /> Compartir
                                </button>
                              </div>

                              {/* Speech Player Trigger */}
                              <button
                                onClick={() => toggleSpeech(index, ref)}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-lg",
                                  isSpeechPlaying 
                                    ? "bg-[#00f2ff]/20 border-[#00f2ff]/40 text-[#00f2ff] animate-pulse" 
                                    : "bg-white/5 border-white/10 text-white/50 hover:text-[#00f2ff] hover:border-[#00f2ff]/30"
                                )}
                              >
                                {isSpeechPlaying ? (
                                  <>
                                    <VolumeX size={13} />
                                    <span>Silenciar</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 size={13} />
                                    <span>Escuchar</span>
                                  </>
                                )}
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            <p className="text-center text-[9px] font-bold text-white/10 uppercase tracking-[0.4em] pt-6 animate-pulse">
              Ministerio Espiritual Federal • Radio Corrientes Viva
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
