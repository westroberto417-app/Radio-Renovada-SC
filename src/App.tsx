import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { PersistentPlayer } from './components/PersistentPlayer';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { Inicio } from './components/Inicio';
import { Chat } from './components/Chat';
import { PedirTema } from './components/PedirTema';
import { Noticias } from './components/Noticias';
import { Mas } from './components/Mas';
import { AdminPanel } from './components/AdminPanel';
import { PedidosLista } from './components/PedidosLista';
import { Sumate } from './components/Sumate';
import { Reflexion } from './components/Reflexion';
import { Programacion } from './components/Programacion';
import { Donaciones } from './components/Donaciones';
import Aplicacion from './components/Aplicacion';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollToTop } from './components/ScrollToTop';

const App = () => {
  const { activeTab, setRequestCount, setInstallPrompt } = useStore();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
      console.log('PWA Install prompt deferred');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setInstallPrompt]);

  useEffect(() => {
    const fetchRequestCount = async () => {
      try {
        const res = await fetch('/api/requests');
        if (res.ok) {
          const data = await res.json();
          setRequestCount(data.length);
        }
      } catch (e) {
         // Silently ignore
      }
    };
    fetchRequestCount();
    const interval = setInterval(fetchRequestCount, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, [setRequestCount]);

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio': return <Inicio />;
      case 'chat': return <Chat />;
      case 'pedir': return <PedirTema />;
      case 'noticias': return <Noticias />;
      case 'mas': return <Mas />;
      case 'admin': return <AdminPanel />;
      case 'pedidos_lista': return <PedidosLista />;
      case 'sumate': return <Sumate />;
      case 'aplicacion': return <Aplicacion />;
      case 'reflexion': return <Reflexion />;
      case 'programacion': return <Programacion />;
      case 'donaciones': return <Donaciones />;
      default: return <Inicio />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#ff007f]/30 overflow-hidden relative">
      {/* Global Background Elements from Theme */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden will-change-transform">
        <img 
          src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=2000" 
          alt="Studio Background"
          className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale-[0.5] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0b1e]/95 via-[#0a0b1e]/80 to-black/90" />
        <div className="absolute inset-0 bg-[#ff007f]/5 mix-blend-overlay" />
        
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,0,127,0.08)_0%,transparent_70%)] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(37,99,235,0.08)_0%,transparent_70%)] rounded-full" />
      </div>

      <PersistentPlayer />
      <TopBar />
      
      <main className="relative z-10 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
        
        {/* Global Footer Text */}
        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none opacity-50">
          <p className="text-[7px] text-white/30 uppercase tracking-widest font-black">
            App creada por West y Google AI Studio
          </p>
        </div>
      </main>

      <BottomNav />
      <ScrollToTop />
    </div>
  );
};

export default App;
