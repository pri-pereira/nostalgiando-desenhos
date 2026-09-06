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

export interface EpisodeProgress {
  episodeId: string;
  episodeIndex: number;
  timestamp: number; // segundos no vídeo
  duration: number; // duração total em segundos
  progressPercent: number;
  updatedAt: string;
}

const getStorageKey = (userId?: string | null) => {
  return userId ? `nostalgiando_history_${userId}` : "nostalgiando_history_guest";
};

const getWatchedKey = (userId?: string | null) => {
  return userId ? `nostalgiando_watched_episodes_${userId}` : "nostalgiando_watched_episodes_guest";
};

const getEpProgressKey = (userId?: string | null) => {
  return userId ? `nostalgiando_ep_progress_${userId}` : "nostalgiando_ep_progress_guest";
};

/**
 * Formata segundos no formato MM:SS ou HH:MM:SS estilo Netflix
 */
export const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
  const sec = Math.floor(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

/**
 * Salva o ponto exato onde o usuário parou em um episódio (segundos e duração)
 */
export const saveEpisodeProgress = (
  userId: string | null | undefined,
  showSlug: string,
  episodeId: string,
  episodeIndex: number,
  timestamp: number,
  duration: number
) => {
  if (typeof window === "undefined" || !showSlug || !episodeId) return;

  try {
    const key = getEpProgressKey(userId);
    const existing = localStorage.getItem(key);
    const allProgress: Record<string, Record<string, EpisodeProgress>> = existing
      ? JSON.parse(existing)
      : {};

    if (!allProgress[showSlug]) {
      allProgress[showSlug] = {};
    }

    const safeDuration = duration > 0 ? duration : 1200;
    const safeTimestamp = Math.max(0, Math.floor(timestamp));
    const progressPercent = Math.min(
      100,
      Math.max(0, Math.round((safeTimestamp / safeDuration) * 100))
    );

    const epProgress: EpisodeProgress = {
      episodeId,
      episodeIndex,
      timestamp: safeTimestamp,
      duration: safeDuration,
      progressPercent,
      updatedAt: new Date().toISOString(),
    };

    allProgress[showSlug][episodeId] = epProgress;
    localStorage.setItem(key, JSON.stringify(allProgress));

    // Se assistiu mais de 90%, marca como assistido
    if (progressPercent >= 90) {
      markEpisodeWatched(userId, showSlug, episodeId);
    }

    window.dispatchEvent(
      new CustomEvent("episode_progress_updated", {
        detail: { showSlug, episodeId, progress: epProgress },
      })
    );
  } catch (err) {
    console.error("Erro ao salvar progresso do episódio:", err);
  }
};

/**
 * Obtém o progresso exato de um episódio específico
 */
export const getEpisodeProgress = (
  userId: string | null | undefined,
  showSlug: string,
  episodeId: string
): EpisodeProgress | null => {
  if (typeof window === "undefined" || !showSlug || !episodeId) return null;
  try {
    const key = getEpProgressKey(userId);
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    const allProgress: Record<string, Record<string, EpisodeProgress>> = JSON.parse(saved);
    return allProgress[showSlug]?.[episodeId] || null;
  } catch {
    return null;
  }
};

/**
 * Obtém todos os progressos salvos de episódios para um título
 */
export const getAllEpisodesProgressForShow = (
  userId: string | null | undefined,
  showSlug: string
): Record<string, EpisodeProgress> => {
  if (typeof window === "undefined" || !showSlug) return {};
  try {
    const key = getEpProgressKey(userId);
    const saved = localStorage.getItem(key);
    if (!saved) return {};
    const allProgress: Record<string, Record<string, EpisodeProgress>> = JSON.parse(saved);
    return allProgress[showSlug] || {};
  } catch {
    return {};
  }
};

/**
 * Reinicia o progresso de um episódio (voltar ao início 00:00)
 */
export const resetEpisodeProgress = (
  userId: string | null | undefined,
  showSlug: string,
  episodeId: string
) => {
  if (typeof window === "undefined" || !showSlug || !episodeId) return;
  try {
    const key = getEpProgressKey(userId);
    const saved = localStorage.getItem(key);
    if (!saved) return;
    const allProgress: Record<string, Record<string, EpisodeProgress>> = JSON.parse(saved);
    if (allProgress[showSlug] && allProgress[showSlug][episodeId]) {
      allProgress[showSlug][episodeId].timestamp = 0;
      allProgress[showSlug][episodeId].progressPercent = 0;
      localStorage.setItem(key, JSON.stringify(allProgress));
    }
  } catch (err) {
    console.error("Erro ao resetar progresso:", err);
  }
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

    const duration = data.duration && data.duration > 0 ? data.duration : 1200;
    const timestamp = typeof data.timestamp === "number" ? Math.max(0, data.timestamp) : 0;
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

    // Também atualiza o progresso granular do episódio
    saveEpisodeProgress(
      userId,
      data.showSlug,
      data.episodeId,
      data.episodeIndex,
      timestamp,
      duration
    );

    // Se completou mais de 85%, marca como assistido
    if (progressPercent >= 85) {
      markEpisodeWatched(userId, data.showSlug, data.episodeId);
    }

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
