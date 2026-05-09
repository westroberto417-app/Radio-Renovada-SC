import { create } from 'zustand';

export type Tab = 'inicio' | 'chat' | 'pedir' | 'noticias' | 'mas' | 'admin' | 'sumate' | 'aplicacion' | 'reflexion' | 'pedidos_lista' | 'programacion';

interface AppState {
  activeTab: Tab;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isDucked: boolean;
  currentTrack: {
    title: string;
    artist: string;
    albumArt?: string;
  };
  requestCount: number;
  setActiveTab: (tab: Tab) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setIsDucked: (ducked: boolean) => void;
  setTrack: (track: { title: string; artist: string; albumArt?: string }) => void;
  setRequestCount: (count: number) => void;
}

export const useStore = create<AppState>((set) => ({
  activeTab: 'inicio',
  isPlaying: false,
  volume: 0.8,
  isMuted: false,
  isDucked: false,
  requestCount: 0,
  currentTrack: {
    title: 'Radio Corrientes Viva',
    artist: 'En Vivo',
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setIsDucked: (ducked) => set({ isDucked: ducked }),
  setTrack: (track) => set({ currentTrack: track }),
  setRequestCount: (count) => set({ requestCount: count }),
}));
