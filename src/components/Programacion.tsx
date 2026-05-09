import React from 'react';
import { Clock, Calendar, Music, Guitar, Radio, Disc, Zap, Headphones } from 'lucide-react';
import { motion } from 'motion/react';

interface Program {
  name: string;
  hours: string[];
  icon: any;
  color: string;
  description: string;
}

const schedule: Program[] = [
  {
    name: 'Música Retro',
    hours: ['00:00', '17:00'],
    icon: Disc,
    color: 'from-amber-500 to-orange-600',
    description: 'Los clásicos que nunca pasan de moda.'
  },
  {
    name: 'Rock Pesado',
    hours: ['01:00', '02:00'],
    icon: Zap,
    color: 'from-red-600 to-black',
    description: 'Potencia pura para la madrugada.'
  },
  {
    name: 'Música Rock',
    hours: ['04:30', '11:30', '20:30', '23:30'],
    icon: Guitar,
    color: 'from-blue-600 to-indigo-800',
    description: 'El mejor rock nacional e internacional.'
  },
  {
    name: 'Música General',
    hours: ['08:00', '13:00', '16:00'],
    icon: Radio,
    color: 'from-green-500 to-teal-600',
    description: 'Variedad musical para acompañar tu mañana.'
  },
  {
    name: 'Cuarteto',
    hours: ['09:00', '14:00', '22:00'],
    icon: Headphones,
    color: 'from-yellow-400 to-orange-500',
    description: 'Toda la alegría del ritmo cordobés.'
  },
  {
    name: 'Música Pop',
    hours: ['10:00', '12:00', '18:00'],
    icon: Music,
    color: 'from-pink-500 to-purple-600',
    description: 'Los hits del momento y tendencias.'
  },
  {
    name: 'Música Reguetón',
    hours: ['15:00', '19:00', '21:00'],
    icon: Zap,
    color: 'from-purple-600 to-indigo-900',
    description: 'Ritmo urbano para encender la tarde.'
  }
];

export const Programacion = () => {
  return (
    <div className="min-h-screen bg-[#0b0c10] pb-32">
      {/* Header */}
      <div className="relative h-48 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff007f]/20 to-transparent z-0" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-4"
        >
          <Calendar size={32} className="text-[#ff007f] mx-auto mb-2" />
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
            Grilla Musical
          </h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
            Programación Diaria • Radio Corrientes Viva
          </p>
        </motion.div>
      </div>

      <div className="max-w-2xl mx-auto px-6 space-y-6">
        {schedule.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-[#ff007f]/50 transition-all shadow-xl hover:shadow-[#ff007f]/10"
          >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-full bg-gradient-to-l ${item.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
            
            <div className="p-6 flex items-start gap-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg`}>
                <item.icon size={24} className="text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-black text-white uppercase italic leading-tight group-hover:text-[#ff007f] transition-colors">
                  {item.name}
                </h3>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3">
                  {item.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {item.hours.map((hour) => (
                    <div 
                      key={hour}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Clock size={12} className="text-[#00f2ff]" />
                      <span className="text-xs font-black text-white font-mono tracking-tight">{hour} HS</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Proximamente / Novedades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative bg-gradient-to-r from-[#00f2ff]/10 to-transparent border border-[#00f2ff]/20 rounded-3xl p-6 overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Radio size={80} className="text-[#00f2ff]" />
          </div>
          
          <h4 className="text-[#00f2ff] text-xs font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Zap size={14} /> Próximamente
          </h4>
          
          <p className="text-white/80 text-sm font-medium leading-relaxed mb-4">
            Iremos agregando la sección de <span className="text-white font-bold italic text-[#00f2ff]">música litoraleña</span> incluyendo por supuesto nuestro querido <span className="text-white font-bold italic">chamamé</span> y otra sección de <span className="text-[#ff007f] font-bold italic">alabanza y adoración</span>.
          </p>
          
          <div className="pt-4 border-t border-white/5">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-tight">
              Recuerda que tu opinión nos importa, agréga tus sugerencias en el chat de la app.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 px-6 text-center">
        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest leading-relaxed">
          * Los horarios pueden variar según eventos especiales.<br />
          Sintoniza 24/7 lo mejor de San Miguel.
        </p>
      </div>
    </div>
  );
};
