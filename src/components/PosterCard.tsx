import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import type { Show } from "@/data/shows";

export function PosterCard({ show }: { show: Show }) {
  return (
    <Link
      to="/assistir/$slug"
      params={{ slug: show.slug }}
      className="group block w-[145px] sm:w-[185px] md:w-[210px] shrink-0 active:scale-98 transition-transform"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-card shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] transition-all duration-500 ease-out group-hover:scale-[1.04] group-hover:border-primary/60 group-hover:shadow-[0_20px_40px_-10px_rgba(217,119,6,0.3)]">
        <img
          src={show.poster}
          alt={`Cartaz de ${show.title}`}
          loading="lazy"
          width={600}
          height={900}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/800x1200/111827/ffffff?text=Sem+Poster";
          }}
        />

        {/* Play Icon Overlay */}
        <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-amber-600 text-primary-foreground shadow-[0_0_20px_rgba(217,119,6,0.6)] transition-transform duration-300 scale-75 group-hover:scale-100">
            <Play className="h-7 w-7 fill-current translate-x-0.5" />
          </span>
        </span>

        {/* Badge Year */}
        <span className="absolute top-2.5 left-2.5 rounded-lg bg-black/70 px-2 py-0.5 text-xs font-black tracking-wider text-white backdrop-blur-md shadow-sm border border-white/15">
          {show.year}
        </span>
      </div>

      <div className="mt-2.5 px-1">
        <h3 className="truncate font-display text-sm sm:text-base font-bold text-foreground transition-colors group-hover:text-primary">
          {show.title}
        </h3>
        <p className="mt-1 flex items-center justify-between text-xs sm:text-sm text-muted-foreground font-medium">
          <span className="truncate">
            {show.episodes && show.episodes.length > 0
              ? `${show.episodes.length} episódios`
              : show.archiveId
                ? "Série Completa"
                : "Dublado"}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-primary font-extrabold shrink-0 pl-1">
            HD
          </span>
        </p>
      </div>
    </Link>
  );
}
