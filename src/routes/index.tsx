import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Sparkles, Clock, RotateCcw, ChevronRight, User, Tv } from "lucide-react";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ShelfCarousel } from "@/components/ShelfCarousel";
import { shelves, CATEGORIES, getCachedShows } from "@/data/shows";
import { useAuth } from "@/lib/authContext";
import { getWatchHistory, type WatchHistoryItem } from "@/lib/watchHistory";
import heroImg from "@/assets/hero-caverna-dragao.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nostalgiando Desenhos — Caverna do Dragão e Clássicos Retrô" },
      {
        name: "description",
        content:
          "Assista a Caverna do Dragão e outros desenhos clássicos que marcaram época: anos 80, anos 90, Hanna-Barbera, tokusatsu e super-heróis.",
      },
      { property: "og:title", content: "Caverna do Dragão — Nostalgiando Desenhos" },
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
    const updateShelvesFromList = (showsList: any[]) => {
      setClientShelves(
        CATEGORIES.filter((c) => c.id !== "todos").map((c) => ({
          ...c,
          shows: c.id === "catalogo" ? showsList : showsList.filter((s) => s.category === c.id),
        }))
      );
    };

    const loadShelves = async () => {
      try {
        const data = await shelves();
        if (data && data.length > 0) {
          setClientShelves(data);
        }
      } catch (e) {
        console.warn("Aviso ao carregar prateleiras:", e);
      }
    };
    loadShelves();

    const handleCatalogUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        updateShelvesFromList(e.detail);
      } else {
        updateShelvesFromList(getCachedShows());
      }
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
      user.email?.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
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
            <div className="flex items-center justify-between gap-3 mb-4 px-1">
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

            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 [scrollbar-width:thin]">
              {history.map((item) => (
                <div
                  key={item.showSlug}
                  className="group relative flex-none w-[230px] sm:w-[270px] rounded-2xl overflow-hidden border border-white/10 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-glow hover:-translate-y-1"
                >
                  <Link
                    to="/assistir/$slug"
                    params={{ slug: item.showSlug }}
                    className="block relative aspect-video w-full bg-black overflow-hidden"
                  >
                    <img
                      src={item.showPoster}
                      alt={item.showTitle}
                      className="h-full w-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    <div className="absolute inset-0 grid place-items-center opacity-90 group-hover:opacity-100 transition-opacity">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 fill-current translate-x-0.5" />
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-secondary/80">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-r-full"
                        style={{ width: `${Math.max(15, item.progressPercent)}%` }}
                      />
                    </div>
                  </Link>

                  <div className="p-3.5">
                    <h3 className="font-display text-sm sm:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {item.showTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.episodeTitle || `Episódio ${item.episodeIndex + 1}`}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" /> Continuar
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {item.progressPercent}% assistido
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Destaque Principal: Caverna do Dragão */}
        <div className="group rounded-3xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] border border-white/10 mb-10 sm:mb-16 flex flex-col md:flex-row relative bg-card transition-all duration-500 hover:border-primary/50 hover:shadow-glow">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />

          <div className="p-6 sm:p-10 md:p-12 md:w-[48%] flex flex-col justify-center relative z-10 bg-card/70 backdrop-blur-2xl border-b md:border-b-0 md:border-r border-white/5 order-2 md:order-1">
            <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs mb-2.5 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Aventura Épica
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-fantasy font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-amber-100 to-amber-500 drop-shadow-lg mb-3 sm:mb-5 text-shadow-fantasy leading-tight">
              Caverna do Dragão
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
              Seis jovens entram em uma montanha-russa mágica e acabam presos em um reino de
              aventuras, monstros e magia. Acompanhe a jornada épica em busca do caminho de casa!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/assistir/$slug"
                params={{ slug: "caverna-do-dragao" }}
                className="bg-gradient-to-r from-primary to-amber-600 text-primary-foreground h-13 px-7 rounded-full font-bold text-base shadow-[0_0_20px_rgba(217,119,6,0.35)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] w-full sm:w-auto"
              >
                <Play className="h-5 w-5 fill-current" /> Assistir Agora
              </Link>
            </div>
          </div>

          <Link
            to="/assistir/$slug"
            params={{ slug: "caverna-do-dragao" }}
            className="md:w-[52%] bg-black relative aspect-video w-full border-l border-white/5 block group-hover:opacity-95 transition-opacity cursor-pointer overflow-hidden order-1 md:order-2"
          >
            <img
              src={heroImg}
              alt="Caverna do Dragão"
              className="absolute top-0 left-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/85 text-white flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(217,119,6,0.6)] group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 sm:h-10 sm:w-10 fill-current translate-x-1" />
              </div>
            </div>
          </Link>
        </div>

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
