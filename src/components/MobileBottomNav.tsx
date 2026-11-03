import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Film, Shuffle, Sparkles, Crown } from "lucide-react";
import { getCachedShows } from "@/data/shows";

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Sorteio aleatório para o botão central
  const handleRandomTune = () => {
    const shows = getCachedShows();
    if (shows && shows.length > 0) {
      const randomIndex = Math.floor(Math.random() * shows.length);
      const chosen = shows[randomIndex];
      if (chosen?.slug) {
        navigate({
          to: "/assistir/$slug",
          params: { slug: chosen.slug },
          search: { autoplay: true } as any,
        });
      }
    } else {
      navigate({ to: "/" });
    }
  };

  const navItems = [
    {
      to: "/",
      label: "Início",
      icon: Home,
      isActive: currentPath === "/",
    },
    {
      to: "/categoria/$id",
      params: { id: "todos" },
      label: "Catálogo",
      icon: Film,
      isActive: currentPath.startsWith("/categoria"),
    },
    {
      action: handleRandomTune,
      label: "Sintonizar",
      icon: Shuffle,
      isSpecial: true,
    },
    {
      to: "/pedidos",
      label: "Pedidos",
      icon: Sparkles,
      isActive: currentPath === "/pedidos",
    },
    {
      to: "/vip",
      label: "VIP",
      icon: Crown,
      isActive: currentPath === "/vip",
      isVipHighlight: true,
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/85 backdrop-blur-2xl border-t border-white/10 pb-[calc(env(safe-area-inset-bottom,8px)+6px)] pt-1.5 px-3 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item, idx) => {
          if (item.isSpecial) {
            return (
              <button
                key={idx}
                onClick={item.action}
                className="flex flex-col items-center justify-center -mt-5 relative active:scale-90 transition-transform cursor-pointer"
                title="Sintonizar TV"
              >
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-500 text-zinc-950 grid place-items-center shadow-[0_0_20px_rgba(245,158,11,0.5)] border-2 border-zinc-950">
                  <Shuffle className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-amber-400 mt-1">
                  {item.label}
                </span>
              </button>
            );
          }

          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={idx}
              to={item.to as any}
              params={item.params as any}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 ${
                active
                  ? "text-primary font-bold"
                  : item.isVipHighlight
                  ? "text-amber-400/90 font-semibold hover:text-amber-300"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${active ? "text-primary" : item.isVipHighlight ? "text-amber-400" : ""}`} />
                {item.isVipHighlight && (
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
