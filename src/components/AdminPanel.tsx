import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Send, Play, Settings, AlertCircle, Sparkles, Volume2, RefreshCcw, Save, Trash2, History, User, Music } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

interface RadioBossConfig {
  ip: string;
  pass: string;
  enabled: boolean;
  duckingVol: number;
}

interface SongRequest {
  id: number;
  name: string;
  song: string;
  artist: string;
  message: string;
  timestamp: string;
}

export const AdminPanel = () => {
  const [announcementText, setAnnouncementText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionStatus, setTransmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showConfig, setShowConfig] = useState(false);
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  
  const [rbConfig, setRbConfig] = useState<RadioBossConfig>(() => {
    try {
      const saved = localStorage.getItem('rb_config');
      return saved ? JSON.parse(saved) : { ip: '127.0.0.1:9000', pass: '', enabled: false, duckingVol: 15 };
    } catch (e) {
      return { ip: '127.0.0.1:9000', pass: '', enabled: false, duckingVol: 15 };
    }
  });

  const { setIsDucked } = useStore();

  useEffect(() => {
    try {
      localStorage.setItem('rb_config', JSON.stringify(rbConfig));
    } catch (e) {
      console.warn("No se pudo guardar la configuración", e);
    }
  }, [rbConfig]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000); // Cada 30 seg
    return () => {
      window.speechSynthesis.cancel();
      setIsDucked(false);
      clearInterval(interval);
    }
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error("Error fetching requests:", e);
    }
  };

  const deleteRequest = async (id: number) => {
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRequests(requests.filter(r => r.id !== id));
      }
    } catch (e) {
      console.error("Error deleting request:", e);
    }
  };

  const clearAllRequests = async () => {
    if (!confirm("¿Seguro que quieres borrar todos los pedidos?")) return;
    try {
      const res = await fetch('/api/requests', { method: 'DELETE' });
      if (res.ok) {
        setRequests([]);
      }
    } catch (e) {
      console.error("Error clearing requests:", e);
    }
  };

  const sendRbCommand = async (action: string) => {
    if (!rbConfig.enabled || !rbConfig.ip || !rbConfig.pass) return;
    
    // Si el usuario pone una URL completa (ej. con ngrok https://...), usarla. Si no, asumir http://
    let baseUrl = rbConfig.ip.trim();
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    if (!baseUrl.startsWith('http')) {
      baseUrl = `http://${baseUrl}`;
    }
    
    const targetUrl = `${baseUrl}/?pass=${encodeURIComponent(rbConfig.pass)}&action=${action}`;
    
    // Si es una IP local o localhost, conectamos directo desde el navegador (requiere "permitir contenido no seguro")
    // Si es ngrok o dominio público, pasamos por el proxy del servidor para evitar problemas de CORS
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('192.168.') || baseUrl.includes('10.');
    
    console.log("Enviando comando a RadioBoss:", isLocal ? "Directo" : "Vía Proxy", targetUrl);

    try {
      if (isLocal) {
        // Petición directa (El cliente debe habilitar HTTP mixto)
        const res = await fetch(targetUrl, { mode: 'no-cors' }); // no-cors sirve para enviar comandos, aunque no leamos la respuesta
        console.log("Comando local enviado exitosamente.");
      } else {
        // Petición por Proxy (Server to Server, sirve para ngrok)
        const proxyUrl = `/api/rb-proxy?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) {
          console.warn("Proxy devolvió error HTTP", res.status);
        } else {
          console.log("Comando a través del proxy enviado exitosamente.");
        }
      }
    } catch (e) {
      console.error("Error conectando con RadioBoss:", e);
    }
  };

  const testConnection = async () => {
    setTransmissionStatus('idle');
    // Enviamos un comando inofensivo: pedir información de reproducción
    await sendRbCommand('playbackinfo');
    alert("Comando de prueba enviado. Verifica si RadioBoss parpadeó o si algo cambió en el registro de RadioBoss. Si tienes error de autorización (401), revisa que la contraseña sea correcta.");
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      setAnnouncementText("⚠️ ATENCIÓN VECINOS:\n\nSe aproxima un frente de tormenta fuerte para la región. Se recomienda tomar precauciones, asegurar objetos y evitar salir si no es estrictamente necesario. Manténganse en sintonía con la radio para más actualizaciones del clima.");
      setIsGenerating(false);
    }, 1500);
  };

  const handleTransmit = async () => {
    if (!announcementText) return;
    setIsTransmitting(true);
    setTransmissionStatus('idle');

    // 1. Aplicar Ducking en App y RadioBoss
    setIsDucked(true);
    await sendRbCommand(`setvol&vol=${rbConfig.duckingVol}`);
    
    setTransmissionStatus('success');
      
    const utterance = new SpeechSynthesisUtterance(announcementText);
    utterance.lang = 'es-AR';
    utterance.rate = 0.95; 
    utterance.pitch = 0.98; 
    
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
    
    if (selectedVoice) utterance.voice = selectedVoice;

    // 2. Restaurar niveles al terminar de hablar
    const restoreLevels = async () => {
      setIsDucked(false);
      await sendRbCommand('setvol&vol=100'); // Assuming 100 is max, adjust si el standard es diferente
      setIsTransmitting(false);
      setTimeout(() => setTransmissionStatus('idle'), 3000);
    };

    utterance.onend = restoreLevels;
    utterance.onerror = restoreLevels;

    // Retraso muy leve para permitir que el ducking ocurra primero
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 500);
  };

  return (
    <div className="min-h-screen pt-24 pb-32 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase italic underline decoration-red-500 decoration-4 underline-offset-8">
              RadioBoss Link
            </h2>
            <p className="text-sm text-white/50">
              Sistema de transmisión remota de alertas
            </p>
          </div>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={cn("p-3 rounded-full transition-all", showConfig ? "bg-white/20 text-white" : "bg-white/5 text-white/50 hover:text-white")}
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Configuration Panel */}
        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 rounded-3xl bg-black/40 border border-white/10 space-y-4 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Radio size={16} className="text-red-500" /> API de RadioBoss
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={rbConfig.enabled}
                      onChange={(e) => setRbConfig({...rbConfig, enabled: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>
                
                {rbConfig.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">IP : PUERTO</label>
                      <input 
                        type="text" 
                        value={rbConfig.ip}
                        onChange={(e) => setRbConfig({...rbConfig, ip: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                        placeholder="127.0.0.1:9000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Contraseña API</label>
                      <input 
                        type="password" 
                        value={rbConfig.pass}
                        onChange={(e) => setRbConfig({...rbConfig, pass: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Volumen de Ducking (%)</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={rbConfig.duckingVol}
                          onChange={(e) => setRbConfig({...rbConfig, duckingVol: parseInt(e.target.value)})}
                          className="w-full accent-red-500"
                        />
                        <span className="text-white font-mono text-sm w-8">{rbConfig.duckingVol}%</span>
                      </div>
                    </div>
                    <div className="md:col-span-2 mt-4">
                      <button 
                        onClick={testConnection}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl border border-white/10 transition-all"
                      >
                        Probar Conexión (Ping)
                      </button>
                    </div>
                    <div className="md:col-span-2 mt-2 flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                      <p className="text-[10px] text-yellow-500/80 leading-relaxed font-bold tracking-wider">
                        NOTA: Para que funcione la comunicación local y debido a las reglas de seguridad de los navegadores (Contenido Mixto HTTPS/HTTP), debes tener habilitada la opción de "Permitir contenido no seguro" para esta pestaña en específico (en el candado de la URL).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-2">
            Contenido de la Transmisión
          </label>
          <div className="relative">
            <textarea
              className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff007f]/50 transition-colors resize-none"
              placeholder="Escribe el aviso de urgencia, evento climático o noticia aquí..."
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
            />
            
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="absolute bottom-4 right-4 bg-[#ff007f]/20 hover:bg-[#ff007f]/40 text-[#ff007f] border border-[#ff007f]/30 p-3 rounded-2xl transition-all disabled:opacity-50"
              title="Redactar alerta con IA"
            >
              {isGenerating ? <RefreshCcw className="animate-spin" size={20} /> : <Sparkles size={20} />}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <button
          onClick={handleTransmit}
          disabled={isTransmitting || !announcementText.trim()}
          className={cn(
            "w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
            isTransmitting ? "bg-white/10 text-white/50" : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
          )}
        >
          {isTransmitting ? (
            <>Transmitiendo...</>
          ) : (
            <>
              <Radio size={16} /> Salir al Aire
            </>
          )}
        </button>

        {/* Listener Requests Section */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ff007f]/10 flex items-center justify-center text-[#ff007f]">
                <Music size={20} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Pedidos de Oyentes</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight">
                  {requests.length} {requests.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchRequests}
                className="p-2 transition-all bg-white/5 text-white/40 hover:text-white rounded-xl"
                title="Actualizar"
              >
                <RefreshCcw size={16} />
              </button>
              {requests.length > 0 && (
                <button 
                  onClick={clearAllRequests}
                  className="p-2 transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl"
                  title="Borrar todo"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {requests.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center space-y-3"
                >
                  <div className="p-3 bg-white/5 rounded-2xl text-white/20">
                    <History size={24} />
                  </div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-loose">
                    No hay pedidos <br /> nuevos por ahora
                  </p>
                </motion.div>
              ) : (
                requests.map((req) => (
                  <motion.div 
                    key={req.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-3 relative group"
                  >
                    <button 
                      onClick={() => deleteRequest(req.id)}
                      className="absolute top-4 right-4 p-2 bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 shrink-0">
                        <User size={18} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#ff007f] uppercase tracking-widest">{req.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white italic uppercase tracking-tighter">{req.song}</span>
                          <span className="text-xs text-white/40">—</span>
                          <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{req.artist}</span>
                        </div>
                      </div>
                    </div>

                    {req.message && (
                      <div className="pl-14">
                        <p className="text-xs text-white/40 font-medium leading-relaxed italic bg-white/5 p-3 rounded-2xl italic">
                          "{req.message}"
                        </p>
                      </div>
                    )}
                    
                    <div className="pl-14 flex items-center gap-2">
                       <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                         {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status indicator */}
        <AnimatePresence>
          {transmissionStatus === 'success' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center"
            >
              <p className="text-xs text-green-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                <Volume2 size={16} /> Audio en vivo (Ducking activo)
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};
