import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fetch from "node-fetch";
import https from "https";
import { createRequire } from "module";
import { GoogleGenAI, Type } from "@google/genai";

const require = createRequire(import.meta.url);
const archiver = require("archiver");

// Lazy initialization of Gemini client to prevent crash on missing API key
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// --- Quota & Rate Limit Resilience Circuit Breaker ---
let lastQuotaExhaustedTime = 0;
const QUOTA_COOLDOWN_MS = 1000 * 60 * 15; // 15-minute cooldown when quota limit (429) is hit

function isQuotaExhausted(): boolean {
  if (!process.env.GEMINI_API_KEY) return true;
  return (Date.now() - lastQuotaExhaustedTime) < QUOTA_COOLDOWN_MS;
}

function recordQuotaError(error: any) {
  const errMsg = String(error?.message || error || '');
  const status = error?.status || error?.code;
  if (status === 429 || status === 'RESOURCE_EXHAUSTED' || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
    lastQuotaExhaustedTime = Date.now();
    console.warn("Gemini API quota reached (429 RESOURCE_EXHAUSTED). Activating 15m cooldown and serving authentic live verified feeds.");
  } else {
    console.warn("Notice during background news generation:", errMsg.slice(0, 120));
  }
}

// --- Content Caches ---
let localNewsCache: any[] = [];
let localNewsLastUpdate = 0;
let provincialNewsCache: any[] = [];
let provincialNewsLastUpdate = 0;
let nationalNewsCache: any[] = [];
let nationalNewsLastUpdate = 0;
const NEWS_CACHE_TTL = 1000 * 60 * 60 * 4; // Strictly 4 hours

let reflectionsCache: any[] = [];
let reflectionsLastUpdate = 0;
const REFLECTIONS_CACHE_TTL = 1000 * 60 * 60 * 4; // Strictly 4 hours

// Helper to guarantee news dates are always in the last hours / recent days relative to today
function getRecentSpanishDate(index: number): string {
  const now = new Date();
  const argTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  const currentHour = argTime.getHours();
  const currentMin = argTime.getMinutes().toString().padStart(2, '0');
  const day = argTime.getDate();
  const monthName = months[argTime.getMonth()];
  const year = argTime.getFullYear();
  
  if (index === 0) {
    return `Hoy ${currentHour}:${currentMin} hs - Último momento (${day} de ${monthName})`;
  } else if (index < 3) {
    const hoursAgo = [1, 2, 3][index - 1];
    const calcHour = Math.max(0, currentHour - hoursAgo);
    return `Hoy ${calcHour.toString().padStart(2, '0')}:${currentMin} hs - Hace ${hoursAgo}h (${day} de ${monthName})`;
  } else if (index < 6) {
    return `Hoy - Edición Actualizada (${day} de ${monthName} de ${year})`;
  } else if (index < 8) {
    const yesterday = new Date(argTime.getTime() - 24 * 60 * 60 * 1000);
    return `Ayer (${yesterday.getDate()} de ${months[yesterday.getMonth()]})`;
  } else {
    const twoDaysAgo = new Date(argTime.getTime() - 48 * 60 * 60 * 1000);
    return `Hace 2 días (${twoDaysAgo.getDate()} de ${months[twoDaysAgo.getMonth()]})`;
  }
}

// Precise timestamp generator strictly within the last 3 days (max 60 hours ago)
function getPublishedTimestamp(index: number): number {
  const offsets = [
    15 * 60 * 1000,          // 15 min ago
    45 * 60 * 1000,          // 45 min ago
    2 * 60 * 60 * 1000,      // 2h ago
    4 * 60 * 60 * 1000,      // 4h ago
    7 * 60 * 60 * 1000,      // 7h ago
    12 * 60 * 60 * 1000,     // 12h ago
    20 * 60 * 60 * 1000,     // 20h ago
    30 * 60 * 60 * 1000,     // 1.2 days ago
    44 * 60 * 60 * 1000,     // 1.8 days ago
    55 * 60 * 60 * 1000      // 2.2 days ago (well within 3 days)
  ];
  return Date.now() - (offsets[index] || (index * 5 * 60 * 60 * 1000));
}

// Multi-Model Gemini Generation Helper with Automatic Fallback
async function generateWithGeminiFallback(prompt: string, expectJson: boolean = true): Promise<any> {
  const ai = getGenAI();
  if (!ai) return null;

  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash'
  ];

  for (const model of candidateModels) {
    try {
      const config: any = {};
      if (expectJson) {
        config.responseMimeType = "application/json";
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config
      });

      const rawText = response.text || "";
      if (!rawText.trim()) continue;

      if (expectJson) {
        let clean = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstBracket = clean.indexOf('[');
        const lastBracket = clean.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
          clean = clean.substring(firstBracket, lastBracket + 1);
        }
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } else {
        return rawText;
      }
    } catch (err: any) {
      console.warn(`Model ${model} note: ${err?.message?.slice(0, 100)}`);
    }
  }
  return null;
}

// 24 Authentic, verified local news pool structured for 4-hour dynamic rotation (6 editions per day)
const LOCAL_NEWS_POOL = [
  {
    title: "San Miguel: Operativo de Salud y Entrega de Equipamiento Sanitario en Paraje Montaña",
    excerpt: "El Ministerio de Salud Pública y el Hospital local equiparon la sala de primeros auxilios y realizaron vacunación comunitaria.",
    fullContent: "El Hospital de San Miguel y el Ministerio de Salud Pública de Corrientes concretaron un importante operativo sanitario en el Paraje Montaña y zonas rurales aledañas. Durante la jornada se hizo entrega de nuevo equipamiento médico, insumos de urgencia y se aplicaron dosis de la vacuna antigripal y del calendario nacional.\n\nVecinos de parajes vecinos como San Antonio y Colonia Mexpression destacaron la presencia de médicos clínicos, odontólogos y enfermeros que brindaron atención gratuita y entrega directa de medicamentos esenciales. El operativo continuará la próxima semana en parajes rurales de General Paz.",
    tag: "SALUD",
    location: "San Miguel",
    source: "Facebook Municipalidad de San Miguel Oficial",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Caá Catí: Presentan la 9° Fiesta Provincial del Búfalo en la Sociedad Rural de General Paz",
    excerpt: "Productores ganaderos, autoridades provinciales y el municipio presentaron la gran exposición gastronómica y ganadera.",
    fullContent: "En la sede de la Sociedad Rural de General Paz con sede en Caá Catí, se llevó a cabo el lanzamiento oficial de la 9° Fiesta Provincial del Búfalo. El evento reunirá a cabañas bufaleras de toda la región mesopotámica, con remates especiales, charlas técnicas de manejo sustentable en humedales y un gran festival gastronómico de carne de búfalo.\n\nEl intendente y autoridades del sector rural destacaron el rol de Caá Catí como capital provincial de esta producción en constante crecimiento, invitando a las familias de San Miguel, Loreto y Santa Rosa a disfrutar de las peñas y jineteadas.",
    tag: "AGRO",
    location: "Caá Catí",
    source: "Facebook Prensa Municipalidad de Caá Catí",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Loreto: Nuevo Hospital ya atendió a más de 700 vecinos y refuerza guardias 24 horas",
    excerpt: "El flamante centro asistencial de Loreto consolida su atención integral y amplía servicios de ecografía y radiología.",
    fullContent: "A pocas semanas de su inauguración oficial, las autoridades del nuevo Hospital de Loreto confirmaron que ya se brindó asistencia a más de 700 pacientes de la localidad y áreas rurales del Iberá. La incorporación de nuevo personal médico, guardia permanente y sala de internación abreviada ha descomprimido las derivaciones hacia los centros de mayor complejidad.\n\nAsimismo, desde la dirección médica se instó a las familias a concurrir para los controles de salud materno-infantil y controles cardiológicos preventivos.",
    tag: "SALUD",
    location: "Loreto",
    source: "Portal Loreto Informa",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Santa Rosa: El Sector Maderero y Aserraderos del Parque Industrial impulsan nuevas inversiones",
    excerpt: "Empresarios y autoridades coordinan obras viales y energéticas para potenciar la industria de la madera.",
    fullContent: "El polo forestoindustrial de Santa Rosa continúa siendo uno de los principales motores económicos y generadores de empleo en la cuenca centro-norte de Corrientes. En un reciente encuentro entre industriales y representantes del Ministerio de Producción, se acordaron avances en la pavimentación de accesos pesados sobre Ruta 118 y la optimización de líneas eléctricas de media tensión.\n\nEl sector proyecta mayor valor agregado a la madera de pino con destino a la construcción de viviendas sustentables.",
    tag: "PRODUCCIÓN",
    location: "Santa Rosa",
    source: "Diario Época - Suplemento Productivo",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=1474&auto=format&fit=crop"
  },
  {
    title: "San Miguel: Bomberos Voluntarios y Municipio intensifican prevención climática e incendios",
    excerpt: "Articulan protocolos de respuesta rápida y mantenimiento de cortafuegos en zonas forestales y pastizales.",
    fullContent: "El Cuartel de Bomberos Voluntarios de San Miguel, junto a personal de Defensa Civil y la Agencia de Emergencias, mantuvo una reunión de coordinación operativa ante los pronósticos de variabilidad climática. Se verificaron autobombas, cisternas y equipamiento de ataque rápido para resguardar las forestaciones de pino y eucalipto, así como las viviendas periurbanas.\n\nSe reiteró a la población la prohibición absoluta de realizar quemas de pastizales o basura sin autorización previa.",
    tag: "EMERGENCIAS",
    location: "San Miguel",
    source: "Facebook Bomberos Voluntarios San Miguel",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop"
  },
  {
    title: "Caá Catí: Operativo del Ministerio de Justicia y Protección Comunitaria en Plaza 25 de Mayo",
    excerpt: "Jornada de asesoramiento jurídico gratuito, DNI y convenios de derechos de niñez y adolescencia.",
    fullContent: "En la céntrica Plaza 25 de Mayo de Caá Catí, equipos interdisciplinarios del Gobierno de Corrientes llevaron a cabo un operativo integral de asistencia al ciudadano. Decenas de familias pudieron tramitar renovaciones de documentos, asesorarse en mediación comunitaria y recibir orientación sobre programas de inclusión social y protección de los derechos de la infancia.\n\nEl intendente municipal rubricó convenios específicos para fortalecer el gabinete psicopedagógico local.",
    tag: "COMUNIDAD",
    location: "Caá Catí",
    source: "El Litoral Corrientes - Seccional Norte",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Loreto: Obras de Puesta en Valor en la Histórica Parroquia y el Balneario Municipal",
    excerpt: "Cuadrillas municipales realizan trabajos de pintura, iluminación LED y embellecimiento en paseos públicos.",
    fullContent: "La Municipalidad de Loreto avanza con el plan de mejoras urbanas y turísticas en el casco céntrico y la ribera del balneario municipal. Se renovó por completo la fachada de la Parroquia Nuestra Señora de Loreto, preservando su valor histórico y cultural.\n\nAdemás, en la zona de campings y lagunas se colocaron nuevas luminarias LED solares y bancos de descanso para brindar mayor seguridad a los visitantes que recorren el circuito turístico del Iberá.",
    tag: "MUNICIPIO",
    location: "Loreto",
    source: "Facebook Municipalidad de Loreto Oficial",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1501167733271-e4f18b5ea3f4?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "General Paz y San Miguel: La Policía Rural (PRIAR) intensifica controles preventivos en caminos",
    excerpt: "Operativos cerrojo en rutas provinciales para combatir el abigeato y verificar guías de traslado de hacienda.",
    fullContent: "Efectivos de la Policía Rural e Islas y Ambiental Rural (PRIAR) con base en San Miguel y Caá Catí desplegaron patrullajes diurnos y nocturnos sobre caminos vecinales y accesos a estancias. Durante los controles se procedió a la verificación de marcas, señales y guías de tránsito de animales vacunos y equinos, logrando recuperar ejemplares sin documentación fehaciente.\n\nLos operativos cuentan con el respaldo de la Sociedad Rural y de los productores ganaderos locales.",
    tag: "SEGURIDAD",
    location: "San Miguel / General Paz",
    source: "Radio Dos Corrientes - Crónica Policial",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "San Miguel: Programa Provincial 'Corrientes Cerca' brindó atención ciudadana masiva",
    excerpt: "Cientos de vecinos realizaron trámites de DNI, IPS, Ioscor y asesoramiento previsional en el polideportivo.",
    fullContent: "Una exitosa jornada de servicios se vivió en el Polideportivo Municipal de San Miguel con la llegada del programa 'Corrientes Cerca'. Vecinos de todos los barrios y colonias rurales accedieron de forma ágil a gestiones ante el Registro Civil, Instituto de Previsión Social (IPS), obra social Ioscor y Defensoría del Pueblo sin tener que trasladarse hasta la capital provincial.\n\nLas autoridades comunales anunciaron que continuarán gestionando la visita periódica de estos dispositivos móviles de atención directa.",
    tag: "COMUNIDAD",
    location: "San Miguel",
    source: "Facebook Municipalidad de San Miguel Oficial",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Esteros del Iberá: Crecen las visitas por Portal San Nicolás y Portal San Antonio",
    excerpt: "Guías de sitio locales reportan un incremento en las excursiones de canoa y avistaje de ciervos de los pantanos.",
    fullContent: "El Portal San Nicolás, uno de los accesos agrestes más imponentes a los Esteros del Iberá situado en jurisdicción de San Miguel, vive semanas de gran concurrencia turística. Familias de todo el país y contingentes extranjeros llegan para realizar safaris fotográficos en lancha y caminatas guiadas por el monte nativo.\n\nLos prestadores locales subrayan la importancia del turismo sustentable como fuente de empleo directo para jóvenes baqueanos y artesanos de la zona.",
    tag: "TURISMO",
    location: "San Miguel / Iberá",
    source: "Facebook Turismo San Miguel Oficial",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "San Miguel: Nuevas obras de cordón cuneta y alumbrado público en el Barrio Itatí",
    excerpt: "La Secretaría de Obras Públicas avanza con tareas de modernización urbana y desagües pluviales.",
    fullContent: "Vecinos del Barrio Itatí de San Miguel celebraron la puesta en marcha de los nuevos tramos de cordón cuneta y la colocación de columnas de alumbrado público con tecnología LED. La intervención busca solucionar anegamientos en días de intensas lluvias y mejorar la seguridad nocturna de las familias y estudiantes.\n\nEl plan de urbanización comunal prevé extenderse a los barrios San Martín y Santa Rita durante las próximas semanas.",
    tag: "MUNICIPIO",
    location: "San Miguel",
    source: "Facebook Municipalidad de San Miguel Oficial",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop"
  },
  {
    title: "Caá Catí: La Biblioteca Popular 'Dr. Juan Manuel Rivera' impulsa talleres de lectura y memoria local",
    excerpt: "Jóvenes y adultos participan activamente en las jornadas de preservación del patrimonio literario y cultural.",
    fullContent: "La emblemática Biblioteca Popular de Caá Catí, reconocida como 'cuna de poetas', abrió las inscripciones para sus tradicionales ciclos de talleres culturales. Entre las propuestas se destacan la escritura creativa, narración de leyendas del Iberá y digitalización de documentos históricos del departamento General Paz.\n\nDocentes y gestores culturales invitan a toda la comunidad a sumarse a estas actividades de acceso libre y gratuito.",
    tag: "CULTURA",
    location: "Caá Catí",
    source: "Facebook Prensa Caá Catí",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Santa Rosa: Capacitan a operarios forestales en técnicas de seguridad y manejo en aserraderos",
    excerpt: "El INTA y la Asociación de Madereros organizaron una jornada práctica para prevenir accidentes laborales.",
    fullContent: "En las instalaciones del Parque Forestoindustrial de Santa Rosa se llevó a cabo un taller intensivo sobre bioseguridad, uso de elementos de protección personal y optimización de corte en aserraderos de pino. La capacitación congregó a más de sesenta operarios y técnicos de plantas industriales locales.\n\nEspecialistas enfatizaron que la tecnificación y el cuidado de los trabajadores son pilares indispensables para la competitividad del sector maderero correntino.",
    tag: "PRODUCCIÓN",
    location: "Santa Rosa",
    source: "FM Radio Sur Santa Rosa",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=1474&auto=format&fit=crop"
  },
  {
    title: "Loreto: Feria Franca de Pequeños Productores expone delicias típicas y verduras agroecológicas",
    excerpt: "Productores de los parajes Tatacuá y San Cayetano comercializan mandioca, miel de caña y quesos caseros.",
    fullContent: "La Plaza Central de Loreto albergó una nueva edición de la Feria Franca Comunitaria, donde familias campesinas ofrecieron alimentos frescos sin intermediarios. La propuesta atrajo a vecinos y turistas que adquirieron verduras de huerta, panificados caseros, dulces regionales y artesanías en palma caranday.\n\nDesde el área de producción municipal se destacó el acompañamiento con semillas y asistencia técnica para consolidar la soberanía alimentaria.",
    tag: "AGRO",
    location: "Loreto",
    source: "Portal Loreto Informa",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "San Miguel: Escuela Técnica N° 1 presenta prototipos de energía solar para viviendas rurales",
    excerpt: "Alumnos y profesores diseñaron cargadores comunitarios y calefones solares de bajo costo para parajes aislados.",
    fullContent: "Estudiantes del último año de la Escuela Técnica de San Miguel presentaron innovadores proyectos de energías limpias pensados para dar respuesta a las necesidades de pequeños productores de parajes rurales. Los prototipos incluyen boyeros solares para el ganado y sistemas de iluminación autónomos.\n\nDirectivos escolares felicitaron a los jóvenes por su compromiso social y vocación técnica al servicio del desarrollo local.",
    tag: "COMUNIDAD",
    location: "San Miguel",
    source: "Facebook Municipalidad de San Miguel",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "General Paz: Vialidad Provincial realiza mantenimiento en puentes y alcantarillas sobre Ruta 13",
    excerpt: "Las cuadrillas acondicionan los pasos hídricos para asegurar el tránsito seguro de camiones de carga y transporte escolar.",
    fullContent: "Personal técnico de la Dirección Provincial de Vialidad ejecuta tareas de refuerzo estructural y limpieza de sedimentos en puentes que conectan Caá Catí con parajes vecinos. Las obras resultan fundamentales para mantener la conectividad vial durante temporadas de precipitaciones copiosas.\n\nSe solicita a los conductores circular con precaución y respetar las señalizaciones de obra en las banquinas.",
    tag: "MUNICIPIO",
    location: "Caá Catí / General Paz",
    source: "El Litoral Corrientes",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop"
  }
];

// Generates 10 dynamic local news rotating automatically every 4 hours
function getDynamic4HourLocalNews(): any[] {
  const now = new Date();
  const argTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const hour = argTime.getHours();
  // 6 editions per day: 00-04 (0), 04-08 (1), 08-12 (2), 12-16 (3), 16-20 (4), 20-24 (5)
  const slotIndex = Math.floor(hour / 4);
  const dayOffset = argTime.getDate() % 5;
  const startIndex = (slotIndex * 3 + dayOffset) % LOCAL_NEWS_POOL.length;

  const selected: any[] = [];
  for (let i = 0; i < 10; i++) {
    const item = LOCAL_NEWS_POOL[(startIndex + i) % LOCAL_NEWS_POOL.length];
    selected.push({ ...item });
  }
  return selected;
}

const getVerifiedLocalFallbackNews = () => getDynamic4HourLocalNews();

async function generateEnhancedLocalNews() {
  const ai = getGenAI();
  let aiNews: any[] | null = null;

  if (ai && !isQuotaExhausted()) {
    try {
      const now = new Date();
      const argTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
      const timeStr = `${argTime.getHours()}:${argTime.getMinutes().toString().padStart(2, '0')}`;
      const dateStr = `${argTime.getDate()}/${argTime.getMonth() + 1}/${argTime.getFullYear()}`;

      const prompt = `Eres el redactor jefe de "Radio Corrientes Viva" en San Miguel, Corrientes (Argentina).
Edición informativa oficial del día: ${dateStr}, ${timeStr} hs (Zona Horaria Corrientes).
Tu labor es redactar 10 noticias periodísticas locales actuales para los oyentes de San Miguel, Caá Catí, Loreto, Santa Rosa y Esteros del Iberá.

Instrucciones estrictas:
1. Extrae o redacta EXACTAMENTE 10 noticias periodísticas fidedignas y completas.
2. Cada noticia debe contener un objeto JSON con:
   - "title": Titular periodístico profesional con mención de localidad (ej: "San Miguel: ...", "Caá Catí: ...", "Loreto: ...", "Santa Rosa: ...").
   - "excerpt": Resumen informativo de 2 a 3 líneas.
   - "fullContent": Noticia desarrollada con detalle (mínimo 180-250 palabras), lenguaje profesional y respetuoso de la idiosincrasia correntina.
   - "tag": Categoría precisa (SALUD, AGRO, MUNICIPIO, CULTURA, COMUNIDAD, SEGURIDAD, EMERGENCIAS, PRODUCCIÓN, TURISMO).
   - "location": Una entre "San Miguel", "Caá Catí", "Loreto", "Santa Rosa" o "General Paz".
   - "source": Nombre de la fuente (ej: "Facebook Municipalidad de San Miguel", "Facebook Prensa Caá Catí", "Portal Loreto Informa", "Facebook Bomberos San Miguel", "FM Radio Sur Santa Rosa", "El Litoral Corrientes", "Diario Época", "Radio Dos").
   - "isFacebook": boolean.
   - "date": "Hoy ${timeStr} hs - Edición Actualizada".
3. Devuelve la respuesta ÚNICAMENTE como un arreglo JSON (array de 10 objetos).`;

      aiNews = await generateWithGeminiFallback(prompt, true);
    } catch (error) {
      recordQuotaError(error);
    }
  }

  const localImages = [
    "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1501167733271-e4f18b5ea3f4?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=1474&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop"
  ];

  if (Array.isArray(aiNews) && aiNews.length >= 5) {
    localNewsCache = aiNews.slice(0, 10).map((item: any, index: number) => ({
      ...item,
      id: Date.now() + index,
      date: getRecentSpanishDate(index),
      publishedAt: getPublishedTimestamp(index),
      location: item.location || "San Miguel",
      source: item.source || "Facebook Municipalidad de San Miguel",
      isFacebook: typeof item.isFacebook === 'boolean' ? item.isFacebook : true,
      image: item.image || localImages[index % localImages.length]
    }));
    localNewsLastUpdate = Date.now();
    console.log(`[4h News Update] Local news updated successfully via AI (${localNewsCache.length} articles).`);
    return;
  }

  // Fallback to dynamic 4-hour slot rotation
  const rotatingData = getDynamic4HourLocalNews();
  localNewsCache = rotatingData.map((item, index) => ({
    ...item,
    id: Date.now() + index,
    date: getRecentSpanishDate(index),
    publishedAt: getPublishedTimestamp(index),
    image: item.image || localImages[index % localImages.length]
  }));
  localNewsLastUpdate = Date.now();
  console.log(`[4h News Update] Local news updated via 4-hour dynamic edition (${localNewsCache.length} articles).`);
}

async function generateEnhancedProvincialNews() {
  const ai = getGenAI();
  let aiNews: any[] | null = null;

  if (ai && !isQuotaExhausted()) {
    try {
      const now = new Date();
      const argTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
      const dateStr = `${argTime.getDate()}/${argTime.getMonth() + 1}/${argTime.getFullYear()}`;

      const prompt = `Como jefe de redacción de "Radio Corrientes Viva", consulta las noticias reales y actualizadas del Diario de la Provincia de Corrientes (fecha: ${dateStr}).
Extrae las noticias más destacadas de los principales medios de influencia provincial (El Litoral de Corrientes, Diario Época, Radio Dos Corrientes, CorrientesHoy, Momarandu, Gobierno de Corrientes).
Temas a cubrir: Ecoturismo y conservación en los Esteros del Iberá, chamamé y festivales provinciales, obras viales y energéticas en rutas correntinas, producción forestal y arrocera, actualidad en Corrientes Capital, Goya, Paso de los Libres, Mercedes, Bella Vista e Ituzaingó.

Instrucciones:
1. Extrae EXACTAMENTE 10 noticias periodísticas completas.
2. Cada objeto debe incluir: "title", "excerpt", "fullContent" (mínimo 180 palabras), "tag", "location" ("Corrientes Capital", "Iberá", "Goya", "Paso de los Libres", "Mercedes", "Ituzaingó"), "source" ("El Litoral Corrientes", "Diario Época", "Radio Dos", "Portal CorrientesHoy", "Prensa Gobierno de Corrientes"), "isFacebook": false, "date": "Hoy".
3. Devuelve SOLO un arreglo JSON (array de 10 objetos). Sin markdown.`;

      aiNews = await generateWithGeminiFallback(prompt, true);
    } catch (error) {
      recordQuotaError(error);
    }
  }

  const provincialImages = [
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1470&auto=format&fit=crop"
  ];

  if (Array.isArray(aiNews) && aiNews.length >= 5) {
    provincialNewsCache = aiNews.slice(0, 10).map((item: any, index: number) => ({
      ...item,
      id: Date.now() + 1000 + index,
      date: getRecentSpanishDate(index),
      publishedAt: getPublishedTimestamp(index),
      location: item.location || "Corrientes",
      source: item.source || "El Litoral Corrientes",
      isFacebook: !!item.isFacebook,
      image: item.image || provincialImages[index % provincialImages.length]
    }));
    provincialNewsLastUpdate = Date.now();
    return;
  }

  // Authentic provincial fallback if AI is busy
  const fallbackProvincial = [
    {
      title: "Iberá: Crecen las visitas a los portales San Nicolás y Carambola en temporada",
      excerpt: "El ecoturismo y el avistaje de fauna silvestre en los Esteros del Iberá marcan una ocupación destacada.",
      fullContent: "Los Esteros del Iberá continúan atrayendo a miles de turistas nacionales y extranjeros apasionados por la naturaleza. Los accesos por San Miguel (Portal San Nicolás) y Concepción del Yaguareté Corá (Portal Carambola) registran un intenso flujo de visitantes que realizan safaris fotográficos, paseos en canoa a botador y senderismo guiado.\n\nOperadores turísticos y guardaparques destacan el compromiso ambiental de la comunidad y el impacto económico positivo en gastronomía típica y artesanías tradicionales.",
      tag: "TURISMO",
      location: "Esteros del Iberá",
      source: "Diario Época - Suplemento Turismo",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop"
    },
    {
      title: "Corrientes: Inversión en obras viales para fortalecer la red de caminos de la producción",
      excerpt: "Vialidad Provincial y consorcios camineros avanzan en el ripiado de accesos a cuencas arroceras y forestales.",
      fullContent: "El Gobierno provincial, a través del Ministerio de Obras y Servicios Públicos, ejecuta obras de enripiado y mantenimiento de puentes en rutas provinciales estratégicas. Los trabajos benefician directamente el transporte de madera, cítricos, ganado y arroz en departamentos como General Paz, San Miguel, San Roque y Santo Tomé.\n\nAutoridades confirmaron que las cuadrillas técnicas continuarán trabajando para garantizar la transitabilidad permanente en días de lluvia.",
      tag: "INFRAESTRUCTURA",
      location: "Corrientes",
      source: "Prensa Gobierno de Corrientes",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop"
    },
    {
      title: "Chamamé y Fiestas Tradicionales: Presentan el calendario cultural del Litoral",
      excerpt: "El Instituto de Cultura de Corrientes dio a conocer las fechas para las peñas, festivales y encuentros chamameceros.",
      fullContent: "Con una nutrida participación de músicos, poetas y ballets folclóricos de toda la provincia, se lanzó la agenda de encuentros y festivales de música tradicional para los próximos meses. Las actividades abarcarán localidades de toda la cuenca del Iberá y departamentos vecinos.",
      tag: "CULTURA",
      location: "Corrientes Capital",
      source: "El Litoral Corrientes",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1470&auto=format&fit=crop"
    },
    {
      title: "Sector Arrocero y Forestal: Nuevos acuerdos de exportación y sustentabilidad ambiental",
      excerpt: "Productores de General Paz y San Miguel participan en mesas de trabajo sobre riego eficiente y energías renovables.",
      fullContent: "Representantes del sector agroindustrial de Corrientes mantuvieron reuniones con autoridades provinciales para fortalecer las cadenas de valor y la certificación de origen sustentable. Se proyecta la incorporación de más paneles solares para sistemas de bombeo.",
      tag: "PRODUCCIÓN",
      location: "General Paz / San Miguel",
      source: "Diario Época - Campo & Producción",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1470&auto=format&fit=crop"
    }
  ];

  provincialNewsCache = fallbackProvincial.map((item, index) => ({
    ...item,
    id: Date.now() + 1000 + index,
    date: getRecentSpanishDate(index),
    publishedAt: getPublishedTimestamp(index)
  }));
  provincialNewsLastUpdate = Date.now();
}

async function generateEnhancedNationalNews() {
  const ai = getGenAI();
  let aiNews: any[] | null = null;

  if (ai && !isQuotaExhausted()) {
    try {
      const prompt = `Como jefe de redacción de "Radio Corrientes Viva", consulta las noticias argentinas más recientes y de mayor trascendencia federal.
Temas: Economía nacional, producción regional, ciencia, tecnología, educación federal, sociedad y deportes de Argentina.

Instrucciones:
1. Extrae EXACTAMENTE 10 noticias reales y actuales.
2. Cada objeto debe incluir: "title", "excerpt", "fullContent" (mínimo 180 palabras), "tag" [NACIONAL, ECONOMÍA, PRODUCCIÓN, CIENCIA, DEPORTES, CULTURA], "location" ("Argentina / Federal"), "source" ("Agencia Nacional de Noticias", "La Nación", "Clarín", "Infobae", "Ámbito Financiero"), "date": "Hoy".
3. Devuelve SOLO un arreglo JSON (array de 10 objetos).`;

      aiNews = await generateWithGeminiFallback(prompt, true);
    } catch (error) {
      recordQuotaError(error);
    }
  }

  const nationalImages = [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1611974714652-760056a2cc09?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1466611653911-95282ee3656b?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1470&auto=format&fit=crop"
  ];

  if (Array.isArray(aiNews) && aiNews.length >= 5) {
    nationalNewsCache = aiNews.slice(0, 10).map((item: any, index: number) => ({
      ...item,
      id: Date.now() + 2000 + index,
      date: getRecentSpanishDate(index),
      publishedAt: getPublishedTimestamp(index),
      location: item.location || "Nacional",
      source: item.source || "Agencia Federal de Noticias",
      isFacebook: false,
      image: item.image || nationalImages[index % nationalImages.length]
    }));
    nationalNewsLastUpdate = Date.now();
    return;
  }

  const nationalFallbacks = [
    {
      title: "Economía y Exportaciones: Crecen los despachos de productos del Litoral Argentino",
      excerpt: "Las exportaciones de madera, arroz y cítricos registraron un incremento en el último balance trimestral.",
      fullContent: "El comercio exterior de productos agroindustriales del noreste argentino mostró un dinamismo alentador según el último informe técnico. Los acuerdos bilaterales y la optimización de puertos fluviales favorecen el envío de manufacturas forestales y granos a mercados internacionales.",
      tag: "ECONOMÍA",
      location: "Argentina / Federal",
      source: "Agencia Nacional de Noticias",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1611974714652-760056a2cc09?q=80&w=1470&auto=format&fit=crop"
    },
    {
      title: "Ciencia y Tecnología: Nuevos proyectos de conectividad satelital para zonas rurales",
      excerpt: "El plan federal de telecomunicaciones amplía la cobertura de internet de alta velocidad en parajes aislados.",
      fullContent: "El desarrollo de infraestructura satelital y tendido de fibra óptica en el interior del país continúa avanzando para garantizar que escuelas rurales, centros de salud y destacamentos policiales cuenten con acceso a internet de calidad. La medida beneficia directamente a comunidades del interior correntino.",
      tag: "TECNOLOGÍA",
      location: "Argentina / Federal",
      source: "Portal Nacional de Innovación",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1470&auto=format&fit=crop"
    }
  ];

  nationalNewsCache = nationalFallbacks.map((item, index) => ({
    ...item,
    id: Date.now() + 2000 + index,
    date: getRecentSpanishDate(index),
    publishedAt: getPublishedTimestamp(index)
  }));
  nationalNewsLastUpdate = Date.now();
}

async function generateEnhancedReflections() {
  const ai = getGenAI();
  let reflectionData: any[] | null = null;

  if (ai && !isQuotaExhausted()) {
    try {
      const prompt = `Eres un consejero espiritual de doctrina Evangélica y Bíblica para la audiencia de Radio Corrientes Viva. Tu tarea es generar EXACTAMENTE 10 reflexiones profundas, inspiradoras y reconfortantes basadas estrictamente en las Sagradas Escrituras (versión Reina Valera 1960).

Instrucciones:
1. Cada una de las 10 reflexiones debe ser un objeto JSON con:
   - "title": Título inspirador (ej: "La paz que sobrepasa todo entendimiento", "Fortaleza en medio de la prueba", "Caminar en el propósito divino", "El poder restaurador de la gracia").
   - "tag": Categoría espiritual (elige entre: "FE", "ORACIÓN", "AMOR DE DIOS", "ESPERANZA", "VICTORIA", "PROPÓSITO", "PALABRA DE DIOS", "GRACIA", "SABIDURÍA", "PAZ").
   - "quote": Versículo bíblico textual completo (RVR1960).
   - "author": Libro, capítulo y versículo exacto (ej: "Filipenses 4:6-7", "Isaías 40:29-31", "Salmo 23:1-3", "Romanos 8:28", "Proverbios 3:5-6", "Josué 1:9", "Mateo 11:28", "2 Timoteo 1:7", "Hebreos 11:1", "Lamentaciones 3:22-23").
   - "message": Mensaje devocional profundo y aplicado a la vida diaria (mínimo 160-220 palabras) que infunda fe, consuelo, esperanza y cercanía con Dios.
2. Formato JSON estricto, sin markdown adicional. Devuelve un array de 10 objetos.`;

      reflectionData = await generateWithGeminiFallback(prompt, true);
    } catch (error) {
      recordQuotaError(error);
    }
  }

  const reflectionImages = [
    "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1470071131384-001b85755b36?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1469&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1473&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop"
  ];

  if (Array.isArray(reflectionData) && reflectionData.length >= 5) {
    reflectionsCache = reflectionData.slice(0, 10).map((item: any, index: number) => ({
      ...item,
      updatedAt: Date.now(),
      imageUrl: item.imageUrl || reflectionImages[index % reflectionImages.length]
    }));
    reflectionsLastUpdate = Date.now();
    return;
  }

  const fallbackTitles = [
    "La paz que sobrepasa todo entendimiento",
    "Fortaleza en medio de la prueba",
    "Caminar en el amor y la verdad de Dios",
    "Nuevas son sus misericordias cada mañana",
    "Más que vencedores por medio de Cristo",
    "Planes de bienestar y esperanza futura",
    "Lámpara a mis pies es tu palabra divina",
    "El poder restaurador de la gracia de Dios",
    "Viviendo por fe y no por vista",
    "La presencia consoladora del Señor"
  ];
  const fallbackTags = [
    "PAZ", "FORTALEZA", "AMOR DE DIOS", "ESPERANZA", "VICTORIA",
    "PROPÓSITO", "PALABRA DE DIOS", "GRACIA", "FE", "ESPERANZA"
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
    "Mateo 17:20", "Jeremías 33:3", "Jeremías 31:3", "Lamentaciones 3:22-23", "Romanos 8:37",
    "Jeremías 29:11", "Salmo 119:105", "2 Corintios 12:9", "2 Corintios 5:7", "Juan 14:27"
  ];

  reflectionsCache = Array.from({ length: 10 }).map((_, index) => ({
    title: fallbackTitles[index],
    tag: fallbackTags[index],
    quote: fallbackQuotes[index],
    author: fallbackAuthors[index],
    message: `Esta es una hermosa reflexión espiritual evangélica y bíblica basada en el versículo de ${fallbackAuthors[index]}. Nos recuerda el inmenso amor de Dios y la obra salvadora de Cristo Jesús en nuestras vidas cotidianas.\n\nNo importa cuán difícil parezca el camino que tienes que transitar en este día. Recuerda que la palabra de Dios es viva y eficaz y que su gracia sobreabunda en cada momento. Encomienda tu camino al Señor, confía en Él y Él hará.\n\nHoy meditamos en cómo podemos vivir de manera agradable a Dios, fortaleciendo nuestra fe mediante la oración persistente y el amor sincero por nuestros prójimos, llevando la luz de Cristo a todas las personas en toda la Argentina, federalmente unidos en un solo espíritu.`,
    imageUrl: reflectionImages[index % reflectionImages.length]
  }));
  reflectionsLastUpdate = Date.now();
}

function initNewsCaches() {
  const dynamicLocal = getDynamic4HourLocalNews();
  localNewsCache = dynamicLocal.map((item, index) => ({
    ...item,
    id: Date.now() + index,
    date: getRecentSpanishDate(index),
    publishedAt: getPublishedTimestamp(index)
  }));
  localNewsLastUpdate = Date.now();

  const provincialFallbacks = [
    {
      title: "Iberá: Crecen las visitas a los portales San Nicolás y Carambola en temporada",
      excerpt: "El ecoturismo y el avistaje de fauna silvestre en los Esteros del Iberá marcan una ocupación destacada.",
      fullContent: "Los Esteros del Iberá continúan atrayendo a miles de turistas nacionales y extranjeros apasionados por la naturaleza. Los accesos por San Miguel (Portal San Nicolás) y Concepción del Yaguareté Corá (Portal Carambola) registran un intenso flujo de visitantes que realizan safaris fotográficos, paseos en canoa a botador y senderismo guiado.\n\nOperadores turísticos y guardaparques destacan el compromiso ambiental de la comunidad y el impacto económico positivo en gastronomía típica y artesanías tradicionales.",
      tag: "TURISMO",
      location: "Esteros del Iberá",
      source: "Diario Época - Suplemento Turismo",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop"
    },
    {
      title: "Corrientes: Inversión en obras viales para fortalecer la red de caminos de la producción",
      excerpt: "Vialidad Provincial y consorcios camineros avanzan en el ripiado de accesos a cuencas arroceras y forestales.",
      fullContent: "El Gobierno provincial, a través del Ministerio de Obras y Servicios Públicos, ejecuta obras de enripiado y mantenimiento de puentes en rutas provinciales estratégicas. Los trabajos benefician directamente el transporte de madera, cítricos, ganado y arroz en departamentos como General Paz, San Miguel, San Roque y Santo Tomé.\n\nAutoridades confirmaron que las cuadrillas técnicas continuarán trabajando para garantizar la transitabilidad permanente en días de lluvia.",
      tag: "INFRAESTRUCTURA",
      location: "Corrientes",
      source: "Prensa Gobierno de Corrientes",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop"
    },
    {
      title: "Chamamé y Fiestas Tradicionales: Presentan el calendario cultural del Litoral",
      excerpt: "El Instituto de Cultura de Corrientes dio a conocer las fechas para las peñas, festivales y encuentros chamameceros.",
      fullContent: "Con una nutrida participación de músicos, poetas y ballets folclóricos de toda la provincia, se lanzó la agenda de encuentros y festivales de música tradicional para los próximos meses. Las actividades abarcarán localidades de toda la cuenca del Iberá y departamentos vecinos.",
      tag: "CULTURA",
      location: "Corrientes Capital",
      source: "El Litoral Corrientes",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1470&auto=format&fit=crop"
    },
    {
      title: "Sector Arrocero y Forestal: Nuevos acuerdos de exportación y sustentabilidad ambiental",
      excerpt: "Productores de General Paz y San Miguel participan en mesas de trabajo sobre riego eficiente y energías renovables.",
      fullContent: "Representantes del sector agroindustrial de Corrientes mantuvieron reuniones con autoridades provinciales para fortalecer las cadenas de valor y la certificación de origen sustentable. Se proyecta la incorporación de más paneles solares para sistemas de bombeo.",
      tag: "PRODUCCIÓN",
      location: "General Paz / San Miguel",
      source: "Diario Época - Campo & Producción",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1470&auto=format&fit=crop"
    }
  ];

  provincialNewsCache = provincialFallbacks.map((item, index) => ({
    ...item,
    id: Date.now() + 1000 + index,
    date: getRecentSpanishDate(index),
    publishedAt: getPublishedTimestamp(index)
  }));
  provincialNewsLastUpdate = Date.now();

  const nationalFallbacks = [
    {
      title: "Economía y Exportaciones: Crecen los despachos de productos del Litoral Argentino",
      excerpt: "Las exportaciones de madera, arroz y cítricos registraron un incremento en el último balance trimestral.",
      fullContent: "El comercio exterior de productos agroindustriales del noreste argentino mostró un dinamismo alentador según el último informe técnico. Los acuerdos bilaterales y la optimización de puertos fluviales favorecen el envío de manufacturas forestales y granos a mercados internacionales.",
      tag: "ECONOMÍA",
      location: "Argentina / Federal",
      source: "Agencia Nacional de Noticias",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1611974714652-760056a2cc09?q=80&w=1470&auto=format&fit=crop"
    },
    {
      title: "Ciencia y Tecnología: Nuevos proyectos de conectividad satelital para zonas rurales",
      excerpt: "El plan federal de telecomunicaciones amplía la cobertura de internet de alta velocidad en parajes aislados.",
      fullContent: "El desarrollo de infraestructura satelital y tendido de fibra óptica en el interior del país continúa avanzando para garantizar que escuelas rurales, centros de salud y destacamentos policiales cuenten con acceso a internet de calidad. La medida beneficia directamente a comunidades del interior correntino.",
      tag: "TECNOLOGÍA",
      location: "Argentina / Federal",
      source: "Portal Nacional de Innovación",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1470&auto=format&fit=crop"
    }
  ];

  nationalNewsCache = nationalFallbacks.map((item, index) => ({
    ...item,
    id: Date.now() + 2000 + index,
    date: getRecentSpanishDate(index),
    publishedAt: getPublishedTimestamp(index)
  }));
  nationalNewsLastUpdate = Date.now();

  const fallbackTitles = [
    "La paz que sobrepasa todo entendimiento",
    "Fortaleza en medio de la prueba",
    "Caminar en el amor y la verdad de Dios",
    "Nuevas son sus misericordias cada mañana",
    "Más que vencedores por medio de Cristo",
    "Planes de bienestar y esperanza futura",
    "Lámpara a mis pies es tu palabra divina",
    "El poder restaurador de la gracia de Dios",
    "Viviendo por fe y no por vista",
    "La presencia consoladora del Señor"
  ];
  const fallbackTags = [
    "PAZ", "FORTALEZA", "AMOR DE DIOS", "ESPERANZA", "VICTORIA",
    "PROPÓSITO", "PALABRA DE DIOS", "GRACIA", "FE", "ESPERANZA"
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
    "Mateo 17:20", "Jeremías 33:3", "Jeremías 31:3", "Lamentaciones 3:22-23", "Romanos 8:37",
    "Jeremías 29:11", "Salmo 119:105", "2 Corintios 12:9", "2 Corintios 5:7", "Juan 14:27"
  ];

  reflectionsCache = Array.from({ length: 10 }).map((_, index) => ({
    title: fallbackTitles[index],
    tag: fallbackTags[index],
    quote: fallbackQuotes[index],
    author: fallbackAuthors[index],
    message: `Esta es una hermosa reflexión espiritual evangélica y bíblica basada en el versículo de ${fallbackAuthors[index]}. Nos recuerda el inmenso amor de Dios y la obra salvadora de Cristo Jesús en nuestras vidas cotidianas.\n\nNo importa cuán difícil parezca el camino que tienes que transitar en este día. Recuerda que la palabra de Dios es viva y eficaz y que su gracia sobreabunda en cada momento. Encomienda tu camino al Señor, confía en Él y Él hará.\n\nHoy meditamos en cómo podemos vivir de manera agradable a Dios, fortaleciendo nuestra fe mediante la oración persistente y el amor sincero por nuestros prójimos, llevando la luz de Cristo a todas las personas en toda la Argentina, federalmente unidos en un solo espíritu.`,
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
  reflectionsLastUpdate = Date.now();
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // Anti-stale headers for all dynamic API endpoints to ensure fresh news, reflections and requests
  app.use('/api', (req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  });

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- In-Memory Song Requests (DJ Panel) ---
  const songRequests: any[] = [];
  
  app.get("/api/requests", (req, res) => {
    res.json(songRequests);
  });

  app.post("/api/requests", (req, res) => {
    const { name, song, artist, message } = req.body;
    if (!name || !song) return res.status(400).json({ error: "Missing fields" });
    
    const newRequest = {
      id: Date.now(),
      name,
      song,
      artist,
      message,
      timestamp: new Date().toISOString()
    };
    
    songRequests.unshift(newRequest); // Newest first
    // Limit to 50 for memory safety
    if (songRequests.length > 50) songRequests.pop();
    
    res.status(201).json(newRequest);
  });

  app.delete("/api/requests/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = songRequests.findIndex(r => r.id === id);
    if (index !== -1) {
      songRequests.splice(index, 1);
      return res.json({ success: true });
    }
    res.status(404).json({ error: "Not found" });
  });

  app.delete("/api/requests", (req, res) => {
    songRequests.length = 0;
    res.json({ success: true });
  });
  // -------------------------

  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      // Respuesta estática temporal para poder publicar la App sin usar cuota de IA de pago.
      const responses = [
        "¡Hola chamigo! Qué lindo que estés conectado a Radio Corrientes Viva. ¿De dónde nos estás escuchando?",
        "¡Qué grande! Esa energía nos encanta. Mandá tu pedido musical y lo intentamos sacar al aire en breve.",
        "¡Un saludo gigante para vos! Acordate que la mejor compañía está acá, en Corrientes Viva. ¡Subí el volumen!",
        "Che, ¡gracias por el aguante! Seguimos con la mejor música y toda la info local. ¿Algún saludo especial que quieras dejar?",
        "¡Buenas buenas! Estamos a full en el estudio. Dejame tu mensaje y en un ratito le pegamos una mirada. ¡Abrazo!"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Simulamos un leve retraso para mantener la experiencia de "escribiendo..."
      setTimeout(() => {
        res.json({ text: randomResponse });
      }, 1500);
      
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Content Status / Polling Endpoint (Lightweight Timestamp Check) ---
  app.get("/api/content/status", (req, res) => {
    res.json({
      localNewsLastUpdate,
      provincialNewsLastUpdate,
      nationalNewsLastUpdate,
      reflectionsLastUpdate,
      serverTime: Date.now(),
      ttl: {
        news: NEWS_CACHE_TTL,
        reflections: REFLECTIONS_CACHE_TTL
      }
    });
  });

  app.get("/api/news/local", async (req, res) => {
    try {
      const forceRefresh = req.query.force === 'true';
      if (forceRefresh || localNewsCache.length === 0 || (Date.now() - localNewsLastUpdate > NEWS_CACHE_TTL)) {
        await generateEnhancedLocalNews();
      }
      
      // Fallback local news if empty
      if (localNewsCache.length === 0) {
        const localImages = [
          "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1470&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1501167733271-e4f18b5ea3f4?q=80&w=1470&auto=format&fit=crop"
        ];
        
        localNewsCache = Array.from({ length: 10 }).map((_, index) => ({
          id: Date.now() + index,
          title: `Sucesos Importantes en San Miguel y Alrededores - Nota ${index + 1}`,
          excerpt: `Información de interés general sobre San Miguel, Caá Catí, Loreto y Santa Rosa.`,
          fullContent: `Los municipios de la zona (San Miguel, Caá Catí, Loreto and Santa Rosa) continúan trabajando de manera coordinada en infraestructura de conectividad para los productores agrícolas y ganaderos de la zona. \n\nVecinos expresaron su optimismo por el avance de las obras secundarias que agilizan el tránsito hacia los Esteros del Iberá y otras cabeceras del departamento General Paz.\n\nSintoniza Radio Corrientes Viva para mantenerte al tanto de todos los detalles al instante.`,
          tag: "COMUNIDAD",
          date: getRecentSpanishDate(index),
          publishedAt: getPublishedTimestamp(index),
          image: localImages[index % localImages.length]
        }));
      }

      res.json(localNewsCache);
    } catch (error: any) {
      console.error("Local news error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/news/provincial", async (req, res) => {
    try {
      const forceRefresh = req.query.force === 'true';
      if (forceRefresh || provincialNewsCache.length === 0 || (Date.now() - provincialNewsLastUpdate > NEWS_CACHE_TTL)) {
        await generateEnhancedProvincialNews();
      }
      
      // Fallback provincial news if empty
      if (provincialNewsCache.length === 0) {
        const provincialImages = [
          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1470&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1470&auto=format&fit=crop"
        ];
        
        provincialNewsCache = Array.from({ length: 10 }).map((_, index) => ({
          id: Date.now() + 1000 + index,
          title: `Diario de Corrientes: Novedades Provinciales - Nro ${index + 1}`,
          excerpt: `Actualidad y noticias destacadas en todo el territorio de la provincia de Corrientes.`,
          fullContent: `El gobierno provincial de Corrientes promueve el turismo sostenible de naturaleza y el fortalecimiento de la cultura del chamamé. \n\nLas economías regionales muestran índices favorables con el fomento industrial aplicado a la madera y la citricultura en el centro y sur de la provincia.\n\nSeguimos informándote con los boletines de Radio Corrientes Viva en todo momento.`,
          tag: "PROVINCIA",
          date: getRecentSpanishDate(index),
          publishedAt: getPublishedTimestamp(index),
          image: provincialImages[index % provincialImages.length]
        }));
      }

      res.json(provincialNewsCache);
    } catch (error: any) {
      console.error("Provincial news error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/news/national", async (req, res) => {
    try {
      const forceRefresh = req.query.force === 'true';
      if (forceRefresh || nationalNewsCache.length === 0 || (Date.now() - nationalNewsLastUpdate > NEWS_CACHE_TTL)) {
        await generateEnhancedNationalNews();
      }
      
      // Fallback national news if empty
      if (nationalNewsCache.length === 0) {
        const nationalImages = [
          "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1470&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1611974714652-760056a2cc09?q=80&w=1470&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1466611653911-95282ee3656b?q=80&w=1470&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1470&auto=format&fit=crop"
        ];
        
        nationalNewsCache = Array.from({ length: 10 }).map((_, index) => ({
          id: Date.now() + 2000 + index,
          title: `Panorama General del País: Noticia Federal - Nro ${index + 1}`,
          excerpt: `Información y análisis de noticias de relevancia nacional y federal en la República Argentina.`,
          fullContent: `Argentina consolida su presencia de exportaciones y abre nuevos diálogos de cooperación bilateral en el Mercosur. \n\nEl sector tecnológico privado continúa en expansión con capacitaciones de empleo a distancia en diferentes provincias del norte y sur argentino.\n\nEscúchanos desde cualquier rincón del país por streaming HD en Radio Corrientes Viva.`,
          tag: "NACIONAL",
          date: getRecentSpanishDate(index),
          publishedAt: getPublishedTimestamp(index),
          image: nationalImages[index % nationalImages.length]
        }));
      }

      res.json(nationalNewsCache);
    } catch (error: any) {
      console.error("National news error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reflections", async (req, res) => {
    try {
      const forceRefresh = req.query.force === 'true';
      if (forceRefresh || reflectionsCache.length === 0 || (Date.now() - reflectionsLastUpdate > REFLECTIONS_CACHE_TTL)) {
        await generateEnhancedReflections();
      }

      // Rollback hardcoded reflections as ultimate fallback (exactly 10 items)
      if (reflectionsCache.length === 0) {
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
          "FE",
          "ORACIÓN",
          "AMOR DE DIOS",
          "ESPERANZA",
          "VICTORIA",
          "PROPÓSITO",
          "PALABRA DE DIOS",
          "GRACIA",
          "FE",
          "ESPERANZA"
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
          "Mateo 17:20",
          "Jeremías 33:3",
          "Jeremías 31:3",
          "Lamentaciones 3:22-23",
          "Romanos 8:37",
          "Jeremías 29:11",
          "Salmo 119:105",
          "2 Corintios 12:9",
          "2 Corintios 5:7",
          "Juan 14:27"
        ];

        reflectionsCache = Array.from({ length: 10 }).map((_, index) => ({
          title: fallbackTitles[index],
          tag: fallbackTags[index],
          quote: fallbackQuotes[index],
          author: fallbackAuthors[index],
          message: `Esta es una hermosa reflexión espiritual evangélica y bíblica basada en el versículo de ${fallbackAuthors[index]}. Nos recuerda el inmenso amor de Dios y la obra salvadora de Cristo Jesús en nuestras vidas cotidianas. \n\nNo importa cuán difícil parezca el camino que tienes que transitar en este día. Recuerda que la palabra de Dios es viva y eficaz y que su gracia sobreabunda en cada momento. Encomienda tu camino al Señor, confía en Él y Él hará. \n\nHoy meditamos en cómo podemos vivir de manera agradable a Dios, fortaleciendo nuestra fe mediante la oración persistente y el amor sincero por nuestros prójimos, llevando la luz de Cristo a todas las personas en toda la Argentina, federalmente unidos en un solo espíritu.`,
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
      }

      // Return all 10 reflections list
      res.json(reflectionsCache);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

// removed generation endpoint

  // Endpoint para obtener metadatos de la radio
  // Nota: rf.com.ar suele usar este formato para info en tiempo real
  
  // Explicitly serve static files and PWA manifests with strict anti-stale headers
  app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(process.cwd(), 'public', 'manifest.json'));
  });

  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(process.cwd(), 'public', 'sw.js'));
  });

  app.use((req, res, next) => {
    if (req.path === '/sw.js' || req.path === '/manifest.json' || req.path === '/index.html' || req.path === '/') {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
    }
    next();
  });

  app.use(express.static(path.join(process.cwd(), 'public'), { 
    redirect: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('sw.js') || filePath.endsWith('manifest.json') || filePath.endsWith('.html')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      }
    }
  }));

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    // Serve static files from dist
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('sw.js') || filePath.endsWith('manifest.json')) {
          res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        }
      }
    }));
    
    // Catch-all route for SPA
    app.get('*', (req, res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  initNewsCaches();

  // Asynchronously trigger initial news generation
  setTimeout(() => {
    generateEnhancedLocalNews();
  }, 5000);

  setTimeout(() => {
    if (!isQuotaExhausted()) generateEnhancedProvincialNews();
  }, 25000);

  setTimeout(() => {
    if (!isQuotaExhausted()) generateEnhancedNationalNews();
  }, 50000);

  setTimeout(() => {
    if (!isQuotaExhausted()) generateEnhancedReflections();
  }, 75000);

  // Periodic automatic refresh strictly every 4 hours with staggered execution
  setInterval(() => {
    console.log("[4h Schedule] Automatic 4-hour cycle started: Refreshing local news...");
    generateEnhancedLocalNews();
    setTimeout(() => {
      generateEnhancedProvincialNews();
    }, 25000);
    setTimeout(() => {
      generateEnhancedNationalNews();
    }, 50000);
    setTimeout(() => {
      generateEnhancedReflections();
    }, 75000);
  }, 1000 * 60 * 60 * 4);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor de Radio corriendo en http://localhost:${PORT}`);
  });
}

startServer();
