import { create } from 'zustand';

export type Tab = 'inicio' | 'chat' | 'pedir' | 'noticias' | 'mas' | 'admin';

interface AppState {
  activeTab: Tab;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTrack: {
    title: string;
    artist: string;
    albumArt?: string;
  };
  setActiveTab: (tab: Tab) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setTrack: (track: { title: string; artist: string; albumArt?: string }) => void;
}

export const useStore = create<AppState>((set) => ({
  activeTab: 'inicio',
  isPlaying: false,
  volume: 0.8,
  isMuted: false,
  currentTrack: {
    title: 'Radio Corrientes Viva',
    artist: 'En Vivo',
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setTrack: (track) => set({ currentTrack: track }),
}));
