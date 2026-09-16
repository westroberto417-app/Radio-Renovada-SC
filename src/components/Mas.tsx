import React, { useState } from 'react';
import { Mail, Github, Instagram, Facebook, Globe, Phone, ExternalLink, Sparkles, Music, Tv, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';

const socialLinks = [
  { icon: Instagram, label: 'Instagram', url: '#', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' },
  { icon: Facebook, label: 'Facebook', url: '#', color: 'bg-blue-600' },
  { icon: Phone, label: 'WhatsApp', url: '#', color: 'bg-green-500' },
  { icon: Globe, label: 'Sitio Web', url: 'https://radiocorrientesviva.com.ar', color: 'bg-white/10' },
];

export const Mas = () => {
  const { setActiveTab, isInstallable, installPrompt, setInstallPrompt } = useStore();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }
      localStorage.clear();
      sessionStorage.clear();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e) {
      window.location.reload();
    }
  };

  const triggerAlert = (name: string) => {
    setToastMessage(name);
    setShowToast(true);
    // Auto collapse after 3.2 seconds
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 3200);
    return () => clearTimeout(timer);
  };

  const handleInstallClick = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstallPrompt(null);
        }
      } catch (e) {
        console.error("Error during install prompt:", e);
      }
    } else {
      alert("Para instalar la App Oficial:\n1. Toca los 3 puntos (⋮) arriba a la derecha en Google Chrome.\n2. Selecciona 'Instalar aplicación' o 'Instalar Radio Corrientes Viva'.\n(Nota: No elijas 'Agregar a pantalla principal' ya que solo crea un acceso directo básico).");
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-32 px-6 bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* PWA Install Section (Shown when in browser mode) */}
        {!window.matchMedia('(display-mode: standalone)').matches && !(navigator as any).standalone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-[2.5rem] bg-gradient-to-br from-[#ff007f] via-[#9333ea] to-[#4f46e5] space-y-4 shadow-2xl relative overflow-hidden border border-white/20"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={80} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-xl flex items-center justify-center shrink-0 border border-white/30">
                  <img 
                    src="/pwa-maskable-192x192.png" 
                    alt="Icono Radio Corrientes Viva" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-widest text-white mb-1">
                    App Oficial
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">
                    Instalar en Pantalla de Inicio
                  </h3>
                </div>
              </div>

              <p className="text-xs text-white/90 font-medium leading-relaxed">
                Disfruta de la radio como una aplicación nativa con su icono distintivo, sin barras de navegación y con máxima estabilidad.
              </p>

              <button 
                onClick={handleInstallClick}
                className="w-full py-3.5 bg-white text-[#ff007f] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/95 transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Instalar Aplicación Oficial
              </button>

              <div className="bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-[11px] text-white/80 space-y-2">
                <p className="font-bold text-white uppercase tracking-wider text-[10px] text-cyan-300">Instalación Rápida:</p>
                <p>• <strong>Android (Chrome):</strong> Menú <span className="bg-white/20 px-1 rounded font-mono">⋮</span> &gt; <strong>“Instalar aplicación”</strong>.</p>
                <p>• <strong>iPhone (Safari):</strong> Botón <span className="bg-white/20 px-1 rounded font-mono">[↑]</span> &gt; <strong>“Agregar a inicio”</strong>.</p>
                <p className="text-[10px] text-white/60 pt-1 border-t border-white/10">💡 Desinstala cualquier acceso con la letra "R" previo para que Android instale el paquete completo con el logo oficial.</p>
              </div>

              <button
                onClick={handleForceUpdate}
                disabled={isUpdating}
                className="w-full py-2.5 bg-black/40 hover:bg-black/60 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} className={isUpdating ? "animate-spin text-cyan-300" : ""} />
                {isUpdating ? "Limpiando y actualizando..." : "Limpiar Caché y Forzar Actualización"}
              </button>
            </div>
          </motion.div>
        )}
        {/* Reflection & Multimedia Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase italic underline decoration-[#ff007f] decoration-4 underline-offset-8">Inspiración y Multimedia</h2>
            <p className="text-sm text-white/40">Detente un momento para alimentar tu espíritu y disfrutar contenido audiovisual.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('video')}
              className="w-full relative overflow-hidden group rounded-[2.5rem] border border-white/10 bg-zinc-950/50 p-8 text-left transition-all hover:border-[#ff007f]/30 shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
                <Tv size={60} className="text-[#ff007f]" />
              </div>
              
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ff007f]/10 border border-[#ff007f]/20 flex items-center justify-center">
                  <Tv size={24} className="text-[#ff007f]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white italic uppercase leading-none tracking-tighter">
                    Videos <br />
                    <span className="text-[#ff007f]">En Vivo</span>
                  </h3>
                  <p className="text-xs text-white/50 font-medium">Transmisiones, festivales y fe.</p>
                </div>
              </div>
            </motion.button>
          </div>
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
          {socialLinks.map((link) => {
            const isUnderConstruction = ['Instagram', 'Facebook', 'Sitio Web'].includes(link.label);
            
            return (
              <motion.button
                key={link.label}
                onClick={() => {
                  if (isUnderConstruction) {
                    triggerAlert(link.label);
                  } else {
                    // Open WhatsApp in a new tab
                    window.open('https://wa.me/5491159204990', '_blank');
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex flex-col items-center justify-center p-6 rounded-3xl ${link.color} transition-all border border-white/5 shadow-xl cursor-pointer w-full text-center`}
              >
                <link.icon size={28} className="mb-2 text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">{link.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 backdrop-blur-md">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
             <Mail size={16} className="text-[#ff007f]" /> 
             Publicidad & Contacto
          </h3>
          <p className="text-xs text-white/40 leading-relaxed">
            Si tienes problemas con la señal o quieres publicitar en nuestra emisora, contáctanos.
          </p>
          <button 
            onClick={() => triggerAlert('Email')}
            className="w-full py-3 bg-[#ff007f]/10 border border-[#ff007f]/20 hover:bg-[#ff007f]/20 rounded-xl text-xs font-bold text-[#ff007f] transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
          >
            ENVIAR EMAIL <ExternalLink size={14} />
          </button>
        </div>

        {/* Floating Under Construction Notification Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed bottom-24 left-6 right-6 z-[999] bg-zinc-950/95 border border-yellow-500/30 shadow-[0_4px_30px_rgba(234,179,8,0.2)] rounded-3xl p-5 flex items-center gap-4 backdrop-blur-xl"
            >
              <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Sitio en Construcción
                </h4>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold leading-normal">
                  La opción de <span className="text-[#ff007f] font-black">{toastMessage}</span> está siendo preparada y estará disponible pronto.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center py-6 space-y-4">
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 max-w-sm mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Versión 2.5.0 Actualizada</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">Online</span>
            </div>
            <p className="text-[11px] text-white/50 text-left leading-relaxed">
              ¿No visualizas los últimos cambios o mejoras en tu pantalla? Pulsa el botón para sincronizar la app.
            </p>
            <button
              onClick={handleForceUpdate}
              disabled={isUpdating}
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 active:scale-98 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10"
            >
              <RefreshCw size={14} className={isUpdating ? "animate-spin text-[#00f2ff]" : "text-[#ff007f]"} />
              {isUpdating ? "Sincronizando..." : "Sincronizar y Limpiar Caché"}
            </button>
          </div>

          <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium">
            Desarrollado para Radio Corrientes Viva
          </p>
        </div>
      </motion.div>
    </div>
  );
};
