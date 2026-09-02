export interface WatchHistoryItem {
  showSlug: string;
  showTitle: string;
  showPoster: string;
  episodeId: string;
  episodeIndex: number;
  episodeTitle: string;
  timestamp: number; // segundos no vídeo
  duration: number; // duração total em segundos
  progressPercent: number;
  watchedAt: string; // ISO string
}

const getStorageKey = (userId?: string | null) => {
  return userId ? `nostalgiando_history_${userId}` : "nostalgiando_history_guest";
};

const getWatchedKey = (userId?: string | null) => {
  return userId ? `nostalgiando_watched_episodes_${userId}` : "nostalgiando_watched_episodes_guest";
};

export const saveWatchProgress = (
  userId: string | null | undefined,
  data: {
    showSlug: string;
    showTitle: string;
    showPoster: string;
    episodeId: string;
    episodeIndex: number;
    episodeTitle: string;
    timestamp?: number;
    duration?: number;
  }
) => {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(userId);
    const existing = localStorage.getItem(key);
    let history: WatchHistoryItem[] = existing ? JSON.parse(existing) : [];

    const duration = data.duration || 1200; // default 20m se não fornecido
    const timestamp = data.timestamp || 10;
    const progressPercent = Math.min(100, Math.round((timestamp / duration) * 100));

    // Remove item anterior do mesmo show se já existir para colocar no topo
    history = history.filter((item) => item.showSlug !== data.showSlug);

    const newItem: WatchHistoryItem = {
      showSlug: data.showSlug,
      showTitle: data.showTitle,
      showPoster: data.showPoster,
      episodeId: data.episodeId,
      episodeIndex: data.episodeIndex,
      episodeTitle: data.episodeTitle,
      timestamp,
      duration,
      progressPercent,
      watchedAt: new Date().toISOString(),
    };

    history.unshift(newItem);

    // Mantém no máximo os 20 últimos títulos
    if (history.length > 20) {
      history = history.slice(0, 20);
    }

    localStorage.setItem(key, JSON.stringify(history));

    // Marca episódio como assistido
    markEpisodeWatched(userId, data.showSlug, data.episodeId);

    window.dispatchEvent(new CustomEvent("watch_history_updated", { detail: history }));
  } catch (err) {
    console.error("Erro ao salvar histórico de visualização:", err);
  }
};

export const getWatchHistory = (userId?: string | null): WatchHistoryItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = getStorageKey(userId);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const markEpisodeWatched = (
  userId: string | null | undefined,
  showSlug: string,
  episodeId: string
) => {
  if (typeof window === "undefined") return;
  try {
    const key = getWatchedKey(userId);
    const saved = localStorage.getItem(key);
    const watchedMap: Record<string, string[]> = saved ? JSON.parse(saved) : {};

    const list = watchedMap[showSlug] || [];
    if (!list.includes(episodeId)) {
      list.push(episodeId);
      watchedMap[showSlug] = list;
      localStorage.setItem(key, JSON.stringify(watchedMap));
    }
  } catch (err) {
    console.error("Erro ao marcar episódio assistido:", err);
  }
};

export const getWatchedEpisodes = (
  userId: string | null | undefined,
  showSlug: string
): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = getWatchedKey(userId);
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const watchedMap: Record<string, string[]> = JSON.parse(saved);
    return watchedMap[showSlug] || [];
  } catch {
    return [];
  }
};

export const getLastWatchedEpisodeIndex = (
  userId: string | null | undefined,
  showSlug: string
): number | null => {
  const history = getWatchHistory(userId);
  const found = history.find((h) => h.showSlug === showSlug);
  return found ? found.episodeIndex : null;
};
