import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Tv,
  Settings,
  LogIn,
  User,
  LogOut,
  ChevronDown,
  Shuffle,
  X,
  Sparkles,
  Film,
  Crown,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/authContext";
import { getCachedShows, type Show } from "@/data/shows";
import { normalizeYear } from "@/lib/normalizeCatalog";

export function SiteHeader() {
  const { user, isAdmin, isVip, logout, logoutAdmin } = useAuth();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [shows, setShows] = useState<Show[]>(() => getCachedShows());

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Carrega catálogo para a busca instantânea
  useEffect(() => {
    const handleCatalogUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setShows(e.detail);
      } else {
        setShows(getCachedShows());
      }
    };
    window.addEventListener("catalog_updated", handleCatalogUpdate);
    window.addEventListener("storage", handleCatalogUpdate);
    return () => {
      window.removeEventListener("catalog_updated", handleCatalogUpdate);
      window.removeEventListener("storage", handleCatalogUpdate);
    };
  }, []);

  // Atalho global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === "Escape") {
        setIsSearchFocused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtragem instantânea dos desenhos
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return shows
      .filter((s) => {
        const titleMatch = (s?.title || "").toLowerCase().includes(q);
        const slugMatch = (s?.slug || "").toLowerCase().includes(q);
        const yearMatch = (s?.year || "").includes(q);
        return titleMatch || slugMatch || yearMatch;
      })
      .slice(0, 7);
  }, [searchQuery, shows]);

  // Função Sintonizar TV (Sorteio Aleatório de Desenho)
  const handleRandomTune = () => {
    if (!shows || shows.length === 0) return;
    const randomIndex = Math.floor(Math.random() * shows.length);
    const randomShow = shows[randomIndex];
    if (randomShow?.slug) {
      navigate({
        to: "/assistir/$slug",
        params: { slug: randomShow.slug },
        search: { autoplay: true } as any,
      });
    }
  };

  const handleAdminClick = () => {
    navigate({ to: "/admin" });
  };

  const handleLogout = async () => {
    await logout();
    logoutAdmin();
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/75 border-b border-white/10 shadow-2xl transition-all">
      <div className="mx-auto max-w-7xl px-3.5 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Bloco Esquerdo: Logo */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-90 active:scale-95"
            >
              <span className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary via-amber-500 to-amber-600 text-primary-foreground shadow-[0_0_20px_rgba(217,119,6,0.45)] border border-white/20">
                <Tv className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <span className="hidden xs:block min-w-0 font-display text-base sm:text-xl tracking-tight leading-tight">
                <span className="block truncate text-primary font-bold text-shadow-premium">
                  Nostalgiando
                </span>
                <span className="block truncate text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-accent/90">
                  DESENHOS
                </span>
              </span>
            </Link>
          </div>

          {/* Barra de Busca Instantânea com Atalho Ctrl+K */}
          <div className="relative flex-1 max-w-md mx-1 sm:mx-3" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Buscar desenhos clássicos..."
                className="h-10 w-full rounded-full border border-white/10 bg-secondary/40 backdrop-blur-md pl-10 pr-16 sm:pr-20 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />

              {/* Botão Limpar ou Badge de Atalho */}
              <div className="absolute right-3 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Limpar busca"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                    Ctrl K
                  </kbd>
                )}
              </div>
            </div>

            {/* Dropdown / Modal de Resultados em Tempo Real */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-white/5">
                      <span>Resultados ({searchResults.length})</span>
                      <span className="text-[10px] text-primary">Enter para abrir</span>
                    </div>

                    {searchResults.map((item) => (
                      <Link
                        key={item.slug}
                        to="/assistir/$slug"
                        params={{ slug: item.slug }}
                        onClick={() => {
                          setIsSearchFocused(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary/60 transition-colors group cursor-pointer"
                      >
                        <div className="h-10 w-8 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                          {item.poster ? (
                            <img
                              src={item.poster}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-primary">
                              <Film className="h-4 w-4" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary truncate transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {normalizeYear(item.year).displayYear} ·{" "}
                            {item.episodes?.length || 0} episódios
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Nenhum desenho encontrado para "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bloco Direito: Botão Sintonizar TV + ADM + Perfil */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Botão Sintonizar TV (Aleatório) */}
            <button
              onClick={handleRandomTune}
              className="flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-300 hover:text-white hover:border-amber-500/60 hover:from-amber-500/25 hover:to-orange-500/25 transition-all text-xs sm:text-sm font-bold active:scale-95 cursor-pointer shadow-sm"
              title="Assistir a um desenho aleatório agora!"
            >
              <Shuffle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 animate-pulse" />
              <span className="hidden md:inline">Sintonizar TV</span>
              <span className="md:hidden">Aleatório</span>
            </button>

            {/* Botão Pedidos da Comunidade */}
            <Link
              to="/pedidos"
              className="hidden lg:flex items-center gap-1.5 h-10 px-3.5 rounded-full border border-white/10 bg-secondary/40 text-muted-foreground hover:text-amber-400 hover:border-amber-500/30 transition-all text-xs font-bold active:scale-95"
              title="Mural de pedidos de desenhos e votação"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Pedidos</span>
            </Link>

            {/* Botão Clube VIP Destaque */}
            <Link
              to="/vip"
              className="flex items-center gap-1.5 h-10 px-3 sm:px-3.5 rounded-full border border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 text-amber-300 hover:text-white hover:border-amber-400 transition-all text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.25)] active:scale-95"
              title="Clube Nostalgia VIP"
            >
              <Crown className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span>VIP</span>
            </Link>

            {/* Botão Admin */}
            <button
              onClick={handleAdminClick}
              className="flex items-center gap-1.5 h-10 px-3 rounded-full border border-white/10 bg-secondary/40 text-muted-foreground hover:text-primary hover:bg-secondary/60 hover:border-primary/30 transition-all text-xs font-bold active:scale-95 cursor-pointer"
              title="Painel de Administração"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">ADM</span>
            </button>

            {/* Login / Perfil do Usuário */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 h-10 px-2.5 sm:px-3.5 rounded-full border border-white/10 bg-secondary/40 text-foreground hover:bg-secondary/60 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-amber-600 text-primary-foreground text-xs font-bold shadow-sm">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                  <span className="hidden sm:block text-xs sm:text-sm font-semibold max-w-[110px] truncate">
                    {user.email?.split("@")[0]}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="px-3.5 py-2.5 border-b border-white/10 mb-2">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-xs font-semibold text-muted-foreground">Conectado como</p>
                        {isVip && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                            <Crown className="h-2.5 w-2.5" /> VIP
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <User className="h-4 w-4 text-primary" />
                      Meu Perfil
                    </Link>

                    <Link
                      to="/pedidos"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      Mural de Pedidos
                    </Link>

                    <Link
                      to="/vip"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-amber-300 hover:bg-amber-500/15 transition-colors"
                    >
                      <Crown className="h-4 w-4 text-amber-400" />
                      Clube VIP
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-primary hover:bg-secondary/60 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Painel de Controle
                      </Link>
                    )}

                    <div className="my-1.5 border-t border-white/10" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 h-10 px-3.5 sm:px-4 rounded-full bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-md transition-all hover:bg-primary/90 active:scale-95 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
