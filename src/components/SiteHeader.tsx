import { Link } from "@tanstack/react-router";
import { Search, Tv } from "lucide-react";
import { CATEGORIES } from "@/data/shows";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground shadow-[0_0_15px_rgba(217,119,6,0.5)]">
              <Tv className="h-5 w-5" />
            </span>
            <span className="min-w-0 font-display text-lg tracking-tight">
              <span className="block truncate leading-tight text-primary font-bold text-shadow-premium">Nostalgiando</span>
              <span className="block truncate text-[10px] font-bold leading-tight tracking-[0.3em] text-accent/90">
                DESENHOS
              </span>
            </span>
          </Link>

          <label className="relative hidden w-full max-w-md items-center sm:flex group">
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="search"
              placeholder="Buscar desenhos, heróis, episódios..."
              className="h-10 w-full rounded-full border border-white/10 bg-secondary/30 backdrop-blur-md pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </label>

          <button
            aria-label="Buscar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-secondary/30 text-foreground sm:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-4 -mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={c.id === "todos" ? "/" : `/#${c.id}`}
              className="shrink-0 rounded-full border border-white/5 bg-secondary/20 px-5 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground transition-all hover:bg-secondary/40 hover:text-foreground active:scale-95"
            >
              {c.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
