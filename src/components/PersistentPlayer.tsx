import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const PersistentPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isPlaying, volume, isMuted, isDucked, setIsPlaying, setTrack, currentTrack, setIsMuted } = useStore();
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
        artwork: [
          { src: currentTrack.albumArt || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=512&h=512&fit=crop', sizes: '512x512', type: 'image/jpeg' }
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
        if (!audioRef.current.src || !audioRef.current.src.includes(STREAM_URL)) {
          audioRef.current.src = STREAM_URL + '?t=' + Date.now();
        }
        
        audioRef.current.play().catch((err) => {
          console.error("Playback error:", err);
          setIsPlaying(false);
        });

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
            if (audioRef.current) {
              audioRef.current.removeAttribute('src');
              audioRef.current.load();
            }
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
    }
  }, [isPlaying, setIsPlaying]);

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

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <audio
      ref={audioRef}
      onEnded={() => setIsPlaying(false)}
      onError={(e) => {
        const target = e.target as HTMLAudioElement;
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

export const getAudioElement = () => document.querySelector('audio');
