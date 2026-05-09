import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Quote, RefreshCcw, Share2 } from 'lucide-react';
import { generateReflection, Reflection } from '../services/geminiService';
import { cn } from '../lib/utils';

export const Reflexion = () => {
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(() => {
    return parseInt(localStorage.getItem('reflection_refresh_count') || '0');
  });

  const fetchReflection = async (force = false) => {
    if (force && refreshCount >= 10) return;

    setLoading(true);
    
    // Check local storage for cached reflection and timestamp
    const cachedData = localStorage.getItem('daily_reflection');
    const cachedTime = localStorage.getItem('daily_reflection_time');
    const ONE_HOUR = 1 * 60 * 60 * 1000;
    
    if (!force && cachedData && cachedTime) {
      const timePassed = Date.now() - parseInt(cachedTime);
      if (timePassed < ONE_HOUR) {
        try {
          setReflection(JSON.parse(cachedData));
          setLoading(false);
          return;
        } catch (e) {
          // Si el JSON es inválido, borramos la caché y forzamos nueva carga
          localStorage.removeItem('daily_reflection');
          localStorage.removeItem('daily_reflection_time');
        }
      } else {
        // Interval passed, reset manual refresh count for the new hour
        setRefreshCount(0);
        try { localStorage.setItem('reflection_refresh_count', '0'); } catch (e) {}
      }
    }

    const data = await generateReflection(force);
    setReflection(data);
    try {
      localStorage.setItem('daily_reflection', JSON.stringify(data));
      localStorage.setItem('daily_reflection_time', Date.now().toString());
    } catch (e) {}
    
    if (force) {
      const newCount = refreshCount + 1;
      setRefreshCount(newCount);
      try {
        localStorage.setItem('reflection_refresh_count', newCount.toString());
      } catch (e) {}
    }
    
    setLoading(false);
  };

  const handleShare = async () => {
    if (!reflection) return;
    const shareData = {
      title: 'Reflexión del Momento',
      text: `"${reflection.quote}" — ${reflection.author}\n\r${reflection.message}\n\rEscucha Radio Corrientes Viva!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        alert('Enlace copiado al portapapeles');
      }
    } catch (err) {
      console.error('Error al compartir:', err);
    }
  };

  useEffect(() => {
    fetchReflection();
  }, []);

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
            <span className="text-[10px] font-black text-[#ff007f] uppercase tracking-widest">Pausa para el alma</span>
          </motion.div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
            Tu Reflexión <br />
            <span className="text-[#00f2ff]">del Momento</span>
          </h2>
          {refreshCount >= 10 && (
            <p className="text-[10px] font-black text-[#ff007f] uppercase tracking-widest animate-pulse">
              Has alcanzado el límite de reflexiones manuales. Vuelve en una hora para más.
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="aspect-square md:aspect-video rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <RefreshCcw className="text-[#00f2ff] animate-spin" size={32} />
            </motion.div>
          ) : reflection && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Main Card */}
              <div className="relative group rounded-[2.5rem] overflow-hidden border border-white/10 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
                {/* Image Background */}
                <div className="h-64 md:h-80 relative overflow-hidden">
                  <img 
                    src={reflection.imageUrl} 
                    alt="Reflexión" 
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                  
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <Quote className="text-[#ff007f] mb-4 opacity-50" size={40} />
                    <h3 className="text-2xl md:text-3xl font-black text-white italic leading-tight drop-shadow-xl">
                      "{reflection.quote}"
                    </h3>
                    <p className="text-[#00f2ff] text-[10px] font-black uppercase tracking-[0.3em] mt-4">
                      — {reflection.author}
                    </p>
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-8 md:p-10 space-y-6">
                  <div className="space-y-4">
                    {reflection.message.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                      <p key={i} className="text-white/70 text-lg md:text-xl font-light leading-relaxed italic border-l-2 border-[#ff007f]/30 pl-6">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <div className="pt-6 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-[#ff007f] transition-colors">
                        <Heart size={14} /> 2.4k
                      </button>
                      <button 
                        onClick={handleShare}
                        className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-[#00f2ff] transition-colors"
                      >
                        <Share2 size={14} /> Compartir
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => fetchReflection(true)}
                      disabled={refreshCount >= 10 || loading}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/20 hover:text-[#ff007f] hover:border-[#ff007f]/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed group/refresh"
                    >
                      <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
                      {refreshCount < 10 && (
                        <span className="absolute -top-2 -right-2 bg-[#ff007f] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg opacity-0 group-hover/refresh:opacity-100 transition-opacity">
                          {10 - refreshCount} libres
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-center text-[10px] font-black text-white/20 uppercase tracking-[0.5em] animate-pulse">
                Sincronizado con San Miguel, Corrientes
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
