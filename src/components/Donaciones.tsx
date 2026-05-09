import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Coffee, CreditCard, ChevronLeft, Copy, Check, MessageCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Donaciones = () => {
  const { setActiveTab } = useStore();
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCvu, setCopiedCvu] = useState(false);

  const handleCopy = (text: string, type: 'alias' | 'cvu') => {
    navigator.clipboard.writeText(text);
    if (type === 'alias') {
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2000);
    } else {
      setCopiedCvu(true);
      setTimeout(() => setCopiedCvu(false), 2000);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-32 px-6 bg-transparent">
      <motion.button
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveTab('mas')}
        className="flex items-center gap-2 text-white/50 hover:text-white mb-6 uppercase text-xs font-bold tracking-widest transition-colors"
      >
        <ChevronLeft size={16} /> Volver
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white italic uppercase leading-none tracking-tighter">
            Apoyá a <br />
            <span className="text-[#ff007f]">Nuestra Radio</span>
          </h2>
          <p className="text-sm text-white/50 font-medium">
            Ayudanos a seguir creciendo y a mejorar nuestra transmisión comunitaria.
          </p>
        </div>

        <div className="grid gap-4 mt-8">
          {/* Cafecito */}
          <div className="w-full flex flex-col items-center justify-center py-2 opacity-50">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-[#00A8FF]/10 flex items-center justify-center border border-[#00A8FF]/20">
                <Coffee size={28} className="text-[#00A8FF]" />
              </div>
              <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Doná un cafecito a la radio</span>
              <div className="mt-2 text-white/30 animate-bounce">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M19 12l-7 7-7-7"/>
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Mercado Pago */}
          <motion.div
            className="w-full relative overflow-hidden rounded-3xl bg-[#009EE3]/10 border border-[#009EE3]/20 p-6 flex flex-col gap-5"
          >
            <a
              href="https://link.mercadopago.com.ar/westtecnobell"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#009EE3]/20 flex items-center justify-center shrink-0">
                <CreditCard size={24} className="text-[#009EE3] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white group-hover:text-[#009EE3] transition-colors">Mercado Pago</h3>
                <p className="text-xs text-white/50">Abrir app y transferir</p>
              </div>
            </a>
            
            <div className="bg-black/20 rounded-2xl p-4 space-y-4">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Alias</span>
                  <button 
                    onClick={() => handleCopy('westtecnobell', 'alias')}
                    className="text-xs flex items-center gap-1 text-[#009EE3] hover:text-white transition-colors"
                  >
                    {copiedAlias ? <Check size={14} /> : <Copy size={14} />}
                    {copiedAlias ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="font-mono text-sm text-white font-medium">westtecnobell</p>
              </div>
              
              <div className="h-px w-full bg-white/5" />
              
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">CVU</span>
                  <button 
                    onClick={() => handleCopy('0000003100067616194578', 'cvu')}
                    className="text-xs flex items-center gap-1 text-[#009EE3] hover:text-white transition-colors"
                  >
                    {copiedCvu ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCvu ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="font-mono text-[13px] text-white font-medium break-all">0000003100067616194578</p>
              </div>
            </div>
          </motion.div>

          {/* Sponsors / Anunciantes */}
          <motion.div
            className="w-full relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/10 p-6 mt-4"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ff007f]/20 flex items-center justify-center">
                <Heart size={24} className="text-[#ff007f]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase italic">Sponsors</h3>
                <p className="text-xs text-white/50 mt-2">
                  Si tenés una empresa o emprendimiento y querés ser mencionado en nuestra transmisión en vivo, contactate con nosotros por WhatsApp.
                </p>
              </div>
              <button 
                onClick={() => window.open('https://wa.me/5491159204990', '_blank')}
                className="w-full mt-2 py-3 bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#25D366] transition-all uppercase tracking-widest"
              >
                <MessageCircle size={16} /> Contactar por WhatsApp
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
