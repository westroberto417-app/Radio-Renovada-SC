import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const PersistentPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isPlaying, volume, isMuted, isDucked, setIsPlaying, setTrack, currentTrack } = useStore();
  const STREAM_URL = 'https://streaming.rf.com.ar/listen/radiocorrientesviva/radio.mp3';

  // Polling de metadatos desactivado por solicitud del usuario
  useEffect(() => {
    // Seteamos metadatos estáticos iniciales
    setTrack({
      title: 'Transmitiendo en Vivo',
      artist: 'Radio Corrientes Viva',
      albumArt: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800'
    });
  }, [setTrack]);

  // Update Media Session API dynamically
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Radio Corrientes Viva',
        artist: currentTrack.artist || 'En Vivo',
        album: 'Radio Corrientes Viva',
        artwork: [
          { src: currentTrack.albumArt || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=512&h=512&fit=crop', sizes: '512x512', type: 'image/jpeg' } // Using a generic radio/music Unsplash image as fallback if logo.png doesn't exist, though we can stick to what was there '/logo.png'
        ]
      });
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      const finalVolume = isMuted ? 0 : (isDucked ? volume * 0.15 : volume);
      audioRef.current.volume = finalVolume;
    }
  }, [volume, isMuted, isDucked]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // Para radio en vivo, si no tiene src o fue removido, lo volvemos a setear con un timestamp 
        // para asegurar que conecte a la emisión actual y no reproduzca audio bufferizado (del pasado).
        if (!audioRef.current.src || !audioRef.current.src.includes(STREAM_URL)) {
          audioRef.current.src = STREAM_URL + '?t=' + Date.now();
        }
        
        audioRef.current.play().catch((err) => {
          console.error("Playback error:", err);
          setIsPlaying(false);
        });

        // Media Session API for background/system controls
        if ('mediaSession' in navigator) {
          navigator.mediaSession.setActionHandler('play', () => {
            if (audioRef.current && !audioRef.current.src.includes(STREAM_URL)) {
              audioRef.current.src = STREAM_URL + '?t=' + Date.now();
            }
            audioRef.current?.play();
            setIsPlaying(true);
          });
          navigator.mediaSession.setActionHandler('pause', () => {
            audioRef.current?.pause();
            // Descartamos el stream para que no guarde buffer viejo
            if (audioRef.current) {
              audioRef.current.removeAttribute('src');
              audioRef.current.load();
            }
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
        // Cuando pausamos radio en vivo, debemos descartar el buffer para no escuchar el pasado al reanudar
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
    }
  }, [isPlaying, setIsPlaying]);

  // Prevent accidental tab closure while playing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isPlaying) {
        e.preventDefault();
        e.returnValue = 'La radio está activa. ¿Seguro que quieres salir?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPlaying]);

  return (
    <audio
      ref={audioRef}
      onEnded={() => setIsPlaying(false)}
      onPlay={() => console.log("Streaming iniciado")}
      onError={(e) => {
        const target = e.target as HTMLAudioElement;
        console.error("Audio error code:", target.error?.code, "message:", target.error?.message);
        
        // Si hay un error de red o de formato, intentamos recargar
        if (isPlaying) {
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.src = STREAM_URL + '?t=' + Date.now();
              audioRef.current.play().catch(err => console.error("Retry failed:", err));
            }
          }, 3000);
        }
      }}
    />
  );
};

// Export the audio element ref for the visualizer
export const getAudioElement = () => document.querySelector('audio');
