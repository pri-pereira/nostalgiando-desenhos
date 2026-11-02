import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
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

  // Estados para Drag-to-Scroll suave no desktop
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [shows, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const step = Math.max(300, Math.floor(scrollRef.current.clientWidth * 0.72));
      const offset = direction === "left" ? -step : step;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Mouse Drag-to-Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDownRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4; // Multiplicador de velocidade
    if (Math.abs(walk) > 6) {
      hasDraggedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDownRef.current = false;
  };

  if (shows.length === 0) return null;

  return (
    <section id={id} className="scroll-mt-28">
      {/* Header da Prateleira */}
      <div className="flex items-end justify-between gap-3 mb-3.5 px-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-foreground font-bold tracking-tight text-shadow-premium">
              {label}
            </h2>
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs uppercase font-extrabold tracking-wider text-primary border border-primary/20">
              {shows.length}
            </span>
          </div>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-none max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Botão Ver Tudo e Controles de Seta no Header */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/categoria/$id"
            params={{ id }}
            className="group inline-flex items-center gap-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all pb-0.5 mr-1"
          >
            <span>Ver Tudo</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Botões de Navegação Direta no Header */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Rolar carrossel para esquerda"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-secondary/60 text-foreground transition-all hover:bg-secondary hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Rolar carrossel para direita"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-secondary/60 text-foreground transition-all hover:bg-secondary hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Carrossel de Vídeos com Rolagem Fluida */}
      <div className="relative group/carousel -mx-4 sm:mx-0">
        {/* Gradiente de Fade Out Esquerdo */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Botão Flutuante Esquerda */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Rolar para esquerda"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden md:grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-zinc-950/80 text-white shadow-2xl backdrop-blur-md transition-all hover:scale-110 hover:border-primary/60 hover:bg-zinc-900 hover:text-primary opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5 -translate-x-0.5" />
          </button>
        )}

        {/* Container Horizontal com Suporte Touch e Drag */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-1 pb-4 pt-1.5 scroll-smooth overscroll-x-contain touch-pan-x cursor-grab active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {shows.map((show) => (
            <div key={show.slug} className="shrink-0">
              <PosterCard show={show} />
            </div>
          ))}
        </div>

        {/* Gradiente de Fade Out Direito */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Botão Flutuante Direita */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Rolar para direita"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden md:grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-zinc-950/80 text-white shadow-2xl backdrop-blur-md transition-all hover:scale-110 hover:border-primary/60 hover:bg-zinc-900 hover:text-primary opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5 translate-x-0.5" />
          </button>
        )}
      </div>
    </section>
  );
}
