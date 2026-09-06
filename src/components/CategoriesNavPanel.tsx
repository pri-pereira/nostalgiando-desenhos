import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Layers,
  Search,
  ChevronDown,
  ChevronRight,
  Tv,
  Film,
  Shield,
  Smile,
  Sword,
  Play,
  Clock,
  Sparkles,
} from "lucide-react";
import { CATEGORIES, type Show } from "@/data/shows";
import { formatTime, type WatchHistoryItem } from "@/lib/watchHistory";

interface CategoriesNavPanelProps {
  currentShowSlug?: string;
  allShows: Show[];
  watchHistory?: WatchHistoryItem[];
  className?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  catalogo: Film,
  "classicos-tv-aberta": Tv,
  tokusatsu: Shield,
  "bau-hanna-barbera": Smile,
  "aventura-fantasia": Sword,
  todos: Layers,
};

export function CategoriesNavPanel({
  currentShowSlug,
  allShows,
  watchHistory = [],
  className = "",
}: CategoriesNavPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  // Categoria atual do show ou padrão 'catalogo'
  const currentShow = useMemo(() => {
    return allShows.find((s) => s.slug === currentShowSlug);
  }, [allShows, currentShowSlug]);

  const [expandedCat, setExpandedCat] = useState<string>(
    () => currentShow?.category || "catalogo"
  );

  const displayCategories = useMemo(() => {
    return CATEGORIES.filter((c) => c.id !== "todos");
  }, []);

  // Cria mapa de onde o usuário parou em cada desenho
  const lastWatchedMap = useMemo(() => {
    const map: Record<string, WatchHistoryItem> = {};
    watchHistory.forEach((h) => {
      if (!map[h.showSlug]) {
        map[h.showSlug] = h;
      }
    });
    return map;
  }, [watchHistory]);

  // Agrupa e ordena ALFABETICAMENTE dentro de cada categoria
  const categorizedShows = useMemo(() => {
    const map: Record<string, Show[]> = {};

    displayCategories.forEach((cat) => {
      let list =
        cat.id === "catalogo"
          ? [...allShows]
          : allShows.filter((s) => s.category === cat.id);

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        list = list.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.synopsis.toLowerCase().includes(q) ||
            (s.year && s.year.includes(q))
        );
      }

      // CLASSIFICAÇÃO RIGOROSA POR ORDEM ALFABÉTICA (A a Z)
      list.sort((a, b) =>
        a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" })
      );

      map[cat.id] = list;
    });

    return map;
  }, [allShows, displayCategories, searchTerm]);

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-card/90 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col ${className}`}
    >
      {/* Cabeçalho do Painel Lateral de Categorias */}
      <div className="p-4 border-b border-white/10 bg-secondary/30">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/25 shadow-sm">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-foreground leading-tight">
              Categorias do Acervo
            </h3>
            <p className="text-[11px] text-muted-foreground">Desenhos em ordem alfabética (A-Z)</p>
          </div>
        </div>

        {/* Busca rápida de títulos na barra lateral */}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome do desenho..."
            className="w-full h-9 rounded-xl border border-white/10 bg-secondary/40 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista de Categorias com Acordeão e Desenhos A-Z */}
      <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] [scrollbar-width:thin]">
        {displayCategories.map((category) => {
          const showsInCat = categorizedShows[category.id] || [];
          const isExpanded = expandedCat === category.id || searchTerm.trim().length > 0;
          const IconComp = CATEGORY_ICONS[category.id] || Tv;

          return (
            <div
              key={category.id}
              className="rounded-2xl border border-white/5 bg-secondary/20 overflow-hidden transition-all"
            >
              {/* Botão da Categoria */}
              <button
                onClick={() =>
                  setExpandedCat(isExpanded && !searchTerm ? "" : category.id)
                }
                className={`w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer ${
                  isExpanded ? "bg-secondary/40" : "hover:bg-secondary/30"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <IconComp className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-foreground truncate">
                      {category.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {showsInCat.length} títulos (A-Z)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.2 rounded-full border border-primary/20">
                    {showsInCat.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Lista dos Desenhos da Categoria Ordenados de A a Z */}
              {isExpanded && (
                <div className="border-t border-white/5 bg-black/30 p-1.5 space-y-1 animate-in fade-in duration-200">
                  {showsInCat.length > 0 ? (
                    showsInCat.map((s, idx) => {
                      const isCurrent = currentShowSlug === s.slug;
                      const initial = s.title.charAt(0).toUpperCase();
                      const lastWatched = lastWatchedMap[s.slug];

                      return (
                        <Link
                          key={s.slug}
                          to="/assistir/$slug"
                          params={{ slug: s.slug }}
                          className={`flex items-center gap-2.5 p-1.5 rounded-xl transition-all ${
                            isCurrent
                              ? "bg-primary/20 border border-primary/40 text-primary shadow-sm"
                              : "hover:bg-secondary/60 text-foreground/90 hover:text-foreground"
                          }`}
                        >
                          {/* Miniatura do pôster com letra inicial */}
                          <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded-md bg-black border border-white/10">
                            <img
                              src={s.poster}
                              alt={s.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-black text-center text-primary leading-none py-0.5">
                              {initial}
                            </span>
                          </div>

                          {/* Detalhes do Desenho */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs truncate">{s.title}</span>
                              {isCurrent && (
                                <span className="shrink-0 text-[9px] font-black uppercase text-primary bg-primary/20 px-1 rounded border border-primary/30">
                                  Assistindo
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                              {s.year && <span>{s.year}</span>}
                              {lastWatched ? (
                                <span className="text-amber-400 font-semibold truncate">
                                  • Ep. {lastWatched.episodeIndex + 1}
                                  {lastWatched.timestamp > 5 ? ` (${formatTime(lastWatched.timestamp)})` : ""}
                                </span>
                              ) : (
                                <span>• #{idx + 1}</span>
                              )}
                            </div>
                          </div>

                          <Play className="h-3 w-3 text-muted-foreground shrink-0" />

                          {/* Mini barra de progresso no card do desenho */}
                          {lastWatched && lastWatched.progressPercent > 3 && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-amber-500"
                                style={{ width: `${Math.min(100, lastWatched.progressPercent)}%` }}
                              />
                            </div>
                          )}
                        </Link>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      Nenhum desenho encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
