import {
  getClientRotatingLocalNews,
  getClientRotatingProvincialNews,
  getClientRotatingNationalNews
} from './localNewsPool';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
export const NEWS_TTL_MS = 1000 * 60 * 60 * 4; // Strictly 4 hours
export const REFLECTION_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // Strictly 72 hours window
const REQUEST_TIMEOUT_MS = 7500; // 7.5s safety timeout to prevent hanging on low RAM / slow connections

// Safe async fetch with AbortController timeout to prevent UI thread starvation
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
};

export const getStoredTimestamp = (key: string): number => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      return typeof parsed.timestamp === 'number' ? parsed.timestamp : 0;
    }
  } catch (e) {}
  return 0;
};

const getFromCache = <T>(key: string, ttl: number): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed: CacheEntry<T> = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < ttl) {
        return parsed.data;
      }
      localStorage.removeItem(key);
    }
  } catch (e) {}
  return null;
};

const saveToCache = <T>(key: string, data: T): void => {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {}
};

export interface ContentStatus {
  localNewsLastUpdate: number;
  provincialNewsLastUpdate: number;
  nationalNewsLastUpdate: number;
  reflectionsLastUpdate: number;
  serverTime: number;
  ttl?: {
    news: number;
    reflections: number;
  };
}

// Lightweight timestamp poll (<100 bytes) to check if server has newer news/reflections
export const getContentStatus = async (): Promise<ContentStatus | null> => {
  try {
    const res = await fetchWithTimeout(`/api/content/status?_t=${Date.now()}`, { cache: 'no-store' }, 4000);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}

export const getChatResponse = async (message: string, history: ChatMessage[] = []) => {
  try {
    const res = await fetchWithTimeout('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    }, 6000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.text;
  } catch (error) {
    // Falls back to a generic message if API fails
    const fallbacks = [
      "¡Hola chamigo! Aquí estamos firmes al aire en Radio Corrientes Viva. Contame, ¿qué música te gustaría escuchar hoy?",
      "¡Buenas, buenas! Hubo una pequeña interferencia técnica en mi sistema, pero mi corazón sigue con San Miguel. ¿Cómo va tu día?",
      "¡Opa! Se me cortó el hilo un segundo, chamigo. Pero acá sigo acompañándote con la mejor energía de la radio. ¿Querés que hablemos de algo en particular?",
      "¡Qué tal, oyente de lujo! Disculpá la demora, a veces la tecnología me juega una pasada, pero acá estamos para informarte y entretenerte. ¿Viste qué lindo día hace en Corrientes?"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

export interface LocalNews {
  id: number;
  title: string;
  excerpt: string;
  fullContent: string;
  tag: string;
  date: string;
  image: string;
  publishedAt?: number;
  location?: string;
  source?: string;
  isFacebook?: boolean;
}

/**
 * Calculates a precise timestamp from news data (either from publishedAt or date text)
 * and determines if it belongs strictly to the last 3 days (<= 72 hours).
 */
export const isNewsWithinLast3Days = (item: LocalNews, referenceNow: number = Date.now()): boolean => {
  if (!item) return false;
  const cutoff = referenceNow - THREE_DAYS_MS;

  // 1. Direct publishedAt timestamp check
  if (typeof item.publishedAt === 'number' && item.publishedAt > 0) {
    return item.publishedAt >= cutoff;
  }

  // 2. Semantic text date analysis
  if (typeof item.date === 'string') {
    const d = item.date.toLowerCase();
    
    // Explicitly old markers -> reject immediately
    if (
      d.includes('hace 4 días') || 
      d.includes('hace 5 días') || 
      d.includes('hace 6 días') || 
      d.includes('hace una semana') || 
      d.includes('hace 1 semana') ||
      d.includes('hace un mes') ||
      d.includes('hace 1 mes')
    ) {
      return false;
    }

    // Recent indicators (< 72h) -> accept
    if (
      d.includes('hoy') || 
      d.includes('ayer') || 
      d.includes('hace 1 día') || 
      d.includes('hace 2 días') || 
      d.includes('hace 3 días') || 
      d.includes('hace unas horas') || 
      d.includes('último momento') ||
      d.includes('edición') ||
      d.includes('actualizado')
    ) {
      return true;
    }

    // Attempt to parse standard date strings
    const parsedTime = Date.parse(item.date);
    if (!isNaN(parsedTime) && parsedTime > 0) {
      return parsedTime >= cutoff;
    }
  }

  // Default to true only if recent timestamp was auto-assigned
  return true;
};

// Filter news strictly to the last 3 days (<= 72 hours reference window)
export const filterRecentNews = (news: LocalNews[]): LocalNews[] => {
  if (!Array.isArray(news)) return [];
  const referenceNow = Date.now();
  return news.filter((item) => isNewsWithinLast3Days(item, referenceNow));
};

// Synchronously get cached news for immediate zero-latency UI rendering
export const getCachedNews = (type: 'local' | 'provincial' | 'national'): LocalNews[] | null => {
  const cacheKey = type === 'local' ? "content_local_news" : type === 'provincial' ? "content_provincial_news" : "content_national_news";
  const cached = getFromCache<LocalNews[]>(cacheKey, NEWS_TTL_MS);
  if (cached) {
    const filtered = filterRecentNews(cached);
    if (filtered && filtered.length > 0) return filtered;
  }
  return null;
};

// Full cache purge for News and API caches (called when user refreshes buffer or news manually)
export const clearAllNewsCache = async (): Promise<void> => {
  try {
    localStorage.removeItem("content_local_news");
    localStorage.removeItem("content_provincial_news");
    localStorage.removeItem("content_national_news");
  } catch (e) {}

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_API_CACHE' });
  }

  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key.includes('api')) {
          await caches.delete(key);
        }
      }
    } catch (e) {}
  }
};

export const generateLocalNews = async (forceRefresh: boolean = false): Promise<LocalNews[]> => {
  const cacheKey = "content_local_news";
  if (forceRefresh) {
    try { localStorage.removeItem(cacheKey); } catch (e) {}
  }

  try {
    const res = await fetchWithTimeout(`/api/news/local?force=${forceRefresh}&_t=${Date.now()}`);
    if (res.ok) {
      const data: LocalNews[] = await res.json();
      const filtered = filterRecentNews(data);
      const result = filtered && filtered.length > 0 ? filtered : data;
      if (result && result.length > 0) {
        saveToCache(cacheKey, result);
        return result;
      }
    }
  } catch (error) {
    console.warn("Notice: server news fetch error, checking local store / rotating fallback:", error);
  }

  // If network failed (offline / server unreachable), check cached news
  const cached = getFromCache<LocalNews[]>(cacheKey, NEWS_TTL_MS);
  if (cached) {
    const filtered = filterRecentNews(cached);
    if (filtered && filtered.length > 0) return filtered;
  }

  // Dynamic 4-hour rotating local news pool (6 editions per day)
  return getClientRotatingLocalNews();
};

export const generateProvincialNews = async (forceRefresh: boolean = false): Promise<LocalNews[]> => {
  const cacheKey = "content_provincial_news";
  if (forceRefresh) {
    try { localStorage.removeItem(cacheKey); } catch (e) {}
  }

  try {
    const res = await fetchWithTimeout(`/api/news/provincial?force=${forceRefresh}&_t=${Date.now()}`);
    if (res.ok) {
      const data: LocalNews[] = await res.json();
      const filtered = filterRecentNews(data);
      const result = filtered && filtered.length > 0 ? filtered : data;
      if (result && result.length > 0) {
        saveToCache(cacheKey, result);
        return result;
      }
    }
  } catch (error) {
    console.warn("Notice: server provincial news fetch error, checking local store / rotating fallback:", error);
  }

  const cached = getFromCache<LocalNews[]>(cacheKey, NEWS_TTL_MS);
  if (cached) {
    const filtered = filterRecentNews(cached);
    if (filtered && filtered.length > 0) return filtered;
  }

  return getClientRotatingProvincialNews();
};

export const generateNationalNews = async (forceRefresh: boolean = false): Promise<LocalNews[]> => {
  const cacheKey = "content_national_news";
  if (forceRefresh) {
    try { localStorage.removeItem(cacheKey); } catch (e) {}
  }

  try {
    const res = await fetchWithTimeout(`/api/news/national?force=${forceRefresh}&_t=${Date.now()}`);
    if (res.ok) {
      const data: LocalNews[] = await res.json();
      const filtered = filterRecentNews(data);
      const result = filtered && filtered.length > 0 ? filtered : data;
      if (result && result.length > 0) {
        saveToCache(cacheKey, result);
        return result;
      }
    }
  } catch (error) {
    console.warn("Notice: server national news fetch error, checking local store / rotating fallback:", error);
  }

  const cached = getFromCache<LocalNews[]>(cacheKey, NEWS_TTL_MS);
  if (cached) {
    const filtered = filterRecentNews(cached);
    if (filtered && filtered.length > 0) return filtered;
  }

  return getClientRotatingNationalNews();
};

export const getMarqueeText = async () => {
  const cacheKey = "content_marquee_text_v3";
  
  try {
    const cachedItem = localStorage.getItem(cacheKey);
    if (cachedItem) {
      const parsed = JSON.parse(cachedItem);
      if (Date.now() - parsed.timestamp < 1000 * 60 * 2) return parsed.data;
    }
  } catch(e) {}

  const now = new Date();
  const argTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const hour = argTime.getHours();
  const minutes = argTime.getMinutes();
  const timeFloat = hour + minutes / 60;

  const schedule = [
    { name: 'Música Retro', start: 0, end: 1 },
    { name: 'Rock Pesado', start: 1, end: 3 },
    { name: 'Música Hebrea', start: 3, end: 4.5 },
    { name: 'Música Rock', start: 4.5, end: 8 },
    { name: 'Música Variada', start: 8, end: 9 },
    { name: 'Cuarteto', start: 9, end: 10 },
    { name: 'Música Pop', start: 10, end: 12 },
    { name: 'Música Pop', start: 12, end: 13 },
    { name: 'Música Variada', start: 13, end: 14 },
    { name: 'Cuarteto', start: 14, end: 15 },
    { name: 'Música de Reguetón', start: 15, end: 16 },
    { name: 'Música Variada', start: 16, end: 17 },
    { name: 'Música Retro', start: 17, end: 18 },
    { name: 'Música Pop', start: 18, end: 19 },
    { name: 'Música de Reguetón', start: 19, end: 20.5 },
    { name: 'Música Rock', start: 20.5, end: 21 },
    { name: 'Música de Reguetón', start: 21, end: 22 },
    { name: 'Cuarteto', start: 22, end: 23.5 },
    { name: 'Música Rock', start: 23.5, end: 24 }
  ];

  const current = schedule.find(p => timeFloat >= p.start && timeFloat < p.end) || { name: 'Música Hebrea' };
  const nextIndex = schedule.indexOf(current as any) + 1;
  const next = schedule[nextIndex % schedule.length];

  const text = `📻 Estás escuchando ${current.name} en vivo... Próximamente a las ${Math.floor(next.start).toString().padStart(2, '0')}:${(Math.floor((next.start % 1) * 60)).toString().padStart(2, '0')} hs: ${next.name}. ¡Radio Corrientes Viva! 🎵`;
  try { localStorage.setItem(cacheKey, JSON.stringify({ data: text, timestamp: Date.now() })); } catch(e) {}
  return text;
};

export interface Reflection {
  title: string;
  tag: string;
  quote: string;
  author: string;
  message: string;
  imageUrl: string;
}

export const generateReflectionsList = async (forceRefresh: boolean = false): Promise<Reflection[]> => {
  const cacheKey = "content_reflections_list";
  if (!forceRefresh) {
    const cached = getFromCache<Reflection[]>(cacheKey, REFLECTION_TTL_MS);
    if (cached) return cached;
  } else {
    try { localStorage.removeItem(cacheKey); } catch (e) {}
  }
  try {
    const res = await fetch(`/api/reflections?force=${forceRefresh}&_t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!res.ok) throw new Error("Backend reflections failed");
    const data = await res.json();
    if (data && data.length > 0) saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    const fallbackTitles = [
      "La fe que mueve montañas",
      "El poder de la oración persistente",
      "El amor incondicional del Padre",
      "Nueva misericordia cada mañana",
      "Más que vencedores en Cristo",
      "Creados con un propósito eterno",
      "La Palabra que ilumina el camino",
      "La gracia suficiente de Cristo",
      "Caminando por fe, no por vista",
      "Paz en medio de la tormenta"
    ];
    const fallbackTags = [
      "FE", "ORACIÓN", "AMOR DE DIOS", "ESPERANZA", "VICTORIA", "PROPÓSITO", "PALABRA DE DIOS", "GRACIA", "FE", "ESPERANZA"
    ];
    const fallbackQuotes = [
      "De cierto os digo, que si tuviereis fe como un grano de mostaza, diréis a este monte: Pásate de aquí allá, y se pasará; y nada os será imposible.",
      "Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ocultas que tú no conoces.",
      "Con amor eterno te he amado; por tanto, te prolongué mi misericordia.",
      "Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias. Nuevas son cada mañana; grande es tu fidelidad.",
      "Antes, en todas estas cosas somos más que vencedores por medio de aquel que nos amó.",
      "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.",
      "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.",
      "Y me ha dicho: Bástate mi gracia; porque mi poder se perfecciona en la debilidad.",
      "Porque por fe andamos, no por vista.",
      "La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo."
    ];
    const fallbackAuthors = [
      "Mateo 17:20", "Jeremías 33:3", "Jeremías 31:3", "Lamentaciones 3:22-23", "Romanos 8:37", "Jeremías 29:11", "Salmo 119:105", "2 Corintios 12:9", "2 Corintios 5:7", "Juan 14:27"
    ];

    const fallbackArray = Array.from({ length: 10 }).map((_, index) => ({
      title: fallbackTitles[index],
      tag: fallbackTags[index],
      quote: fallbackQuotes[index],
      author: fallbackAuthors[index],
      message: `Esta es una hermosa reflexión espiritual evangélica y bíblica basada en el versículo de ${fallbackAuthors[index]}. Nos recuerda el inmenso amor de Dios y la obra salvadora de Cristo Jesús en nuestras vidas cotidianas. \n\nNo importa cuán difícil parezca el camino que tienes que transitar en este día. Recuerda que la palabra de Dios es viva y eficaz y que su gracia sobreabunda en cada momento. Encomienda tu camino al Señor, confía en Él y Él hará. \n\nHoy meditamos en cómo podemos vivir de manera agradable a Dios, fortaleciendo nuestra fe mediante la oración persistente y constante.`,
      imageUrl: `https://images.unsplash.com/photo-${[
        "1490730141103-6cac27aaab94",
        "1506744038136-46273834b3fb",
        "1518133910546-b6c2fb7d79e3",
        "1470071131384-001b85755b36",
        "1520607162513-77705c0f0d4a",
        "1472214103451-9374bd1c798e",
        "1507525428034-b723cf961d3e",
        "1490730141103-6cac27aaab94",
        "1506744038136-46273834b3fb",
        "1518133910546-b6c2fb7d79e3"
      ][index]}?q=80&w=1470&auto=format&fit=crop`
    }));
    return fallbackArray;
  }
};

