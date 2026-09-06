import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Sparkles, Clock, RotateCcw, ChevronRight, User, Tv } from "lucide-react";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ShelfCarousel } from "@/components/ShelfCarousel";
import { HeroCarousel } from "@/components/HeroCarousel";
import { shelves, CATEGORIES, getCachedShows, getAllShows, type Show } from "@/data/shows";
import { useAuth } from "@/lib/authContext";
import { getWatchHistory, formatTime, type WatchHistoryItem } from "@/lib/watchHistory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nostalgiando Desenhos — Desenhos Clássicos e Animações Retrô" },
      {
        name: "description",
        content:
          "Assista aos desenhos mais populares da semana, Caverna do Dragão e outros desenhos clássicos que marcaram época: anos 80, anos 90, Hanna-Barbera, tokusatsu e super-heróis.",
      },
      { property: "og:title", content: "Nostalgiando Desenhos — Catálogo Retrô" },
      {
        property: "og:description",
        content:
          "Streaming de desenhos clássicos e animações retrô, em prateleiras por década e estúdio.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [allShows, setAllShows] = useState<Show[]>(() => getCachedShows());
  const [clientShelves, setClientShelves] = useState<any[]>(() => {
    const cached = getCachedShows();
    return CATEGORIES.filter((c) => c.id !== "todos").map((c) => ({
      ...c,
      shows: c.id === "catalogo" ? cached : cached.filter((s) => s.category === c.id),
    }));
  });

  useEffect(() => {
    const loadHistory = () => {
      const list = getWatchHistory(user?.uid);
      setHistory(list);
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

  useEffect(() => {
    const updateShelvesFromList = (showsList: Show[]) => {
      setAllShows(showsList);
      setClientShelves(
        CATEGORIES.filter((c) => c.id !== "todos").map((c) => ({
          ...c,
          shows: c.id === "catalogo" ? showsList : showsList.filter((s) => s.category === c.id),
        }))
      );
    };

    const loadInitialData = async () => {
      try {
        const data = await getAllShows();
        if (data && data.length > 0) {
          updateShelvesFromList(data);
        }
      } catch (e) {
        console.warn("Aviso ao carregar shows:", e);
      }
    };
    loadInitialData();

    const handleCatalogUpdate = (e: any) => {
      const showsList = e?.detail && Array.isArray(e.detail) ? e.detail : getCachedShows();
      updateShelvesFromList(showsList);
    };

    window.addEventListener("catalog_updated", handleCatalogUpdate);
    window.addEventListener("storage", handleCatalogUpdate);
    return () => {
      window.removeEventListener("catalog_updated", handleCatalogUpdate);
      window.removeEventListener("storage", handleCatalogUpdate);
    };
  }, []);

  const userName = user
    ? user.displayName ||
      user.email?.split("@")[0]?.replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
      "Nostálgico"
    : null;

  return (
    <div className="min-h-screen bg-background pt-24 sm:pt-28 pb-16">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-3.5 sm:px-6">
        {user && (
          <div className="mb-6 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/15 via-card to-card p-4 sm:p-6 shadow-glow backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-500">
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
                  className="group relative flex items-center gap-3 rounded-2xl border border-white/8 bg-card/60 hover:bg-card backdrop-blur-sm px-3 py-3 transition-all duration-200 hover:border-primary/35 hover:shadow-[0_0_20px_rgba(217,119,6,0.08)] active:scale-[0.98] overflow-hidden"
                >
                  {/* Poster Miniatura */}
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black shadow-sm">
                    <img
                      src={item.showPoster}
                      alt={item.showTitle}
                      className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Play overlay ao hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

                    {/* Barra de progresso minimalista */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-amber-400 transition-all"
                          style={{ width: `${Math.max(8, item.progressPercent)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-primary/80 shrink-0 tabular-nums">
                        {item.timestamp > 0 ? formatTime(item.timestamp) : `${item.progressPercent}%`}
                      </span>
                    </div>
                  </div>

                  {/* Ícone de continuar */}
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <HeroCarousel shows={allShows} />

        <div className="mx-auto max-w-7xl space-y-9 sm:space-y-12 pb-12">
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
