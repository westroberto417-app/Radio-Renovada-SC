import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface WelcomeScreenProps {
  onDismiss: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onDismiss }) => {
  const [imageSrc, setImageSrc] = useState('/presentacion final.jpeg');
  const [attemptIndex, setAttemptIndex] = useState(0);

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
      // If none of the presentacion_final variations exist, fall back to /logo.png as safety
      setImageSrc('/logo.png');
    }
  };

  useEffect(() => {
    const handleEvents = () => {
      onDismiss();
    };

    // Listen for any keydown, click, or touchstart
    window.addEventListener('keydown', handleEvents);
    window.addEventListener('click', handleEvents);
    window.addEventListener('touchstart', handleEvents);

    return () => {
      window.removeEventListener('keydown', handleEvents);
      window.removeEventListener('click', handleEvents);
      window.removeEventListener('touchstart', handleEvents);
    };
  }, [onDismiss]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 overflow-hidden select-none cursor-pointer"
    >
      {/* Dynamic blurred background glow representing the presentation image */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-[50px] opacity-20 scale-110 pointer-events-none transition-all duration-500"
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
      
      {/* Ambient pink/blue radial spotlights */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ff007f]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full h-full justify-between py-4 max-h-[96vh]">
        
        {/* Top subtle greeting */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-center"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white/50">
            Radio Corrientes Viva
          </span>
        </motion.div>

        {/* Poster Image Content - Ultra responsive layout */}
        <div className="my-auto w-full flex items-center justify-center p-2 max-h-[75vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -6, 0]
            }}
            transition={{
              opacity: { duration: 0.8, ease: "easeOut" },
              scale: { duration: 0.8, ease: "easeOut" },
              y: {
                repeat: Infinity,
                duration: 5,
                ease: "easeInOut"
              }
            }}
            className="relative rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,0,127,0.35)] border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center p-1 w-full max-w-[400px]"
          >
            {/* Subtle inside shine effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/5 pointer-events-none z-30" />
            
            <img 
              src={imageSrc} 
              alt="Bienvenido a Radio Corrientes Viva"
              onError={handleImageError}
              className="w-full h-auto max-h-[70vh] object-contain rounded-2xl pointer-events-none z-20 transition-all duration-300"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        {/* Dynamic bottom action indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ 
            initial: { duration: 0.8 },
            opacity: {
              repeat: Infinity,
              duration: 2.2,
              ease: "easeInOut"
            }
          }}
          className="text-center mt-3 px-5 py-2 bg-gradient-to-r from-transparent via-[#ff007f]/10 to-transparent rounded-full border border-white/[0.03]"
        >
          <span className="text-xs sm:text-sm font-black uppercase tracking-[0.15em] text-white drop-shadow-[0_0_10px_rgba(255,0,127,0.6)]">
            Toca la pantalla o presiona una tecla para continuar
          </span>
        </motion.div>

      </div>
    </motion.div>
  );
};
