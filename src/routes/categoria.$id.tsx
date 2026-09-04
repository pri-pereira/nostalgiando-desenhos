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
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PosterCard } from "@/components/PosterCard";
import { CATEGORIES, getAllShows, getCachedShows, type Show, type CategoryId } from "@/data/shows";

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

function CategoriaView() {
  const { id: currentCategoryParam } = useParams({ from: "/categoria/$id" });
  const [activeCategoryId, setActiveCategoryId] = useState<string>(currentCategoryParam || "catalogo");
  const [shows, setShows] = useState<Show[]>(() => getCachedShows());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setActiveCategoryId(currentCategoryParam || "catalogo");
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
        setShows(e.detail);
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
    return CATEGORIES.find((c) => c.id === activeCategoryId) || {
      id: "catalogo",
      label: "Catálogo Completo",
      shortLabel: "Catálogo",
      description: "Todos os desenhos e animações disponíveis no Nostalgiando.",
    };
  }, [activeCategoryId]);

  // Filtra títulos por categoria e por busca
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
          s.title.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          (s.year && s.year.includes(q))
      );
    }

    return list;
  }, [shows, activeCategoryId, searchQuery]);

  return (
    <div className="min-h-screen bg-background pt-24 sm:pt-28 pb-16">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-3.5 sm:px-6">
        {/* Breadcrumb / Botão Voltar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors py-1.5 px-3 rounded-xl hover:bg-secondary/40 border border-transparent hover:border-white/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Início
          </Link>

          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Film className="h-3.5 w-3.5 text-primary" />
            <strong className="text-foreground">{filteredShows.length}</strong> títulos disponíveis
          </span>
        </div>

        {/* Header da Categoria */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-secondary/40 via-card/80 to-card p-6 sm:p-8 shadow-card overflow-hidden mb-8">
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
            {currentCategory.description && (
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
                {currentCategory.description}
              </p>
            )}

            {/* Barra de Busca e Filtros Rápidos */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar em ${currentCategory.label}...`}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-secondary/50 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
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
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
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

        {/* Grade de Pôsteres (Grid Responsivo) */}
        {filteredShows.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4.5">
            {filteredShows.map((show) => (
              <div key={show.slug} className="animate-in fade-in zoom-in-95 duration-300">
                <PosterCard show={show} />
              </div>
            ))}
          </div>
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
              className="mt-4 px-5 py-2 rounded-xl bg-secondary text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors"
            >
              Limpar Busca
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
