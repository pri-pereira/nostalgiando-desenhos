import defaultCatalog from "../data/catalog.json";
import { normalizeTitle, normalizeYear } from "./normalizeCatalog";

/**
 * Interceptor inteligente para robôs e crawlers de redes sociais (WhatsApp, Telegram, Facebook, Twitter, Discord).
 * Retorna imediatamente uma resposta HTML leve e enriquecida com todas as meta tags OpenGraph e Twitter Card,
 * garantindo renderização instantânea do preview mesmo em crawlers que não executam JavaScript.
 */
export function handleCrawlerOgResponse(request: Request): Response | null {
  try {
    const url = new URL(request.url);
    const userAgent = request.headers.get("user-agent") || "";
    const isCrawler = /WhatsApp|TelegramBot|facebookexternalhit|Facebot|Twitterbot|Discordbot|SkypeUriPreview|LinkedInBot/i.test(
      userAgent
    );

    const isAssistirRoute = url.pathname.startsWith("/assistir/");
    const isApiOgRoute = url.pathname === "/api/og-share" || url.pathname === "/api/og";

    if (!isApiOgRoute && (!isCrawler || !isAssistirRoute)) {
      return null;
    }

    const slug = isApiOgRoute
      ? (url.searchParams.get("slug") || "").trim()
      : url.pathname.replace(/^\/assistir\/?/, "").split("/")[0].trim();

    if (!slug) return null;

    // Localiza show no catálogo
    const cleanSlug = slug.toLowerCase();
    const show = (defaultCatalog as any[]).find(
      (s) => s.slug === slug || s.slug.toLowerCase() === cleanSlug
    );

    if (!show) return null;

    const title = normalizeTitle(show.title);
    const yearObj = normalizeYear(show.year);
    const year = yearObj.displayYear;
    const ogTitle = `Assista ${title} (${year}) Completo no Nostalgiando Desenhos`;
    const ogDesc =
      show.synopsis ||
      "Assista episódios completos dublados e mate a saudade dos maiores clássicos da animação retrô no Nostalgiando!";
    const poster = show.poster || "https://nostalgiando-desenhos.vercel.app/icon-512x512.png";
    const canonicalUrl = `https://nostalgiando-desenhos.vercel.app/assistir/${encodeURIComponent(show.slug)}`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${ogTitle}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${ogDesc}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- OpenGraph WhatsApp / Facebook / Telegram -->
  <meta property="og:site_name" content="Nostalgiando Desenhos" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDesc}" />
  <meta property="og:image" content="${poster}" />
  <meta property="og:image:secure_url" content="${poster}" />
  <meta property="og:image:width" content="600" />
  <meta property="og:image:height" content="900" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:alt" content="Capa do desenho ${title}" />
  <meta property="og:type" content="video.tv_show" />
  <meta property="og:url" content="${canonicalUrl}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@nostalgiando" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDesc}" />
  <meta name="twitter:image" content="${poster}" />
  <meta name="twitter:image:alt" content="Capa do desenho ${title}" />

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": "${title.replace(/"/g, '\\"')}",
    "description": "${ogDesc.replace(/"/g, '\\"')}",
    "image": "${poster}",
    "dateCreated": "${year}",
    "inLanguage": "pt-BR",
    "url": "${canonicalUrl}"
  }
  </script>

  <style>
    body { background: #0d0c13; color: #f3f4f6; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { max-width: 480px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
    img { width: 180px; height: 270px; object-fit: cover; border-radius: 16px; margin: 0 auto 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { font-size: 20px; margin: 0 0 8px; color: #fbbf24; }
    p { font-size: 13px; line-height: 1.5; color: #9ca3af; margin: 0 0 20px; }
    a { display: inline-block; background: #d97706; color: #000; font-weight: bold; padding: 12px 24px; border-radius: 12px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${poster}" alt="${title}" />
    <h1>${title} (${year})</h1>
    <p>${ogDesc}</p>
    <a href="${canonicalUrl}">Assistir no Nostalgiando</a>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("Erro no interceptor de crawlers:", err);
    return null;
  }
}

