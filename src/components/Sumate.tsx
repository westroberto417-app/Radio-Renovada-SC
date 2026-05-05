import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, User, Mail, MessageSquare } from 'lucide-react';

export const Sumate = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    comentario: ''
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => {
      setSent(true);
      setFormData({ nombre: '', email: '', comentario: '' });
      setTimeout(() => setSent(false), 5000);
    }, 1000);
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-6 bg-transparent overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto space-y-8"
      >
        {/* Image */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="relative w-full rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(255,0,127,0.2)] border border-[#ff007f]/20 group"
        >
          <img 
            src="/sumate.jpeg" 
            alt="Anuncia y Vende Más" 
            className="w-full h-auto relative z-20 group-hover:scale-105 transition-transform duration-500"
          />
        </motion.div>

        {/* Text */}
        <div className="text-center p-6 bg-gradient-to-br from-indigo-900/40 to-[#ff007f]/10 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl">
          <p className="text-base sm:text-lg font-medium text-white/90 leading-relaxed drop-shadow-md">
            <span className="text-[#ff007f] font-bold text-xl">Gracias</span> por interesarte en este proyecto comunitario donde queremos llevar la radio a otro nivel. 
            Y donde queremos que seas parte importante también, aportandonos tus ideas y comentarios para ir mejorando este espacio de compañía con calidad.
          </p>
        </div>

        {/* Form */}
        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff007f]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
          
          <h2 className="text-xl font-bold text-white mb-6 relative z-10">Déjanos tus comentarios</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="text-white/40" size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Tu Nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff007f]/50 focus:ring-1 focus:ring-[#ff007f]/50 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-white/40" size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Tu Correo (Email)"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff007f]/50 focus:ring-1 focus:ring-[#ff007f]/50 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute top-4 left-4 pointer-events-none">
                  <MessageSquare className="text-white/40" size={18} />
                </div>
                <textarea
                  required
                  placeholder="Escribe tus ideas y comentarios aquí..."
                  value={formData.comentario}
                  onChange={(e) => setFormData({...formData, comentario: e.target.value})}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff007f]/50 focus:ring-1 focus:ring-[#ff007f]/50 transition-all font-medium resize-none"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={sent}
              type="submit"
              className={`w-full py-4 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${
                sent ? 'bg-green-500 text-white shadow-green-500/25' : 'bg-[#ff007f] text-white shadow-[#ff007f]/25 hover:bg-[#ff007f]/90'
              }`}
            >
              {sent ? (
                '¡ENVIADO CON ÉXITO!'
              ) : (
                <>
                  <Send size={18} />
                  ENVIAR COMENTARIO
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
