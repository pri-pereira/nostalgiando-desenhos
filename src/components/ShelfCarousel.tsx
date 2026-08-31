import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PosterCard } from "./PosterCard";
import type { Show } from "@/data/shows";

interface ShelfCarouselProps {
  id: string;
  label: string;
  description?: string;
  shows: Show[];
}

export function ShelfCarousel({ id, label, description, shows }: ShelfCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [shows]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -380 : 380;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section id={id} className="scroll-mt-32">
      {/* Header com título, descrição e botão Ver Tudo */}
      <div className="flex items-end justify-between gap-4 mb-5 px-1">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl text-foreground sm:text-3xl font-bold tracking-tight text-shadow-premium">
              {label}
            </h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-primary border border-primary/20">
              {shows.length} títulos
            </span>
          </div>
          {description && (
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground/80 max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Botão Sutil "Ver Tudo" */}
        <a
          href={`#${id}`}
          className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-all hover:text-primary sm:text-sm"
        >
          <span>Ver Tudo</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      {/* Carrossel de Vídeos com Botões de Navegação */}
      <div className="relative group/carousel -mx-4 sm:mx-0">
        
        {/* Shadow Overlay Esquerda */}
        <div className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />

        {/* Botão Esquerda */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Rolar para esquerda"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden h-12 w-12 place-items-center rounded-full border border-white/10 bg-black/60 text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:scale-110 hover:border-primary/50 hover:bg-black/80 hover:text-primary md:grid opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronLeft className="h-6 w-6 -translate-x-0.5" />
          </button>
        )}

        {/* Container Horizontal */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-1 pb-6 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {shows.map((show) => (
            <PosterCard key={show.slug} show={show} />
          ))}
        </div>

        {/* Shadow Overlay Direita */}
        <div className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />

        {/* Botão Direita */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Rolar para direita"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden h-12 w-12 place-items-center rounded-full border border-white/10 bg-black/60 text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:scale-110 hover:border-primary/50 hover:bg-black/80 hover:text-primary md:grid opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronRight className="h-6 w-6 translate-x-0.5" />
          </button>
        )}
      </div>
    </section>
  );
}
