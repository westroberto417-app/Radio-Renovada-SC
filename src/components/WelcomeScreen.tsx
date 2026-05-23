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
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07070a] overflow-hidden select-none cursor-pointer"
    >
      {/* Dynamic blurred background glow representing the presentation image to fill any screen container padding voids */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-[50px] opacity-25 scale-110 pointer-events-none transition-all duration-500"
        style={{ backgroundImage: `url('${imageSrc}')` }}
      />
      
      {/* Ambient pink/blue radial spotlights */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#ff007f]/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />

      {/* Main Fullscreen Image Container */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full h-full flex items-center justify-center"
        >
          <img 
            src={imageSrc} 
            alt="Bienvenido a Radio Corrientes Viva"
            onError={handleImageError}
            className="w-full h-full max-h-screen object-contain pointer-events-none z-20"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      {/* Dynamic bottom action indicator overlay - ultra-low positioned, subtle and tiny to protect poster information */}
      <div className="absolute bottom-1.5 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
        <motion.div 
          animate={{ 
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex items-center gap-1 bg-black/40 px-2.5 py-0.5 rounded-full backdrop-blur-sm"
        >
          <span className="w-1 h-1 rounded-full bg-[#ff007f] opacity-80" />
          <span className="text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.16em] text-white/60">
            Toca en cualquier lugar para ingresar
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};
