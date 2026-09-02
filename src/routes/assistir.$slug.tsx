import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Share2,
  Tv,
  Sparkles,
  Volume2,
  Clock,
  Film,
  Info,
  LogIn,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PosterCard } from "@/components/PosterCard";
import { getShow, getStaticShow, SHOWS, type Episode, type Show } from "@/data/shows";
import { useAuth } from "@/lib/authContext";
import {
  saveWatchProgress,
  getWatchedEpisodes,
  markEpisodeWatched,
  getLastWatchedEpisodeIndex,
} from "@/lib/watchHistory";
import { trackShowView } from "@/lib/trendingShows";

export const Route = createFileRoute("/assistir/$slug")({
  loader: ({ params }) => {
    // Busca estática no SSR para evitar timeout/erros com SDK cliente do Firebase no servidor
    const show = getStaticShow(params.slug);
    return { show, slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData || !loaderData.show) {
      return {
        meta: [
          { title: "Indisponível — Nostalgiando Desenhos" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { show } = loaderData;
    return {
      meta: [
        { title: `Assistir ${show.title} Online Dublado — Nostalgiando Desenhos` },
        { name: "description", content: show.synopsis },
        { property: "og:title", content: `${show.title} — Nostalgiando Desenhos` },
        { property: "og:description", content: show.synopsis },
      ],
    };
  },
  component: Watch,
});

function Watch() {
  const { show: serverShow, slug } = Route.useLoaderData();
  
  // Resolvemos o show real no cliente.
  const [show, setShow] = useState<Show | undefined>(serverShow);

  useEffect(() => {
    if (!show && typeof window !== "undefined") {
      const fetchDynamic = async () => {
        const dynamicShow = await getShow(slug);
        if (dynamicShow) {
          setShow(dynamicShow);
        }
      };
      fetchDynamic();
    }
  }, [show, slug]);

  const [current, setCurrent] = useState(0);
  const [inList, setInList] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlayingSimulated, setIsPlayingSimulated] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);

  // Carrega episódios assistidos e restaura onde o usuário parou
  useEffect(() => {
    if (show) {
      trackShowView(show.slug);
      const watched = getWatchedEpisodes(user?.uid, show.slug);
      setWatchedEpisodes(watched);

      const lastIndex = getLastWatchedEpisodeIndex(user?.uid, show.slug);
      if (lastIndex !== null && lastIndex >= 0) {
        setCurrent(lastIndex);
      }
    }
  }, [show, user]);

  // Paywall: 40 segundos para usuários não logados
  const { user } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);
  const paywallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Inicia o timer de 40s quando o episódio muda (se não estiver logado)
  const startPaywallTimer = useCallback(() => {
    if (user) return; // Logado = sem paywall
    setShowPaywall(false);
    if (paywallTimerRef.current) clearTimeout(paywallTimerRef.current);
    paywallTimerRef.current = setTimeout(() => {
      setShowPaywall(true);
      // Pausar o vídeo nativo se existir
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }, 40000); // 40 segundos
  }, [user]);

  // Reset paywall quando episódio muda
  useEffect(() => {
    startPaywallTimer();
    return () => {
      if (paywallTimerRef.current) clearTimeout(paywallTimerRef.current);
    };
  }, [current, startPaywallTimer]);

  // Se o usuário faz login enquanto assiste, remover paywall
  useEffect(() => {
    if (user && showPaywall) {
      setShowPaywall(false);
      if (videoRef.current) {
        videoRef.current.play();
      }
    }
  }, [user]);

  // Estado para episódios dinâmicos (Internet Archive)
  const [dynamicEpisodes, setDynamicEpisodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Efeito para buscar episódios dinâmicos se o show possuir archiveId
  useEffect(() => {
    if (show?.archiveId) {
      setIsLoading(true);
      fetch(`https://archive.org/metadata/${show.archiveId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.files) {
            // Filtra apenas arquivos .mp4 e ordena pelo nome (opcional, para garantir ordem)
            const mp4Files = data.files.filter((f: any) => f?.name?.endsWith(".mp4")).sort((a: any, b: any) => (a?.name || "").localeCompare(b?.name || ""));
            
            const mapped = mp4Files.map((f: any, idx: number) => {
              // Tenta extrair a duração se disponível (em segundos)
              let duration = "--:--";
              if (f.length) {
                const secs = Math.floor(parseFloat(f.length));
                const m = Math.floor(secs / 60);
                const s = secs % 60;
                duration = `${m}:${s.toString().padStart(2, "0")}`;
              }

              // Limpa o nome do arquivo usando o mesmo padrão do script
              const cleanName = decodeURIComponent(f.name)
                .replace('.mp4', '')
                .replace(/_/g, ' ')
                .replace(/-/g, ' ')
                .replace(/\+/g, ' ')
                .replace(/ready/gi, '')
                .trim();
              
              return {
                id: f.name,
                title: f.title || cleanName || `Episódio ${idx + 1}`,
                synopsis: "Episódio resgatado do catálogo clássico dublado.",
                duration: duration,
                videoUrl: `https://archive.org/download/${show.archiveId}/${f.name}`,
              };
            });
            setDynamicEpisodes(mapped);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [show?.slug, show?.archiveId]);

  if (!show) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-16 flex items-center justify-center">
        <h1 className="text-2xl text-white">Carregando...</h1>
      </div>
    );
  }

  // Define a lista de episódios (dinâmica ou estática do mock)
  const episodesList = dynamicEpisodes.length > 0 ? dynamicEpisodes : (show.episodes || []);
  const episode = episodesList[current] || (show.episodes && show.episodes.length > 0 ? show.episodes[0] : {
    id: "empty",
    title: "Sem Episódios",
    synopsis: "Nenhum episódio foi encontrado para este desenho ainda.",
    duration: "--:--",
    videoUrl: ""
  });
  const related = SHOWS.filter((s) => s.slug !== show.slug).slice(0, 6);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setIsPlayingSimulated(true);
    }
  };

  const handleNext = () => {
    if (current < episodesList.length - 1) {
      setCurrent(current + 1);
      setIsPlayingSimulated(true);
    }
  };

  if (!show) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-16 flex items-center justify-center">
        <h1 className="text-2xl text-white">Carregando...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28 pb-16 sm:pt-28">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:text-sm">
            <ChevronLeft className="h-4 w-4" /> Voltar para o Início
          </Link>
          <span className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-medium text-accent border border-border/40">
            {show.title}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/80 bg-black shadow-2xl">
              {!episode ? (
                <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <Tv className="h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum episódio encontrado para este título.</p>
                </div>
              ) : episode.videoUrl ? (
                <>
                  {episode.videoUrl.endsWith('.mp4') ? (
                    <video
                      key={episode.id}
                      ref={videoRef}
                      src={episode.videoUrl}
                      controls
                      autoPlay
                      className="absolute inset-0 h-full w-full object-cover bg-black"
                    />
                  ) : (
                    <iframe
                      key={episode.id}
                      src={episode.videoUrl}
                      title={`${show.title} - ${episode.title}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full border-0"
                    />
                  )}

                  {showPaywall && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-500">
                      <div className="max-w-md text-center p-6">
                        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-amber-600/20 border border-primary/30 shadow-[0_0_40px_rgba(217,119,6,0.2)]">
                          <Lock className="h-9 w-9 text-primary" />
                        </div>
                        <h3 className="font-display text-2xl font-bold text-foreground mb-2">Gostou do que viu?</h3>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                          Faça login ou crie sua conta <strong className="text-foreground">gratuita</strong> para continuar assistindo.
                        </p>
                        <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-primary to-amber-600 text-primary-foreground font-bold text-sm">
                          <LogIn className="h-4 w-4" /> Entrar / Criar Conta
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative h-full w-full select-none overflow-hidden bg-gradient-to-t from-black via-zinc-950 to-zinc-900">
                  <img src={show.poster} alt={show.title} className="absolute inset-0 h-full w-full object-cover opacity-20 filter blur-xl scale-110" />
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <button onClick={() => setIsPlayingSimulated(!isPlayingSimulated)} className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Play className="h-9 w-9 fill-current translate-x-1" />
                    </button>
                    <p className="mt-2 text-lg font-bold text-foreground">{episode.title}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Episódio {current + 1} de {episodesList.length}</span>
                  <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">{episode.title}</h1>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                  <button onClick={handlePrev} disabled={current === 0} className="h-11 px-3.5 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold hover:bg-secondary">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={handleNext} disabled={current === episodesList.length - 1} className="h-11 px-3.5 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold hover:bg-secondary">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button onClick={() => setInList(!inList)} className="h-11 px-3.5 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold flex items-center gap-1.5">
                    {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Lista
                  </button>
                  <button onClick={handleShare} className="h-11 px-3.5 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-card">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Film className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-bold text-foreground">Todos os Episódios</h2>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2.5 max-h-[580px] overflow-y-auto pr-1">
                {episodesList.map((epItem, index) => {
                  const isActive = index === current;
                  const isWatched = watchedEpisodes.includes(epItem.id);
                  return (
                    <button
                      key={epItem.id}
                      onClick={() => setCurrent(index)}
                      className={`group relative flex items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                        isActive ? "border-primary bg-primary/15" : "border-border/70 bg-secondary/30"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`block truncate font-bold text-sm ${isActive ? "text-primary" : "text-foreground"}`}>{epItem.title}</span>
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-muted-foreground">{epItem.duration}</span>
                          <div className="flex items-center gap-1.5">
                            {isWatched && !isActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                                <CheckCircle2 className="h-3 w-3" /> Assistido
                              </span>
                            )}
                            {isActive && <span className="font-bold text-primary animate-pulse text-[11px]">Assistindo</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RECOMENDAÇÕES */}
        <section className="mt-16 border-t border-border/60 pt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                Continue Nostalgiando
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Outras animações e séries clássicas que marcaram época
              </p>
            </div>
            <Link
              to="/categoria/$id"
              params={{ id: "catalogo" }}
              className="text-xs sm:text-sm font-semibold text-primary hover:underline"
            >
              Ver Catálogo Completo →
            </Link>
          </div>

          <div className="mt-6 -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {related.map((s) => (
              <PosterCard key={s.slug} show={s} />
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
        Nostalgiando Desenhos · seu portal definitivo de animações retrô.
      </footer>
    </div>
  );
}

