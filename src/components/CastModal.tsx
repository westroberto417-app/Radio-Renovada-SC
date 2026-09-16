import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Cast, Tv, Airplay, Copy, Check, 
  ExternalLink, QrCode, Radio, Sparkles, Volume2 
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

interface CastModalProps {
  onClose: () => void;
}

export const CastModal = ({ onClose }: CastModalProps) => {
  const isPlaying = useStore((state) => state.isPlaying);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [castStatus, setCastStatus] = useState<string | null>(null);

  const STREAM_URL = 'https://streaming.rf.com.ar/listen/radiocorrientesviva/radio.mp3';
  const APP_URL = typeof window !== 'undefined' ? window.location.href : 'https://radiocorrientesviva.com';

  const handleNativeCast = async () => {
    setCastStatus(null);
    const audio = document.querySelector('audio') as any;

    if (!audio) {
      setCastStatus('Iniciando reproductor de audio...');
      setIsPlaying(true);
      return;
    }

    if (!isPlaying) {
      setIsPlaying(true);
    }

    // 1. Apple AirPlay Target Picker
    if (typeof audio.webkitShowPlaybackTargetPicker === 'function') {
      try {
        audio.webkitShowPlaybackTargetPicker();
        setCastStatus('Abriendo selector de AirPlay / Apple TV...');
        return;
      } catch (e) {
        console.warn('Airplay target picker error:', e);
      }
    }

    // 2. W3C Remote Playback API (Chromecast / Smart TVs en Chrome)
    if (audio.remote && typeof audio.remote.prompt === 'function') {
      try {
        setCastStatus('Buscando dispositivos Chromecast y Smart TV...');
        await audio.remote.prompt();
        setCastStatus('¡Conectado exitosamente al dispositivo!');
        setTimeout(() => setCastStatus(null), 4000);
        return;
      } catch (err: any) {
        if (err.name === 'NotFoundError' || err.message === 'The prompt was dismissed.' || err.name === 'NotAllowedError') {
          setCastStatus(null);
          return;
        }
        console.warn('Remote playback prompt warning:', err);
      }
    }

    // 3. Fallback instructions
    setCastStatus('Selecciona tu Smart TV o receptor de audio en el menú de tu navegador.');
    setTimeout(() => setCastStatus(null), 5000);
  };

  const handleCopyStream = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(STREAM_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenDirectStream = () => {
    window.open(STREAM_URL, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
        className="relative w-full max-w-lg bg-[#0e0f26] border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden z-10"
      >
        {/* Ambient Background Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#ff007f]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#00f2ff]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff007f]/20 border border-[#ff007f]/40 flex items-center justify-center text-[#ff007f] shadow-[0_0_15px_rgba(255,0,127,0.3)]">
              <Cast size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-wider leading-tight">
                Transmitir Señal en Vivo
              </h3>
              <p className="text-[11px] text-white/50 font-medium">
                Smart TV, Chromecast, AirPlay y Parlantes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Message Notification */}
        {castStatus && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-2xl bg-[#ff007f]/15 border border-[#ff007f]/30 text-xs font-bold text-white flex items-center gap-2"
          >
            <Sparkles size={16} className="text-[#ff007f] shrink-0" />
            <span>{castStatus}</span>
          </motion.div>
        )}

        {/* Options List */}
        <div className="mt-5 space-y-3">
          {/* Option 1: Native Cast / AirPlay Button */}
          <button
            onClick={handleNativeCast}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 border border-white/15 hover:border-[#ff007f]/50 hover:from-[#ff007f]/20 hover:to-white/5 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:text-[#ff007f] transition-all">
                <Tv size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white uppercase tracking-wider">
                    Chromecast / Smart TV
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#ff007f]/30 text-[#ff007f] text-[9px] font-black uppercase">
                    Inalámbrico
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  Conectar directamente a televisores compatibles o Android TV
                </p>
              </div>
            </div>
            <Cast size={18} className="text-white/40 group-hover:text-white transition-colors" />
          </button>

          {/* Option 2: AirPlay / Apple TV */}
          <button
            onClick={handleNativeCast}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/10 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 text-[#00f2ff] transition-all">
                <Airplay size={20} />
              </div>
              <div>
                <span className="text-sm font-black text-white uppercase tracking-wider block">
                  Apple AirPlay / Mac
                </span>
                <p className="text-xs text-white/50">
                  Enviar a Apple TV, HomePod o dispositivos iOS
                </p>
              </div>
            </div>
            <ExternalLink size={18} className="text-white/40 group-hover:text-white transition-colors" />
          </button>

          {/* Option 3: Direct Stream URL Copy (for VLC, TV Boxes, Kodi) */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-[#ff007f]" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Enlace de Transmisión HD
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-mono">MP3 • 128 kbps</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-mono text-white/70 truncate select-all">
                {STREAM_URL}
              </div>
              <button
                onClick={handleCopyStream}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
                  copied
                    ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    : "bg-[#ff007f] hover:bg-[#ff007f]/80 text-white"
                )}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Ideal para reproductores Smart TV, VLC Media Player, Roku, Winamp o navegadores de Smart TV.
            </p>
          </div>

          {/* Option 4: QR Code & Open Direct Player */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setShowQR(!showQR)}
              className={cn(
                "p-3 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                showQR
                  ? "bg-white/20 border-white/40 text-white"
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <QrCode size={16} className="text-[#00f2ff]" />
              <span>{showQR ? 'Ocultar QR' : 'Escanear QR'}</span>
            </button>

            <button
              onClick={handleOpenDirectStream}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ExternalLink size={16} className="text-[#ff007f]" />
              <span>Abrir Señal</span>
            </button>
          </div>

          {/* Dynamic QR Display */}
          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center space-y-2 mt-2">
                  <div className="bg-white p-3 rounded-2xl shadow-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(APP_URL)}`}
                      alt="QR Radio Corrientes Viva"
                      className="w-36 h-36"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-[11px] font-bold text-white/90">
                    Apunta con la cámara de tu Smart TV o celular
                  </p>
                  <p className="text-[9px] text-white/40">
                    Para sintonizar en pantalla grande instantáneamente
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Notice */}
        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-white/30 uppercase tracking-widest font-mono">
          <span className="flex items-center gap-1">
            <Volume2 size={12} className="text-[#ff007f]" />
            Radio Corrientes Viva
          </span>
          <span>San Miguel, Ctes</span>
        </div>
      </motion.div>
    </div>
  );
};
