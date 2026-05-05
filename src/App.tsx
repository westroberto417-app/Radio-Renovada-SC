import React from 'react';
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
import { Sumate } from './components/Sumate';
import { Reflexion } from './components/Reflexion';
import Aplicacion from './components/Aplicacion';
import { motion, AnimatePresence } from 'motion/react';

const App = () => {
  const { activeTab } = useStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio': return <Inicio />;
      case 'chat': return <Chat />;
      case 'pedir': return <PedirTema />;
      case 'noticias': return <Noticias />;
      case 'mas': return <Mas />;
      case 'admin': return <AdminPanel />;
      case 'sumate': return <Sumate />;
      case 'aplicacion': return <Aplicacion />;
      case 'reflexion': return <Reflexion />;
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
          className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale-[0.5] scale-110 motion-safe:animate-[pulse_15s_infinite]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0b1e]/90 via-[#0a0b1e]/70 to-black/80" />
        <div className="absolute inset-0 bg-[#ff007f]/10 mix-blend-overlay" />
        
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#ff007f]/10 rounded-full blur-[160px] opacity-50" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] opacity-50" />
      </div>

      <PersistentPlayer />
      <TopBar />
      
      <main className="relative z-10 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
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
    </div>
  );
};

export default App;
