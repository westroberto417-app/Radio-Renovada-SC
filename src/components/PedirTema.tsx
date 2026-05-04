import React, { useState } from 'react';
import { Music, Star, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PedirTema = () => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', song: '', artist: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
    setForm({ name: '', song: '', artist: '', message: '' });
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-6 bg-transparent">
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="space-y-6"
          >
            <div className="space-y-2 mb-8">
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase italic">Pedir un Tema</h2>
              <p className="text-sm font-light text-white/40 tracking-tight">Completa el formulario y escucha tu canción favorita en vivo.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-6">Tu Nombre</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-full py-5 px-8 text-sm font-bold uppercase tracking-widest text-white focus:border-[#ff007f]/50 transition-all backdrop-blur-md"
                  placeholder="NOMBRE O APODO"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-6">Canción</label>
                  <input
                    required
                    type="text"
                    value={form.song}
                    onChange={(e) => setForm({ ...form, song: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-full py-5 px-8 text-sm font-bold uppercase tracking-widest text-white focus:border-[#ff007f]/50 transition-all backdrop-blur-md"
                    placeholder="TÍTULO"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-6">Artista</label>
                  <input
                    required
                    type="text"
                    value={form.artist}
                    onChange={(e) => setForm({ ...form, artist: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-full py-5 px-8 text-sm font-bold uppercase tracking-widest text-white focus:border-[#ff007f]/50 transition-all backdrop-blur-md"
                    placeholder="BANDA"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-6">Dedicatoria</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="w-full bg-black/60 border border-white/10 rounded-[2rem] py-5 px-8 text-sm font-bold uppercase tracking-widest text-white focus:border-[#ff007f]/50 transition-all resize-none backdrop-blur-md"
                  placeholder="MENSAJE..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#ff007f] text-white font-black py-6 rounded-full flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#ff007f]/20 uppercase tracking-[0.2em]"
              >
                ENVIAR PEDIDO <Send size={20} />
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6"
          >
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <CheckCircle size={48} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">¡Pedido enviado!</h2>
              <p className="text-sm text-white/40 max-w-[200px]">Tu pedido ha sido enviado al locutor de turno.</p>
            </div>
            <button
              onClick={() => setSent(false)}
              className="text-xs font-bold text-[#ff007f] uppercase tracking-widest border-b border-[#ff007f]/20 pb-1"
            >
              Hacer otro pedido
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
