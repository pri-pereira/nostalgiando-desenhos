import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import type { Show } from "@/data/shows";

export function PosterCard({ show }: { show: Show }) {
  return (
    <Link
      to="/assistir/$slug"
      params={{ slug: show.slug }}
      className="group block w-[155px] sm:w-[200px] shrink-0"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-card shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] transition-all duration-500 ease-out group-hover:scale-[1.04] group-hover:border-primary/60 group-hover:shadow-[0_20px_40px_-10px_rgba(217,119,6,0.3)]">
        <img
          src={show.poster}
          alt={`Cartaz de ${show.title}`}
          loading="lazy"
          width={600}
          height={900}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        
        {/* Play Icon Overlay */}
        <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-amber-600 text-primary-foreground shadow-[0_0_20px_rgba(217,119,6,0.6)] transition-transform duration-300 scale-50 group-hover:scale-100">
            <Play className="h-7 w-7 fill-current translate-x-0.5" />
          </span>
        </span>

        {/* Badge Year */}
        <span className="absolute top-3 left-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white backdrop-blur-md shadow-sm border border-white/20">
          {show.year}
        </span>
      </div>

      <div className="mt-3 px-1">
        <h3 className="truncate font-display text-sm font-bold text-foreground/90 transition-colors group-hover:text-primary">
          {show.title}
        </h3>
        <p className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">
            {show.episodes.length > 0
              ? `${show.episodes.length} episódios`
              : show.archiveId
                ? "Série Completa"
                : "Em breve"}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-accent/80 font-bold">Clássico</span>
        </p>
      </div>
    </Link>
  );
}
