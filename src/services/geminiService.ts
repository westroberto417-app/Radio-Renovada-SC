import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const TTL_MS = 1000 * 60 * 60; // 1 hour cache

const getFromCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed: CacheEntry<T> = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < TTL_MS) {
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: `Eres el asistente de IA de "Radio Corrientes Viva". 
        Tu personalidad es carismática, alegre, cercana y profesional, como un locutor de radio con mucha energía. 
        Saludas con entusiasmo. Estás en San Miguel, Corrientes. 
        Hablas con un tono amigable, usas modismos locales de forma sutil y respetuosa (como "che", "chamigo", "viste"). 
        Tu objetivo es interactuar con los oyentes, responder dudas, comentar sobre la música y mantener el ambiente vibrante. 
        Si te preguntan por noticias, diles que revisen la sección de Noticias para lo último de la región.
        Mantén tus respuestas breves y directas, como intervenciones al aire.`,
        temperature: 0.8,
      }
    });

    return response.text;
  } catch (error) {
    console.warn("Gemini Chat Warning:", error);
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

export const generateLocalNews = async (): Promise<LocalNews[]> => {
  const cacheKey = "gemini_local_news";
  const cached = getFromCache<LocalNews[]>(cacheKey);
  if (cached) return cached;

  try {
    const currentDate = new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "full" });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ 
        parts: [{ 
          text: `HOY ES: ${currentDate}. 
          Genera una lista de 12 noticias locales ACTUALIZADAS AL DÍA DE HOY y trascendentes para San Miguel (Corrientes, Argentina) y la región (Caá Catí, Loreto, Santa Rosa, etc.). 
          NO agregues noticias antiguas, ni de otro año, ni desactualizadas. 
          Abarca temáticas muy prácticas y cotidianas de la zona para que sirva como puente informativo: trámites en el municipio, horarios del banco y el correo, novedades del hospital local, campañas oftalmológicas de turno, campañas de vacunación, feria de emprendedores, cortes programados de calle y otras noticias útiles e importantes que conecten con el público de todas las edades.
          Cada noticia debe ser única y útil.
          REQUISITO CRÍTICO: El campo "fullContent" debe ser un desarrollo profundo y extenso (mínimo 5 párrafos detallados) que explique el qué, quién, cómo, cuándo y por qué, incluyendo recomendaciones o datos de contacto si aplica.
          
          Formato JSON:
          {
            "id": number,
            "title": string,
            "excerpt": string (resumen breve),
            "fullContent": string (desarrollo largo y detallado),
            "tag": "COMUNIDAD" | "EVENTO" | "SALUD" | "TRANSPORTE" | "ECONOMÍA",
            "date": string (fecha de emisión de la noticia en formato legible, ej: "Emitido el 5 de Mayo de 2026"),
            "image": string (URL Unsplash relacionada)
          }` 
        }] 
      }],
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Eres un periodista senior de Radio Corrientes Viva. Tu redacción es profesional, detallada y profundamente informativa para la comunidad local.",
      }
    });

    const data = JSON.parse(response.text || "[]");
    if (data.length > 0) saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    console.warn("Gemini Local News Warning:", error);
    const fallbacks: LocalNews[] = [
      {
        id: Date.now(),
        title: "Campaña Oftalmológica y de Vacunación en el Hospital",
        excerpt: "El Hospital de San Miguel informa sobre sus nuevos operativos de control visual y esquemas de vacunación.",
        fullContent: "El Hospital local de San Miguel ha anunciado que, durante toda la próxima semana, se llevará a cabo una campaña oftalmológica gratuita para todos los vecinos de la región y localidades vecinas como Caá Catí y Loreto. \n\nAdemás del control visual con especialistas, se estará aplicando la vacuna antigripal y se completarán los calendarios nacionales de vacunación obligatoria para niños en edad escolar. \n\nEl operativo oftalmológico funcionará por orden de llegada desde las 07:30 hs y hay un cupo de 50 pacientes por día. Se recomienda asistir temprano y tener a mano el DNI y carnet de salud. \n\nPara el sector de vacunación, las puertas estarán abiertas en horario extendido hasta las 18:00 hs, habilitando una vía rápida en el ingreso lateral del edificio para mayor fluidez. \n\nCuidar la salud es responsabilidad de todos, no pierdas la oportunidad de aprovechar estas campañas preventivas, totalmente gratuitas y muy necesarias para la comunidad.",
        tag: "SALUD",
        date: "Actualidad",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop"
      },
      {
        id: Date.now() + 1,
        title: "Nuevos Horarios de Banco y Trámites del Correo",
        excerpt: "Atención vecinos: cambios importantes en los horarios de atención de las entidades locales.",
        fullContent: "Informamos a la comunidad que a partir de este mes, la sucursal bancaria local ha modificado su horario de atención al público. Las puertas abrirán a partir de las 07:00 hs hasta las 12:00 hs, buscando evitar las altas temperaturas del mediodía y agilizar el pago de jubilaciones y asignaciones. \n\nPor el lado del Correo, se recuerda que la entrega de encomiendas y paquetes funcionará tanto a la mañana como por la tarde, brindando doble turno para evitar largas filas. \n\nEs importante tener en cuenta que para trámites bancarios que requieran asesoría comercial, es necesario sacar un turno previo a través de la página oficial de la entidad o llamando al teléfono fijo de la sucursal. \n\nPara el pago de servicios por línea de caja en el Banco, este se centrará principalmente en los días martes y jueves. Los cajeros automáticos, por su parte, tendrán una recarga especial los días viernes por la tarde, cubriendo la demanda del fin de semana. \n\nOrganiza bien tus horarios y así ganamos tiempo todos, evitando demoras o traslados en vano al centro del pueblo.",
        tag: "COMUNIDAD",
        date: "Servicios",
        image: "https://images.unsplash.com/photo-1501167733271-e4f18b5ea3f4?q=80&w=1470&auto=format&fit=crop"
      },
      {
        id: Date.now() + 2,
        title: "Gran Feria de Emprendedores y Actividades del Municipio",
        excerpt: "Seviene una nueva edición de la feria en la plaza principal. Todo lo que podés encontrar.",
        fullContent: "La Municipalidad de San Miguel invita a todos los vecinos y turistas a sumarse a la Gran Feria de Emprendedores que se desarrollará este fin de semana en la plaza central de nuestra localidad. \n\nMás de 40 artesanos y productores de la región estarán ofreciendo sus productos, abarcando desde comidas típicas, conservas y dulces, hasta artesanías en madera, cuero y tejidos tradicionales de primer nivel que siempre identifican a nuestra zona. \n\nEl área de cultura del Municipio también sumará un escenario con shows musicales en vivo de agrupaciones chamameceras, clases abiertas de danzas folclóricas y un rincón de pintura para los más chicos. \n\nAdemás, se instalará la carpa de servicios municipales donde vas a poder consultar el estado de deudas de patentes, obtener información sobre microcréditos para tu propio emprendimiento e inscribirte a los nuevos cursos de oficios gratuitos. \n\nLos stands estarán abiertos desde las 17:00 hs hasta la medianoche. Animate a dar una vuelta y apoyá el trabajo de las familias locales, ¡te esperamos para pasar un día en comunidad!",
        tag: "EVENTO",
        date: "Comunidad",
        image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1470&auto=format&fit=crop"
      }
    ];
    return fallbacks;
  }
};

export const generateNationalNews = async (): Promise<LocalNews[]> => {
  const cacheKey = "gemini_national_news";
  const cached = getFromCache<LocalNews[]>(cacheKey);
  if (cached) return cached;

  try {
    const currentDate = new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "full" });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ 
        parts: [{ 
          text: `HOY ES: ${currentDate}.
          Genera una lista de las 12 noticias más trascendentes de HOY en Argentina y el mundo.
          NO agregues noticias antiguas, ni de otro año, ni desactualizadas. 
          REQUISITO CRÍTICO: El campo "fullContent" debe ser un análisis profundo y extenso (mínimo 5 párrafos detallados) similar a un artículo de diario profesional.
          
          Formato JSON:
          {
            "id": number,
            "title": string,
            "excerpt": string,
            "fullContent": string,
            "tag": "NACIONAL" | "MUNDO" | "ECONOMÍA" | "TECNOLOGÍA",
            "date": string (fecha de emisión de la noticia en formato legible, ej: "Emitido el 5 de Mayo de 2026"),
            "image": string (URL Unsplash relacionada)
          }` 
        }] 
      }],
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Eres el jefe de redacción de noticias internacionales de Radio Corrientes Viva. Tu tono es objetivo, analítico y profesional.",
      }
    });

    const data = JSON.parse(response.text || "[]");
    if (data.length > 0) saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    console.warn("Gemini National News Warning:", error);
    const fallbacks: LocalNews[] = [
      {
        id: Date.now() + 10,
        title: "Tendencias Económicas Nacionales",
        excerpt: "Análisis sobre el comportamiento de los mercados y las nuevas medidas de estabilización.",
        fullContent: "El panorama económico nacional muestra señales de estabilización en diversos sectores productivos. \n\nAnalistas destacan el incremento en las exportaciones de granos y el fortalecimiento de las economías regionales como motores del crecimiento para el próximo trimestre.\n\nSe espera que las nuevas medidas de fomento industrial permitan una mayor generación de empleo en el sector privado del norte argentino.",
        tag: "NACIONAL",
        date: "Hoy",
        image: "https://images.unsplash.com/photo-1611974714652-760056a2cc09?q=80&w=1470&auto=format&fit=crop"
      },
      {
        id: Date.now() + 11,
        title: "Avances en Energías Renovables",
        excerpt: "Argentina lidera proyectos de energía solar y eólica en la región para combatir el cambio climático.",
        fullContent: "Nuevos parques eólicos en la Patagonia y plantas solares en el norte grande se suman a la red nacional de energía. \n\nArgentina se posiciona como un referente regional en la transición hacia energías limpias, atrayendo inversiones internacionales significativas.\n\nEstos proyectos no solo reducen la huella de carbono, sino que también generan puestos de trabajo especializados en comunidades rurales alejadas.",
        tag: "MUNDO",
        date: "Destacado",
        image: "https://images.unsplash.com/photo-1466611653911-95282ee3656b?q=80&w=1470&auto=format&fit=crop"
      }
    ];
    return fallbacks;
  }
};

export const getArtistInfo = async (artistName: string) => {
  const cacheKey = `gemini_artist_${artistName}`;
  const cached = getFromCache<any>(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ 
        parts: [{ 
          text: `Proporciona información breve y curiosa sobre el artista musical: "${artistName}".
          Devuelve el resultado en formato JSON puro con esta estructura:
          {
            "bio": "Un párrafo breve y carismático sobre su carrera",
            "trivia": ["Dato curioso 1", "Dato curioso 2", "Dato curioso 3"]
          }
          Si no conoces al artista, inventa algo positivo o di que es un talento emergente de la radio.` 
        }] 
      }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const info = JSON.parse(response.text || '{"bio": "", "trivia": []}');
    saveToCache(cacheKey, info);
    return info;
  } catch (error) {
    console.warn("Gemini Artist Info Warning:", error);
    return { 
      bio: "Un artista increíble que suena fuerte en nuestra radio.", 
      trivia: ["Está rompiendo récords hoy", "Gran favorito de la audiencia", "Talento puro al aire"] 
    };
  }
};

export const getMarqueeText = async () => {
  const cacheKey = "gemini_marquee_text";
  const cached = getFromCache<string>(cacheKey);
  // Shorter lived cache constraint, marquee text is time-dependent
  // but let's just use the cached if it exists (it'll be refreshed every 1h unless we modify it)
  // Actually, we probably don't want 1hr cache for marquee since it mentions specific times.
  // We'll cache for 5 minutes here.
  try {
    const cachedItem = localStorage.getItem(cacheKey);
    if (cachedItem) {
      const parsed = JSON.parse(cachedItem);
      if (Date.now() - parsed.timestamp < 1000 * 60 * 5) return parsed.data;
    }
  } catch(e) {}

  try {
    const currentTime = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "full", timeStyle: "long" });
    const currentHour = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", hour12: false });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ 
        parts: [{ 
           text: `Eres el locutor de Radio Corrientes Viva. Ahora mismo en Argentina es: ${currentTime} (Hora: ${currentHour} hs).
           
           Esta es nuestra programación diaria (cada bloque arranca en esa hora en punto):
           • Música de Cuarteto: 9:00, 14:00 y 22:00
           • Música Rock: 4:00, 11:00, 20:00 y 23:00
           • Música Variada: 8:00, 13:00 y 16:00
           • Música Pop: 10:00, 12:00 y 18:00
           • Música de Reguetón: 15:00, 19:00 y 21:00
           • Música Retro: 0:00 y 17:00
           • Música de Rock Pesado: 1:00 y 2:00
           • (Próximamente: música de Alabanza, Adoración y Folclore)

           Instrucciones obligatorias para tu respuesta:
           1. Saluda acorde a la hora real (Buenos días, Buenas tardes, o Buenas noches). ¡No te equivoques de saludo!
           2. Deduce exactamente qué estilo PUEDE estar sonando AHORA según el último bloque de horario que ya pasó o empezó.
           3. Deduce qué estilo se transmitirá en el PRÓXIMO bloque horario.
           4. Usa este formato o uno muy similar: "¡[Saludo]! Ahora está sonando [Música Actual] y después, a las [Hora del próximo bloque], va a sonar [Próxima Música]..." (Asegúrate de incluir que algo 'está sonando ahora' y luego qué 'va a sonar después').
           5. Tu texto debe ser de una sola línea, fluido, cálido, amigable y continuado para que corra bien en una marquesina.
           ` 
        }] 
      }],
      config: {
        temperature: 0.2, // Baja temperatura para mayor precisión
      }
    });

    const text = response.text?.trim().replace(/\n/g, ' ') || "📻 Escuchando Radio Corrientes Viva, la mejor programación todo el día. ¡Próximamente Folclore y Alabanzas! 🎵";
    try { localStorage.setItem(cacheKey, JSON.stringify({ data: text, timestamp: Date.now() })); } catch(e) {}
    return text;
  } catch (error) {
    console.warn("Gemini Marquee Text Warning:", error);
    return "📻 Escuchando Radio Corrientes Viva, la mejor programación todo el día. ¡Próximamente Folclore y Alabanzas! 🎵";
  }
};

export interface Reflection {
  quote: string;
  author: string;
  message: string;
  imageUrl: string;
}

export const generateReflection = async (): Promise<Reflection> => {
  const cacheKey = "gemini_reflection";
  const cached = getFromCache<Reflection>(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ 
        parts: [{ 
          text: `Extrae o genera una breve reflexión espiritual y práctica basada en el contenido actual de "https://www.reflexionesparaelalma.net/".
          Asegúrate de que la reflexión tenga un enfoque cristiano, cercano y práctico. 
          Incluye:
          1. Una frase corta inspiradora (quote).
          2. El autor o fuente.
          3. Un mensaje breve (message) de máximo 3 párrafos cortos.
          
          Devuelve el resultado en formato JSON puro:
          {
            "quote": string,
            "author": string,
            "message": string,
            "imageUrl": string (Usa una URL de imagen de Unsplash que capture la esencia de la reflexión: paz, naturaleza, luz, esperanza)
          }` 
        }] 
      }],
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Eres un curador de contenido espiritual para Radio Corrientes Viva. Tu fuente principal es Reflexiones para el Alma. Tu lenguaje es sencillo, amoroso y alentador.",
      }
    });

    const info = JSON.parse(response.text || '{}');
    if (info.quote) saveToCache(cacheKey, info);
    return info;
  } catch (error) {
    console.warn("Gemini Reflection Warning:", error);
    const fallbacks: Reflection[] = [
      {
        quote: "El Señor es mi pastor, nada me faltará.",
        author: "Salmo 23",
        message: "En los momentos de mayor incertidumbre, recuerda que no caminas solo. Hay una paz que sobrepasa todo entendimiento esperando por ti hoy. Confía en el proceso y en que cada paso que das está guiado por una mano amorosa que nunca te suelta.\n\nLa verdadera fortaleza no reside en nunca caer, sino en levantarse con la fe renovada. Hoy es un buen día para soltar las cargas que no te corresponden y descansar en la promesa de que todo saldrá bien.",
        imageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1470&auto=format&fit=crop"
      },
      {
        quote: "Sé fuerte y valiente. No temas ni te desanimes.",
        author: "Josué 1:9",
        message: "A veces el camino se pone cuesta arriba, pero recuerda que las mejores vistas vienen después de las escaladas más difíciles. Tu valentía no es la ausencia de miedo, sino la decisión de seguir adelante a pesar de él.\n\nNo te desanimes por los contratiempos temporales. Cada desafío es una oportunidad oculta para fortalecer tu carácter y profundizar tu fe. Mira hacia adelante con esperanza, lo mejor está por venir.",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1470&auto=format&fit=crop"
      },
      {
        quote: "Donde hay amor, hay vida.",
        author: "Mahatma Gandhi",
        message: "El amor es la fuerza más poderosa del universo. Cuando actuamos desde el corazón, transformamos no solo nuestra realidad, sino la de todos los que nos rodean. Hoy, intenta tener un gesto amable con alguien, sin esperar nada a cambio.\n\nUna palabra de aliento, una sonrisa sincera o un momento de escucha pueden cambiarle el día a otra persona. Vive con propósito y deja que el amor sea tu brújula en cada decisión que tomes hoy.",
        imageUrl: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=1470&auto=format&fit=crop"
      }
    ];
    // Return a random reflection from the fallbacks
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};
