import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PosterCard } from "@/components/PosterCard";
import { getShow, getStaticShow, type Episode, type Show } from "@/data/shows";

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
            const mp4Files = data.files.filter((f: any) => f.name.endsWith(".mp4")).sort((a: any, b: any) => a.name.localeCompare(b.name));
            
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
                synopsis: "Episódio resgatado do acervo clássico dublado.",
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

  return (
    <div className="min-h-screen bg-background pt-28 pb-16 sm:pt-28">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* NAVEGAÇÃO SUPERIOR / BREADCRUMB */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:text-sm"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar para o Início
          </Link>
          <span className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-medium text-accent border border-border/40">
            {show.title} · Temporada 1
          </span>
        </div>

        {/* GRADE PRINCIPAL: PLAYER (ESQUERDA) + SELETOR DE EPISÓDIOS (DIREITA) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* =================================================================
              COLUNA DA ESQUERDA: VÍDEO PLAYER 16:9 + INFORMAÇÕES DO EPISÓDIO
             ================================================================= */}
          <div className="lg:col-span-8">
            {/* CONTAINER DO PLAYER 16:9 */}
            <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/80 bg-black shadow-2xl">
              {!episode ? (
                <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <Tv className="h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum episódio encontrado para este título.</p>
                  <p className="text-sm mt-2 opacity-70">Se for um desenho do acervo, aguarde o carregamento do Internet Archive.</p>
                </div>
              ) : episode.videoUrl ? (
                // 1) RENDERIZAÇÃO QUANDO HOUVER URL DE VÍDEO / IFRAME CONFIGURADA
                episode.videoUrl.endsWith(".mp4") ? (
                  <video
                    key={episode.id}
                    src={episode.videoUrl}
                    controls
                    autoPlay
                    className="absolute inset-0 h-full w-full object-cover bg-black"
                  >
                    Seu navegador não suporta a reprodução deste vídeo.
                  </video>
                ) : (
                  <iframe
                    key={episode.id}
                    src={episode.videoUrl}
                    title={`${show.title} - ${episode.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                )
              ) : (
                // 2) PLAYER INTERATIVO EM ESTILO RETRO STREAMING (SIMULAÇÃO)
                <div className="relative h-full w-full select-none overflow-hidden bg-gradient-to-t from-black via-zinc-950 to-zinc-900">
                  {/* Fundo com pôster desfocado */}
                  <img
                    src={show.poster}
                    alt={show.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-20 filter blur-xl scale-110"
                  />
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />

                  {/* Conteúdo central do Player */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <button
                      onClick={() => setIsPlayingSimulated(!isPlayingSimulated)}
                      aria-label="Reproduzir episódio"
                      className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-all duration-300 hover:scale-110 hover:bg-primary/90 active:scale-95 sm:h-24 sm:w-24"
                    >
                      <Play className="h-9 w-9 fill-current translate-x-1 transition-transform group-hover:scale-110 sm:h-11 sm:w-11" />
                      {/* Efeito radar/pulsar */}
                      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40 opacity-75" />
                    </button>

                    <div className="mt-5 max-w-md">
                      <span className="inline-block rounded-full bg-accent/20 px-3 py-0.5 text-xs font-bold text-accent">
                        {isPlayingSimulated ? "Reproduzindo" : "Pronto para Assistir"}
                      </span>
                      <h2 className="mt-2 font-display text-lg text-foreground sm:text-2xl drop-shadow">
                        {episode.title}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                        {isPlayingSimulated
                          ? "Simulação de vídeo ativa. Cole seu <iframe> em shows.ts para rodar do YouTube/Archive."
                          : "Clique para simular ou insira seu link no arquivo shows.ts"}
                      </p>
                    </div>
                  </div>

                  {/* Barra inferior do player com controles visuais */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent p-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="font-semibold text-foreground">HD 1080p · Dublagem Clássica</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {episode.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5" /> PT-BR
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* INFORMAÇÕES DO EPISÓDIO E AÇÕES DE REPRODUÇÃO */}
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {show.title}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{show.year}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="rounded bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                      Dublado
                    </span>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      Livre
                    </span>
                  </div>
                  <h1 className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">
                    {episode.title}
                  </h1>
                </div>

                {/* BOTÕES DE CONTROLE: ANTERIOR / PRÓXIMO / MINHA LISTA / COMPARTILHAR */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={current === 0}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={current === show.episodes.length - 1}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Próximo <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setInList(!inList)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
                      inList
                        ? "border-primary bg-primary/20 text-primary shadow-sm"
                        : "border-border bg-secondary/60 text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {inList ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {inList ? "Salvo" : "Minha Lista"}
                  </button>

                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {copied ? "Link Copiado!" : "Compartilhar"}
                  </button>
                </div>
              </div>

              {/* SINOPSE DO EPISÓDIO */}
              <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sinopse do Episódio
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-200 sm:text-base">
                  {episode.synopsis}
                </p>
              </div>

              {/* SOBRE O DESENHO */}
              <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border/60 bg-secondary/30 p-4 sm:flex-row sm:items-center">
                <img
                  src={show.poster}
                  alt={show.title}
                  className="h-24 w-16 shrink-0 rounded-xl object-cover shadow-md"
                />
                <div className="min-w-0">
                  <h4 className="font-display text-base font-bold text-foreground">
                    Sobre {show.title} ({show.year})
                  </h4>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {show.synopsis}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================
              COLUNA DA DIREITA: SELETOR DE EPISÓDIOS (BINGE-WATCHING)
             ================================================================= */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-card">
              {/* CABEÇALHO DO SELETOR */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Film className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-bold text-foreground">
                    Todos os Episódios
                  </h2>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-primary">
                  {episodesList.length} ep.
                </span>
              </div>

              {/* LISTA VERTICAL ROLÁVEL DE EPISÓDIOS */}
              <div className="mt-3 flex flex-col gap-2.5 max-h-[580px] overflow-y-auto pr-1 scroll-smooth [scrollbar-width:thin]">
                {episodesList.length === 0 && (
                   <div className="text-center p-4 text-muted-foreground text-sm">
                      Nenhum episódio listado.
                   </div>
                )}
                {episodesList.map((epItem, index) => {
                  const isActive = index === current;
                  return (
                    <button
                      key={epItem.id}
                      onClick={() => {
                        setCurrent(index);
                        setIsPlayingSimulated(true);
                        // Rola até o player no mobile
                        if (typeof window !== "undefined" && window.innerWidth < 1024) {
                          window.scrollTo({ top: 80, behavior: "smooth" });
                        }
                      }}
                      className={`group relative flex items-start gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
                        isActive
                          ? "border-primary bg-primary/15 shadow-glow ring-1 ring-primary/50"
                          : "border-border/70 bg-secondary/30 hover:border-primary/60 hover:bg-secondary/70"
                      }`}
                    >
                      {/* Miniatura com Indicador */}
                      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-xl bg-black shadow">
                        <img
                          src={show.poster}
                          alt={epItem.title}
                          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            isActive ? "opacity-75" : "opacity-90"
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                        {/* Ícone Play / Tocando agora */}
                        <div className="absolute inset-0 grid place-items-center">
                          {isActive ? (
                            <div className="flex items-end gap-0.5 h-4">
                              <span className="w-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s] h-4" />
                              <span className="w-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s] h-3" />
                              <span className="w-1 bg-primary rounded-full animate-bounce h-4" />
                            </div>
                          ) : (
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                              <Play className="h-3 w-3 fill-current translate-x-0.5" />
                            </span>
                          )}
                        </div>

                        {/* Número do Episódio */}
                        <span className="absolute bottom-1 left-1.5 rounded bg-black/80 px-1.5 py-0.2 text-[10px] font-bold text-white">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Dados do Episódio */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`truncate font-display text-sm font-bold ${
                              isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                            }`}
                          >
                            {epItem.title}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-snug">
                          {epItem.synopsis}
                        </p>

                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-muted-foreground">
                            {epItem.duration}
                          </span>
                          {isActive && (
                            <span className="font-bold text-primary animate-pulse">
                              Assistindo agora
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* PRATELEIRA DE RELACIONADOS: CONTINUE NOSTALGIANDO */}
        <section className="mt-16 border-t border-border/60 pt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                Continue Nostalgiando
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Outras animações e séries clássicas que marcaram época
              </p>
            </div>
            <Link
              to="/"
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

