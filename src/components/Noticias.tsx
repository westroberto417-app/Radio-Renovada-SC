import React, { useState, useEffect, useCallback, useMemo, useTransition, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ArrowRight, RefreshCcw, MapPin, Sparkles, Newspaper, Globe, X, Share2, Search, Volume2, Square } from 'lucide-react';
import { 
  generateLocalNews, 
  generateProvincialNews, 
  generateNationalNews, 
  getContentStatus, 
  getStoredTimestamp, 
  filterRecentNews, 
  getCachedNews,
  clearAllNewsCache,
  LocalNews 
} from '../services/contentService';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

interface NewsCardProps {
  item: LocalNews;
  activeType: 'local' | 'provincial' | 'national';
  isSpeaking: boolean;
  onSelect: (item: LocalNews) => void;
  onSpeak: (item: LocalNews, e: React.MouseEvent) => void;
  onShare: (item: LocalNews, e: React.MouseEvent) => void;
}

// Memoized News Card to prevent expensive re-renders on low-RAM devices
const NewsCard = memo(({ item, activeType, isSpeaking, onSelect, onSpeak, onShare }: NewsCardProps) => {
  const isFb = item.isFacebook || item.source?.toLowerCase().includes('facebook');

  return (
    <div className="group relative bg-zinc-950/40 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-[#ff007f]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#ff007f]/5 will-change-transform">
      <div className="flex flex-col lg:flex-row h-full">
        <div className="lg:w-1/3 aspect-[16/9] lg:aspect-auto overflow-hidden relative min-h-[220px] bg-zinc-900">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="bg-[#ff007f] text-[10px] font-black text-white uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-md">
              {item.tag}
            </span>
            {item.location && (
              <span className="bg-black/70 border border-white/20 text-[10px] font-black text-white uppercase tracking-wider px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1">
                <MapPin size={10} className="text-[#00f2ff]" />
                {item.location}
              </span>
            )}
          </div>

          {/* Source Badge overlay on image */}
          {item.source && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md border inline-flex items-center gap-1.5 shadow-lg",
                isFb 
                  ? "bg-blue-950/90 text-blue-300 border-blue-500/40" 
                  : "bg-zinc-950/90 text-emerald-300 border-emerald-500/30"
              )}>
                <span className={cn("w-2 h-2 rounded-full", isFb ? "bg-blue-400 animate-pulse" : "bg-emerald-400")} />
                <span className="truncate max-w-[200px] sm:max-w-xs">{item.source}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[10px] text-white/50 uppercase font-black tracking-widest flex-wrap">
              <span className="flex items-center gap-1 text-[#ff007f]">
                <Clock size={12} />
                {item.date}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-white/40">
                {activeType === 'local' ? 'San Miguel & Aledañas (3 días)' : activeType === 'provincial' ? 'Provincia de Corrientes' : 'Cobertura Federal'}
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white leading-snug group-hover:text-[#ff007f] transition-colors italic">
              {item.title}
            </h3>
            <p className="text-sm font-light text-white/60 leading-relaxed line-clamp-3">
              {item.excerpt}
            </p>
          </div>
          
          <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-white/5">
            <button 
              onClick={() => onSelect(item)}
              className="group/btn flex items-center text-[#ff007f] text-[10px] font-black tracking-[0.25em] gap-2.5 uppercase py-2 cursor-pointer"
            >
              Amplificar Noticia 
              <div className="p-1.5 bg-[#ff007f]/10 rounded-full group-hover/btn:bg-[#ff007f] group-hover/btn:text-white transition-colors">
                <ArrowRight size={13} />
              </div>
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => onSpeak(item, e)}
                title={isSpeaking ? "Detener lectura" : "Leer noticia completa"}
                className={cn(
                  "transition-all cursor-pointer flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
                  isSpeaking 
                    ? "bg-[#ff007f] text-white border-[#ff007f] animate-pulse" 
                    : "bg-[#ff007f]/10 hover:bg-[#ff007f]/20 text-[#ff007f] border-transparent"
                )}
              >
                {isSpeaking ? <Square size={12} fill="currentColor" /> : <Volume2 size={12} />}
                <span>{isSpeaking ? 'Detener' : 'Escuchar'}</span>
              </button>
              <button 
                onClick={(e) => onShare(item, e)}
                className="hover:bg-white/10 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-white/10"
                title="Compartir"
              >
                <Share2 size={14} className="text-white/40 hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

NewsCard.displayName = 'NewsCard';

export const Noticias = () => {
  const [newsList, setNewsList] = useState<LocalNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<'local' | 'provincial' | 'national'>('local');
  const [selectedTown, setSelectedTown] = useState<string>('all');
  const [selectedNews, setSelectedNews] = useState<LocalNews | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const { setIsDucked } = useStore();
  const currentRequestRef = useRef<string>('');

  const fetchNews = useCallback(async (force: boolean = false, silent: boolean = false) => {
    const requestId = `${activeType}_${Date.now()}`;
    currentRequestRef.current = requestId;

    if (!silent) setLoading(true);
    try {
      // Asynchronously fetch without blocking main thread
      const generatedNews = activeType === 'local' 
        ? await generateLocalNews(force) 
        : activeType === 'provincial'
          ? await generateProvincialNews(force)
          : await generateNationalNews(force);
      
      // If a newer request was dispatched (user switched tabs), discard stale response
      if (currentRequestRef.current !== requestId) return;

      // Filter news strictly to the reference date cutoff (last 3 days / 72 hours)
      const filtered = filterRecentNews(generatedNews);

      startTransition(() => {
        setNewsList(filtered);
        if (!silent) setLoading(false);
      });
    } catch (err) {
      console.warn('Async news fetch error handled smoothly:', err);
      if (currentRequestRef.current === requestId && !silent) {
        setLoading(false);
      }
    }
  }, [activeType]);

  const handleManualRefresh = useCallback(async () => {
    setLoading(true);
    await clearAllNewsCache();
    await fetchNews(true, false);
  }, [fetchNews]);

  // Initial fetch or instant cached display on type change
  useEffect(() => {
    const cached = getCachedNews(activeType);
    if (cached && cached.length > 0) {
      setNewsList(cached);
      setLoading(false);
      fetchNews(false, true); // background sync to fetch newest 4-hour news
    } else {
      fetchNews(false, false);
    }
  }, [activeType, fetchNews]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setIsDucked(false);
    };
  }, [setIsDucked]);

  // Optimized Polling with Timestamp Check (every 60s & on visibility change)
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    const checkTimestampAndPoll = async () => {
      if (document.hidden) return; // Do not waste RAM / CPU when backgrounded
      
      const status = await getContentStatus();
      if (!status) return;

      const cacheKey = activeType === 'local' 
        ? 'content_local_news' 
        : activeType === 'provincial' 
          ? 'content_provincial_news' 
          : 'content_national_news';
      
      const lastLocalTime = getStoredTimestamp(cacheKey);
      const serverUpdate = activeType === 'local' 
        ? status.localNewsLastUpdate 
        : activeType === 'provincial' 
          ? status.provincialNewsLastUpdate 
          : status.nationalNewsLastUpdate;

      // If server has a newer timestamp than client storage, silently fetch fresh news
      if (serverUpdate > lastLocalTime) {
        fetchNews(true, true);
      }
    };

    // Run polling timer
    timerId = setInterval(checkTimestampAndPoll, 60000); // 60s lightweight polling

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
  }, [activeType, fetchNews]);

  const handleSpeak = useCallback((news: LocalNews, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (speakingId === news.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      setIsDucked(false);
      return;
    }
    
    window.speechSynthesis.cancel();
    
    // Clean up content from icons or emoji
    const cleanTitle = news.title.replace(/[🎧📷📻🎵]/g, '');
    const cleanContent = news.fullContent.replace(/[🎧📷📻🎵]/g, '');
    const textToRead = `${cleanTitle}. ${cleanContent}`;
    
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'es-AR';
    utterance.rate = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
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
  }, [speakingId, setIsDucked]);

  const handleShare = useCallback(async (item: LocalNews, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareData = {
      title: item.title,
      text: `${item.title}\n\r${item.excerpt}\n\rEscucha Radio Corrientes Viva!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      }
    } catch (err) {
      console.error('Error sharing news item:', err);
    }
  }, []);

  // Filtered and memoized news items strictly to the last 3 days and town filter
  const filteredNews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let recentOnly = filterRecentNews(newsList);

    if (activeType === 'local' && selectedTown !== 'all') {
      recentOnly = recentOnly.filter(news => 
        news?.location?.toLowerCase().includes(selectedTown.toLowerCase()) ||
        news?.title?.toLowerCase().includes(selectedTown.toLowerCase()) ||
        news?.source?.toLowerCase().includes(selectedTown.toLowerCase())
      );
    }

    if (!query) return recentOnly;
    return recentOnly.filter(news => 
      news?.title?.toLowerCase().includes(query) || 
      news?.excerpt?.toLowerCase().includes(query) ||
      news?.tag?.toLowerCase().includes(query) ||
      news?.location?.toLowerCase().includes(query) ||
      news?.source?.toLowerCase().includes(query)
    );
  }, [newsList, searchQuery, activeType, selectedTown]);

  const localTowns = [
    { id: 'all', label: 'Todas las localidades' },
    { id: 'San Miguel', label: 'San Miguel' },
    { id: 'Caá Catí', label: 'Caá Catí' },
    { id: 'Loreto', label: 'Loreto' },
    { id: 'Santa Rosa', label: 'Santa Rosa' }
  ];

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
            <Sparkles size={11} />
            Edición Informativa Actualizada Cada 4 Horas • Redes Oficiales y Locales
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight flex items-center gap-3 italic flex-wrap">
            {activeType === 'local' && <MapPin className="text-[#ff007f]" />}
            {activeType === 'provincial' && <Newspaper className="text-[#00f2ff]" />}
            {activeType === 'national' && <Globe className="text-emerald-400" />}
            
            {activeType === 'local' && 'San Miguel, Caá Catí, Loreto y Santa Rosa'}
            {activeType === 'provincial' && 'Diario de la Provincia'}
            {activeType === 'national' && 'Noticias Generales del País'}
          </h2>
          <p className="text-sm font-light text-white/60 leading-relaxed max-w-lg italic border-l-2 border-[#ff007f]/40 pl-4">
            {activeType === 'local' && 'Información extraída de las páginas oficiales de Facebook municipalidades, bomberos, centros de salud y medios de influencia comunitaria.'}
            {activeType === 'provincial' && 'Todo el acontecer diario de la Provincia de Corrientes, su chamamé, ecoturismo del Iberá y desarrollo de sus municipios.'}
            {activeType === 'national' && 'Las novedades de actualidad e interés federal más relevantes y trascendentes de toda la República Argentina.'}
            <span className="block mt-2 font-bold text-white/40">Filtro activo: Cobertura reciente verificada en tiempo real.</span>
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          <div className="flex items-center bg-zinc-950/80 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md flex-wrap gap-1 md:gap-0 w-full sm:w-auto justify-center sm:justify-start">
            <button 
              onClick={() => { setActiveType('local'); setSelectedTown('all'); }}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer",
                activeType === 'local' ? "bg-[#ff007f] text-white shadow-[0_0_15px_rgba(255,0,127,0.3)]" : "text-white/30 hover:text-white/60"
              )}
            >
              <MapPin size={12} /> Locales
            </button>
            <button 
              onClick={() => setActiveType('provincial')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer",
                activeType === 'provincial' ? "bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]" : "text-white/30 hover:text-white/60"
              )}
            >
              <Newspaper size={12} /> Diario
            </button>
            <button 
              onClick={() => setActiveType('national')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer",
                activeType === 'national' ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-white/30 hover:text-white/60"
              )}
            >
              <Globe size={12} /> Nacionales
            </button>
            <div className="hidden md:block w-[1px] h-4 bg-white/10 mx-2" />
            <button 
              onClick={handleManualRefresh}
              disabled={loading}
              className="p-2 text-white/20 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
              title="Renovar noticias manualmente"
            >
              <RefreshCcw size={15} className={cn(loading && "animate-spin text-[#ff007f]")} />
            </button>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
            <input
              type="text"
              placeholder="Buscar por tema o localidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#ff007f]/50 transition-all font-light"
            />
          </div>
        </div>
      </div>

      {/* Town Quick Filter Bar for Local News */}
      {activeType === 'local' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <MapPin size={12} className="text-[#ff007f]" /> Ciudad:
          </span>
          {localTowns.map((town) => (
            <button
              key={town.id}
              onClick={() => setSelectedTown(town.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer border",
                selectedTown === town.id
                  ? "bg-[#ff007f]/20 border-[#ff007f] text-white shadow-sm"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
              )}
            >
              {town.label}
            </button>
          ))}
        </div>
      )}

      {/* News List Grid - Low RAM Optimized */}
      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-[2.5rem] h-64 animate-pulse" />
          ))
        ) : filteredNews.length > 0 ? (
          filteredNews.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              activeType={activeType}
              isSpeaking={speakingId === item.id}
              onSelect={setSelectedNews}
              onSpeak={handleSpeak}
              onShare={handleShare}
            />
          ))
        ) : (
          searchQuery || selectedTown !== 'all' ? (
            <div className="text-center py-20 space-y-4">
              <Search className="text-white/20 justify-center w-full mb-2 mx-auto" size={36} />
              <p className="text-white md:text-lg font-black italic uppercase text-sm max-w-sm mx-auto">
                No se encontraron noticias con estos filtros
              </p>
              <p className="text-white/40 italic text-xs">
                Prueba buscando otro término o seleccionando "Todas las localidades".
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedTown('all'); }}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="text-center py-20 space-y-4 bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-8">
              <div className="w-14 h-14 bg-[#ff007f]/10 border border-[#ff007f]/30 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <RefreshCcw className="text-[#ff007f]" size={24} />
              </div>
              <p className="text-white md:text-lg font-black italic tracking-wider uppercase text-sm max-w-sm mx-auto">
                Actualizar sección de noticias
              </p>
              <p className="text-white/40 italic text-xs max-w-md mx-auto">
                Presiona el botón para recargar la información más reciente de Facebook municipal y medios locales.
              </p>
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ff007f] text-white text-xs font-black uppercase tracking-wider hover:bg-[#ff007f]/90 transition-all cursor-pointer shadow-lg shadow-[#ff007f]/20"
              >
                <RefreshCcw size={14} className={cn(loading && "animate-spin")} />
                Recargar Noticias Ahora
              </button>
            </div>
          )
        )}
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
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col z-10"
            >
              <button 
                onClick={() => setSelectedNews(null)}
                className="absolute top-5 right-5 z-10 p-3 bg-black/60 text-white hover:bg-[#ff007f] transition-all rounded-full backdrop-blur-md cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="h-[35vh] relative min-h-[250px]">
                  <img 
                    src={selectedNews.image} 
                    className="w-full h-full object-cover" 
                    alt="" 
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-[#ff007f] text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest inline-block shadow-md">
                        {selectedNews.tag}
                      </span>
                      {selectedNews.location && (
                        <span className="bg-black/80 border border-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 backdrop-blur-md">
                          <MapPin size={10} className="text-[#00f2ff]" />
                          {selectedNews.location}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white italic leading-tight uppercase tracking-tight">
                      {selectedNews.title}
                    </h2>
                  </div>
                </div>

                <div className="p-6 md:p-12 space-y-8">
                  <div className="flex items-center justify-between flex-wrap gap-4 text-[10px] font-black text-white/50 uppercase tracking-[0.15em] border-b border-white/5 pb-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1.5 italic text-[#ff007f]">
                        <Clock size={13} /> {selectedNews.date}
                      </span>
                      {selectedNews.location && (
                        <span className="flex items-center gap-1.5 italic text-[#00f2ff]">
                          <MapPin size={13} /> {selectedNews.location}
                        </span>
                      )}
                    </div>

                    {selectedNews.source && (
                      <div className={cn(
                        "px-3.5 py-1.5 rounded-full border text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5",
                        (selectedNews.isFacebook || selectedNews.source.toLowerCase().includes('facebook'))
                          ? "bg-blue-950/80 text-blue-300 border-blue-500/40"
                          : "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                      )}>
                        <span className={cn("w-2 h-2 rounded-full", (selectedNews.isFacebook || selectedNews.source.toLowerCase().includes('facebook')) ? "bg-blue-400 animate-pulse" : "bg-emerald-400")} />
                        Fuente: {selectedNews.source}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-5 text-base md:text-lg text-white/90 font-light leading-relaxed italic border-l-4 border-[#ff007f]/40 pl-6">
                    {selectedNews.fullContent.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                      <p key={i} className="mb-3">{paragraph}</p>
                    ))}
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <p className="text-xs text-white/60 leading-relaxed italic">
                      "Información extraída y validada en tiempo real para la audiencia de Radio Corrientes Viva. Cobertura de eventos y hechos reales de las últimas 72 horas."
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] text-center md:text-left">Radio Corrientes Viva • 2026</p>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => handleSpeak(selectedNews)}
                        className={cn(
                          "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer border",
                          speakingId === selectedNews.id 
                            ? "bg-[#ff007f] border-[#ff007f] text-white" 
                            : "bg-white/10 hover:bg-white/20 border-transparent text-white"
                        )}
                      >
                        {speakingId === selectedNews.id ? <Square fill="currentColor" size={13} /> : <Volume2 size={13} />}
                        {speakingId === selectedNews.id ? 'Detener Voz' : 'Escuchar Noticia'}
                      </button>
                      <button 
                        onClick={() => handleShare(selectedNews)}
                        className="bg-[#ff007f] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,127,0.3)] flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer"
                      >
                        <Share2 size={13} /> Compartir
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
