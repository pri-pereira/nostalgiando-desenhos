/**
 * Service Worker PWA - Nostalgiando Desenhos
 * 
 * Estratégias:
 * - Stale-While-Revalidate para fontes, scripts, folhas de estilo e capas TMDB (image.tmdb.org)
 * - Network-First para APIs (/api/) e chamadas do Firestore
 * - Fallback Offline Retrô ("Sem Sinal de TV / Fora do Ar")
 */

const CACHE_NAME = "nostalgiando-v2";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
  OFFLINE_URL,
];

// Instalação: Pré-cache de arquivos essenciais e página offline
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Adiciona página offline sintetizada
      const offlinePageContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sem Sinal • Nostalgiando</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #09090b;
      color: #fafafa;
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .tv-box {
      background: #18181b;
      border: 2px solid #27272a;
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.8);
    }
    .antenna {
      font-size: 48px;
      margin-bottom: 16px;
      animation: float 2s ease-in-out infinite alternate;
    }
    @keyframes float {
      from { transform: translateY(0); }
      to { transform: translateY(-6px); }
    }
    h1 { font-size: 20px; font-weight: 800; color: #f59e0b; margin-bottom: 8px; }
    p { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px; }
    button {
      background: #f59e0b;
      color: #09090b;
      font-weight: 700;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 14px;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="tv-box">
    <div class="antenna">📺⚡</div>
    <h1>FORA DO AR (SEM SINAL)</h1>
    <p>Parece que a antena da TV perdeu o sinal da internet. Reconecte-se para continuar assistindo aos clássicos.</p>
    <button onclick="window.location.reload()">Sintonizar Novamente</button>
  </div>
</body>
</html>`;

      const offlineResponse = new Response(offlinePageContent, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
      cache.put(OFFLINE_URL, offlineResponse);

      return cache.addAll(PRECACHE_ASSETS.filter((url) => url !== OFFLINE_URL)).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Ativação: Limpeza de caches obsoletos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Interceptação de Requisições
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Não interceptar requisições não-GET
  if (request.method !== "GET") return;

  // 1. Requisições de API, Firestore e Auth: Network-Only
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("securetoken.googleapis.com")
  ) {
    return;
  }

  // 2. Navegação de Páginas HTML: Network-First com Fallback Offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedPage = await cache.match(request);
        if (cachedPage) return cachedPage;
        return (await cache.match(OFFLINE_URL)) || Response.error();
      })
    );
    return;
  }

  // 3. Imagens do TMDB, Fontes Google e Assets Estáticos: Stale-While-Revalidate
  const isTmdbImage = url.hostname.includes("image.tmdb.org");
  const isGoogleFont = url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com");
  const isStaticAsset = url.pathname.startsWith("/assets/") || url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.endsWith(".png");

  if (isTmdbImage || isGoogleFont || isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

