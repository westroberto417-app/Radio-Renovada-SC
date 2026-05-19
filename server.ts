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
const NEWS_CACHE_TTL = 1000 * 60 * 60 * 4; // 4 hours

let reflectionsCache: any[] = [];
let reflectionsLastUpdate = 0;
const REFLECTIONS_CACHE_TTL = 1000 * 60 * 60 * 5; // 5 hours

async function generateEnhancedLocalNews() {
  try {
    const Parser = (await import("rss-parser")).default;
    const parser = new Parser();
    // Broadened search to Corrientes and Argentina general news for wider appeal
    const feed = await parser.parseURL("https://news.google.com/rss/search?q=Corrientes+Argentina+OR+Argentina+Nacional+when:1d&hl=es-419&gl=AR&ceid=AR:es-419");
    
    const context = feed.items.slice(0, 15).map(item => ({
      title: item.title,
      summary: item.contentSnippet,
      date: item.pubDate
    }));

    const prompt = `Como jefe de redacción de "Radio Corrientes Viva", utiliza el siguiente contexto para redactar EXACTAMENTE 10 noticias regionales y nacionales de alto impacto.
    Contexto RSS: ${JSON.stringify(context)}

    Instrucciones:
    1. Redacta 10 noticias. Deben ser de interés para alguien en Corrientes pero también en Buenos Aires o el resto del país.
    2. Cada noticia debe tener un título impactante, un extracto sugerente y un "fullContent" bien desarrollado (mínimo 200 palabras por noticia).
    3. Usa un lenguaje profesional, cálido y federal.
    4. El formato de respuesta DEBE ser un JSON válido.
    5. Asigna una categoría (TAG) adecuada (SOCIEDAD, CULTURA, SALUD, DEPORTES, CLIMA, ECONOMÍA).
    6. No uses marcadores de markdown en la respuesta, solo el JSON puro.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
    
    // Add images
    const localImages = [
      "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1501167733271-e4f18b5ea3f4?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=1474&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1470&auto=format&fit=crop"
    ];

    localNewsCache = newsData.map((item: any, index: number) => ({
      ...item,
      id: Date.now() + index,
      image: localImages[index % localImages.length]
    }));
    localNewsLastUpdate = Date.now();
  } catch (error) {
    console.error("Error generating enhanced news:", error);
  }
}

async function generateEnhancedReflections() {
  try {
    const prompt = `Eres un guía espiritual de doctrina Evangélica y Bíblica para la audiencia de Radio Corrientes Viva. Tu tarea es generar EXACTAMENTE 7 reflexiones profundas, basadas estrictamente en las Sagradas Escrituras y con un enfoque federal (para todo el país).

    Instrucciones:
    1. Cada reflexión debe tener una cita (quote) bíblica (use la versión Reina Valera 1960), un autor (el pasaje bíblico o un predicador evangélico reconocido) y un mensaje (message) largo y significativo (mínimo 150 palabras) que dé consuelo, esperanza y edificación espiritual.
    2. Evita rituales o menciones católicas. Enfócate en la relación personal con Cristo, la salvación, la gracia, la fe y la fortaleza espiritual.
    3. NO menciones una localidad específica (como San Miguel) para que el mensaje sea recibido por igual en Buenos Aires, Córdoba o Corrientes. 
    4. El formato de respuesta DEBE ser un JSON válido.
    5. No uses marcadores de markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              quote: { type: Type.STRING },
              author: { type: Type.STRING },
              message: { type: Type.STRING }
            },
            required: ["quote", "author", "message"]
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
      
      // If still empty (AI failed), fallback to direct RSS with basic mapping
      if (localNewsCache.length === 0) {
        const Parser = (await import("rss-parser")).default;
        const parser = new Parser();
        const feed = await parser.parseURL("https://news.google.com/rss/search?q=Corrientes+Argentina+when:1d&hl=es-419&gl=AR&ceid=AR:es-419");
        
        const localImages = [
          "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1470&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1501167733271-e4f18b5ea3f4?q=80&w=1470&auto=format&fit=crop"
        ];
        
        localNewsCache = feed.items.slice(0, 10).map((item, index) => ({
          id: Date.now() + index,
          title: item.title || "Noticia Regional",
          excerpt: (item.contentSnippet || "").substring(0, 150) + "...",
          fullContent: (item.contentSnippet || "Amplía la información sintonizando Radio Corrientes Viva."),
          tag: "INTERÉS GENERAL",
          date: item.pubDate ? new Date(item.pubDate).toLocaleDateString("es-AR") : "Hoy",
          image: localImages[index % localImages.length]
        }));
      }

      res.json(localNewsCache);
    } catch (error: any) {
      console.error("Local news error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/news/national", async (req, res) => {
    try {
      const Parser = (await import("rss-parser")).default;
      const parser = new Parser();
      const feed = await parser.parseURL("https://news.google.com/rss/headlines/section/topic/NATION?hl=es-419&gl=AR&ceid=AR:es-419");
      
      const nationalImages = [
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1470&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1611974714652-760056a2cc09?q=80&w=1470&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1466611653911-95282ee3656b?q=80&w=1470&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1470&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1470&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1551076805-e1869043e560?q=80&w=1459&auto=format&fit=crop"
      ];
      
      const news = feed.items.slice(0, 12).map((item, index) => ({
        id: Date.now() + 100 + index,
        title: item.title || "Noticia sin título",
        excerpt: (item.contentSnippet || "").substring(0, 150) + "...",
        fullContent: (item.contentSnippet || item.content || "Contenido no disponible.") + "\n\nRadio Corrientes Viva, llevándote la información más relevante de todo el país directamente a tu pantalla.",
        tag: "NACIONAL",
        date: item.pubDate ? new Date(item.pubDate).toLocaleDateString("es-AR") : "Hoy",
        image: nationalImages[index % nationalImages.length]
      }));
      res.json(news);
    } catch (error: any) {
      console.error("National news RSS error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reflections", async (req, res) => {
    try {
      const forceRefresh = req.query.force === 'true';
      if (forceRefresh || reflectionsCache.length === 0 || (Date.now() - reflectionsLastUpdate > REFLECTIONS_CACHE_TTL)) {
        await generateEnhancedReflections();
      }

      // Rollback hardcoded reflections as ultimate fallback
      if (reflectionsCache.length === 0) {
        reflectionsCache = [
          {
            quote: "El Señor es mi pastor, nada me faltará.",
            author: "Salmo 23",
            message: "En los momentos de mayor incertidumbre, recuerda que no caminas solo. Hay una paz que sobrepasa todo entendimiento esperando por ti hoy. Confía en el proceso y en que cada paso que das está guiado por una mano amorosa que nunca te suelta. San Miguel nos enseña que la fe es nuestro escudo más fuerte.",
            imageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1470&auto=format&fit=crop"
          }
        ];
      }

      const isRandom = req.query.random === 'true';
      // Rotation logic: current hour window
      const currentHour = new Date().getHours();
      const currentCycle = Math.floor(currentHour / 5); // 5 hours rotate
      
      const index = isRandom ? Math.floor(Math.random() * reflectionsCache.length) : (currentCycle % reflectionsCache.length);
      const reflection = reflectionsCache[index];
      
      res.json(reflection);
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
