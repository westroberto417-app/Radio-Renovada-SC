import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fetch from "node-fetch";
import https from "https";
import { createRequire } from "module";
import { GoogleGenAI, Type } from "@google/genai";

const require = createRequire(import.meta.url);
const archiver = require("archiver");

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// --- Content Caches ---
let localNewsCache: any[] = [];
let localNewsLastUpdate = 0;
let provincialNewsCache: any[] = [];
let provincialNewsLastUpdate = 0;
let nationalNewsCache: any[] = [];
let nationalNewsLastUpdate = 0;
const NEWS_CACHE_TTL = 1000 * 60 * 60 * 4; // 4 hours

let reflectionsCache: any[] = [];
let reflectionsLastUpdate = 0;
const REFLECTIONS_CACHE_TTL = 1000 * 60 * 60 * 5; // 5 hours

async function generateEnhancedLocalNews() {
  try {
    const Parser = (await import("rss-parser")).default;
    const parser = new Parser();
    // Search specific to San Miguel, Caá Catí, Loreto, Santa Rosa and general surrounding regions
    const feed = await parser.parseURL("https://news.google.com/rss/search?q=San+Miguel+Corrientes+OR+Caa+Cati+OR+Loreto+Corrientes+OR+Santa+Rosa+Corrientes+when:3d&hl=es-419&gl=AR&ceid=AR:es-419");
    
    const context = feed.items.slice(0, 15).map(item => ({
      title: item.title,
      summary: item.contentSnippet,
      date: item.pubDate
    }));

    const prompt = `Como jefe de redacción de "Radio Corrientes Viva", utiliza el siguiente contexto para redactar EXACTAMENTE 10 noticias locales profundas y atractivas sobre San Miguel, Corrientes y sus zonas aledañas (Caá Catí, Loreto, Santa Rosa, etc., "noticias locales y regionales").
    Contexto RSS: ${JSON.stringify(context)}

    Instrucciones:
    1. Redacta 10 noticias locales. Si el contexto RSS no es suficiente para completar 10 de San Miguel y alrededores, completa con temas comunitarios de interés para estas localidades (asuntos municipales, recordatorios pastorales, salud rural, eventos culturales locale, clima agropecuario, etc.).
    2. Cada noticia debe tener un título impactante, un extracto sugerente y un "fullContent" bien desarrollado (mínimo 200 palabras por noticia).
    3. Usa un lenguaje profesional, cálido y comunitario, que haga sentir a los vecinos de San Miguel y zonas aledañas plenamente representados.
    4. El formato de respuesta DEBE ser un JSON válido.
    5. Asigna una categoría (TAG) adecuada (MUNICIPIO, SALUD, DEPORTES, CULTURA, AGROPECUARIO, COMUNIDAD).
    6. No uses marcadores de markdown en la respuesta, solo el JSON puro.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              fullContent: { type: Type.STRING },
              tag: { type: Type.STRING },
              date: { type: Type.STRING }
            },
            required: ["title", "excerpt", "fullContent", "tag", "date"]
          }
        }
      }
    });

    const newsData = JSON.parse(response.text);
    
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

    localNewsCache = newsData.map((item: any, index: number) => ({
      ...item,
      id: Date.now() + index,
      image: localImages[index % localImages.length]
    }));
    localNewsLastUpdate = Date.now();
  } catch (error) {
    console.error("Error generating enhanced local news:", error);
  }
}

async function generateEnhancedProvincialNews() {
  try {
    const Parser = (await import("rss-parser")).default;
    const parser = new Parser();
    // News for the general Province of Corrientes (Diario)
    const feed = await parser.parseURL("https://news.google.com/rss/search?q=Provincia+de+Corrientes+Argentina+when:2d&hl=es-419&gl=AR&ceid=AR:es-419");
    
    const context = feed.items.slice(0, 15).map(item => ({
      title: item.title,
      summary: item.contentSnippet,
      date: item.pubDate
    }));

    const prompt = `Como jefe de redacción de "Radio Corrientes Viva", utiliza el siguiente contexto para redactar EXACTAMENTE 10 noticias del "Diario de la Provincia de Corrientes" más relevantes.
    Contexto RSS: ${JSON.stringify(context)}

    Instrucciones:
    1. Redacta 10 noticias de la Provincia de Corrientes. Si el contexto RSS no es suficiente para completar 10, completa con temas de cultura libre correntina, chamamé, ecoturismo de los Esteros del Iberá, o noticias de actualidad de ciudades importantes de la provincia.
    2. Cada noticia debe tener un título impactante, un extracto sugerente y un "fullContent" bien desarrollado (mínimo 200 palabras por noticia).
    3. El formato de respuesta DEBE ser un JSON válido.
    4. Asigna una categoría (TAG) adecuada (PROVINCIA, CULTURA, TURISMO, POLÍTICA, ECONOMÍA, REGIONAL).
    5. No uses marcadores de markdown en la respuesta, solo el JSON puro.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              fullContent: { type: Type.STRING },
              tag: { type: Type.STRING },
              date: { type: Type.STRING }
            },
            required: ["title", "excerpt", "fullContent", "tag", "date"]
          }
        }
      }
    });

    const newsData = JSON.parse(response.text);
    
    const provincialImages = [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1470&auto=format&fit=crop"
    ];

    provincialNewsCache = newsData.map((item: any, index: number) => ({
      ...item,
      id: Date.now() + 1000 + index,
      image: provincialImages[index % provincialImages.length]
    }));
    provincialNewsLastUpdate = Date.now();
  } catch (error) {
    console.error("Error generating enhanced provincial news:", error);
  }
}

async function generateEnhancedNationalNews() {
  try {
    const Parser = (await import("rss-parser")).default;
    const parser = new Parser();
    // General nation news of Argentina
    const feed = await parser.parseURL("https://news.google.com/rss/headlines/section/topic/NATION?hl=es-419&gl=AR&ceid=AR:es-419");
    
    const context = feed.items.slice(0, 15).map(item => ({
      title: item.title,
      summary: item.contentSnippet,
      date: item.pubDate
    }));

    const prompt = `Como jefe de redacción de "Radio Corrientes Viva", utiliza el siguiente contexto de novedades nacionales para redactar EXACTAMENTE 10 noticias generales de Argentina (de altísimo impacto y alcance federal).
    Contexto RSS: ${JSON.stringify(context)}

    Instrucciones:
    1. Redacta 10 noticias generales del país. Si el contexto RSS no es suficiente para 10, completa con temas nacionales relevantes de interés (sociedad, avances en educación, ciencia, deportes generales o cultura federal).
    2. Cada noticia debe tener un título relevante, un extracto sugerente y un "fullContent" bien desarrollado (mínimo 200 palabras).
    3. El formato de respuesta DEBE ser un JSON válido.
    4. Asigna una categoría (TAG) adecuada (NACIONAL, SOCIEDAD, CULTURA, SALUD, DEPORTES, ECONOMÍA).
    5. No uses marcadores de markdown en la respuesta, solo el JSON puro.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              fullContent: { type: Type.STRING },
              tag: { type: Type.STRING },
              date: { type: Type.STRING }
            },
            required: ["title", "excerpt", "fullContent", "tag", "date"]
          }
        }
      }
    });

    const newsData = JSON.parse(response.text);
    
    const nationalImages = [
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611974714652-760056a2cc09?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1466611653911-95282ee3656b?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1470&auto=format&fit=crop"
    ];

    nationalNewsCache = newsData.map((item: any, index: number) => ({
      ...item,
      id: Date.now() + 2000 + index,
      image: nationalImages[index % nationalImages.length]
    }));
    nationalNewsLastUpdate = Date.now();
  } catch (error) {
    console.error("Error generating enhanced national news:", error);
  }
}

async function generateEnhancedReflections() {
  try {
    const prompt = `Eres un consejero espiritual de doctrina Evangélica y Bíblica para la audiencia de Radio Corrientes Viva. Tu tarea es generar EXACTAMENTE 10 reflexiones profundas y edificantes para los oyentes, basadas estrictamente en las Sagradas Escrituras y con un enfoque amplio y federal (para todo el país, apto para oyentes de Buenos Aires, Córdoba, Corrientes u otras provincias).

    Instrucciones:
    1. Cada una de las 10 reflexiones debe ser un objeto JSON con las siguientes propiedades EXACTAS:
       - "title": Un título inspirador (ej: "La fe que mueve montañas", "El poder de la oración persistente").
       - "tag": Un término espiritual clave de la teología evangélica (elije estrictamente entre: "FE", "ORACIÓN", "AMOR DE DIOS", "ESPERANZA", "VICTORIA", "PROPÓSITO", "PALABRA DE DIOS", "GRACIA").
       - "quote": Un versículo bíblico textual (usa preferencialmente la traducción Reina Valera 1960).
       - "author": La cita exacta del libro de la Biblia donde se halla el versículo (ej: "Filipenses 4:13", "Jonás 2:2").
       - "message": Un mensaje reflexivo hondo y desarrollado (mínimo 150-200 palabras) de fe, arrepentimiento, redención, comunión sincera, o victoria espiritual en Cristo.
    2. Mantente fiel a los principios bíblicos evangélicos. Evita cualquier tipo de mención de ritos, santos, sacerdotes, vírgenes, dogmas católicos o denominacionales excluyentes. Pon el foco absoluto en Jesucristo, la gracia divina, la fe viva y el consuelo de las Escrituras.
    3. NO menciones ninguna localidad específica (como San Miguel) para que la radio tenga una llegada federal amplia a todas las provincias de la Argentina.
    4. El formato de respuesta DEBE ser un JSON válido. No uses marcadores de markdown en la respuesta, solo el JSON puro.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              tag: { type: Type.STRING },
              quote: { type: Type.STRING },
              author: { type: Type.STRING },
              message: { type: Type.STRING }
            },
            required: ["title", "tag", "quote", "author", "message"]
          }
        }
      }
    });

    const reflectionData = JSON.parse(response.text);
    const reflectionImages = [
      "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071131384-001b85755b36?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1469&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1473&auto=format&fit=crop"
    ];

    reflectionsCache = reflectionData.map((item: any, index: number) => ({
      ...item,
      imageUrl: reflectionImages[index % reflectionImages.length]
    }));
    reflectionsLastUpdate = Date.now();
  } catch (error) {
    console.error("Error generating enhanced reflections:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

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
          fullContent: `Los municipios de la zona (San Miguel, Caá Catí, Loreto y Santa Rosa) continúan trabajando de manera coordinada en infraestructura vial y conectividad para los productores agrícolas y ganaderos de la zona. \n\nVecinos expresaron su optimismo por el avance de las obras secundarias que agilizan el tránsito hacia los Esteros del Iberá y otras cabeceras del departamento General Paz.\n\nSintoniza Radio Corrientes Viva para mantenerte al tanto de todos los detalles al instante.`,
          tag: "COMUNIDAD",
          date: "Hoy",
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
          date: "Hoy",
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
          date: "Hoy",
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
  
  // Explicitly serve static files from public folder
  app.use(express.static(path.join(process.cwd(), 'public'), { redirect: false }));

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
    app.use(express.static(distPath));
    
    // Catch-all route for SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor de Radio corriendo en http://localhost:${PORT}`);
  });
}

startServer();
