import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Sparkles, ChevronLeft, ChevronRight, Flame, Trophy, Film } from "lucide-react";
import type { Show } from "@/data/shows";
import { getWeeklyTopShows, type TrendingShowItem } from "@/lib/trendingShows";

interface HeroCarouselProps {
  shows: Show[];
}

export function HeroCarousel({ shows }: HeroCarouselProps) {
  const [trending, setTrending] = useState<TrendingShowItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const list = getWeeklyTopShows(shows);
    setTrending(list);
  }, [shows]);

  // Listener para atualização de visualizações em tempo real
  useEffect(() => {
    const handleViewsUpdate = () => {
      setTrending(getWeeklyTopShows(shows));
    };
    window.addEventListener("views_updated", handleViewsUpdate);
    return () => window.removeEventListener("views_updated", handleViewsUpdate);
  }, [shows]);

  // Timer de Auto-Play de 6 segundos
  useEffect(() => {
    if (trending.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trending.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [trending.length, isPaused, currentIndex]);

  if (trending.length === 0) return null;

  const currentItem = trending[currentIndex] || trending[0];
  if (!currentItem) return null;
  const { show, badge, rank } = currentItem;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? trending.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % trending.length);
  };

  return (
    <div
      className="relative mb-10 sm:mb-16"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Container Principal do Banner Hero */}
      <div className="group rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] border border-white/10 flex flex-col md:flex-row relative bg-card transition-all duration-500 hover:border-primary/40 hover:shadow-glow">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-amber-500/5 to-transparent opacity-60 pointer-events-none" />

        {/* Lado Esquerdo: Informações do Título */}
        <div className="p-6 sm:p-10 md:p-12 md:w-[48%] flex flex-col justify-center relative z-10 bg-card/75 backdrop-blur-2xl border-b md:border-b-0 md:border-r border-white/5 order-2 md:order-1">
          {/* Badge de Ranking Semanal */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-400 border border-amber-500/30 shadow-sm animate-pulse">
              <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              {badge}
            </span>
            <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-bold text-foreground border border-white/10">
              {show.year}
            </span>
            <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
              Série Completa HD
            </span>
          </div>

          {/* Título Principal */}
          <h2
            key={`title-${show.slug}`}
            className="text-3xl sm:text-4xl md:text-5xl font-fantasy font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-amber-100 to-amber-500 drop-shadow-lg mb-3 sm:mb-4 text-shadow-fantasy leading-tight animate-in fade-in slide-in-from-left-3 duration-300"
          >
            {show.title}
          </h2>

          {/* Sinopse */}
          <p
            key={`synopsis-${show.slug}`}
            className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed line-clamp-3 md:line-clamp-4 animate-in fade-in duration-300"
          >
            {show.synopsis}
          </p>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/assistir/$slug"
              params={{ slug: show.slug }}
              className="bg-gradient-to-r from-primary to-amber-600 text-primary-foreground h-13 px-8 rounded-full font-bold text-base shadow-[0_0_25px_rgba(217,119,6,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 hover:shadow-[0_0_35px_rgba(217,119,6,0.6)]"
            >
              <Play className="h-5 w-5 fill-current" /> Assistir Agora
            </Link>

            <Link
              to="/categoria/$id"
              params={{ id: show.category || "catalogo" }}
              className="h-13 px-5 rounded-full border border-white/10 bg-secondary/40 text-foreground font-semibold text-sm hover:bg-secondary/70 transition-all flex items-center justify-center gap-1.5"
            >
              <Film className="h-4 w-4 text-muted-foreground" /> Ver Mais na Categoria
            </Link>
          </div>
        </div>

        {/* Lado Direito: Capa e Pôster Clicável com Play */}
        <Link
          to="/assistir/$slug"
          params={{ slug: show.slug }}
          className="md:w-[52%] bg-black relative aspect-video w-full border-l border-white/5 block group-hover:opacity-95 transition-opacity cursor-pointer overflow-hidden order-1 md:order-2"
        >
          <img
            key={`img-${show.slug}`}
            src={show.poster}
            alt={show.title}
            className="absolute top-0 left-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700 animate-in fade-in duration-500"
          />

          {/* Overlay de Sombra e Gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Botão Play Centralizado */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 text-white flex items-center justify-center backdrop-blur-md shadow-[0_0_35px_rgba(217,119,6,0.7)] group-hover:scale-110 transition-transform">
              <Play className="h-8 w-8 sm:h-10 sm:w-10 fill-current translate-x-1" />
            </div>
          </div>

          {/* Badge Flutuante no Pôster */}
          <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-black text-white">TOP #{rank}</span>
          </div>
        </Link>

        {/* Botões Laterais de Navegação (Desktop & Tablet) */}
        <button
          onClick={(e) => {
            e.preventDefault();
            handlePrev();
          }}
          aria-label="Destaque anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-black hover:scale-110 transition-all shadow-lg"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            handleNext();
          }}
          aria-label="Próximo destaque"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-black hover:scale-110 transition-all shadow-lg"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* =====================================================================
          SELETOR DE DESTAQUES (INDICADORES 01, 02, 03, 04 COM BARRA DE TEMPO)
          ===================================================================== */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 px-1">
        {trending.map((item, idx) => {
          const isSelected = idx === currentIndex;
          return (
            <button
              key={item.show.slug}
              onClick={() => setCurrentIndex(idx)}
              className={`relative overflow-hidden rounded-2xl p-3 text-left transition-all border ${
                isSelected
                  ? "bg-secondary/70 border-primary/60 shadow-md ring-1 ring-primary/40"
                  : "bg-secondary/30 border-white/5 hover:border-white/20 hover:bg-secondary/50 text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className={`text-xs font-black tracking-wider ${
                    isSelected ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  0{idx + 1}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground/80 truncate">
                  {item.badge.includes("Novidade") ? "Novidade" : `Top #${item.rank}`}
                </span>
              </div>

              <p
                className={`text-xs sm:text-sm font-bold truncate ${
                  isSelected ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.show.title}
              </p>

              {/* Barra de Progresso do Slide Ativo */}
              {isSelected && !isPaused && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
                  <div className="h-full bg-primary animate-[progress_6s_linear_infinite]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
