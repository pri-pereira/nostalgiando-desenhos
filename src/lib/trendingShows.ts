import type { Show } from "@/data/shows";

export interface TrendingShowItem {
  show: Show;
  rank: number;
  badge: string;
  isNew: boolean;
  viewsCount: number;
}

const VIEWS_STORAGE_KEY = "nostalgiando_weekly_views";

// Retorna a chave da semana atual no formato "YYYY-WW" (ex: "2026-W36")
export const getCurrentWeekKey = (): string => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
};

// Incrementa a contagem de visualizações de um título na semana atual
export const trackShowView = (slug: string) => {
  if (typeof window === "undefined" || !slug) return;

  try {
    const weekKey = getCurrentWeekKey();
    const raw = localStorage.getItem(VIEWS_STORAGE_KEY);
    const data: Record<string, Record<string, number>> = raw ? JSON.parse(raw) : {};

    if (!data[weekKey]) {
      data[weekKey] = {};
    }

    data[weekKey][slug] = (data[weekKey][slug] || 0) + 1;

    // Remove semanas muito antigas (mantém apenas as últimas 4 semanas)
    const weekKeys = Object.keys(data);
    if (weekKeys.length > 4) {
      const sortedKeys = weekKeys.sort();
      while (sortedKeys.length > 4) {
        const oldest = sortedKeys.shift();
        if (oldest) delete data[oldest];
      }
    }

    localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("views_updated", { detail: data[weekKey] }));
  } catch (err) {
    console.error("Erro ao registrar visualização:", err);
  }
};

// Retorna o mapa de visualizações da semana atual
export const getWeeklyViewsMap = (): Record<string, number> => {
  if (typeof window === "undefined") return {};
  try {
    const weekKey = getCurrentWeekKey();
    const raw = localStorage.getItem(VIEWS_STORAGE_KEY);
    if (!raw) return {};
    const data: Record<string, Record<string, number>> = JSON.parse(raw);
    return data[weekKey] || {};
  } catch {
    return {};
  }
};

// Seleciona e ordena os Top 4 títulos da semana para exibição no Hero
export const getWeeklyTopShows = (allShows: Show[]): TrendingShowItem[] => {
  if (!allShows || allShows.length === 0) return [];

  const viewsMap = getWeeklyViewsMap();

  // Atribui pontuação calculada baseada em visualizações + bônus para clássicos e novidades
  const scoredShows = allShows.map((show, index) => {
    const realViews = viewsMap[show.slug] || 0;
    
    // Títulos de destaque padrão recebem uma base de views se ainda não houver dados
    let baseViews = 0;
    if (show.slug === "caverna-do-dragao" || show.slug === "caverna-do-dragao_202508") baseViews = 450;
    else if (show.slug === "corrida-maluca" || show.slug === "corrida-malucadublado") baseViews = 380;
    else if (show.slug === "jiraiya") baseViews = 310;
    else if (show.slug === "pica-pau") baseViews = 270;
    else if (show.slug === "thunder-cats" || show.slug === "thundercats") baseViews = 240;
    else if (show.slug === "tom-e-jerry") baseViews = 210;

    // Se o desenho foi adicionado recentemente pelo admin (está no início da lista)
    const isNew = index === 0 && show.slug !== "caverna-do-dragao";
    const bonusNew = isNew ? 350 : 0;

    const totalViews = realViews + baseViews + bonusNew;

    return {
      show,
      realViews,
      totalViews,
      isNew,
    };
  });

  // Ordena pelos mais assistidos
  scoredShows.sort((a, b) => b.totalViews - a.totalViews);

  // Seleciona os 4 primeiros colocados
  const top4 = scoredShows.slice(0, 4);

  return top4.map((item, idx) => {
    const rank = idx + 1;
    let badge = `🔥 #${rank} Mais Assistido da Semana`;
    if (item.isNew) {
      badge = `✨ Novidade em Alta na Semana`;
    } else if (rank === 1) {
      badge = `👑 #1 Mais Assistido da Semana`;
    }

    return {
      show: item.show,
      rank,
      badge,
      isNew: item.isNew,
      viewsCount: item.totalViews,
    };
  });
};
