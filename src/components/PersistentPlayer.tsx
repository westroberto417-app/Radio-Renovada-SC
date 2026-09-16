import React, { useEffect, useRef, memo } from 'react';
import { useStore } from '../store/useStore';

export const PersistentPlayer = memo(() => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlaying = useStore((state) => state.isPlaying);
  const volume = useStore((state) => state.volume);
  const isMuted = useStore((state) => state.isMuted);
  const isDucked = useStore((state) => state.isDucked);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const setTrack = useStore((state) => state.setTrack);
  const currentTrack = useStore((state) => state.currentTrack);
  const STREAM_URL = 'https://streaming.rf.com.ar/listen/radiocorrientesviva/radio.mp3';

  // Initial stream metadata
  useEffect(() => {
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

  // Volume & Ducking Control
  useEffect(() => {
    if (audioRef.current) {
      const finalVolume = isMuted ? 0 : (isDucked ? volume * 0.15 : volume);
      audioRef.current.volume = Math.max(0, Math.min(1, finalVolume));
    }
  }, [volume, isMuted, isDucked]);

  // Stream Play / Pause & Auto-Start Lifecycle
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let cleanupListeners: (() => void) | null = null;

    if (isPlaying) {
      if (!audio.src || audio.src === '' || audio.paused) {
        audio.src = STREAM_URL + '?nocache=' + Date.now();
        audio.load();
      }

      const attemptPlay = () => {
        if (!audioRef.current || !isPlaying) return;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (cleanupListeners) {
                cleanupListeners();
                cleanupListeners = null;
              }
            })
            .catch((err) => {
              console.log("[Autoplay Policy] Waiting for user interaction:", err.message || err);
              // Browser requires a user gesture: attach one-time unlock listeners
              const userInteractionEvents = ['click', 'touchstart', 'pointerdown', 'keydown', 'scroll'];
              
              const unlockAndPlay = () => {
                if (audioRef.current && isPlaying) {
                  audioRef.current.play().catch(() => {});
                }
                userInteractionEvents.forEach((evt) => {
                  window.removeEventListener(evt, unlockAndPlay);
                });
              };

              userInteractionEvents.forEach((evt) => {
                window.addEventListener(evt, unlockAndPlay, { once: true, passive: true });
              });

              cleanupListeners = () => {
                userInteractionEvents.forEach((evt) => {
                  window.removeEventListener(evt, unlockAndPlay);
                });
              };
            });
        }
      };

      attemptPlay();

      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
          if (audioRef.current) {
            audioRef.current.src = STREAM_URL + '?nocache=' + Date.now();
            audioRef.current.play().catch(() => {});
          }
          setIsPlaying(true);
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
          }
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }

    return () => {
      if (cleanupListeners) {
        cleanupListeners();
      }
    };
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

  return (
    <audio
      id="main-radio-audio"
      ref={audioRef}
      preload="auto"
      playsInline
      {...({ 'x-webkit-airplay': 'allow' } as any)}
      onEnded={() => setIsPlaying(false)}
      onError={() => {
        if (isPlaying && audioRef.current) {
          setTimeout(() => {
            if (isPlaying && audioRef.current) {
              audioRef.current.src = STREAM_URL + '?nocache=' + Date.now();
              audioRef.current.play().catch(err => console.warn("Stream reconnect retry:", err));
            }
          }, 2500);
        }
      }}
    />
  );
});

PersistentPlayer.displayName = 'PersistentPlayer';

export const getAudioElement = () => document.querySelector('audio');
