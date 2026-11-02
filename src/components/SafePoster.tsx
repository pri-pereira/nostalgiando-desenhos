import { useState } from "react";
import { Tv, Film } from "lucide-react";

interface SafePosterProps {
  src?: string;
  alt: string;
  title: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function SafePoster({
  src,
  alt,
  title,
  className = "",
  width = 600,
  height = 900,
  priority = false,
}: SafePosterProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Se não houver src ou a imagem já acusou erro
  const isBroken = !src || hasError;

  if (isBroken) {
    // Iniciais do título para o monograma retrô
    const initials = title
      ? title
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join("")
      : "TV";

    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 text-center select-none border border-white/10 ${className}`}
        style={{ aspectRatio: "2/3" }}
      >
        {/* Efeito de Grade Retrô de Fundo */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* Glow Central */}
        <div className="absolute h-24 w-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        {/* Ícone de TV Retrô */}
        <div className="relative z-10 grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-secondary/80 border border-white/15 text-primary shadow-lg mb-2 sm:mb-3">
          <Tv className="h-6 w-6 sm:h-7 sm:w-7 text-primary drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" />
        </div>

        {/* Monograma Retrô */}
        <span className="relative z-10 font-mono text-[11px] font-black tracking-widest text-primary/70 uppercase mb-1">
          [{initials}]
        </span>

        {/* Título do Desenho formatado */}
        <p className="relative z-10 font-display text-xs sm:text-sm font-bold text-foreground line-clamp-3 leading-snug px-2">
          {title || "Desenho Clássico"}
        </p>

        {/* Badge Nostalgiando */}
        <span className="relative z-10 mt-2 rounded-md bg-white/5 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider border border-white/10">
          Acervo Retrô
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton / Shimmer enquanto carrega */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-900/80 animate-pulse flex items-center justify-center">
          <Film className="h-6 w-6 text-zinc-700 animate-spin" />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`h-full w-full object-cover transition-all duration-700 ${
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      />
    </div>
  );
}

