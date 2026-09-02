import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Tv, Settings, LogIn, User, LogOut, ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/data/shows";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/authContext";

export function SiteHeader() {
  const { user, isAdmin, logout, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdminClick = () => {
    navigate({ to: "/admin" });
  };

  const handleLogout = async () => {
    await logout();
    logoutAdmin();
    setUserMenuOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-7xl px-3.5 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-85 active:scale-98"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground shadow-[0_0_20px_rgba(217,119,6,0.4)]">
              <Tv className="h-6 w-6" />
            </span>
            <span className="min-w-0 font-display text-lg sm:text-xl tracking-tight leading-tight">
              <span className="block truncate text-primary font-bold text-shadow-premium">
                Nostalgiando
              </span>
              <span className="block truncate text-[11px] font-bold tracking-[0.25em] text-accent/90">
                DESENHOS
              </span>
            </span>
          </Link>

          {/* Busca no Desktop */}
          <label className="relative hidden w-full max-w-md items-center md:flex group">
            <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="search"
              placeholder="Buscar desenhos, heróis, episódios..."
              className="h-11 w-full rounded-full border border-white/10 bg-secondary/40 backdrop-blur-md pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </label>

          {/* Ações do Header: ADM + Login/Usuário */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão Admin */}
            <button
              onClick={handleAdminClick}
              className="flex items-center gap-2 h-11 px-3.5 sm:px-4 rounded-full border border-white/10 bg-secondary/40 text-muted-foreground hover:text-primary hover:bg-secondary/60 hover:border-primary/30 transition-all text-sm font-bold active:scale-95"
              title="Painel de Administração"
            >
              <Settings className="h-4 w-4" />
              <span>ADM</span>
            </button>

            {/* Login / Usuário */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 h-11 px-3.5 rounded-full border border-white/10 bg-secondary/40 text-foreground hover:bg-secondary/60 transition-all active:scale-95"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-amber-600 text-primary-foreground text-xs font-bold shadow-sm">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                  <span className="hidden sm:block text-sm font-semibold max-w-[120px] truncate">
                    {user.email?.split("@")[0]}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-white/10 bg-card/95 backdrop-blur-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="px-3.5 py-2.5 border-b border-border/60 mb-1">
                      <p className="text-sm font-bold text-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Conta Conectada</p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all font-semibold"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair da Conta
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 h-11 px-4 sm:px-5 rounded-full bg-gradient-to-r from-primary to-amber-600 text-primary-foreground text-sm font-bold shadow-[0_0_20px_rgba(217,119,6,0.35)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] transition-all hover:scale-[1.02] active:scale-[0.97]"
              >
                <LogIn className="h-4 w-4" />
                <span>Entrar</span>
              </Link>
            )}
          </div>
        </div>

        {/* Navegação de Categorias / Prateleiras com toque fluido */}
        <nav className="mt-3 -mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={c.id === "todos" ? "/" : `/#${c.id}`}
              className="shrink-0 rounded-full border border-white/5 bg-secondary/30 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold tracking-wide text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground active:scale-95"
            >
              {c.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
