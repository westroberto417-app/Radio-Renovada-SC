import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const PersistentPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isPlaying, volume, isMuted, isDucked, setIsPlaying, setTrack, currentTrack } = useStore();
  const STREAM_URL = '/api/stream';

  // Polling de metadatos
  useEffect(() => {
    let interval: number;
    
    const fetchMetadata = async () => {
      try {
        const response = await fetch('/api/metadata');
        if (!response.ok) {
          // Si no es un OK, no intentamos parsear JSON para evitar el error "Rate exceeded"
          return;
        }
        const data = await response.json();
        if (data && data.title && data.artist) {
          setTrack({
            title: data.title,
            artist: data.artist,
            albumArt: data.albumArt
          });
        }
      } catch (err) {
        // Solo logueamos errores reales de red o parseo, no los 429 ya filtrados
        if (!(err instanceof Error && err.message.includes('Unexpected token'))) {
          console.error("Error fetching metadata:", err);
        }
      }
    };

    if (isPlaying) {
      fetchMetadata();
      interval = window.setInterval(fetchMetadata, 10000); // Cada 10 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, setTrack]);

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
        audioRef.current.play().catch((err) => {
          console.error("Playback error:", err);
          setIsPlaying(false);
        });

        // Media Session API for background/system controls
        if ('mediaSession' in navigator) {
          navigator.mediaSession.setActionHandler('play', () => {
            audioRef.current?.play();
            setIsPlaying(true);
          });
          navigator.mediaSession.setActionHandler('pause', () => {
            audioRef.current?.pause();
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
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
      src={STREAM_URL}
      crossOrigin="anonymous"
      preload="auto"
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
