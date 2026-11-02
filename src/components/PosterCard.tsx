import { Link } from "@tanstack/react-router";
import { Play, Sparkles } from "lucide-react";
import type { Show } from "@/data/shows";
import { StarRating } from "./StarRating";
import { FavoriteButton } from "./FavoriteButton";
import { SafePoster } from "./SafePoster";
import { normalizeYear } from "@/lib/normalizeCatalog";

export function PosterCard({
  show,
  className = "",
}: {
  show: Show;
  className?: string;
}) {
  const { displayYear } = normalizeYear(show.year);
  const episodeCount = show.episodes?.length || 0;

  // Verifica se é um item recém-adicionado
  const isRecent = (() => {
    const created = (show as any).createdAt || (show as any).updatedAt;
    if (!created) return false;
    const diffDays = (Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 45;
  })();

  // Largura padrão para carrosséis caso não seja especificada uma classe (ex: w-full na grade)
  const sizingClass = className || "w-[130px] sm:w-[155px] md:w-[175px] lg:w-[190px] shrink-0";

  return (
    <Link
      to="/assistir/$slug"
      params={{ slug: show.slug }}
      className={`group block ${sizingClass} active:scale-[0.98] transition-transform select-none`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-card shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:border-primary/60 group-hover:shadow-[0_20px_40px_-10px_rgba(217,119,6,0.35)]">
        {/* Poster com Proteção contra Links Quebrados */}
        <SafePoster
          src={show.poster}
          alt={`Cartaz de ${show.title}`}
          title={show.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Play Icon Overlay com Efeito Glossy */}
        <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid h-13 w-13 sm:h-14 sm:w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-amber-600 text-primary-foreground shadow-[0_0_25px_rgba(217,119,6,0.7)] transition-transform duration-300 scale-75 group-hover:scale-100 border border-white/20">
            <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-current translate-x-0.5" />
          </span>
        </span>

        {/* Badges Superiores */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
          {/* Badge Ano/Década */}
          <span className="rounded-lg bg-black/60 px-2 py-0.5 text-[11px] font-black tracking-wider text-white backdrop-blur-md shadow-sm border border-white/15">
            {displayYear}
          </span>

          {/* Badge NOVO dinâmico (apenas quando recém-adicionado) */}
          {isRecent && (
            <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-500/90 text-zinc-950 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm">
              <Sparkles className="h-2.5 w-2.5" />
              NOVO
            </span>
          )}
        </div>

        {/* Botão de Favoritar no topo direito */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <FavoriteButton slug={show.slug} />
        </div>
      </div>

      <div className="mt-2.5 px-1">
        {/* Título Principal */}
        <h3 className="truncate font-display text-sm sm:text-base font-bold text-foreground transition-colors group-hover:text-primary">
          {show.title}
        </h3>

        {/* Metadados Dinâmicos (sem repetição de tags vazias) */}
        <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span className="truncate">
            {episodeCount > 0 ? `${episodeCount} ${episodeCount === 1 ? "episódio" : "episódios"}` : "Completo"}
          </span>
          <span className="text-[10px] uppercase font-bold text-primary/80 shrink-0">
            {displayYear !== "Clássico" ? displayYear : "TV Retrô"}
          </span>
        </div>

        {/* Avaliação 5 Estrelas */}
        <div className="mt-1 relative z-10" onClick={(e) => e.preventDefault()}>
          <StarRating slug={show.slug} />
        </div>
      </div>
    </Link>
  );
}
