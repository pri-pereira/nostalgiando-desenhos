import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Sparkles, Clock, RotateCcw, ChevronRight, User, Tv, Heart } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ShelfCarousel } from "@/components/ShelfCarousel";
import { HeroCarousel } from "@/components/HeroCarousel";
import { DecadesBentoGrid } from "@/components/DecadesBentoGrid";
import { shelves, CATEGORIES, getCachedShows, getAllShows, type Show } from "@/data/shows";
import { useAuth } from "@/lib/authContext";
import {
  getWatchHistory,
  syncWatchHistoryFromCloud,
  formatTime,
  type WatchHistoryItem,
} from "@/lib/watchHistory";
import { getFavoriteShows } from "@/lib/userPreferences";
import { sortRecentlyAdded, normalizeCatalogList } from "@/lib/normalizeCatalog";
import { SafePoster } from "@/components/SafePoster";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nostalgiando Desenhos — Desenhos Clássicos e Animações Retrô" },
      {
        name: "description",
        content:
          "Assista a desenhos clássicos e animações retrô que marcaram época: Caverna do Dragão, He-Man, ThunderCats, anos 80, anos 90, Hanna-Barbera e tokusatsu.",
      },
      { property: "og:title", content: "Nostalgiando Desenhos — Catálogo Retrô" },
      {
        property: "og:description",
        content:
          "Streaming de desenhos clássicos e animações retrô com estética nostálgica de TV de tubo.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [allShows, setAllShows] = useState<Show[]>(() => getCachedShows());

  // Carrega histórico e sincroniza da nuvem se logado
  useEffect(() => {
    const loadHistory = async () => {
      const local = getWatchHistory(user?.uid);
      setHistory(local);
      if (user?.uid) {
        try {
          const synced = await syncWatchHistoryFromCloud(user.uid);
          if (synced && synced.length > 0) {
            setHistory(synced);
          }
        } catch (e) {
          console.warn("Aviso ao carregar histórico sincronizado:", e);
        }
      }
    };
    loadHistory();

    const handleHistoryUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setHistory(e.detail);
      } else {
        loadHistory();
      }
    };

    window.addEventListener("watch_history_updated", handleHistoryUpdate);
    window.addEventListener("storage", handleHistoryUpdate);
    return () => {
      window.removeEventListener("watch_history_updated", handleHistoryUpdate);
      window.removeEventListener("storage", handleHistoryUpdate);
    };
  }, [user]);

  // Carrega lista de favoritos
  useEffect(() => {
    const loadFavorites = async () => {
      const favs = await getFavoriteShows(user?.uid);
      setFavoriteSlugs(favs);
    };
    loadFavorites();

    const handleFavUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setFavoriteSlugs(e.detail);
      }
    };
    window.addEventListener("favorites_updated", handleFavUpdate);
    return () => window.removeEventListener("favorites_updated", handleFavUpdate);
  }, [user]);

  // Carrega catálogo geral com proteção de cache TTL de 30 min
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await getAllShows();
        if (data && data.length > 0) {
          setAllShows(data);
        }
      } catch (e) {
        console.warn("Aviso ao carregar shows:", e);
      }
    };
    loadInitialData();

    const handleCatalogUpdate = (e: any) => {
      const showsList = e?.detail && Array.isArray(e.detail) ? e.detail : getCachedShows();
      setAllShows(normalizeCatalogList(showsList));
    };

    window.addEventListener("catalog_updated", handleCatalogUpdate);
    window.addEventListener("storage", handleCatalogUpdate);
    return () => {
      window.removeEventListener("catalog_updated", handleCatalogUpdate);
      window.removeEventListener("storage", handleCatalogUpdate);
    };
  }, []);

  // Prateleiras dinâmicas e inteligentes
  const clientShelves = useMemo(() => {
    const shelvesList: any[] = [];

    // 1. Prateleira "Minha Lista" (se houver itens favoritados)
    if (favoriteSlugs.length > 0) {
      const favShows = allShows.filter((s) => favoriteSlugs.includes(s.slug));
      if (favShows.length > 0) {
        shelvesList.push({
          id: "minha-lista",
          label: "Minha Lista",
          description: "Os títulos que você salvou para não esquecer.",
          shows: favShows,
        });
      }
    }

    // 2. Prateleira "Adicionados Recentemente" (ordenação real decrescente por createdAt/updatedAt)
    const recentShows = sortRecentlyAdded(allShows).slice(0, 15);
    shelvesList.push({
      id: "recentes",
      label: "Adicionados Recentemente",
      description: "As últimas novidades e clássicos que acabaram de chegar ao acervo.",
      shows: recentShows,
    });

    // 3. Prateleiras por Categoria
    const categoriesShelves = CATEGORIES.filter((c) => c.id !== "todos").map((c) => ({
      ...c,
      shows: c.id === "catalogo" ? allShows : allShows.filter((s) => s.category === c.id),
    }));

    shelvesList.push(...categoriesShelves);
    return shelvesList;
  }, [allShows, favoriteSlugs]);

  const userName = user
    ? user.displayName ||
      user.email?.split("@")[0]?.replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
      "Nostálgico"
    : null;

  return (
    <div className="min-h-screen bg-background pb-16">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-3.5 sm:px-6 pt-4 sm:pt-6">
        {/* =================================================================
            1. HERO BANNER DINÂMICO NO TOPO (Lei de Fitts: Destaque Principal)
            ================================================================= */}
        <HeroCarousel shows={allShows} />

        {/* Boas-vindas para Assinante */}
        {user && (
          <div className="mb-10 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/15 via-card/80 to-card p-4 sm:p-6 shadow-glow backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground font-black text-xl shadow-md border border-white/20">
                  {userName ? userName.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Área do Assinante
                    </span>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                    Olá, <span className="text-primary">{userName}</span>! 👋
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Que bom ter você de volta no Nostalgiando. O que vamos assistir hoje?
                  </p>
                </div>
              </div>

              <Link
                to="/categoria/$id"
                params={{ id: "catalogo" }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs sm:text-sm font-bold border border-white/10 transition-all hover:border-primary/40 active:scale-95 shrink-0"
              >
                <Tv className="h-4 w-4 text-primary" />
                Explorar Catálogo Completo
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* =================================================================
            2. TRILHO "CONTINUAR ASSISTINDO" (Efeito Zeigarnik)
            ================================================================= */}
        {history.length > 0 && (
          <section className="mb-10 sm:mb-14">
            <div className="flex items-center justify-between gap-3 mb-5 px-1">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/20 text-primary border border-primary/30">
                  <Clock className="h-4 w-4" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-foreground font-bold tracking-tight">
                  Continuar Assistindo
                </h2>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs uppercase font-extrabold tracking-wider text-primary border border-primary/20">
                  {history.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {history.slice(0, 4).map((item) => (
                <Link
                  key={item.showSlug}
                  to="/assistir/$slug"
                  params={{ slug: item.showSlug }}
                  className="group relative flex items-center gap-3 rounded-2xl border border-white/8 bg-card/75 hover:bg-card backdrop-blur-md px-3 py-3 transition-all duration-200 hover:border-primary/35 hover:shadow-[0_0_20px_rgba(217,119,6,0.12)] active:scale-[0.98] overflow-hidden"
                >
                  {/* Poster Miniatura com Proteção */}
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black shadow-sm">
                    <SafePoster
                      src={item.showPoster}
                      alt={item.showTitle}
                      title={item.showTitle}
                      className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Play overlay ao hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <Play className="h-4 w-4 text-white fill-white" />
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                      {item.showTitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Ep. {item.episodeIndex + 1} · {item.episodeTitle || `Episódio ${item.episodeIndex + 1}`}
                    </p>

                    {/* Barra de progresso visual */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-[4px] rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-amber-400 transition-all"
                          style={{ width: `${Math.max(8, item.progressPercent)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-primary/90 shrink-0 tabular-nums">
                        {item.timestamp > 0 ? formatTime(item.timestamp) : `${item.progressPercent}%`}
                      </span>
                    </div>
                  </div>

                  {/* Ícone de retomar */}
                  <RotateCcw className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* =================================================================
            3. BENTO GRID DE DÉCADAS E GERAÇÕES (Leis de Hick & Miller)
            ================================================================= */}
        <DecadesBentoGrid shows={allShows} />

        {/* =================================================================
            4. PRATELEIRAS DO STREAMING ("Minha Lista", "Recentes", Categorias)
            ================================================================= */}
        <div className="space-y-10 sm:space-y-14 pb-12">
          {clientShelves.map((shelf) => (
            <ShelfCarousel
              key={shelf.id}
              id={shelf.id}
              label={shelf.label}
              description={shelf.description}
              shows={shelf.shows}
            />
          ))}
        </div>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs sm:text-sm text-muted-foreground px-4">
        Nostalgiando Desenhos · feito com carinho para quem cresceu na frente da TV de tubo.
      </footer>
    </div>
  );
}
