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
import { StarRating } from "@/components/StarRating";
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
  const [show, setShow] = useState<Show | undefined>(() => serverShow || getStaticShow(slug));
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
  const [showShareModal, setShowShareModal] = useState(false);
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
            let cleanName = baseName;
            try {
              cleanName = decodeURIComponent(baseName);
            } catch {
              cleanName = baseName;
            }
            cleanName = cleanName
              .replace(/\.(mp4|mkv|avi|webm|ogv|m4v)$/i, "")
              .replace(/_/g, " ")
              .replace(/-/g, " ")
              .replace(/ready/gi, "")
              .replace(/hidratorrent\.com/gi, "")
              .trim();

            const isMp4OrWebm =
              f.name.toLowerCase().endsWith(".mp4") || f.name.toLowerCase().endsWith(".webm");

            const encodedFileName = encodeURIComponent(f.name).replace(/%2F/g, "/");
            const videoUrl = isMp4OrWebm
              ? `https://archive.org/download/${safeId}/${encodedFileName}`
              : `https://archive.org/embed/${safeId}/${encodedFileName}`;

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
                title: (show?.title || "Desenho") + " (Acervo Completo)",
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

  // Define a lista de episódios (prioriza episódios dinâmicos do Archive quando archiveId existe)
  const episodesList = dynamicEpisodes.length > 0 
    ? dynamicEpisodes 
    : (show?.archiveId && isLoading 
        ? [] 
        : (show?.episodes || []));

  const episode = episodesList[current] || (episodesList.length > 0 ? episodesList[0] : (show?.episodes && show.episodes.length > 0 && !show?.archiveId ? show.episodes[0] : {
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
    if (!show) return [];
    const currentCategory = show.category;
    const sameCat = allShows.filter((s) => s.slug !== show.slug && s.category === currentCategory);
    const otherCat = allShows.filter((s) => s.slug !== show.slug && s.category !== currentCategory);
    return [...sameCat, ...otherCat].slice(0, 10);
  }, [allShows, show?.slug, show?.category]);

  const handleShare = () => {
    // Primeiro tenta a Web Share API (Garante compartilhamento direto para Insta/TikTok no celular)
    if (navigator.share && /android|iphone|ipad|ipod/i.test(navigator.userAgent || "")) {
      navigator.share({
        title: show?.title || 'Nostalgiando Desenhos',
        text: `Nostalgia pura! Assista ${show?.title} agora no Nostalgiando:`,
        url: window.location.href,
      }).catch((e) => {
        // Se o usuário cancelar, não faz nada. Se falhar, abre o modal customizado.
        setShowShareModal(true);
      });
    } else {
      // Se estiver no Desktop ou não suportar, mostra o Modal Customizado bonitão
      setShowShareModal(true);
    }
  };

  const copyToClipboard = () => {
    if (typeof window !== "undefined") {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
        } catch (err) {}
        document.body.removeChild(textArea);
      }
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
      <div className="min-h-screen bg-background pt-24 pb-16 flex flex-col items-center justify-center text-center px-4">
        <SiteHeader />
        <div className="max-w-md w-full p-8 rounded-3xl border border-white/10 bg-card/90 backdrop-blur-xl shadow-2xl animate-in fade-in duration-300">
          <div className="relative mb-5 mx-auto w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/20 text-primary border border-primary/30 shadow-glow">
            <Tv className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2 font-display">Carregando Acervo...</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
            Sincronizando este título clássico com a nuvem do Nostalgiando. Aguarde um instante...
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-secondary/80 hover:bg-secondary text-foreground text-xs sm:text-sm font-bold border border-white/10 transition-all hover:border-primary/40 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar ao Início
            </Link>
            <Link
              to="/categoria/$id"
              params={{ id: "catalogo" }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold transition-all hover:bg-primary/90 active:scale-95 shadow-md"
            >
              Ver Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                  {(episode.videoUrl.toLowerCase().includes(".mp4") || episode.videoUrl.toLowerCase().includes(".webm")) ? (
                    <video
                      key={episode.id}
                      ref={videoRef}
                      src={episode.videoUrl.replace("/embed/", "/download/")}
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
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-500 overflow-y-auto">
                      <div className="max-w-md text-center p-4 sm:p-6 my-auto">
                        <div className="mx-auto mb-3 sm:mb-5 grid h-12 w-12 sm:h-20 sm:w-20 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-amber-600/20 border border-primary/30 shadow-[0_0_40px_rgba(217,119,6,0.2)]">
                          <Lock className="h-6 w-6 sm:h-9 sm:w-9 text-primary" />
                        </div>
                        <h3 className="font-display text-lg sm:text-2xl font-bold text-foreground mb-1.5 sm:mb-2">Gostou do que viu?</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 leading-relaxed max-w-[280px] sm:max-w-none mx-auto">
                          Faça login ou crie sua conta para continuar assistindo.
                        </p>
                        <Link to="/login" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3.5 rounded-full bg-gradient-to-r from-primary to-amber-600 text-primary-foreground font-bold text-xs sm:text-sm">
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
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={handlePrev} disabled={current === 0} className="flex-1 sm:flex-none h-10 px-4 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold hover:bg-secondary disabled:opacity-40 cursor-pointer flex items-center justify-center">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={handleNext} disabled={current === episodesList.length - 1} className="flex-1 sm:flex-none h-10 px-4 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold hover:bg-secondary disabled:opacity-40 cursor-pointer flex items-center justify-center">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={() => setInList(!inList)} className="flex-1 sm:flex-none h-10 px-4 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer justify-center">
                      {inList ? <Check className="h-4 w-4 text-emerald-400" /> : <Plus className="h-4 w-4" />} Lista
                    </button>
                    <button onClick={handleShare} className="flex-1 sm:flex-none h-10 px-4 rounded-xl border border-white/10 bg-secondary/50 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all justify-center" title="Compartilhar Link">
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4" />
                          <span>Compartilhar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Avaliação das Estrelas */}
              <div className="mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Avalie este Título
                </span>
                <StarRating slug={show.slug} readOnly={false} />
              </div>
            </div>
          </div>

          {/* Modal de Compartilhamento (Custom) */}
          {showShareModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
              <div className="bg-card w-full max-w-sm rounded-3xl border border-border shadow-2xl p-6 relative animate-in zoom-in-95 duration-300">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <h3 className="text-xl font-bold font-display text-foreground mb-1 text-center">Compartilhar</h3>
                <p className="text-xs text-muted-foreground text-center mb-6">Convide seus amigos para maratonar</p>
                
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/?text=Dá uma olhada nesse desenho nostálgico que achei! %0A%0A${show?.title}%0A${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center border border-[#25D366]/20 group-hover:bg-[#25D366] group-hover:text-white transition-all shadow-[0_0_15px_rgba(37,211,102,0)] group-hover:shadow-[0_0_20px_rgba(37,211,102,0.3)] group-hover:-translate-y-1">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">WhatsApp</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center border border-[#1877F2]/20 group-hover:bg-[#1877F2] group-hover:text-white transition-all shadow-[0_0_15px_rgba(24,119,242,0)] group-hover:shadow-[0_0_20px_rgba(24,119,242,0.3)] group-hover:-translate-y-1">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Facebook</span>
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=Assista ${show?.title} agora!&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-foreground/5 text-foreground flex items-center justify-center border border-border group-hover:bg-foreground group-hover:text-background transition-all group-hover:-translate-y-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">X</span>
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:?subject=Recomendação de Clássico: ${show?.title}&body=Achei esse clássico e lembrei de você:%0D%0A%0D%0A${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(244,63,94,0)] group-hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] group-hover:-translate-y-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Email</span>
                  </a>
                </div>

                <div className="bg-secondary/40 border border-border rounded-xl p-2 flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={typeof window !== "undefined" ? window.location.href : ""}
                    className="bg-transparent border-none text-xs text-muted-foreground flex-1 focus:outline-none px-2 w-full truncate" 
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                
                {/* Nota sobre Instagram e Tiktok */}
                <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2">
                  <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-500/80 leading-relaxed">
                    Para o <strong className="text-amber-500">Instagram</strong> ou <strong className="text-amber-500">TikTok</strong>, acesse pelo celular (se disponível abrirão nativamente), ou clique em "Copiar" e cole o link diretamente na DM/Stories das redes.
                  </p>
                </div>
              </div>
            </div>
          )}

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

