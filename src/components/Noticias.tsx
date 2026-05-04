import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const news = [
  {
    id: 1,
    title: 'Nueva programación fin de semana',
    excerpt: 'Conoce los nuevos horarios y locutores que se incorporan a la radio.',
    tag: 'Institucional',
    date: 'Hace 2 horas',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1470&auto=format&fit=crop'
  },
  {
    id: 2,
    title: 'Entrevista exclusiva con artista local',
    excerpt: 'Este viernes hablamos con el creador del hit del momento.',
    tag: 'Entrevista',
    date: 'Hace 5 horas',
    image: 'https://images.unsplash.com/photo-1520529615802-53531b990924?q=80&w=1470&auto=format&fit=crop'
  },
  {
    id: 3,
    title: 'Sorteo: ¡Entradas para el festival!',
    excerpt: 'Participa comentando en nuestras redes sociales oficiales.',
    tag: 'Concurso',
    date: 'Ayer',
    image: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=1471&auto=format&fit=crop'
  }
];

export const Noticias = () => {
  return (
    <div className="min-h-screen pt-24 pb-28 px-8">
      <div className="space-y-3 mb-10">
        <h2 className="text-4xl font-black text-white leading-tight">Novedades</h2>
        <p className="text-sm font-light text-white/40 tracking-tight">Estás al tanto de todo lo que vibra.</p>
      </div>

      <div className="space-y-8">
        {news.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative bg-zinc-950/50 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-[#ff007f]/30 transition-all duration-500"
          >
            <div className="aspect-[16/10] w-full overflow-hidden relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-6 left-6 bg-[#ff007f] text-[10px] font-black text-white uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                {item.tag}
              </div>
            </div>
            
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-5 text-[10px] text-white/20 uppercase font-black tracking-widest">
                <span className="flex items-center gap-2"><Clock size={12} className="text-[#ff007f]" /> {item.date}</span>
                <span className="flex items-center gap-2 font-mono opacity-50">2026/05/02</span>
              </div>
              <h3 className="text-2xl font-black text-white leading-[1.1] group-hover:text-[#ff007f] transition-colors">
                {item.title}
              </h3>
              <p className="text-sm font-light text-white/40 leading-relaxed line-clamp-2">{item.excerpt}</p>
              
              <div className="pt-2 flex items-center text-[#ff007f] text-[10px] font-black tracking-[0.2em] gap-3 group-hover:gap-5 transition-all uppercase">
                Leer Nota <ArrowRight size={14} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
