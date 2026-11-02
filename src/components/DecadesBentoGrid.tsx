import { Link } from "@tanstack/react-router";
import { Sparkles, Tv, Flame, Radio, Zap } from "lucide-react";
import type { Show } from "@/data/shows";
import { normalizeYear } from "@/lib/normalizeCatalog";

interface DecadesBentoGridProps {
  shows: Show[];
}

export function DecadesBentoGrid({ shows }: DecadesBentoGridProps) {
  // Contabiliza títulos por era
  const countDecade = (targetDecade: string) => {
    return shows.filter((s) => {
      const { decade } = normalizeYear(s.year);
      return decade === targetDecade;
    }).length;
  };

  const count5060 = countDecade("anos-50-60");
  const count70 = countDecade("anos-70");
  const count80 = countDecade("anos-80");
  const count9000 = countDecade("anos-90-2000");

  const cards = [
    {
      id: "anos-50-60",
      title: "Era de Ouro",
      subtitle: "Anos 50 & 60",
      description: "Pica-Pau clássico, Corrida Maluca, Tom & Jerry e os pioneiros da animação mundial.",
      icon: Tv,
      count: count5060,
      gradient: "from-amber-600/30 via-amber-900/10 to-card",
      border: "border-amber-500/25 hover:border-amber-500/50",
      accent: "text-amber-400",
      glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]",
      categoryParam: "classicos-tv-aberta",
    },
    {
      id: "anos-70",
      title: "Clássicos de Domingo",
      subtitle: "Anos 70",
      description: "O auge da Hanna-Barbera, Zé Colmeia, Scooby-Doo e as manhãs preguiçosas de TV.",
      icon: Radio,
      count: count70,
      gradient: "from-emerald-600/25 via-emerald-950/15 to-card",
      border: "border-emerald-500/25 hover:border-emerald-500/50",
      accent: "text-emerald-400",
      glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]",
      categoryParam: "bau-hanna-barbera",
    },
    {
      id: "anos-80",
      title: "Febre dos Anos 80",
      subtitle: "Anos 80",
      description: "Caverna do Dragão, He-Man, ThunderCats, Tokusatsu e guerreiros cósmicos inesquecíveis.",
      icon: Flame,
      count: count80,
      gradient: "from-rose-600/30 via-purple-950/15 to-card",
      border: "border-rose-500/25 hover:border-rose-500/50",
      accent: "text-rose-400",
      glow: "hover:shadow-[0_0_30px_rgba(244,63,94,0.25)]",
      categoryParam: "aventura-fantasia",
    },
    {
      id: "anos-90-2000",
      title: "Animes & Anos 90/2000",
      subtitle: "Anos 90 & 2000",
      description: "Cavaleiros do Zodíaco, Yu Yu Hakusho, Pokémon e a era de ouro da TV Manchete.",
      icon: Zap,
      count: count9000,
      gradient: "from-sky-600/25 via-indigo-950/15 to-card",
      border: "border-sky-500/25 hover:border-sky-500/50",
      accent: "text-sky-400",
      glow: "hover:shadow-[0_0_30px_rgba(14,165,233,0.2)]",
      categoryParam: "desenhos-japoneses",
    },
  ];

  return (
    <section className="mb-12 sm:mb-16">
      <div className="flex items-center justify-between gap-3 mb-5 px-1">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Navegue no Tempo
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-foreground font-bold tracking-tight mt-1">
            Épocas e Gerações
          </h2>
        </div>

        <Link
          to="/categoria/$id"
          params={{ id: "catalogo" }}
          className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary transition-colors shrink-0"
        >
          Ver todo o acervo →
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              to="/categoria/$id"
              params={{ id: card.categoryParam }}
              className={`group relative rounded-3xl p-5 sm:p-6 bg-gradient-to-br ${card.gradient} backdrop-blur-xl border ${card.border} ${card.glow} transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] overflow-hidden flex flex-col justify-between`}
            >
              {/* Efeito sutil de brilho interno no hover */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl bg-black/40 border border-white/10 ${card.accent} shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <span className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-foreground border border-white/10">
                    {card.subtitle}
                  </span>
                </div>

                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">
                  {card.count > 0 ? `${card.count} títulos` : "Coleção clássica"}
                </span>
                <span className={`${card.accent} font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5`}>
                  Explorar →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

