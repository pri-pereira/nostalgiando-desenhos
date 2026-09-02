import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ShelfCarousel } from "@/components/ShelfCarousel";
import { shelves, CATEGORIES, getCachedShows } from "@/data/shows";
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
  const [clientShelves, setClientShelves] = useState<any[]>(() => {
    const cached = getCachedShows();
    return CATEGORIES.filter((c) => c.id !== "todos").map((c) => ({
      ...c,
      shows: cached.filter((s) => s.category === c.id),
    }));
  });

  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen bg-background pt-28 sm:pt-32 pb-16">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-3.5 sm:px-6">
        {/* Destaque Principal: Caverna do Dragão */}
        <div className="group rounded-3xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] border border-white/10 mb-10 sm:mb-16 flex flex-col md:flex-row relative bg-card transition-all duration-500 hover:border-primary/50 hover:shadow-glow">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />

          {/* Informações */}
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

          {/* Capa Clicável para o Player */}
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
      </main>

      {/* PRATELEIRAS DE VÍDEOS (CARROSSÉIS HORIZONTAIS) */}
      <div className="mx-auto max-w-7xl space-y-9 sm:space-y-12 px-3.5 sm:px-6 pb-12">
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

      <footer className="border-t border-border/60 py-8 text-center text-xs sm:text-sm text-muted-foreground px-4">
        Nostalgiando Desenhos · feito com carinho para quem cresceu na frente da TV de tubo.
      </footer>
    </div>
  );
}
