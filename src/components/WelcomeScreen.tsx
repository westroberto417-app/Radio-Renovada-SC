import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Radio, Play, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onDismiss: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onDismiss }) => {
  const [imageSrc, setImageSrc] = useState('/presentacion final.jpeg');
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [canDismiss, setCanDismiss] = useState(false);

  const fallbackImages = [
    '/presentacion final.jpeg',
    '/presentacion%20final.jpeg',
    '/presentacion final.jpg',
    '/presentacion%20final.jpg',
    '/presentacion_final.png',
    '/presentacion_final.jpg',
    '/presentacion_final.jpeg',
    '/logo.png'
  ];

  const handleImageError = () => {
    if (attemptIndex < fallbackImages.length - 1) {
      const nextIndex = attemptIndex + 1;
      setAttemptIndex(nextIndex);
      setImageSrc(fallbackImages[nextIndex]);
    } else {
      setImageSrc('/logo.png');
    }
  };

  // Prevent instant accidental dismiss on initial page load / mobile gesture
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanDismiss(true);
    }, 900); // Guard delay

    return () => clearTimeout(timer);
  }, []);

  const handleUserDismiss = () => {
    if (!canDismiss) return;
    onDismiss();
  };

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.5, ease: 'easeInOut' } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#07070a] overflow-hidden select-none p-4 sm:p-6"
      onClick={handleUserDismiss}
    >
      {/* Dynamic blurred background glow */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-[60px] opacity-30 scale-110 pointer-events-none transition-all duration-700"
        style={{ backgroundImage: `url('${imageSrc}')` }}
      />
      
      {/* Ambient spotlights */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ff007f]/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#00f2ff]/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />

      {/* Top Header Badge */}
      <div className="relative z-20 pt-2 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-black/60 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg"
        >
          <Radio size={14} className="text-[#ff007f] animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">
            Radio Corrientes Viva
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-ping" />
        </motion.div>
      </div>

      {/* Main Fullscreen Poster / Presentation Container */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center my-2 max-h-[78vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full h-full flex items-center justify-center"
        >
          <img 
            src={imageSrc} 
            alt="Presentación Radio Corrientes Viva"
            onError={handleImageError}
            className="w-full h-full max-h-[75vh] object-contain rounded-2xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-20 pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      {/* Action Button & Instructions */}
      <div className="relative z-30 pb-2 w-full max-w-sm flex flex-col items-center gap-2.5">
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#ff007f] via-[#d0006f] to-[#00f2ff] text-white font-black text-xs uppercase tracking-[0.25em] shadow-[0_0_25px_rgba(255,0,127,0.4)] hover:shadow-[0_0_35px_rgba(0,242,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <Play size={15} className="fill-white" />
          <span>Ingresar a la Radio</span>
          <Sparkles size={14} className="text-white/80" />
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.6 }}
          className="text-[9px] font-bold text-white/50 uppercase tracking-[0.18em] text-center"
        >
          O toca en cualquier parte para continuar
        </motion.p>
      </div>
    </motion.div>
  );
};

