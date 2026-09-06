import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Tv,
  Film,
  Sparkles,
  Layers,
  Sword,
  Shield,
  Smile,
  Play,
} from "lucide-react";
import { CATEGORIES, getCachedShows, getAllShows, type Show, type CategoryId } from "@/data/shows";

interface CategoriesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentShowSlug?: string;
}

// Mapeamento de ícones temáticos para cada categoria
const CATEGORY_ICONS: Record<string, any> = {
  catalogo: Film,
  "classicos-tv-aberta": Tv,
  tokusatsu: Shield,
  "bau-hanna-barbera": Smile,
  "aventura-fantasia": Sword,
  todos: Layers,
};

export function CategoriesSidebar({ isOpen, onClose, currentShowSlug }: CategoriesSidebarProps) {
  const [shows, setShows] = useState<Show[]>(() => getCachedShows());
  const [searchTerm, setSearchTerm] = useState("");
  // Categoria expandida inicialmente (padrão a primeira com desenhos ou catalogo)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string>("catalogo");

  useEffect(() => {
    let isMounted = true;
    getAllShows().then((data) => {
      if (isMounted && data && data.length > 0) {
        setShows(data);
      }
    });

    const handleUpdate = (e: any) => {
      if (isMounted) {
        setShows(e?.detail && Array.isArray(e.detail) ? e.detail : getCachedShows());
      }
    };

    window.addEventListener("catalog_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("catalog_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lista de categorias filtradas (sem "todos" repetitivo)
  const displayCategories = useMemo(() => {
    return CATEGORIES.filter((c) => c.id !== "todos");
  }, []);

  // Agrupa os desenhos ordenados ALFABETICAMENTE dentro de cada categoria
  const categorizedShows = useMemo(() => {
    const map: Record<string, Show[]> = {};

    displayCategories.forEach((cat) => {
      let filtered =
        cat.id === "catalogo"
          ? [...shows]
          : shows.filter((s) => s.category === cat.id);

      // Aplica busca se houver
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.synopsis.toLowerCase().includes(q) ||
            (s.year && s.year.includes(q))
        );
      }

      // CLASSIFICAÇÃO RIGOROSA POR ORDEM ALFABÉTICA (A a Z)
      filtered.sort((a, b) =>
        a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" })
      );

      map[cat.id] = filtered;
    });

    return map;
  }, [shows, displayCategories, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Overlay escuro de fundo */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Lateral Esquerda */}
      <aside className="relative z-10 flex h-full w-full max-w-xs sm:max-w-md flex-col border-r border-white/10 bg-[#0d0c13]/95 backdrop-blur-2xl text-foreground shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-left duration-300">
        {/* Cabeçalho da Barra Lateral */}
        <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground shadow-[0_0_15px_rgba(217,119,6,0.35)]">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Categorias</h2>
              <p className="text-xs text-muted-foreground">Desenhos de A a Z por categoria</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-all cursor-pointer"
            title="Fechar menu lateral"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de Pesquisa Rápida no Menu Lateral */}
        <div className="p-3 sm:p-4 border-b border-white/5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar título nesta lista..."
              className="w-full h-10 rounded-xl border border-white/10 bg-secondary/30 pl-10 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Lista de Categorias e Desenhos em Ordem Alfabética */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 [scrollbar-width:thin]">
          {displayCategories.map((category) => {
            const categoryShows = categorizedShows[category.id] || [];
            const isExpanded = expandedCategoryId === category.id || searchTerm.trim().length > 0;
            const IconComponent = CATEGORY_ICONS[category.id] || Tv;

            return (
              <div
                key={category.id}
                className="rounded-2xl border border-white/5 bg-secondary/20 overflow-hidden transition-all"
              >
                {/* Cabeçalho da Categoria (Accordion) */}
                <button
                  onClick={() =>
                    setExpandedCategoryId(isExpanded && !searchTerm ? "" : category.id)
                  }
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-secondary/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground truncate">
                        {category.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {categoryShows.length} {categoryShows.length === 1 ? "desenho" : "desenhos"} (A-Z)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      {categoryShows.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Lista de Desenhos em Ordem Alfabética da Categoria */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/20 p-2 space-y-1.5 animate-in fade-in duration-200">
                    {categoryShows.length > 0 ? (
                      categoryShows.map((s, idx) => {
                        const isCurrent = currentShowSlug === s.slug;
                        const initialLetter = s.title.charAt(0).toUpperCase();

                        return (
                          <Link
                            key={s.slug}
                            to="/assistir/$slug"
                            params={{ slug: s.slug }}
                            onClick={onClose}
                            className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                              isCurrent
                                ? "bg-primary/20 border border-primary/40 text-primary shadow-sm"
                                : "hover:bg-secondary/50 text-foreground/90 hover:text-foreground"
                            }`}
                          >
                            {/* Poster miniatura */}
                            <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-black border border-white/10">
                              <img
                                src={s.poster}
                                alt={s.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-black text-center text-primary leading-tight py-0.5">
                                {initialLetter}
                              </span>
                            </div>

                            {/* Detalhes do Desenho */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm truncate">
                                  {s.title}
                                </span>
                                {isCurrent && (
                                  <span className="shrink-0 text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.2 rounded border border-primary/30">
                                    Assistindo
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                {s.year && <span>{s.year}</span>}
                                <span>•</span>
                                <span className="truncate">Ordem: #{idx + 1}</span>
                              </div>
                            </div>

                            <Play className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </Link>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Nenhum desenho encontrado nesta categoria.
                      </div>
                    )}

                    <div className="pt-2 pb-1 text-center">
                      <Link
                        to="/categoria/$id"
                        params={{ id: category.id }}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline py-1 px-3"
                      >
                        Ver grade completa de {category.shortLabel} →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rodapé da Barra Lateral */}
        <div className="border-t border-white/10 p-3 sm:p-4 bg-secondary/10">
          <Link
            to="/categoria/$id"
            params={{ id: "catalogo" }}
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-amber-600 text-primary-foreground text-xs sm:text-sm font-bold shadow-md hover:opacity-95 transition-all"
          >
            <Film className="h-4 w-4" />
            Explorar Todo o Catálogo (Grade)
          </Link>
        </div>
      </aside>
    </div>
  );
}
