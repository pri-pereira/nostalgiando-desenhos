import type { Show, Episode, CategoryId } from "@/data/shows";

/**
 * Palavras que devem permanecer em minúsculo no Title Case em Português
 * (a não ser que sejam a primeira palavra da frase).
 */
const LOWERCASE_WORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "na",
  "no",
  "nas",
  "nos",
  "com",
  "por",
  "para",
  "a",
  "o",
  "as",
  "os",
  "um",
  "uma",
]);

/**
 * Mapeamento e preservação de grafias consagradas de clássicos retrô
 */
const KNOWN_TITLE_FIXES: Record<string, string> = {
  "toro e pancho": "Toro e Pancho",
  "as aventuras de jack chan": "As Aventuras de Jackie Chan",
  "as aventuras de jackie chan": "As Aventuras de Jackie Chan",
  "super mario bros super": "Super Mario Bros.",
  "super mario bros": "Super Mario Bros.",
  "super mário bros": "Super Mario Bros.",
  "caverna do dragao": "Caverna do Dragão",
  "he-man": "He-Man e os Mestres do Universo",
  "he man": "He-Man e os Mestres do Universo",
  "thundercats": "ThunderCats",
  "thundarr": "Thundarr, o Bárbaro",
  "x-men": "X-Men: A Série Animada",
  "x men": "X-Men: A Série Animada",
  "yu yu hakusho": "Yu Yu Hakusho",
  "dragon ball z": "Dragon Ball Z",
  "cavaleiros do zodiaco": "Os Cavaleiros do Zodíaco",
  "os cavaleiros do zodiaco": "Os Cavaleiros do Zodíaco",
  "corrida maluca": "Corrida Maluca",
  "ze colmeia": "Zé Colmeia",
  "pica pau": "Pica-Pau",
  "pica-pau": "Pica-Pau",
};

/**
 * Formata um título em Title Case preservando regras de português e siglas
 */
export function normalizeTitle(rawTitle: string): string {
  if (!rawTitle) return "";
  const trimmed = rawTitle.trim();

  // Verifica se existe substituição direta conhecida
  const lowerKey = trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim();

  if (KNOWN_TITLE_FIXES[lowerKey]) {
    return KNOWN_TITLE_FIXES[lowerKey];
  }

  // Se o título estiver todo em caixa alta (ex: "TORO E PANCHO") ou minúscula
  const words = trimmed.split(/\s+/);
  const normalizedWords = words.map((word, index) => {
    // Casos com hífen como X-Men, He-Man, Pica-Pau
    if (word.includes("-")) {
      return word
        .split("-")
        .map((part) => {
          if (part.toLowerCase() === "x") return "X";
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join("-");
    }

    const lowerWord = word.toLowerCase();

    // Primeira palavra sempre começa maiúscula
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    // Se for preposição/conjunção, mantém em minúsculo
    if (LOWERCASE_WORDS.has(lowerWord)) {
      return lowerWord;
    }

    // Siglas e números romanos (ex: TV, II, III, IV, Z)
    if (/^(tv|ii|iii|iv|vi|vii|viii|ix|x|z)$/i.test(word)) {
      return word.toUpperCase();
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return normalizedWords.join(" ");
}

/**
 * Normaliza um slug para formato seguro (lowercase, kebab-case)
 */
export function normalizeSlug(rawSlug: string): string {
  if (!rawSlug) return "";
  return rawSlug
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9-]/g, "-") // substitui caracteres não alfanuméricos por -
    .replace(/-+/g, "-") // remove hífens duplicados
    .replace(/^-|-$/g, ""); // remove hífens nas extremidades
}

export type DecadeCategory = "anos-50-60" | "anos-70" | "anos-80" | "anos-90-2000" | "classicos";

export interface NormalizedYearInfo {
  displayYear: string;
  numericYear: number | null;
  decade: DecadeCategory;
  decadeLabel: string;
}

/**
 * Extrai o primeiro ano válido de 4 dígitos e categoriza em sua respectiva década
 */
export function normalizeYear(rawYear: string | number | undefined | null): NormalizedYearInfo {
  if (!rawYear) {
    return {
      displayYear: "Clássico",
      numericYear: null,
      decade: "classicos",
      decadeLabel: "Clássicos Retrô",
    };
  }

  const str = String(rawYear).trim();
  const match = str.match(/(19\d\d|20\d\d)/);

  if (match) {
    const yearNum = parseInt(match[1], 10);
    let decade: DecadeCategory = "classicos";
    let decadeLabel = "Clássicos Retrô";

    if (yearNum >= 1950 && yearNum <= 1969) {
      decade = "anos-50-60";
      decadeLabel = "Anos 50 & 60";
    } else if (yearNum >= 1970 && yearNum <= 1979) {
      decade = "anos-70";
      decadeLabel = "Anos 70";
    } else if (yearNum >= 1980 && yearNum <= 1989) {
      decade = "anos-80";
      decadeLabel = "Anos 80";
    } else if (yearNum >= 1990 && yearNum <= 2009) {
      decade = "anos-90-2000";
      decadeLabel = "Anos 90 & 2000";
    }

    return {
      displayYear: String(yearNum),
      numericYear: yearNum,
      decade,
      decadeLabel,
    };
  }

  return {
    displayYear: "Clássico",
    numericYear: null,
    decade: "classicos",
    decadeLabel: "Clássicos Retrô",
  };
}

/**
 * Normaliza um objeto Show completo com fallbacks robustos
 */
export function normalizeShow(raw: any): Show {
  const title = normalizeTitle(raw?.title || "");
  const slug = raw?.slug ? String(raw.slug).trim() : normalizeSlug(title);
  const yearInfo = normalizeYear(raw?.year);

  // Garantir array de episódios válido
  const episodes: Episode[] = Array.isArray(raw?.episodes)
    ? raw.episodes.map((ep: any, idx: number) => ({
        id: ep?.id || `ep-${idx + 1}`,
        number: typeof ep?.number === "number" ? ep.number : idx + 1,
        title: ep?.title ? normalizeTitle(ep.title) : `Episódio ${idx + 1}`,
        duration: ep?.duration || "22 min",
        synopsis: ep?.synopsis || "",
        thumbnail: ep?.thumbnail || undefined,
        videoUrl: ep?.videoUrl || "",
      }))
    : [];

  return {
    slug,
    title,
    year: yearInfo.displayYear,
    category: (raw?.category as CategoryId) || "catalogo",
    poster: raw?.poster || "",
    synopsis: raw?.synopsis || "",
    archiveId: raw?.archiveId || undefined,
    episodes,
    // Preserva timestamps para ordenações se existirem
    ...(raw?.createdAt ? { createdAt: raw.createdAt } : {}),
    ...(raw?.updatedAt ? { updatedAt: raw.updatedAt } : {}),
  } as Show;
}

/**
 * Deduplica títulos em memória agrupando por nome canônico normalizado
 */
export function deduplicateShows(shows: Show[]): Show[] {
  const map = new Map<string, Show>();

  for (const show of shows) {
    const key = show.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

    if (!map.has(key)) {
      map.set(key, show);
    } else {
      const existing = map.get(key)!;
      // Dá preferência ao show com mais episódios ou mais dados
      const existingEps = existing.episodes?.length || 0;
      const currentEps = show.episodes?.length || 0;
      if (currentEps > existingEps) {
        map.set(key, show);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Normaliza e deduplica uma lista completa de títulos
 */
export function normalizeCatalogList(rawShows: any[]): Show[] {
  if (!Array.isArray(rawShows)) return [];
  const normalized = rawShows.map(normalizeShow);
  return deduplicateShows(normalized);
}

/**
 * Ordena a lista de shows por adicionados recentemente de forma real
 * (evitando a ordenação reversa alfabética de Z a A).
 */
export function sortRecentlyAdded(shows: Show[]): Show[] {
  return [...shows].sort((a, b) => {
    const timeA =
      (a as any).createdAt ? new Date((a as any).createdAt).getTime() :
      (a as any).updatedAt ? new Date((a as any).updatedAt).getTime() : 0;
    
    const timeB =
      (b as any).createdAt ? new Date((b as any).createdAt).getTime() :
      (b as any).updatedAt ? new Date((b as any).updatedAt).getTime() : 0;

    if (timeA > 0 && timeB > 0 && timeA !== timeB) {
      return timeB - timeA;
    }
    if (timeB > 0 && timeA === 0) return 1;
    if (timeA > 0 && timeB === 0) return -1;

    // Fallback: títulos que possuem episódios mais recentes
    return 0;
  });
}

