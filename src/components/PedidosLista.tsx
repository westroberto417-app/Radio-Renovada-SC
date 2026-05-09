import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, RefreshCcw, Trash2, History, User } from 'lucide-react';

interface SongRequest {
  id: number;
  name: string;
  song: string;
  artist: string;
  message: string;
  timestamp: string;
}

export const PedidosLista = () => {
  const [requests, setRequests] = useState<SongRequest[]>([]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000); // Cada 10 seg
    return () => clearInterval(interval);
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

  return (
    <div className="min-h-screen pt-24 pb-32 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase italic underline decoration-[#ff007f] decoration-4 underline-offset-8">
              Bandeja de Pedidos
            </h2>
            <p className="text-sm text-white/50">
              Solicitudes musicales de los oyentes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchRequests}
              className="p-3 bg-white/5 text-white/50 hover:text-white rounded-xl transition-all"
            >
              <RefreshCcw size={20} />
            </button>
            {requests.length > 0 && (
              <button 
                onClick={clearAllRequests}
                className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all"
                title="Borrar todo"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <AnimatePresence mode="popLayout">
            {requests.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="p-4 bg-white/5 rounded-3xl text-white/20">
                  <History size={32} />
                </div>
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest leading-loose">
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
                  className="p-6 bg-zinc-950/50 border border-white/10 rounded-[2.5rem] space-y-4 relative group shadow-xl"
                >
                  <button 
                    onClick={() => deleteRequest(req.id)}
                    className="absolute top-6 right-6 p-2 bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex items-start gap-4 pr-12">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#ff007f] shrink-0">
                      <Music size={20} />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xs font-black text-[#00f2ff] uppercase tracking-widest">{req.name}</p>
                      <h3 className="text-lg font-black text-white italic uppercase leading-tight tracking-tighter">
                        {req.song}
                      </h3>
                      <p className="text-sm font-bold text-white/60 uppercase tracking-widest">
                        {req.artist}
                      </p>
                    </div>
                  </div>

                  {req.message && (
                    <div className="pl-16">
                      <p className="text-sm text-white/50 font-medium leading-relaxed italic bg-white/5 p-4 rounded-2xl relative">
                        <span className="absolute -left-2 -top-2 text-2xl text-white/10">"</span>
                        {req.message}
                        <span className="absolute -right-2 -bottom-4 text-2xl text-white/10">"</span>
                      </p>
                    </div>
                  )}
                  
                  <div className="pl-16 flex items-center gap-2">
                     <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                       Recibido a las {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
};
