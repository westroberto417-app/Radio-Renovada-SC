import React from 'react';
import { Mail, Github, Instagram, Facebook, Globe, Phone, ExternalLink, Sparkles, Music } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';

const socialLinks = [
  { icon: Instagram, label: 'Instagram', url: '#', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' },
  { icon: Facebook, label: 'Facebook', url: '#', color: 'bg-blue-600' },
  { icon: Phone, label: 'WhatsApp', url: '#', color: 'bg-green-500' },
  { icon: Globe, label: 'Sitio Web', url: 'https://radiocorrientesviva.com.ar', color: 'bg-white/10' },
];

export const Mas = () => {
  const { setActiveTab, isInstallable, installPrompt, setInstallPrompt } = useStore();

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-32 px-6 bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* PWA Install Section */}
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-[2.5rem] bg-gradient-to-br from-[#ff007f] to-[#7c3aed] space-y-4 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={80} />
            </div>
            <div className="relative z-10 space-y-3">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">
                Instala la App <br />
                <span className="text-white/80">En tu móvil</span>
              </h3>
              <p className="text-xs text-white/90 font-medium">
                Accede más rápido y sin necesidad de navegador.
              </p>
              <button 
                onClick={handleInstallClick}
                className="w-full py-3 bg-white text-[#ff007f] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-lg"
              >
                Instalar Ahora
              </button>
            </div>
          </motion.div>
        )}
        {/* Reflection Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase italic underline decoration-[#ff007f] decoration-4 underline-offset-8">Inspiración</h2>
            <p className="text-sm text-white/40">Detente un momento y alimenta tu espíritu.</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('reflexion')}
            className="w-full relative overflow-hidden group rounded-[2.5rem] border border-white/10 bg-zinc-950/50 p-8 text-left transition-all hover:border-[#00f2ff]/30 shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
              <Sparkles size={60} className="text-[#00f2ff]" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00f2ff]/10 border border-[#00f2ff]/20 flex items-center justify-center">
                <Sparkles size={24} className="text-[#00f2ff]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white italic uppercase leading-none tracking-tighter">
                  Reflexión <br />
                  <span className="text-[#00f2ff]">Espiritual</span>
                </h3>
                <p className="text-xs text-white/50 font-medium">Sabiduría práctica para tu vida diaria.</p>
              </div>
            </div>
          </motion.button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase italic underline decoration-red-500 decoration-4 underline-offset-8">Estudio y Recepción</h2>
            <p className="text-sm text-white/40">Sistemas técnicos, transmisión y pedidos musicales.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('pedidos_lista')}
              className="w-full relative overflow-hidden group rounded-[2.5rem] border border-white/10 bg-zinc-950/50 p-6 text-left transition-all hover:border-[#ff007f]/30 shadow-2xl"
            >
              <div className="relative z-10 space-y-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#ff007f]/10 border border-[#ff007f]/20 flex items-center justify-center">
                  <Music size={24} className="text-[#ff007f]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white italic uppercase leading-none tracking-tighter">
                    Bandeja <br />
                    <span className="text-[#ff007f]">Pedidos</span>
                  </h3>
                </div>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('donaciones')}
              className="w-full relative overflow-hidden group rounded-[2.5rem] border border-white/10 bg-zinc-950/50 p-6 text-left transition-all hover:border-green-500/30 shadow-2xl"
            >
              <div className="relative z-10 space-y-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Sparkles size={24} className="text-green-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white italic uppercase leading-none tracking-tighter">
                    Apoyar <br />
                    <span className="text-green-500">A La Radio</span>
                  </h3>
                  <p className="text-xs text-white/50 font-medium pt-1">Donaciones y Sponsors</p>
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase italic underline decoration-[#00f2ff] decoration-4 underline-offset-8">Conéctate</h2>
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
