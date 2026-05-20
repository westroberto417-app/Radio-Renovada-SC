import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Tv, Share2, Search, X, Volume2, HelpCircle, Heart, Clock, ThumbsUp, Sparkles, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

interface VideoRecord {
  id: string;
  title: string;
  description: string;
  category: 'vivo' | 'festivales' | 'mensaje' | 'musica' | 'entrevistas';
  duration: string;
  views: string;
  date: string;
  embedUrl: string;
  thumbnail: string;
}

const CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'vivo', label: 'En Vivo' },
  { id: 'festivales', label: 'Festivales' },
  { id: 'mensaje', label: 'Mensajes / Fe' },
  { id: 'musica', label: 'Música' },
  { id: 'entrevistas', label: 'Entrevistas' },
];

const VIDEO_LIST: VideoRecord[] = [
  {
    id: 'vid-1',
    title: 'Transmisión Especial En Vivo - Radio Corrientes Viva',
    description: 'Sintoniza nuestra transmisión audiovisual oficial en vivo. Festivales, actualidad y momentos de fe directamente desde nuestro estudio en San Miguel, Corrientes.',
    category: 'vivo',
    duration: 'VIVO',
    views: '4.8k espectando',
    date: 'En vivo',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder, plays beautifully
    thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=1470&auto=format&fit=crop',
  },
  {
    id: 'vid-2',
    title: 'Festival Provincial del Chamamé - San Miguel 2026',
    description: 'Reviví los mejores momentos de la noche de gala del Chamamé con grupos renombrados y el baile tradicional de nuestra querida región de San Miguel.',
    category: 'festivales',
    duration: '24:15',
    views: '1.8k vistas',
    date: 'Hace 2 días',
    embedUrl: 'https://www.youtube.com/embed/5-9a8qVesE8',
    thumbnail: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1470&auto=format&fit=crop',
  },
  {
    id: 'vid-3',
    title: 'Palabra de Aliento y Fe para la Semana',
    description: 'Mensaje de reflexión espiritual del Pastor Gómez para encontrar guía, sabiduría y reconfortar el espíritu en estos tiempos desafiantes.',
    category: 'mensaje',
    duration: '08:30',
    views: '920 vistas',
    date: 'Hace 4 días',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1470&auto=format&fit=crop',
  },
  {
    id: 'vid-4',
    title: 'Especial Antonio Tarragó Ros en Corrientes',
    description: 'Compilación y homenaje exclusivo al rey del chamamé correntino transmitido especialmente por Radio Corrientes Viva para todo el país.',
    category: 'musica',
    duration: '18:12',
    views: '2.5k vistas',
    date: 'Hace 1 semana',
    embedUrl: 'https://www.youtube.com/embed/5-9a8qVesE8',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1470&auto=format&fit=crop',
  },
  {
    id: 'vid-5',
    title: 'Entrevista Exclusiva: Plan de Obras para San Miguel',
    description: 'Hablamos con las autoridades locales sobre el renovado plan de conectividad rural, caminos vecinales y salud para San Miguel, Caá Catí y Loreto.',
    category: 'entrevistas',
    duration: '15:40',
    views: '710 vistas',
    date: 'Hace 2 semanas',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=1471&auto=format&fit=crop',
  },
  {
    id: 'vid-6',
    title: 'Oración por nuestra Patria y Provincia de Corrientes',
    description: 'Un momento sagrado de oración colectiva llevado a cabo en vivo desde los estudios de Radio Corrientes Viva con gran participación de nuestros queridos oyentes.',
    category: 'mensaje',
    duration: '12:05',
    views: '1.1k vistas',
    date: 'Hace 3 semanas',
    embedUrl: 'https://www.youtube.com/embed/5-9a8qVesE8',
    thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=1470&auto=format&fit=crop',
  }
];

export const Video = () => {
  const { isPlaying, setIsPlaying } = useStore();
  const [activeCategory, setActiveCategory] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);
  
  // Track liked videos locally
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('videos_likes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newMap = { ...likedMap, [id]: !likedMap[id] };
    setLikedMap(newMap);
    try {
      localStorage.setItem('videos_likes', JSON.stringify(newMap));
    } catch {}
  };

  const handleShare = async (vid: VideoRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: vid.title,
      text: `¡Mira el video de Radio Corrientes Viva!\n\n"${vid.title}"\n\r${vid.description}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
      }
    } catch (err) {
      console.error('Error sharing video:', err);
    }
  };

  const playVideo = (vid: VideoRecord) => {
    // Automatically pause the background radio to prevent sound mess!
    if (isPlaying) {
      setIsPlaying(false);
    }
    setSelectedVideo(vid);
  };

  const filteredVideos = VIDEO_LIST.filter(vid => {
    const matchesCategory = activeCategory === 'todos' || vid.category === activeCategory;
    const matchesSearch = vid.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          vid.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredVideo = VIDEO_LIST[0]; // Featured video is the live stream

  return (
    <div className="min-h-screen pt-24 pb-32 px-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-10">
        
        {/* Header Title */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-[#ff007f]/10 border border-[#ff007f]/20 px-4 py-1.5 rounded-full"
          >
            <Tv size={14} className="text-[#ff007f] animate-pulse" />
            <span className="text-[10px] font-black text-[#ff007f] uppercase tracking-widest text-glow-pink">Radio Corrientes Viva TV</span>
          </motion.div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
            Multimedia <br />
            <span className="text-[#00f2ff] text-glow-cyan">& Video Clips</span>
          </h2>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider max-w-sm mx-auto">
            Disfrutá de transmisiones especiales en vivo, chamamé tradicional, oraciones y la mejor actualidad correntina.
          </p>
        </div>

        {/* Featured Video Card */}
        {featuredVideo && activeCategory === 'todos' && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/60 backdrop-blur-md shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center group"
          >
            {/* Spotlight Banner Neon Overlay */}
            <div className="absolute top-0 right-0 p-4 shrink-0 pointer-events-none opacity-20">
              <Sparkles className="text-[#ff007f]" size={100} />
            </div>

            {/* Thumbnail Feature */}
            <div 
              onClick={() => playVideo(featuredVideo)}
              className="relative w-full md:w-3/5 h-56 md:h-72 rounded-[1.8rem] overflow-hidden border border-white/5 cursor-pointer shrink-0"
            >
              <img 
                src={featuredVideo.thumbnail} 
                alt={featuredVideo.title}
                className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
              
              {/* Play Badge Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#ff007f] hover:bg-[#ff007f]/90 text-white flex items-center justify-center transition-all duration-350 shadow-[0_0_25px_rgba(255,0,127,0.7)] hover:scale-110 active:scale-90 relative">
                  <Play size={26} fill="white" className="ml-1" />
                  <span className="absolute inset-0 border-4 border-[#ff007f]/60 rounded-full animate-ping pointer-events-none" />
                </div>
              </div>

              {/* Status Badge Live */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-red-600 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest text-white shadow-lg animate-pulse border border-red-500/50">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />
                EN VIVO
              </div>
            </div>

            {/* Content Feature */}
            <div className="flex flex-col justify-center flex-1 space-y-4">
              <span className="text-[10px] font-black uppercase text-[#ff007f] tracking-widest text-glow-pink">Recomendado</span>
              <h3 className="text-xl md:text-2xl font-black text-white italic tracking-tight uppercase leading-tight group-hover:text-[#ff007f] transition-colors">
                {featuredVideo.title}
              </h3>
              <p className="text-sm font-medium text-white/50 leading-relaxed">
                {featuredVideo.description}
              </p>
              
              <div className="flex items-center gap-6 pt-4 border-t border-white/5 text-[10px] text-white/30 font-black uppercase tracking-widest">
                <span className="text-[#00f2ff] text-glow-cyan">{featuredVideo.views}</span>
                <span>•</span>
                <span>{featuredVideo.date}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter And Search Controls */}
        <div className="flex flex-col md:flex-row gap-5 justify-between items-center bg-zinc-950/40 p-5 rounded-[2rem] border border-white/5 backdrop-blur-sm">
          {/* Categories Horizontal Scrolling Filter */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none custom-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap cursor-pointer select-none",
                    isActive 
                      ? "bg-[#ff007f] text-white shadow-[0_0_15px_rgba(255,0,127,0.3)]" 
                      : "bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/10"
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input 
              type="text" 
              placeholder="Buscar videos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#ff007f]/50 transition-colors font-light"
            />
          </div>
        </div>

        {/* Gallery Grid of Videos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredVideos.map((vid, i) => {
              const isLiked = !!likedMap[vid.id];
              return (
                <motion.div
                  key={vid.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => playVideo(vid)}
                  className="group relative bg-zinc-950/45 border border-white/5 hover:border-[#ff007f]/20 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-white/5">
                    <img 
                      src={vid.thumbnail} 
                      alt={vid.title} 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />

                    {/* Small Play Badge */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-11 h-11 bg-[#ff007f] text-white rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300 font-bold">
                        <Play size={16} fill="white" className="ml-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-3 right-3 shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-black/75 rounded-md text-[8px] font-mono tracking-wider font-extrabold text-white border border-white/5 shadow-md">
                      <Clock size={10} className="text-[#00f2ff]" />
                      {vid.duration}
                    </div>

                    {/* Category Label Item */}
                    <div className="absolute top-3 left-3 select-none">
                      <span className={cn(
                        "inline-block text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider shadow-md",
                        vid.category === 'vivo' 
                          ? "bg-red-500/10 border-red-500/30 text-red-400" 
                          : "bg-[#ff007f]/10 border-[#ff007f]/20 text-[#ff007f]"
                      )}>
                        {vid.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold leading-snug text-white/90 group-hover:text-[#ff007f] transition-colors line-clamp-2">
                        {vid.title}
                      </h4>
                      <p className="text-[11px] font-medium text-white/40 leading-relaxed line-clamp-2">
                        {vid.description}
                      </p>
                    </div>

                    {/* Actions and details */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-white/30 font-bold uppercase tracking-widest">
                      <span>{vid.date}</span>
                      
                      <div className="flex items-center gap-2">
                        {/* Like */}
                        <button 
                          onClick={(e) => toggleLike(vid.id, e)}
                          className={cn(
                            "p-2 rounded-lg transition-colors border border-transparent hover:border-white/5 cursor-pointer",
                            isLiked ? "text-[#ff007f]" : "text-white/30 hover:text-white"
                          )}
                          title="Me gusta"
                        >
                          <ThumbsUp size={11} fill={isLiked ? "currentColor" : "none"} />
                        </button>
                        
                        {/* Share */}
                        <button 
                          onClick={(e) => handleShare(vid, e)}
                          className="p-2 text-white/30 hover:text-[#00f2ff] rounded-lg transition-colors border border-transparent hover:border-white/5 cursor-pointer"
                          title="Compartir"
                        >
                          <Share2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty search fallback */}
          {filteredVideos.length === 0 && (
            <div className="col-span-1 sm:col-span-2 md:col-span-3 text-center py-24 space-y-4">
              <Tv className="text-white/10 w-16 h-16 mx-auto animate-pulse" />
              <p className="text-white font-black uppercase text-sm tracking-widest italic pt-2">No se encontraron videos</p>
              <p className="text-white/30 text-xs italic">Intenta filtrando con otra categoría o palabra clave.</p>
            </div>
          )}
        </div>

        {/* Footer Support Message */}
        <p className="text-center text-[9px] font-bold text-white/10 uppercase tracking-[0.4em] pt-6 animate-pulse">
          Radio Corrientes Viva • San Miguel Multimedia
        </p>

      </div>

      {/* Embedded Video Player Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-3xl overflow-hidden bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col ring-1 ring-[#ff007f]/10"
            >
              {/* Close Button overlay */}
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 p-3 bg-black/60 text-white hover:bg-[#ff007f] transition-colors rounded-full backdrop-blur-md cursor-pointer border border-white/5"
                title="Cerrar Reproductor"
              >
                <X size={16} />
              </button>

              {/* Video Player responsive container */}
              <div className="aspect-[16/9] w-full bg-black relative">
                <iframe 
                  src={`${selectedVideo.embedUrl}?autoplay=1&mute=0&modestbranding=1&rel=0&showinfo=0`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Video Info Body section */}
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-[9px] font-extrabold uppercase tracking-widest">
                  <span className="bg-[#ff007f]/10 border border-[#ff007f]/20 text-[#ff007f] px-2.5 py-0.5 rounded-full text-glow-pink">
                    {selectedVideo.category}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/50">{selectedVideo.date}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-[#00f2ff] text-glow-cyan">{selectedVideo.views}</span>
                </div>

                <h3 className="text-xl md:text-2xl font-black text-white italic leading-tight uppercase tracking-tight">
                  {selectedVideo.title}
                </h3>

                <p className="text-xs md:text-sm font-medium text-white/60 leading-relaxed border-l-2 border-[#ff007f]/40 pl-4 italic">
                  {selectedVideo.description}
                </p>

                {/* Footer disclaimer badge */}
                <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Radio Corrientes Viva HD</span>
                  <button 
                    onClick={(e) => handleShare(selectedVideo, e)}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-[#ff007f] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-102 transition-all shadow-[0_0_15px_rgba(255,0,127,0.3)] cursor-pointer"
                  >
                    <Share2 size={12} /> Compartir Video
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
