import { useState, useEffect } from "react";
import {
  Search,
  Sparkles,
  Film,
  Tv,
  Check,
  X,
  Loader2,
  Calendar,
  Star,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import {
  searchTmdb,
  getStoredTmdbKey,
  setStoredTmdbKey,
  cleanTitleForTmdb,
  type TmdbResult,
} from "@/lib/tmdb";

interface TmdbSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  onSelect: (data: {
    title: string;
    poster: string;
    backdropUrl?: string;
    year: string;
    synopsis: string;
  }) => void;
}

export function TmdbSearchModal({
  isOpen,
  onClose,
  initialQuery,
  onSelect,
}: TmdbSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [apiKey, setApiKey] = useState(() => getStoredTmdbKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const clean = cleanTitleForTmdb(initialQuery);
      setQuery(clean);
      setResults([]);
      setHasSearched(false);
      if (clean && (apiKey || getStoredTmdbKey())) {
        performSearch(clean);
      }
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const performSearch = async (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;

    const currentKey = apiKey || getStoredTmdbKey();
    if (!currentKey) {
      setShowKeyInput(true);
      toast.info("Informe a chave de API do TMDB para consultar dados oficiais.");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const found = await searchTmdb(term, currentKey);
      setResults(found);
      if (found.length === 0) {
        toast.info("Nenhum resultado encontrado no TMDB para este título.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao consultar TMDB.");
      setShowKeyInput(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      setStoredTmdbKey(apiKey.trim());
      toast.success("Chave TMDB gravada!");
      setShowKeyInput(false);
      if (query.trim()) {
        performSearch(query.trim());
      }
    } else {
      toast.error("Digite uma chave de API válida.");
    }
  };

  const handleChoose = (item: TmdbResult) => {
    onSelect({
      title: item.title,
      poster: item.posterUrl || "",
      backdropUrl: item.backdropUrl || undefined,
      year: item.year || "Clássico",
      synopsis: item.overview || "",
    });
    toast.success(`Dados oficiais de "${item.title}" aplicados!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-primary flex items-center justify-center text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Buscar Metadados no TMDB
              </h2>
              <p className="text-xs text-muted-foreground">
                Consulte pôsteres HD (w780), backdrops (w1280), sinopse e ano oficial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-white/10 bg-secondary/30 hover:bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Gerenciador de Chave TMDB */}
        {(showKeyInput || !apiKey) && (
          <div className="my-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-sm space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Key className="h-4 w-4" />
              Configurar Chave de API do TMDB
            </div>
            <p className="text-xs text-muted-foreground">
              Para buscar capas oficiais, informe sua chave v3 gratuita (obtenha em{" "}
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline font-medium"
              >
                themoviedb.org
              </a>
              ) ou defina <code className="text-foreground">VITE_TMDB_API_KEY</code> no .env:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua TMDB API Key aqui (ex: 32 caracteres)"
                className="flex-1 h-10 px-3 rounded-xl border border-white/10 bg-black/40 text-sm text-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all"
              >
                Salvar Chave
              </button>
            </div>
          </div>
        )}

        {/* Search Input Bar */}
        <div className="pt-4 pb-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performSearch(query);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite o título do desenho (ex: YuYu Hakusho, Zé Colmeia)..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-secondary/40 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar
            </button>
            {!showKeyInput && (
              <button
                type="button"
                onClick={() => setShowKeyInput(true)}
                title="Configurar Chave TMDB"
                className="px-3 h-11 rounded-xl border border-white/10 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50 flex items-center justify-center transition-all"
              >
                <Key className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[260px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Consultando The Movie Database...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <div
                key={`${item.mediaType}-${item.id}`}
                className="group p-3.5 rounded-2xl border border-white/5 bg-zinc-900/60 hover:bg-zinc-900 hover:border-primary/40 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                <div className="flex gap-3.5 items-start">
                  {/* Poster Thumbnail */}
                  <div className="w-16 h-24 shrink-0 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 relative shadow-md">
                    {item.posterUrl ? (
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-[10px] text-center p-1">
                        <Film className="h-5 w-5 mb-1 opacity-40" />
                        Sem capa
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-base">
                        {item.title}
                      </span>
                      {item.year && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-white/10 text-muted-foreground font-mono">
                          <Calendar className="h-3 w-3" />
                          {item.year}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30">
                        {item.mediaType === "tv" ? "Série / Desenho" : "Filme"}
                      </span>
                      {item.voteAverage > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-400 font-bold">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {item.voteAverage}
                        </span>
                      )}
                    </div>

                    {item.originalTitle && item.originalTitle !== item.title && (
                      <p className="text-xs text-muted-foreground italic">
                        Original: {item.originalTitle}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground/90 line-clamp-2 max-w-xl">
                      {item.overview || "Sinopse não disponível em português."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleChoose(item)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-2 shadow-md shrink-0 transition-all active:scale-95"
                >
                  <Check className="h-4 w-4" />
                  Aplicar Dados
                </button>
              </div>
            ))
          ) : hasSearched ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <Film className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm font-semibold">Nenhum desenho encontrado</p>
              <p className="text-xs">
                Tente simplificar o título ou remover pontuações (ex: "X-Men" -&gt; "X Men").
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground/60 space-y-2">
              <Tv className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm">Digite o nome do desenho e clique em "Buscar".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
