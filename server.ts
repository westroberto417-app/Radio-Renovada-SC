import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fetch from "node-fetch";
import https from "https";

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // Cache para metadatos
  let cache: { data: any; timestamp: number } | null = null;
  const CACHE_TTL = 15000; // 15 segundos

  app.get("/api/metadata", async (req, res) => {
    try {
      // Retornar cache si es reciente
      if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
        return res.json(cache.data);
      }

      const STREAM_ID = 'radiocorrientesviva';
      const response = await fetch(`https://streaming.rf.com.ar/status-json.xsl`, {
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      });
      
      if (!response.ok) {
        if (response.status === 404 || response.status === 403) {
          const fallback = { artist: 'Radio Corrientes Viva', title: 'Transmitiendo en Vivo', albumArt: null };
          cache = { data: fallback, timestamp: Date.now() };
          return res.json(fallback);
        }
        const text = await response.text();
        if (text.includes("Rate exceeded")) {
          throw new Error("RATE_LIMIT");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Página de metadatos no devolvió JSON");
      }

      const data: any = await response.json();
      
      let source = null;
      if (data.icestats && data.icestats.source) {
        if (Array.isArray(data.icestats.source)) {
          source = data.icestats.source.find((s: any) => s.listenurl && s.listenurl.includes(STREAM_ID));
        } else if (data.icestats.source.listenurl && data.icestats.source.listenurl.includes(STREAM_ID)) {
          source = data.icestats.source;
        }
      }
      
      if (source && source.title) {
        const titleParts = source.title.split(' - ');
        const artistClean = titleParts[0]?.trim() || 'Radio Corrientes Viva';
        const titleClean = titleParts[1]?.trim() || 'En Vivo';
        
        let albumArt = null;
        if (artistClean && artistClean.toLowerCase() !== 'radio corrientes viva' && artistClean.toLowerCase() !== 'stream') {
           albumArt = `https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800&sig=${encodeURIComponent(artistClean)}`;
        }

        const result = {
          artist: artistClean,
          title: titleClean,
          albumArt,
          now_playing: source.title
        };

        // Guardar en cache
        cache = { data: result, timestamp: Date.now() };
        res.json(result);
      } else {
        const fallback = { artist: 'Radio Corrientes Viva', title: 'En Vivo', albumArt: null };
        cache = { data: fallback, timestamp: Date.now() };
        res.json(fallback);
      }
    } catch (error: any) {
      console.error("Metadata fetch error:", error.message);
      // Fallback silencioso
      if (cache) {
        return res.json(cache.data);
      }
      res.json({ artist: 'Radio Corrientes Viva', title: 'Escuchando en Vivo', albumArt: null });
    }
  });

  // Proxy the audio stream to bypass CORS for Web Audio API visualizer
  app.get("/api/stream", (req, res) => {
    const streamUrl = "https://streaming.rf.com.ar/listen/radiocorrientesviva/radio.mp3";
    
    // Set basic headers for CORS and prevent caching
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'audio/mpeg');

    const proxyReq = https.get(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Connection': 'keep-alive'
      }
    }, (proxyRes: any) => {
      // Forward status code and content-type if available
      if (proxyRes.statusCode) {
        res.status(proxyRes.statusCode);
      }
      
      if (proxyRes.headers['content-type']) {
        res.setHeader('Content-Type', proxyRes.headers['content-type']);
      }

      proxyRes.pipe(res);
    });

    proxyReq.on("error", (e: any) => {
      console.error("Stream Proxy Error:", e);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
    
    req.on("close", () => {
      proxyReq.destroy();
    });
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
