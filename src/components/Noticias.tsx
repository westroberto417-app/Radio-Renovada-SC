import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, ArrowRight, RefreshCcw, MapPin, Sparkles, Newspaper, Globe, X, Share2, Search, Volume2, Square } from 'lucide-react';
import { generateLocalNews, generateNationalNews, LocalNews } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export const Noticias = () => {
  const [newsList, setNewsList] = useState<LocalNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<'local' | 'national'>('local');
  const [selectedNews, setSelectedNews] = useState<LocalNews | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const { setIsDucked } = useStore();

  const fetchNews = async () => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setNewsList([]);
    const generatedNews = activeType === 'local' 
      ? await generateLocalNews() 
      : await generateNationalNews();
    setNewsList(generatedNews);
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, [activeType]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setIsDucked(false);
    };
  }, []);

  const handleSpeak = (news: LocalNews, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (speakingId === news.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      setIsDucked(false);
      return;
    }
    
    window.speechSynthesis.cancel();
    
    const textToRead = `${news.title}. ${news.fullContent}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'es-AR';
    utterance.rate = 0.95; // A bit slower for more natural reading
    utterance.pitch = 0.98; // Slightly lower pitch typically sounds better
    
    const voices = window.speechSynthesis.getVoices();
    
    // Attempt to find the best, most natural-sounding Spanish voice available.
    // Edge/Chrome often have 'Natural' or 'Online' voices that sound vastly better.
    let selectedVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Natural') || v.name.includes('Online')));
    
    if (!selectedVoice) {
      const preferredVoices = ['Microsoft Elena', 'Microsoft Tomas', 'Google español'];
      for (const name of preferredVoices) {
        const match = voices.find(v => v.name.includes(name) && v.lang.includes('es'));
        if (match) {
          selectedVoice = match;
          break;
        }
      }
    }
    
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes('es-AR')) || voices.find(v => v.lang.startsWith('es'));
    }

    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => {
      setSpeakingId(null);
      setIsDucked(false);
    };
    utterance.onerror = () => {
      setSpeakingId(null);
      setIsDucked(false);
    };
    
    setIsDucked(true);
    window.speechSynthesis.speak(utterance);
    setSpeakingId(news.id);
  };

  const filteredNews = newsList.filter(news => 
    news.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    news.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    news.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-32 px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
        <div className="space-y-4 max-w-2xl">
          <h2 className="text-4xl font-black text-white leading-tight flex items-center gap-3 italic">
            {activeType === 'local' ? <MapPin className="text-[#ff007f]" /> : <Globe className="text-[#00f2ff]" />}
            {activeType === 'local' ? 'Actualidad Regional' : 'Panorama Global'}
          </h2>
          <p className="text-sm font-light text-white/60 leading-relaxed max-w-lg italic border-l-2 border-[#ff007f]/40 pl-4">
            Información curada para nuestra comunidad. Mantente al día con los sucesos más relevantes de San Miguel y el mundo. 
            <span className="block mt-2 font-bold text-white/40">Si tienes información importante, compártela en los comentarios para sumarla a nuestras noticias generales.</span>
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-4 w-full md:w-auto">
          <div className="flex items-center bg-zinc-950/80 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
            <button 
              onClick={() => setActiveType('local')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeType === 'local' ? "bg-[#ff007f] text-white shadow-[0_0_15px_rgba(255,0,127,0.3)]" : "text-white/30 hover:text-white/60"
              )}
            >
              <MapPin size={12} /> Regional
            </button>
            <button 
              onClick={() => setActiveType('national')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeType === 'national' ? "bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]" : "text-white/30 hover:text-white/60"
              )}
            >
              <Newspaper size={12} /> Diario
            </button>
            <div className="w-[1px] h-4 bg-white/10 mx-2" />
            <button 
              onClick={fetchNews}
              disabled={loading}
              className="p-2.5 text-white/20 hover:text-white transition-colors disabled:opacity-30"
            >
              <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
            </button>
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              type="text"
              placeholder="Buscar noticias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#ff007f]/50 transition-all font-light"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <AnimatePresence mode="popLayout">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-[3rem] h-80 animate-pulse" />
            ))
          ) : filteredNews.length > 0 ? (
            filteredNews.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-zinc-950/40 border border-white/5 rounded-[3rem] overflow-hidden hover:border-[#ff007f]/20 transition-all duration-700 hover:shadow-2xl hover:shadow-[#ff007f]/5"
              >
                <div className="flex flex-col lg:flex-row h-full">
                  <div className="lg:w-1/3 aspect-[16/9] lg:aspect-auto overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100"
                    />
                    <div className="absolute top-6 left-6 bg-[#ff007f] text-[10px] font-black text-white uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg backdrop-blur-md">
                      {item.tag}
                    </div>
                  </div>
                  
                  <div className="flex-1 p-8 md:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-[10px] text-white/30 uppercase font-black tracking-widest">
                        <Clock size={12} className="text-[#ff007f]" />
                        {item.date}
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        {activeType === 'national' ? 'Destacado' : 'Regional'}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-white leading-[1.1] group-hover:text-[#ff007f] transition-all duration-500 italic">
                        {item.title}
                      </h3>
                      <p className="text-sm font-light text-white/50 leading-relaxed line-clamp-3">
                        {item.excerpt}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => setSelectedNews(item)}
                        className="group/btn flex items-center text-[#ff007f] text-[10px] font-black tracking-[0.3em] gap-3 uppercase py-2"
                      >
                        Amplificar Noticia <div className="p-2 bg-[#ff007f]/10 rounded-full group-hover/btn:bg-[#ff007f] group-hover/btn:text-white transition-all"><ArrowRight size={14} /></div>
                      </button>
                      <div className="flex gap-4">
                        <button 
                          onClick={(e) => handleSpeak(item, e)}
                          title={speakingId === item.id ? "Detener lectura" : "Leer noticia completa"}
                          className="text-[#ff007f] hover:text-white transition-colors cursor-pointer flex items-center gap-1 bg-[#ff007f]/10 px-3 py-1.5 rounded-full"
                        >
                          {speakingId === item.id ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
                          <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                            {speakingId === item.id ? 'Detener' : 'Voz Natural'}
                          </span>
                        </button>
                        <Share2 size={16} className="text-white/10 hover:text-white transition-colors cursor-pointer mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            searchQuery ? (
              <div className="text-center py-24 space-y-4">
                <Search className="text-white/20 justify-center w-full mb-6" size={48} />
                <p className="text-white md:text-xl font-black italic uppercase text-xs max-w-sm mx-auto">
                  No se encontraron resultados
                </p>
                <p className="text-white/30 italic text-sm">
                  Intenta con otras palabras clave.
                </p>
              </div>
            ) : (
              <div className="text-center py-24 space-y-4">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="animate-pulse text-[#ff007f]" size={24} />
                </div>
                <p className="text-white md:text-xl font-black italic tracking-widest uppercase text-xs animate-pulse max-w-sm mx-auto">
                  Espere unos segundos mientras se cargan las últimas noticias
                </p>
                <p className="text-white/20 italic font-bold tracking-widest uppercase text-[10px]">Sincronizando con fuentes locales...</p>
              </div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNews(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            <motion.div
              layoutId={`card-${selectedNews.id}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
            >
              <button 
                onClick={() => setSelectedNews(null)}
                className="absolute top-6 right-6 z-10 p-4 bg-black/50 text-white hover:bg-[#ff007f] transition-all rounded-full backdrop-blur-md"
              >
                <X size={20} />
              </button>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="h-[40vh] relative min-h-[300px]">
                  <img src={selectedNews.image} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <div className="absolute bottom-10 left-10 right-10">
                    <span className="bg-[#ff007f] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">
                      {selectedNews.tag}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-white italic leading-tight uppercase tracking-tighter">
                      {selectedNews.title}
                    </h2>
                  </div>
                </div>

                <div className="p-10 md:p-16 space-y-10">
                  <div className="flex items-center gap-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-2 italic"><Clock size={14} className="text-[#ff007f]" /> {selectedNews.date}</span>
                    <span className="flex items-center gap-2 italic"><MapPin size={14} className="text-[#00f2ff]" /> San Miguel Región</span>
                  </div>
                  
                  <div className="space-y-6 text-lg md:text-xl text-white/90 font-light leading-relaxed italic border-l-4 border-[#ff007f]/20 pl-8">
                    {selectedNews.fullContent.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                      <p key={i} className="mb-4">{paragraph}</p>
                    ))}
                  </div>

                  <div className="bg-white/5 rounded-3xl p-8 border border-white/5">
                    <p className="text-sm text-white/60 leading-relaxed italic">
                      "Esta noticia ha sido procesada por nuestra Inteligencia Artificial curadora de contenidos para Radio Corrientes Viva, extrayendo los puntos más relevantes para brindarte una cobertura completa y profunda del suceso."
                    </p>
                  </div>

                  <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] text-center md:text-left">Radio Corrientes Viva • 2026</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleSpeak(selectedNews)}
                        className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 w-full md:w-auto"
                      >
                        {speakingId === selectedNews.id ? <Square fill="currentColor" size={14} /> : <Volume2 size={14} />}
                        {speakingId === selectedNews.id ? 'Detener Voz' : 'Escuchar Noticia'}
                      </button>
                      <button className="bg-[#ff007f] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,127,0.3)] hidden md:block">
                        Seguir Tema
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


