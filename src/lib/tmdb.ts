/**
 * Serviço de Integração com The Movie Database (TMDB)
 * Permite buscar metadados, capas HD (w780) e backdrops (w1280) para desenhos clássicos.
 */

export interface TmdbResult {
  id: number;
  mediaType: "tv" | "movie";
  title: string;
  originalTitle?: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  year: string;
  voteAverage: number;
  rawPosterPath?: string;
}

const TMDB_STORAGE_KEY = "nostalgiando_tmdb_api_key";

/**
 * Obtém a chave de API do TMDB configurada no .env ou no LocalStorage
 */
export function getStoredTmdbKey(): string {
  const envKey = (import.meta.env.VITE_TMDB_API_KEY || "").trim();
  if (envKey) return envKey;

  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(TMDB_STORAGE_KEY) || sessionStorage.getItem(TMDB_STORAGE_KEY);
      if (saved) return saved.trim();
    } catch {}
  }
  return "";
}

/**
 * Salva chave de API temporária ou fixa informada pelo administrador
 */
export function setStoredTmdbKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (key.trim()) {
      localStorage.setItem(TMDB_STORAGE_KEY, key.trim());
      sessionStorage.setItem(TMDB_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(TMDB_STORAGE_KEY);
      sessionStorage.removeItem(TMDB_STORAGE_KEY);
    }
  } catch {}
}

/**
 * Identifica se a URL da capa é frágil, instável ou de baixa resolução
 * (Mercado Livre, gstatic, eBay, wikia, placeholders)
 */
export function isFragilePoster(url: string | undefined | null): boolean {
  if (!url || !url.trim()) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("mlstatic.com") ||
    lower.includes("mlcdn.com.br") ||
    lower.includes("mercadolivre") ||
    lower.includes("ebayimg.com") ||
    lower.includes("ebay.com") ||
    lower.includes("encrypted-tbn0.gstatic.com") ||
    lower.includes("wikia.nocookie.net") ||
    lower.includes("fandom.com") ||
    lower.includes("placeholder.com") ||
    lower.includes("via.placeholder") ||
    lower.includes("googleusercontent.com") ||
    lower.includes("bp.blogspot.com")
  );
}

/**
 * Limpa termos comuns que prejudicam a busca no TMDB
 */
export function cleanTitleForTmdb(title: string): string {
  if (!title) return "";
  let clean = title
    .replace(/\s*\([^)]*\)/g, "") // remove parenteses ex: (1986), (Dublado)
    .replace(/\b(dublado|completo|hd|serie classica|desenho|classico|desenhos|anos \d\d)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean || title.trim();
}

/**
 * Realiza busca multi (TV + Filmes) no TMDB em idioma pt-BR
 */
export async function searchTmdb(query: string, customApiKey?: string): Promise<TmdbResult[]> {
  const apiKey = (customApiKey || getStoredTmdbKey()).trim();
  if (!apiKey) {
    throw new Error("Chave de API do TMDB não configurada. Informe uma chave válida no painel.");
  }

  const cleanQuery = cleanTitleForTmdb(query);
  if (!cleanQuery) return [];

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(cleanQuery)}&language=pt-BR&page=1&include_adult=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Chave de API do TMDB inválida ou não autorizada.");
      }
      throw new Error(`Erro na API do TMDB (Status ${res.status})`);
    }

    const data = await res.json();
    const results: any[] = Array.isArray(data?.results) ? data.results : [];

    const parsed: TmdbResult[] = [];

    for (const item of results) {
      if (item.media_type !== "tv" && item.media_type !== "movie") continue;

      const title = item.name || item.title || item.original_name || item.original_title || "";
      const originalTitle = item.original_name || item.original_title;
      const dateStr = item.first_air_date || item.release_date || "";
      const yearMatch = dateStr.match(/\b(19\d\d|20\d\d)\b/);
      const year = yearMatch ? yearMatch[1] : "";

      const posterUrl = item.poster_path
        ? `https://image.tmdb.org/t/p/w780${item.poster_path}`
        : null;

      const backdropUrl = item.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
        : null;

      parsed.push({
        id: item.id,
        mediaType: item.media_type,
        title,
        originalTitle,
        overview: item.overview || "",
        posterUrl,
        backdropUrl,
        year,
        voteAverage: typeof item.vote_average === "number" ? Math.round(item.vote_average * 10) / 10 : 0,
        rawPosterPath: item.poster_path || undefined,
      });
    }

    return parsed;
  } catch (err: any) {
    console.error("Erro na busca TMDB:", err);
    throw err;
  }
}

/**
 * Busca automática do melhor resultado no TMDB para um determinado desenho
 */
export async function findBestTmdbMatch(
  title: string,
  year?: string,
  customApiKey?: string
): Promise<TmdbResult | null> {
  try {
    const results = await searchTmdb(title, customApiKey);
    if (!results || results.length === 0) return null;

    // Se temos um ano numérico de referência, prioriza resultado com mesmo ano
    if (year && /\b(19\d\d|20\d\d)\b/.test(year)) {
      const targetYear = year.match(/\b(19\d\d|20\d\d)\b/)![1];
      const exactYearMatch = results.find(
        (r) => r.year === targetYear && Boolean(r.posterUrl)
      );
      if (exactYearMatch) return exactYearMatch;
    }

    // Prioriza o primeiro resultado que possua pôster
    const withPoster = results.find((r) => Boolean(r.posterUrl));
    return withPoster || results[0] || null;
  } catch {
    return null;
  }
}

