interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const NEWS_TTL_MS = 1000 * 60 * 60 * 3; // 3 hours
const REFLECTION_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours

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
}

const saveToCache = <T>(key: string, data: T): void => {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {}
}

export interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}

export const getChatResponse = async (message: string, history: ChatMessage[] = []) => {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
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
}

export const generateLocalNews = async (forceRefresh: boolean = false): Promise<LocalNews[]> => {
  const cacheKey = "content_local_news";
  if (!forceRefresh) {
    const cached = getFromCache<LocalNews[]>(cacheKey, NEWS_TTL_MS);
    if (cached) return cached;
  }
  try {
    const res = await fetch(`/api/news/local?force=${forceRefresh}`);
    if (!res.ok) throw new Error("Backend news local failed");
    const data = await res.json();
    if (data && data.length > 0) saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    return [
      {
        id: Date.now(),
        title: "Campaña Oftalmológica y de Vacunación en el Hospital",
        excerpt: "El Hospital de San Miguel informa sobre sus nuevos operativos de control visual y esquemas de vacunación.",
        fullContent: "El Hospital local de San Miguel ha anunciado que, durante toda la próxima semana, se llevará a cabo una campaña oftalmológica gratuita para todos los vecinos de la región y localidades vecinas como Caá Catí y Loreto. \n\nAdemás del control visual con especialistas, se estará aplicando la vacuna antigripal y se completarán los calendarios nacionales de vacunación obligatoria para niños en edad escolar. \n\nEl operativo oftalmológico funcionará por orden de llegada desde las 07:30 hs y hay un cupo de 50 pacientes por día. Se recomienda asistir temprano y tener a mano el DNI y carnet de salud. \n\nPara el sector de vacunación, las puertas estarán abiertas en horario extendido hasta las 18:00 hs, habilitando una vía rápida en el ingreso lateral del edificio para mayor fluidez. \n\nCuidar la salud es responsabilidad de todos, no pierdas la oportunidad de aprovechar estas campañas preventivas, totalmente gratuitas y muy necesarias para la comunidad.",
        tag: "SALUD",
        date: "Actualidad",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop"
      }
    ];
  }
};

export const generateNationalNews = async (forceRefresh: boolean = false): Promise<LocalNews[]> => {
  const cacheKey = "content_national_news";
  if (!forceRefresh) {
    const cached = getFromCache<LocalNews[]>(cacheKey, NEWS_TTL_MS);
    if (cached) return cached;
  }
  try {
    const res = await fetch('/api/news/national');
    if (!res.ok) throw new Error("Backend news national failed");
    const data = await res.json();
    if (data && data.length > 0) saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    return [
      {
        id: Date.now() + 10,
        title: "Tendencias Económicas Nacionales",
        excerpt: "Análisis sobre el comportamiento de los mercados y las nuevas medidas de estabilización.",
        fullContent: "El panorama económico nacional muestra señales de estabilización en diversos sectores productivos. \n\nAnalistas destacan el incremento en las exportaciones de granos y el fortalecimiento de las economías regionales como motores del crecimiento para el próximo trimestre.\n\nSe espera que las nuevas medidas de fomento industrial permitan una mayor generación de empleo en el sector privado del norte argentino.",
        tag: "NACIONAL",
        date: "Hoy",
        image: "https://images.unsplash.com/photo-1611974714652-760056a2cc09?q=80&w=1470&auto=format&fit=crop"
      }
    ];
  }
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
  quote: string;
  author: string;
  message: string;
  imageUrl: string;
}

export const generateReflection = async (forceRefresh: boolean = false): Promise<Reflection> => {
  const cacheKey = "content_reflection";
  if (!forceRefresh) {
    const cached = getFromCache<Reflection>(cacheKey, REFLECTION_TTL_MS);
    if (cached) return cached;
  }
  try {
    const res = await fetch(`/api/reflections?force=${forceRefresh}&random=${forceRefresh}`);
    if (!res.ok) throw new Error("Backend reflection failed");
    const info = await res.json();
    if (info.quote) saveToCache(cacheKey, info);
    return info;
  } catch (error) {
    return {
      quote: "El Señor es mi pastor, nada me faltará.",
      author: "Salmo 23",
      message: "En los momentos de mayor incertidumbre, recuerda que no caminas solo. Hay una paz que sobrepasa todo entendimiento esperando por ti hoy. Confía en el proceso y en que cada paso que das está guiado por una mano amorosa que nunca te suelta.",
      imageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1470&auto=format&fit=crop"
    };
  }
};

