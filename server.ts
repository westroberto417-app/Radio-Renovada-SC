import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fetch from "node-fetch";
import https from "https";

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
      const Parser = (await import("rss-parser")).default;
      const parser = new Parser();
      const feed = await parser.parseURL("https://news.google.com/rss/search?q=Corrientes+Argentina+when:1d&hl=es-419&gl=AR&ceid=AR:es-419");
      
      const localImages = [
        "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1470&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1501167733271-e4f18b5ea3f4?q=80&w=1470&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1470&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=1474&auto=format&fit=crop"
      ];
      
      const news = feed.items.slice(0, 6).map((item, index) => ({
        id: Date.now() + index,
        title: item.title || "Noticia sin título",
        excerpt: (item.contentSnippet || "").substring(0, 100) + "...",
        fullContent: item.contentSnippet || item.content || "Contenido no disponible.",
        tag: "COMUNIDAD",
        date: item.pubDate ? new Date(item.pubDate).toLocaleDateString("es-AR") : "Hoy",
        image: localImages[index % localImages.length]
      }));
      res.json(news);
    } catch (error: any) {
      console.error("Local news RSS error:", error);
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
      
      const news = feed.items.slice(0, 6).map((item, index) => ({
        id: Date.now() + 100 + index,
        title: item.title || "Noticia sin título",
        excerpt: (item.contentSnippet || "").substring(0, 100) + "...",
        fullContent: item.contentSnippet || item.content || "Contenido no disponible.",
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

  app.get("/api/reflections", (req, res) => {
    const reflections = [
      {
        quote: "El Señor es mi pastor, nada me faltará.",
        author: "Salmo 23",
        message: "En los momentos de mayor incertidumbre, recuerda que no caminas solo. Hay una paz que sobrepasa todo entendimiento esperando por ti hoy. Confía en el proceso y en que cada paso que das está guiado por una mano amorosa que nunca te suelta.",
        imageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1470&auto=format&fit=crop"
      },
      {
        quote: "Sé fuerte y valiente. No temas ni te desanimes.",
        author: "Josué 1:9",
        message: "A veces el camino se pone cuesta arriba, pero recuerda que las mejores vistas vienen después de las escaladas más difíciles. Tu valentía no es la ausencia de miedo, sino la decisión de seguir adelante a pesar de él.",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1470&auto=format&fit=crop"
      },
      {
        quote: "Donde hay amor, hay vida.",
        author: "Mahatma Gandhi",
        message: "El amor es la fuerza más poderosa del universo. Cuando actuamos desde el corazón, transformamos no solo nuestra realidad, sino la de todos los que nos rodean. Hoy, intenta tener un gesto amable con alguien, sin esperar nada a cambio.",
        imageUrl: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=1470&auto=format&fit=crop"
      },
      {
        quote: "La fe no hace las cosas fáciles, hace las cosas posibles.",
        author: "Lucas 1:37",
        message: "A veces nos encontramos frente a montañas que parecen imposibles de mover. Pero recuerda que no dependes solo de tus fuerzas. Pon tu carga y tu confianza en manos divinas y observa cómo se abren puertas donde parecía haber solo muros.",
        imageUrl: "https://images.unsplash.com/photo-1470071131384-001b85755b36?q=80&w=1470&auto=format&fit=crop"
      },
      {
        quote: "Todo lo que hagáis, hacedlo con amor.",
        author: "1 Corintios 16:14",
        message: "El ingrediente secreto para que todas las cosas tengan sentido y propósito es el amor. No importa si tu labor es grande o pequeña a los ojos del mundo. Lo que transforma lo ordinario en extraordinario es el amor con el que lo realizas.",
        imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1469&auto=format&fit=crop"
      },
      {
        quote: "El gozo del Señor es nuestra fuerza.",
        author: "Nehemías 8:10",
        message: "La verdadera alegría no depende de que nuestras circunstancias sean perfectas, sino de saber que tenemos un Dios perfecto que nos cuida. Decide hoy enfocarte en todo lo bueno y permite que su gozo sea el motor que te impulse hacia adelante.",
        imageUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1470&auto=format&fit=crop"
      },
      {
        quote: "Echa toda tu ansiedad sobre Él, porque Él tiene cuidado de ti.",
        author: "1 Pedro 5:7",
        message: "Vivimos en un mundo que a menudo nos llena de preocupaciones, pero no fuiste diseñado para cargar con ese peso. Toma un momento hoy, respira profundamente y entrega aquello que te roba la paz.",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1473&auto=format&fit=crop"
      }
    ];

    const isRandom = req.query.random === 'true';
    // Rotar por el día del año o aleatorio
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const index = isRandom ? Math.floor(Math.random() * reflections.length) : (dayOfYear % reflections.length);
    const reflection = reflections[index];
    
    res.json(reflection);
  });

// removed generation endpoint

  // Endpoint para obtener metadatos de la radio
  // Nota: rf.com.ar suele usar este formato para info en tiempo real
  
  // PWA Essentials: Serve Service Worker and Manifest explicitly to avoid redirects
  app.get("/sw.js", (req, res) => {
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(process.cwd(), "public", "sw.js"));
  });

  app.get("/manifest.json", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "manifest.json"));
  });

  // Explicitly serve static files from public folder without redirects
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
