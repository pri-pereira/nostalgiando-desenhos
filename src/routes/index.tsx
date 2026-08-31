import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Info, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ShelfCarousel } from "@/components/ShelfCarousel";
import { FEATURED, shelves } from "@/data/shows";
import heroImg from "@/assets/hero-caverna-dragao.jpg";
import heroPicaPau from "@/assets/hero-picapau.jpg";

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
        content: "Streaming de desenhos clássicos e animações retrô, em prateleiras por década e estúdio.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [clientShelves, setClientShelves] = useState<any[]>([]);

  useEffect(() => {
    // Carrega do Firebase + Dados estáticos
    const loadShelves = async () => {
      const data = await shelves();
      setClientShelves(data);
    };
    loadShelves();
  }, []);

  return (
    <div className="min-h-screen bg-background pt-32 sm:pt-28">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Destaque 1: Caverna do Dragão */}
        <div className="group rounded-3xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] border border-white/10 mb-16 flex flex-col md:flex-row relative bg-card transition-all duration-500 hover:border-primary/50 hover:shadow-glow">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
            
            {/* Informações */}
            <div className="p-8 md:p-12 md:w-[45%] flex flex-col justify-center relative z-10 bg-card/60 backdrop-blur-2xl border-r border-white/5">
                <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Aventura Épica</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-fantasy font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-amber-100 to-amber-500 drop-shadow-lg mb-5 text-shadow-fantasy leading-tight">Caverna do Dragão</h2>
                <p className="text-muted-foreground mb-8 text-sm md:text-base leading-relaxed">
                    Seis jovens entram em uma montanha-russa mágica e acabam presos em um reino de aventuras, monstros e magia. Acompanhe a jornada épica em busca do caminho de casa!
                </p>
                <div className="flex space-x-4">
                    <Link to="/assistir/$slug" params={{ slug: "caverna-do-dragao" }} className="bg-primary text-primary-foreground px-6 py-3.5 rounded-full font-bold text-center shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] w-full sm:w-auto">
                        <Play className="h-4 w-4 fill-current" /> Série Completa
                    </Link>
                </div>
            </div>
            {/* Player Nativo */}
            <div className="md:w-[55%] bg-black relative aspect-video w-full border-l border-white/5">
                <video controls preload="metadata" className="absolute top-0 left-0 w-full h-full object-cover bg-black">
                  <source src="https://archive.org/download/caverna-do-dragao-ep-01/Caverna_do_Dragao_Ep01_Dublado.mp4" type="video/mp4" />
                  Seu navegador não suporta a reprodução deste vídeo.
                </video>
            </div>
        </div>

        {/* Destaque 2: Pica-Pau */}
        <div className="group rounded-3xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] border border-white/10 mb-16 flex flex-col md:flex-row-reverse relative bg-card transition-all duration-500 hover:border-accent/50 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_14px_40px_-12px_rgba(251,191,36,0.45)]">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-l from-accent/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />

            {/* Informações */}
            <div className="p-8 md:p-12 md:w-[45%] flex flex-col justify-center relative z-10 bg-card/60 backdrop-blur-2xl border-l border-white/5">
                <span className="text-accent font-bold uppercase tracking-[0.2em] text-xs mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Comédia Clássica</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-5 tracking-tight text-shadow-premium">Pica-Pau</h2>
                <p className="text-muted-foreground mb-8 text-sm md:text-base leading-relaxed">
                    As maiores loucuras e confusões do pássaro mais maluco da televisão. Prepare-se para rir sem parar com os episódios que marcaram gerações nas manhãs da TV brasileira.
                </p>
                <div className="flex space-x-4">
                    <Link to="/assistir/$slug" params={{ slug: "pica-pau" }} className="bg-accent text-accent-foreground px-6 py-3.5 rounded-full font-bold text-center shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] w-full sm:w-auto">
                        <Play className="h-4 w-4 fill-current" /> Assistir Agora
                    </Link>
                </div>
            </div>
            {/* Player Nativo / Capa */}
            <div className="md:w-[55%] bg-black relative aspect-video w-full border-r border-white/5">
                <img 
                  src={heroPicaPau} 
                  alt="Pica-Pau" 
                  className="absolute top-0 left-0 w-full h-full object-cover opacity-80" 
                />
            </div>
        </div>
      </main>

      {/* PRATELEIRAS DE VÍDEOS (CARROSSÉIS HORIZONTAIS) */}
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-4 sm:px-6 pb-20">
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

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Nostalgiando Desenhos · feito com carinho para quem cresceu na frente da TV de tubo.
      </footer>
    </div>
  );
}
