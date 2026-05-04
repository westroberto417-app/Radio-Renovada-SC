import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const PersistentPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isPlaying, volume, isMuted, setIsPlaying, setTrack } = useStore();
  const STREAM_URL = '/api/stream';

  // Polling de metadatos
  useEffect(() => {
    let interval: number;
    
    const fetchMetadata = async () => {
      try {
        const response = await fetch('/api/metadata');
        const data = await response.json();
        if (data.title && data.artist) {
          setTrack({
            title: data.title,
            artist: data.artist,
            albumArt: data.albumArt
          });
        }
      } catch (err) {
        console.error("Error fetching metadata:", err);
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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error("Playback error:", err);
          setIsPlaying(false);
        });

        // Media Session API for background/system controls
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Radio Corrientes Viva',
            artist: 'En Vivo',
            album: 'Corrientes, Argentina',
            artwork: [
              { src: '/logo.png', sizes: '512x512', type: 'image/png' }
            ]
          });

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
