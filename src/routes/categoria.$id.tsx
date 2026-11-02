import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Film,
  Sparkles,
  Tv,
  Filter,
  Layers,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PosterCard } from "@/components/PosterCard";
import { CATEGORIES, getAllShows, getCachedShows, type Show, type CategoryId } from "@/data/shows";
import { sortRecentlyAdded, normalizeCatalogList } from "@/lib/normalizeCatalog";

export const Route = createFileRoute("/categoria/$id")({
  head: ({ params }) => {
    const category = CATEGORIES.find((c) => c.id === params.id) || {
      label: "Catálogo",
      description: "Desenhos e clássicos retrô",
    };
    return {
      meta: [
        { title: `${category.label} — Nostalgiando Desenhos` },
        { name: "description", content: category.description || "Catálogo de desenhos clássicos." },
      ],
    };
  },
  component: CategoriaView,
});

const PAGE_SIZE = 24;

function CategoriaView() {
  const { id: currentCategoryParam } = useParams({ from: "/categoria/$id" });
  const [activeCategoryId, setActiveCategoryId] = useState<string>(currentCategoryParam || "catalogo");
  const [shows, setShows] = useState<Show[]>(() => getCachedShows());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"az" | "recent">("az");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  useEffect(() => {
    setActiveCategoryId(currentCategoryParam || "catalogo");
    setVisibleCount(PAGE_SIZE);
  }, [currentCategoryParam]);

  useEffect(() => {
    const loadShows = async () => {
      try {
        const data = await getAllShows();
        if (data && data.length > 0) {
          setShows(data);
        }
      } catch (err) {
        console.warn("Erro ao carregar catálogo da categoria:", err);
      }
    };
    loadShows();

    const handleUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setShows(normalizeCatalogList(e.detail));
      } else {
        setShows(getCachedShows());
      }
    };

    window.addEventListener("catalog_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("catalog_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const currentCategory = useMemo(() => {
    return (
      CATEGORIES.find((c) => c.id === activeCategoryId) || {
        id: "catalogo",
        label: "Catálogo Completo",
        shortLabel: "Catálogo",
        description: "Todos os desenhos e animações disponíveis no Nostalgiando.",
      }
    );
  }, [activeCategoryId]);

  // Filtra títulos por categoria e por busca, com ordenação inteligente
  const filteredShows = useMemo(() => {
    let list = shows;

    // Se for "catalogo" ou "todos", mostra tudo. Caso contrário, filtra pela categoria selecionada.
    if (activeCategoryId !== "catalogo" && activeCategoryId !== "todos") {
      list = list.filter((s) => s.category === activeCategoryId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          (s?.title || "").toLowerCase().includes(q) ||
          (s?.slug || "").toLowerCase().includes(q) ||
          (s?.year && s.year.includes(q))
      );
    }

    // Classificação baseada na escolha do usuário
    if (sortOrder === "recent") {
      return sortRecentlyAdded(list);
    }

    // Padrão: Ordem alfabética (A a Z)
    return [...list].sort((a, b) =>
      (a?.title || "").localeCompare(b?.title || "", "pt-BR", { sensitivity: "base" })
    );
  }, [shows, activeCategoryId, searchQuery, sortOrder]);

  // Paginação visual sob demanda para não sobrecarregar o DOM
  const visibleShows = useMemo(() => {
    return filteredShows.slice(0, visibleCount);
  }, [filteredShows, visibleCount]);

  const hasMore = visibleCount < filteredShows.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredShows.length));
  };

  return (
    <div className="min-h-screen bg-background pt-24 sm:pt-28 pb-16">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-3.5 sm:px-6">
        {/* Breadcrumb / Botão Voltar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors py-1.5 px-3 rounded-xl hover:bg-secondary/40 border border-transparent hover:border-white/5 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Início
          </Link>

          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Film className="h-3.5 w-3.5 text-primary" />
            <strong className="text-foreground">{filteredShows.length}</strong> títulos encontrados
          </span>
        </div>

        {/* Header da Categoria com Efeito Glossy Glassmorphism */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-secondary/40 via-card/80 to-card p-6 sm:p-8 shadow-card overflow-hidden mb-8 backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="rounded-full bg-primary/20 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-primary border border-primary/30">
                {activeCategoryId === "catalogo" ? "Acervo Total" : "Categoria"}
              </span>
              <span className="text-xs text-muted-foreground">
                • {filteredShows.length} {filteredShows.length === 1 ? "título" : "títulos"}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {currentCategory.label}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
              {currentCategory.description}
            </p>

            {/* Barra de Filtros e Busca Rápida */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pt-4 border-t border-white/5">
              {/* Input de Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Filtrar por nome ou ano..."
                  className="w-full h-11 rounded-2xl border border-white/10 bg-secondary/50 pl-10 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Botões de Ordenação */}
              <div className="flex items-center gap-1.5 bg-secondary/30 p-1 rounded-2xl border border-white/5 self-start sm:self-auto">
                <button
                  onClick={() => setSortOrder("az")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    sortOrder === "az"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Ordem Alfabética (A-Z)
                </button>
                <button
                  onClick={() => setSortOrder("recent")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    sortOrder === "recent"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Mais Recentes
                </button>
              </div>
            </div>

            {/* Tabs de Troca Rápida de Categoria */}
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {CATEGORIES.map((cat) => {
                const isSelected = activeCategoryId === cat.id;
                return (
                  <Link
                    key={cat.id}
                    to="/categoria/$id"
                    params={{ id: cat.id }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md scale-100"
                        : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-white/5"
                    }`}
                  >
                    <span>{(cat as any).shortLabel || (cat as any).label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grade de Pôsteres com Lazy Loading */}
        {visibleShows.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4.5">
              {visibleShows.map((show) => (
                <div key={show.slug} className="animate-in fade-in zoom-in-95 duration-200">
                  <PosterCard show={show} className="w-full" />
                </div>
              ))}
            </div>

            {/* Botão Carregar Mais (Lazy Rendering) */}
            {hasMore && (
              <div className="mt-12 text-center">
                <div className="inline-flex flex-col items-center gap-2">
                  <button
                    onClick={handleLoadMore}
                    className="min-h-[50px] px-8 py-3.5 rounded-full bg-secondary/80 hover:bg-secondary border border-white/10 hover:border-primary/50 text-foreground font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer group"
                  >
                    <ChevronDown className="h-4 w-4 text-primary group-hover:translate-y-0.5 transition-transform" />
                    Carregar Mais Desenhos ({filteredShows.length - visibleCount} restantes)
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Exibindo {visibleShows.length} de {filteredShows.length} títulos
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Estado Vazio */
          <div className="rounded-3xl border border-dashed border-white/10 bg-card/40 p-12 text-center my-8">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-secondary/60 text-muted-foreground">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">
              Nenhum título encontrado
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
              Não encontramos nenhum desenho correspondente a "{searchQuery}" nesta categoria.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-5 py-2.5 rounded-xl bg-secondary text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              Limpar Busca
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
