import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PosterCard } from "@/components/PosterCard";
import { CategoriesNavPanel } from "@/components/CategoriesNavPanel";
import { getShow, getStaticShow, getCachedShows, getAllShows, type Episode, type Show } from "@/data/shows";
import { useAuth } from "@/lib/authContext";
import {
  saveWatchProgress,
  getEpisodeProgress,
  getAllEpisodesProgressForShow,
  resetEpisodeProgress,
  formatTime,
  getWatchedEpisodes,
  markEpisodeWatched,
  getLastWatchedEpisodeIndex,
  getWatchHistory,
  type WatchHistoryItem,
  type EpisodeProgress,
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
  const { user, isAdmin } = useAuth();
  
  // Resolvemos o show real no cliente (atualiza da nuvem/Firestore mesmo se houver mock no SSR)
  const [show, setShow] = useState<Show | undefined>(serverShow);
  const [allShows, setAllShows] = useState<Show[]>(() => getCachedShows());

  useEffect(() => {
    let isMounted = true;
    if (typeof window !== "undefined") {
      getShow(slug).then((dynamicShow) => {
        if (isMounted && dynamicShow) {
          setShow(dynamicShow);
        }
      });

      getAllShows().then((dynamicShows) => {
        if (isMounted && dynamicShows && dynamicShows.length > 0) {
          setAllShows(dynamicShows);
        }
      });

      const handleCatalogUpdate = (e: any) => {
        const showsList = e?.detail && Array.isArray(e.detail) ? e.detail : getCachedShows();
        if (isMounted) {
          setAllShows(showsList);
          const currentUpdated = showsList.find((s: Show) => s.slug === slug);
          if (currentUpdated) {
            setShow(currentUpdated);
          }
        }
      };

      window.addEventListener("catalog_updated", handleCatalogUpdate);
      window.addEventListener("storage", handleCatalogUpdate);

      return () => {
        isMounted = false;
        window.removeEventListener("catalog_updated", handleCatalogUpdate);
        window.removeEventListener("storage", handleCatalogUpdate);
      };
    }
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const [current, setCurrent] = useState(0);
  const [inList, setInList] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlayingSimulated, setIsPlayingSimulated] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);
  const [savedLastIndex, setSavedLastIndex] = useState<number | null>(null);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(() => getWatchHistory(user?.uid));
  const [episodesProgressMap, setEpisodesProgressMap] = useState<Record<string, EpisodeProgress>>({});
  const [resumeBanner, setResumeBanner] = useState<{
    timestamp: number;
    formatted: string;
    percent: number;
  } | null>(null);
  const [epSearch, setEpSearch] = useState("");
  const lastSavedTimeRef = useRef<number>(0);
  const hasRestoredTimeRef = useRef<string | null>(null);

  // Escuta atualizações do histórico de episódios
  useEffect(() => {
    const handleHistUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setWatchHistory(e.detail);
      } else {
        setWatchHistory(getWatchHistory(user?.uid));
      }
    };
    window.addEventListener("watch_history_updated", handleHistUpdate);
    window.addEventListener("storage", handleHistUpdate);
    return () => {
      window.removeEventListener("watch_history_updated", handleHistUpdate);
      window.removeEventListener("storage", handleHistUpdate);
    };
  }, [user?.uid]);

  // Escuta e carrega progressos granulares dos episódios
  useEffect(() => {
    if (show?.slug) {
      const progressMap = getAllEpisodesProgressForShow(user?.uid, show.slug);
      setEpisodesProgressMap(progressMap);
    }

    const handleEpProgressUpdate = (e: any) => {
      if (e?.detail?.showSlug === show?.slug && e.detail.episodeId && e.detail.progress) {
        setEpisodesProgressMap((prev) => ({
          ...prev,
          [e.detail.episodeId]: e.detail.progress,
        }));
      }
    };
    window.addEventListener("episode_progress_updated", handleEpProgressUpdate);
    return () => {
      window.removeEventListener("episode_progress_updated", handleEpProgressUpdate);
    };
  }, [show?.slug, user?.uid]);

  // Carrega episódios assistidos e restaura onde o usuário parou
  useEffect(() => {
    if (show) {
      trackShowView(show.slug);
      const watched = getWatchedEpisodes(user?.uid, show.slug);
      setWatchedEpisodes(watched);

      const lastIndex = getLastWatchedEpisodeIndex(user?.uid, show.slug);
      setSavedLastIndex(lastIndex);
      if (lastIndex !== null && lastIndex >= 0) {
        setCurrent(lastIndex);
      }
    }
  }, [show?.slug, user?.uid]);

  // Paywall: 40 segundos para usuários não logados
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
    const rawArchiveId = show?.archiveId;
    if (!rawArchiveId) return;

    // Sanitiza e limpa o archiveId (extrai ID se usuário colou URL completa ou se tiver nome de arquivo)
    let safeId = rawArchiveId.trim();
    if (safeId.includes("archive.org/details/")) {
      safeId = safeId.split("archive.org/details/")[1]?.split("/")[0]?.split("?")[0] || safeId;
    } else if (safeId.includes("archive.org/embed/")) {
      safeId = safeId.split("archive.org/embed/")[1]?.split("/")[0]?.split("?")[0] || safeId;
    } else if (safeId.includes("archive.org/download/")) {
      safeId = safeId.split("archive.org/download/")[1]?.split("/")[0]?.split("?")[0] || safeId;
    }
    if (safeId.toLowerCase().includes("caverna") && (safeId.includes(".mp4") || safeId.includes("Amanha"))) {
      safeId = "caverna-do-dragao-completo-ptbr-paixaoflix";
    }
    safeId = safeId.replace(/[^a-zA-Z0-9_.-]/g, "");

    if (!safeId) return;

    setIsLoading(true);
    fetch(`https://archive.org/metadata/${safeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.files) {
          const isVideoFile = (name: string) => {
            const lower = name.toLowerCase();
            return (
              lower.endsWith(".mp4") ||
              lower.endsWith(".mkv") ||
              lower.endsWith(".webm") ||
              lower.endsWith(".avi") ||
              lower.endsWith(".ogv") ||
              lower.endsWith(".m4v")
            );
          };

          const videoFiles = data.files
            .filter((f: any) => {
              if (!f?.name) return false;
              const lower = f.name.toLowerCase();
              if (
                lower.endsWith(".xml") ||
                lower.endsWith(".sqlite") ||
                lower.endsWith(".torrent") ||
                lower.endsWith(".png") ||
                lower.endsWith(".jpg") ||
                lower.endsWith(".json")
              ) {
                return false;
              }
              return (
                isVideoFile(f.name) ||
                f.format === "h.264" ||
                f.format === "MPEG4" ||
                f.format === "Matroska" ||
                f.format === "512Kb MPEG4" ||
                (f.format && f.format.toLowerCase().includes("video"))
              );
            })
            .sort((a: any, b: any) =>
              (a?.name || "").localeCompare(b?.name || "", undefined, {
                numeric: true,
                sensitivity: "base",
              })
            );

          const mapped = videoFiles.map((f: any, idx: number) => {
            let duration = "--:--";
            if (f.length) {
              const secs = Math.floor(parseFloat(f.length));
              const m = Math.floor(secs / 60);
              const s = secs % 60;
              duration = `${m}:${s.toString().padStart(2, "0")}`;
            }

            const baseName = (f.name || "").split("/").pop() || f.name;
            const cleanName = decodeURIComponent(baseName)
              .replace(/\.(mp4|mkv|avi|webm|ogv|m4v)$/i, "")
              .replace(/_/g, " ")
              .replace(/-/g, " ")
              .replace(/ready/gi, "")
              .replace(/hidratorrent\.com/gi, "")
              .trim();

            const isMp4OrWebm =
              f.name.toLowerCase().endsWith(".mp4") || f.name.toLowerCase().endsWith(".webm");

            const videoUrl = isMp4OrWebm
              ? `https://archive.org/download/${safeId}/${encodeURI(f.name)}`
              : `https://archive.org/embed/${safeId}/${encodeURIComponent(f.name)}`;

            return {
              id: f.name,
              title: f.title || cleanName || `Episódio ${idx + 1}`,
              synopsis: "Episódio resgatado do catálogo clássico dublado.",
              duration: duration,
              videoUrl,
            };
          });

          if (mapped.length === 0) {
            setDynamicEpisodes([
              {
                id: "archive-embed-full",
                title: show.title + " (Acervo Completo)",
                synopsis: "Assista aos episódios resgatados diretamente do acervo.",
                duration: "--:--",
                videoUrl: `https://archive.org/embed/${safeId}`,
              },
            ]);
          } else {
            setDynamicEpisodes(mapped);
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar episódios no Internet Archive:", err);
      })
      .finally(() => setIsLoading(false));
  }, [show?.slug, show?.archiveId]);

  if (!show) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-16 flex items-center justify-center">
        <h1 className="text-2xl text-white">Carregando...</h1>
      </div>
    );
  }

  // Define a lista de episódios (prioriza episódios dinâmicos do Archive quando archiveId existe)
  const episodesList = dynamicEpisodes.length > 0 
    ? dynamicEpisodes 
    : (show.archiveId && isLoading 
        ? [] 
        : (show.episodes || []));

  const episode = episodesList[current] || (episodesList.length > 0 ? episodesList[0] : (show.episodes && show.episodes.length > 0 && !show.archiveId ? show.episodes[0] : {
    id: "empty",
    title: isLoading ? "Carregando acervo..." : "Sem Episódios",
    synopsis: isLoading ? "Buscando episódios no Internet Archive..." : "Nenhum episódio foi encontrado para este desenho ainda.",
    duration: "--:--",
    videoUrl: ""
  }));

  // Sincroniza o episódio atual e restaura o ponto de onde o usuário parou
  useEffect(() => {
    if (show && episode && episode.id && episode.id !== "empty") {
      hasRestoredTimeRef.current = null;
      lastSavedTimeRef.current = 0;

      // Recupera o timestamp salvo se existir
      const existingProg =
        episodesProgressMap[episode.id] ||
        getEpisodeProgress(user?.uid, show.slug, episode.id);

      const currentTimestamp = existingProg ? existingProg.timestamp : 0;
      const currentDuration =
        existingProg && existingProg.duration > 0 ? existingProg.duration : 1200;

      saveWatchProgress(user?.uid, {
        showSlug: show.slug,
        showTitle: show.title,
        showPoster: show.poster,
        episodeId: episode.id,
        episodeIndex: current,
        episodeTitle: episode.title,
        timestamp: currentTimestamp,
        duration: currentDuration,
      });

      if (existingProg && existingProg.timestamp > 5 && existingProg.progressPercent < 90) {
        setResumeBanner({
          timestamp: existingProg.timestamp,
          formatted: formatTime(existingProg.timestamp),
          percent: existingProg.progressPercent,
        });
      } else {
        setResumeBanner(null);
      }

      const watched = getWatchedEpisodes(user?.uid, show.slug);
      setWatchedEpisodes(watched);
      const hist = getWatchHistory(user?.uid);
      setWatchHistory(hist);
    }
  }, [show?.slug, current, episode?.id, user?.uid]);

  // Restaura automaticamente a posição exata do vídeo ao carregar os metadados (estilo Netflix)
  const handleLoadedMetadata = () => {
    if (!videoRef.current || !show || !episode || episode.id === "empty") return;
    const existingProg =
      episodesProgressMap[episode.id] ||
      getEpisodeProgress(user?.uid, show.slug, episode.id);

    if (existingProg && existingProg.timestamp > 5 && existingProg.progressPercent < 92) {
      if (hasRestoredTimeRef.current !== episode.id) {
        hasRestoredTimeRef.current = episode.id;
        videoRef.current.currentTime = existingProg.timestamp;
        setResumeBanner({
          timestamp: existingProg.timestamp,
          formatted: formatTime(existingProg.timestamp),
          percent: existingProg.progressPercent,
        });

        // Banner auto-dismiss após 6 segundos
        setTimeout(() => {
          setResumeBanner((prev) => (prev?.timestamp === existingProg.timestamp ? null : prev));
        }, 6000);
      }
    }
  };

  // Salva o ponto exato a cada 3 segundos de reprodução contínua
  const handleTimeUpdate = () => {
    if (!videoRef.current || !show || !episode || episode.id === "empty") return;
    const currentSec = Math.floor(videoRef.current.currentTime);
    const totalDuration = Math.floor(videoRef.current.duration) || 1200;

    if (Math.abs(currentSec - lastSavedTimeRef.current) >= 3) {
      lastSavedTimeRef.current = currentSec;
      saveWatchProgress(user?.uid, {
        showSlug: show.slug,
        showTitle: show.title,
        showPoster: show.poster,
        episodeId: episode.id,
        episodeIndex: current,
        episodeTitle: episode.title,
        timestamp: currentSec,
        duration: totalDuration,
      });
    }
  };

  // Salva imediatamente ao pausar ou ao buscar (seek)
  const handleVideoPause = () => {
    if (!videoRef.current || !show || !episode || episode.id === "empty") return;
    const currentSec = Math.floor(videoRef.current.currentTime);
    const totalDuration = Math.floor(videoRef.current.duration) || 1200;
    saveWatchProgress(user?.uid, {
      showSlug: show.slug,
      showTitle: show.title,
      showPoster: show.poster,
      episodeId: episode.id,
      episodeIndex: current,
      episodeTitle: episode.title,
      timestamp: currentSec,
      duration: totalDuration,
    });
  };

  // Ao finalizar o vídeo, marca como assistido
  const handleVideoEnded = () => {
    if (!show || !episode || episode.id === "empty") return;
    const totalDuration = videoRef.current ? Math.floor(videoRef.current.duration) : 1200;
    markEpisodeWatched(user?.uid, show.slug, episode.id);
    saveWatchProgress(user?.uid, {
      showSlug: show.slug,
      showTitle: show.title,
      showPoster: show.poster,
      episodeId: episode.id,
      episodeIndex: current,
      episodeTitle: episode.title,
      timestamp: totalDuration,
      duration: totalDuration,
    });
    setResumeBanner(null);
  };

  // Recomeçar o episódio do início (00:00)
  const handleRestartEpisode = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    if (show && episode) {
      resetEpisodeProgress(user?.uid, show.slug, episode.id);
      saveWatchProgress(user?.uid, {
        showSlug: show.slug,
        showTitle: show.title,
        showPoster: show.poster,
        episodeId: episode.id,
        episodeIndex: current,
        episodeTitle: episode.title,
        timestamp: 0,
        duration: videoRef.current ? Math.floor(videoRef.current.duration) : 1200,
      });
    }
    setResumeBanner(null);
  };

  const related = useMemo(() => {
    const currentCategory = show.category;
    const sameCat = allShows.filter((s) => s.slug !== show.slug && s.category === currentCategory);
    const otherCat = allShows.filter((s) => s.slug !== show.slug && s.category !== currentCategory);
    return [...sameCat, ...otherCat].slice(0, 10);
  }, [allShows, show.slug, show.category]);

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

  return (
    <div className="min-h-screen bg-background pt-20 pb-16 sm:pt-24">
      <SiteHeader />

      <main className="mx-auto max-w-[1700px] px-3.5 sm:px-6">
        {/* Barra superior de Navegação e Continuar de Onde Parou */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:text-sm"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar para o Início
          </Link>

          <div className="flex items-center gap-2">
            {savedLastIndex !== null && savedLastIndex !== current && (
              <button
                onClick={() => setCurrent(savedLastIndex)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Clique para ir diretamente onde você parou neste desenho"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Continuar do Ep. {savedLastIndex + 1}</span>
              </button>
            )}
            <span className="rounded-full bg-secondary/80 px-3.5 py-1 text-xs font-bold text-accent border border-border/40">
              {show.title}
            </span>
          </div>
        </div>

        {/* Layout Principal: Lateral de Categorias A-Z + Player + Episódios */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6">
          {/* COLUNA LATERAL ESQUERDA: CATEGORIAS E DESENHOS EM ORDEM ALFABÉTICA */}
          <div className="lg:col-span-3 xl:col-span-3 order-2 lg:order-1">
            <CategoriesNavPanel
              currentShowSlug={show.slug}
              allShows={allShows}
              watchHistory={watchHistory}
              className="sticky top-20"
            />
          </div>

          {/* COLUNA CENTRAL: PLAYER DE VÍDEO E DETALHES DO EPISÓDIO */}
          <div className="lg:col-span-6 xl:col-span-6 order-1 lg:order-2 space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/80 bg-black shadow-2xl">
              {isLoading ? (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-black/95">
                  <div className="relative mb-3 flex items-center justify-center">
                    <span className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <Tv className="absolute h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Conectando ao acervo do Internet Archive...</p>
                  <p className="text-xs text-muted-foreground mt-1">Carregando catálogo de episódios dublados</p>
                </div>
              ) : !episode ? (
                <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <Tv className="h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum episódio encontrado para este título.</p>
                </div>
              ) : episode.videoUrl ? (
                <>
                  {episode.videoUrl.includes(".mp4") && !episode.videoUrl.includes("/embed/") ? (
                    <video
                      key={episode.id}
                      ref={videoRef}
                      src={episode.videoUrl}
                      controls
                      autoPlay
                      playsInline
                      onLoadedMetadata={handleLoadedMetadata}
                      onCanPlay={handleLoadedMetadata}
                      onTimeUpdate={handleTimeUpdate}
                      onPause={handleVideoPause}
                      onSeeked={handleVideoPause}
                      onEnded={handleVideoEnded}
                      className="absolute inset-0 h-full w-full object-contain bg-black"
                    />
                  ) : (
                    <iframe
                      key={episode.id}
                      src={episode.videoUrl}
                      title={`${show.title} - ${episode.title}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full border-0 bg-black"
                    />
                  )}

                  {/* Banner Flutuante Estilo Netflix: Continuando de onde parou */}
                  {resumeBanner && (
                    <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-3 rounded-2xl bg-black/90 backdrop-blur-md border border-primary/40 px-3.5 py-2.5 text-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/20 text-primary border border-primary/30 shrink-0">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-bold truncate">
                            Continuando de onde você parou:{" "}
                            <span className="text-primary font-mono">{resumeBanner.formatted}</span> ({resumeBanner.percent}%)
                          </p>
                          <p className="text-[10px] text-muted-foreground hidden sm:block">
                            Posição exata restaurada automaticamente estilo Netflix
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={handleRestartEpisode}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                          title="Reiniciar este episódio do minuto 00:00"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Do início</span>
                        </button>
                        <button
                          onClick={() => setResumeBanner(null)}
                          className="text-white/60 hover:text-white text-xs px-1.5 py-1 cursor-pointer"
                          title="Fechar aviso"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
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
                <div className="relative h-full w-full select-none overflow-hidden bg-gradient-to-t from-black via-zinc-950 to-zinc-900 flex flex-col items-center justify-center p-6 text-center">
                  <img src={show.poster} alt={show.title} className="absolute inset-0 h-full w-full object-cover opacity-15 filter blur-2xl scale-110" />
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />
                  <div className="relative z-10 max-w-md flex flex-col items-center">
                    <span className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-3 shadow-[0_0_30px_rgba(245,158,11,0.2)] animate-pulse">
                      <Tv className="h-8 w-8" />
                    </span>
                    <h3 className="font-display text-xl font-bold text-foreground mb-1">
                      {episode.title || "Aguardando Episódios"}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      Este título clássico faz parte do catálogo oficial. O acervo de vídeos no Internet Archive ainda não foi vinculado a este título.
                    </p>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-colors"
                      >
                        <Film className="h-3.5 w-3.5" />
                        Vincular ID do Archive no Painel
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Controles e Informações do Episódio */}
            <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Episódio {current + 1} de {episodesList.length}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.2 rounded border border-emerald-500/30">
                      Progresso Salvo
                    </span>
                  </div>
                  <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-foreground">{episode.title}</h1>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
                  <button onClick={handlePrev} disabled={current === 0} className="h-10 px-3 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold hover:bg-secondary disabled:opacity-40 cursor-pointer">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={handleNext} disabled={current === episodesList.length - 1} className="h-10 px-3 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold hover:bg-secondary disabled:opacity-40 cursor-pointer">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button onClick={() => setInList(!inList)} className="h-10 px-3 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    {inList ? <Check className="h-4 w-4 text-emerald-400" /> : <Plus className="h-4 w-4" />} Lista
                  </button>
                  <button onClick={handleShare} className="h-10 px-3 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold cursor-pointer" title="Compartilhar Link">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA LATERAL DIREITA: TODOS OS EPISÓDIOS DO TÍTULO ATUAL */}
          <div className="lg:col-span-3 xl:col-span-3 order-3">
            <div className="rounded-3xl border border-border/80 bg-card shadow-card sticky top-20 overflow-hidden">
              {/* Header do painel */}
              <div className="px-4 pt-4 pb-3 border-b border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-sm font-bold text-foreground">Episódios</h2>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full border border-border/40">
                    {episodesList.length} ep.
                  </span>
                </div>

                {/* Campo de busca — aparece sempre se tiver mais de 8 episódios */}
                {episodesList.length > 8 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={epSearch}
                      onChange={(e) => setEpSearch(e.target.value)}
                      placeholder="Buscar episódio..."
                      className="w-full h-8 rounded-xl bg-secondary/50 border border-border/50 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 focus:bg-secondary/70 transition-all"
                    />
                    {epSearch && (
                      <button
                        onClick={() => setEpSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Lista de episódios */}
              <div className="max-h-[calc(100vh-260px)] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
                {isLoading ? (
                  <div className="p-3 space-y-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="animate-pulse flex items-center gap-2.5 px-2 py-2.5 rounded-xl">
                        <div className="h-5 w-7 rounded bg-white/8 shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-3/4 rounded bg-white/10" />
                          <div className="h-2 w-1/4 rounded bg-white/6" />
                        </div>
                      </div>
                    ))}
                    <p className="text-center text-[11px] text-muted-foreground py-2">
                      Buscando episódios no acervo...
                    </p>
                  </div>
                ) : episodesList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Nenhum episódio encontrado.
                  </div>
                ) : (() => {
                  // Filtrar com base na busca
                  const term = epSearch.trim().toLowerCase();
                  const filtered = term
                    ? episodesList
                        .map((ep, idx) => ({ ep, idx }))
                        .filter(({ ep, idx }) =>
                          ep.title.toLowerCase().includes(term) ||
                          String(idx + 1).includes(term)
                        )
                    : episodesList.map((ep, idx) => ({ ep, idx }));

                  if (filtered.length === 0) {
                    return (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        Nenhum episódio encontrado para "{epSearch}".
                      </div>
                    );
                  }

                  return (
                    <div className="p-2 space-y-0.5">
                      {filtered.map(({ ep: epItem, idx: index }) => {
                        const isActive = index === current;
                        const isWatched = watchedEpisodes.includes(epItem.id);
                        const epProg = episodesProgressMap[epItem.id];
                        const hasProgress = epProg && epProg.timestamp > 5 && epProg.progressPercent < 92;

                        return (
                          <button
                            key={epItem.id}
                            onClick={() => { setCurrent(index); setEpSearch(""); }}
                            className={`group relative w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all cursor-pointer overflow-hidden ${
                              isActive
                                ? "bg-primary/15 text-primary"
                                : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
                            }`}
                          >
                            {/* Número do episódio */}
                            <span className={`shrink-0 w-7 text-center text-[10px] font-black tabular-nums ${
                              isActive ? "text-primary" : "text-muted-foreground/60"
                            }`}>
                              {index + 1}
                            </span>

                            {/* Título e info */}
                            <div className="flex-1 min-w-0">
                              <span className={`block truncate text-xs font-semibold leading-tight ${
                                isActive ? "text-primary" : "text-foreground"
                              }`}>
                                {epItem.title}
                              </span>
                              {/* Barra de progresso inline + duration */}
                              <div className="flex items-center gap-2 mt-1">
                                {hasProgress ? (
                                  <>
                                    <div className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-primary to-amber-400"
                                        style={{ width: `${epProg.progressPercent}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-mono text-primary/70 shrink-0 tabular-nums">
                                      {formatTime(epProg.timestamp)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[9px] text-muted-foreground/50">
                                    {epItem.duration !== "--:--" ? epItem.duration : ""}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Indicadores de status */}
                            {isActive && (
                              <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            )}
                            {isWatched && !isActive && (
                              <CheckCircle2 className="shrink-0 h-3 w-3 text-emerald-500/70" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
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

