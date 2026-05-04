import React from 'react';
import { Mail, Github, Instagram, Facebook, Globe, Phone, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

const socialLinks = [
  { icon: Instagram, label: 'Instagram', url: '#', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' },
  { icon: Facebook, label: 'Facebook', url: '#', color: 'bg-blue-600' },
  { icon: Phone, label: 'WhatsApp', url: '#', color: 'bg-green-500' },
  { icon: Globe, label: 'Sitio Web', url: 'https://radiocorrientesviva.com.ar', color: 'bg-white/10' },
];

export const Mas = () => {
  return (
    <div className="min-h-screen pt-24 pb-24 px-6 bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase italic">Conéctate</h2>
          <p className="text-sm text-white/40">Sigue nuestras redes y participa de sorteos.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {socialLinks.map((link) => (
            <motion.a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center justify-center p-6 rounded-3xl ${link.color} transition-all border border-white/5 shadow-xl`}
            >
              <link.icon size={28} className="mb-2 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">{link.label}</span>
            </motion.a>
          ))}
        </div>

        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 backdrop-blur-md">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
             <Mail size={16} className="text-[#ff007f]" /> 
             Publicidad & Contacto
          </h3>
          <p className="text-xs text-white/40 leading-relaxed">
            Si tienes problemas con la señal o quieres publicitar en nuestra emisora, contáctanos.
          </p>
          <button className="w-full py-3 bg-[#ff007f]/10 border border-[#ff007f]/20 hover:bg-[#ff007f]/20 rounded-xl text-xs font-bold text-[#ff007f] transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
            ENVIAR EMAIL <ExternalLink size={14} />
          </button>
        </div>

        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff007f] glow-pink" />
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Version 1.0.0</span>
          </div>
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium">
            Desarrollado para Radio Corrientes Viva
          </p>
        </div>
      </motion.div>
    </div>
  );
};
