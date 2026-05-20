import { create } from 'zustand';

export type Tab = 'inicio' | 'chat' | 'pedir' | 'noticias' | 'mas' | 'admin' | 'sumate' | 'aplicacion' | 'reflexion' | 'pedidos_lista' | 'programacion' | 'donaciones' | 'video';

export interface SongRequest {
  id: number;
  name: string;
  song: string;
  artist: string;
  message: string;
  timestamp: string;
}

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
  installPrompt: any;
  isInstallable: boolean;
  requests: SongRequest[];
  setActiveTab: (tab: Tab) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setIsDucked: (ducked: boolean) => void;
  setTrack: (track: { title: string; artist: string; albumArt?: string }) => void;
  setRequestCount: (count: number) => void;
  setInstallPrompt: (prompt: any) => void;
  fetchRequests: () => Promise<void>;
  deleteRequest: (id: number) => Promise<void>;
  clearAllRequests: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  activeTab: 'inicio',
  isPlaying: false,
  volume: 0.8,
  isMuted: false,
  isDucked: false,
  requestCount: 0,
  installPrompt: null,
  isInstallable: false,
  requests: [],
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
  setInstallPrompt: (prompt) => set({ installPrompt: prompt, isInstallable: !!prompt }),
  fetchRequests: async () => {
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        set({ requests: data, requestCount: data.length });
      }
    } catch (e) {
      console.error("Error fetching requests in store:", e);
    }
  },
  deleteRequest: async (id) => {
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        set((state) => {
          const updated = state.requests.filter(r => r.id !== id);
          return { requests: updated, requestCount: updated.length };
        });
      }
    } catch (e) {
      console.error("Error deleting request in store:", e);
    }
  },
  clearAllRequests: async () => {
    try {
      const res = await fetch('/api/requests', { method: 'DELETE' });
      if (res.ok) {
        set({ requests: [], requestCount: 0 });
      }
    } catch (e) {
      console.error("Error clearing requests in store:", e);
    }
  },
}));
