import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles,
  Crown,
  ThumbsUp,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Film,
  AlertCircle,
  ExternalLink,
  ChevronUp,
  Check,
  X,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/authContext";
import { getCachedShows, type Show } from "@/data/shows";
import { searchMultiTmdb } from "@/lib/tmdb";
import {
  fetchDrawingRequests,
  createDrawingRequest,
  toggleVoteDrawingRequest,
  checkUserMonthlyRequestLimit,
  type DrawingRequest,
  type RequestStatus,
} from "@/lib/requests";

export const Route = createFileRoute("/pedidos")({
  component: PedidosPage,
  head: () => ({
    meta: [
      { title: "Mural de Pedidos de Desenhos | Nostalgiando" },
      {
        name: "description",
        content:
          "Peça desenhos clássicos que marcaram sua infância e vote nos pedidos da comunidade para entrarem no acervo do Nostalgiando.",
      },
    ],
  }),
});

export function PedidosPage() {
  const { user, isVip, profile } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<DrawingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "top" | "vip" | "in_progress" | "added">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Estado do Modal de Novo Pedido
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newPoster, setNewPoster] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sugestões do TMDB
  const [tmdbSuggestions, setTmdbSuggestions] = useState<any[]>([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);

  // Catálogo local para verificação de duplicidade
  const [catalogShows, setCatalogShows] = useState<Show[]>(() => getCachedShows());

  const searchDebounceRef = useRef<any>(null);

  // Carrega catálogo e pedidos
  useEffect(() => {
    setCatalogShows(getCachedShows());
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await fetchDrawingRequests();
    setRequests(data);
    setLoading(false);
  };

  // Autocomplete do TMDB ao digitar título no modal
  useEffect(() => {
    if (!newTitle.trim() || newTitle.trim().length < 3) {
      setTmdbSuggestions([]);
      return;
    }

    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingTmdb(true);
      try {
        const results = await searchMultiTmdb(newTitle);
        setTmdbSuggestions(results.slice(0, 4));
      } catch {
        setTmdbSuggestions([]);
      } finally {
        setIsSearchingTmdb(false);
      }
    }, 400);

    return () => clearTimeout(searchDebounceRef.current);
  }, [newTitle]);

  // Checagem se o desenho já existe no catálogo
  const matchingCatalogShow = useMemo(() => {
    if (!newTitle.trim() || newTitle.trim().length < 3) return null;
    const clean = newTitle.toLowerCase().trim();
    return catalogShows.find(
      (s) =>
        s.title.toLowerCase().includes(clean) ||
        clean.includes(s.title.toLowerCase()) ||
        s.slug.toLowerCase().includes(clean.replace(/\s+/g, "-"))
    );
  }, [newTitle, catalogShows]);

  // Checagem se o desenho já foi pedido no mural
  const matchingExistingRequest = useMemo(() => {
    if (!newTitle.trim() || newTitle.trim().length < 3) return null;
    const clean = newTitle.toLowerCase().trim();
    return requests.find(
      (r) =>
        r.title.toLowerCase().includes(clean) || clean.includes(r.title.toLowerCase())
    );
  }, [newTitle, requests]);

  // Ação de Votar com Optimistic UI
  const handleVote = async (request: DrawingRequest) => {
    if (!user) {
      toast.info("Faça login para votar nos seus desenhos favoritos!");
      navigate({ to: "/login", search: { redirect: "/pedidos" } as any });
      return;
    }

    const currentVoted = request.votedBy.includes(user.uid);
    const voteWeight = isVip ? 2 : 1;
    const delta = currentVoted ? -voteWeight : voteWeight;

    // Atualização otimista na tela
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === request.id) {
          const updatedVotedBy = currentVoted
            ? r.votedBy.filter((id) => id !== user.uid)
            : [...r.votedBy, user.uid];
          return {
            ...r,
            votesCount: Math.max(0, r.votesCount + delta),
            votedBy: updatedVotedBy,
          };
        }
        return r;
      })
    );

    try {
      await toggleVoteDrawingRequest(request.id, user.uid, isVip, currentVoted);
      if (!currentVoted) {
        toast.success(
          isVip
            ? "Voto computado com peso duplo (Voto VIP)! 🎉"
            : "Voto registrado com sucesso! 👍"
        );
      }
    } catch (err) {
      toast.error("Falha ao registrar voto. Tente novamente.");
      loadRequests(); // Reverte
    }
  };

  // Abrir Modal de Criação com Checagem de Limite
  const handleOpenCreateModal = async () => {
    if (!user) {
      toast.info("Faça login para pedir um desenho.");
      navigate({ to: "/login", search: { redirect: "/pedidos" } as any });
      return;
    }

    const limitCheck = await checkUserMonthlyRequestLimit(user.uid, isVip);
    if (!limitCheck.canRequest) {
      toast.warning(limitCheck.reason);
      return;
    }

    setNewTitle("");
    setNewYear("");
    setNewPoster("");
    setNewDescription("");
    setTmdbSuggestions([]);
    setIsModalOpen(true);
  };

  // Submeter Novo Pedido
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newTitle.trim()) {
      toast.error("Por favor, informe o título do desenho.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createDrawingRequest({
        title: newTitle,
        year: newYear,
        tmdbPoster: newPoster,
        description: newDescription,
        requestedByUid: user.uid,
        requestedByName: profile?.name || user.email?.split("@")[0] || "Nostálgico",
        isVipRequest: isVip,
      });

      toast.success(
        isVip
          ? "Pedido VIP publicado com prioridade no mural! 👑"
          : "Pedido enviado para a comunidade com sucesso!"
      );
      setIsModalOpen(false);
      setRequests((prev) => [created, ...prev]);
    } catch (err: any) {
      toast.error(err.message || "Erro ao publicar pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtragem dos pedidos
  const filteredRequests = useMemo(() => {
    let list = [...requests];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.requestedByName.toLowerCase().includes(q) ||
          r.year?.includes(q)
      );
    }

    if (activeFilter === "top") {
      list.sort((a, b) => b.votesCount - a.votesCount);
    } else if (activeFilter === "vip") {
      list = list.filter((r) => r.isVipRequest);
    } else if (activeFilter === "in_progress") {
      list = list.filter((r) => r.status === "in_progress" || r.status === "approved");
    } else if (activeFilter === "added") {
      list = list.filter((r) => r.status === "added");
    }

    return list;
  }, [requests, activeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      <SiteHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Cabeçalho Hero do Mural */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10 border-b border-white/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-300 text-xs font-bold mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Voz da Comunidade Nostálgica</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Mural de Pedidos de Desenhos
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
              Qual clássico da sua infância está faltando por aqui? Peça o seu desenho ou vote nos
              pedidos da comunidade para trazermos para o acervo com episódios completos!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-zinc-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="h-4 w-4 text-zinc-950 stroke-[3]" />
              <span>Pedir um Desenho</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Busca Rápida */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-8">
          {/* Abas de Filtros */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "Todos os Pedidos" },
              { id: "top", label: "Mais Votados" },
              { id: "vip", label: "Pedidos VIP", icon: Crown },
              { id: "in_progress", label: "Buscando Episódios" },
              { id: "added", label: "Já no Catálogo" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`h-10 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === f.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border border-white/10 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                }`}
              >
                {f.icon && <f.icon className="h-3.5 w-3.5 text-amber-400" />}
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Busca no Mural */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar pedido..."
              className="w-full h-10 rounded-xl border border-white/10 bg-secondary/40 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
        </div>

        {/* Feed de Pedidos em Bento Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-amber-500 border-t-transparent mb-3" />
            <p className="text-xs text-muted-foreground">Carregando pedidos da comunidade...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-12 text-center max-w-md mx-auto">
            <Sparkles className="h-12 w-12 text-amber-400/50 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Nenhum pedido encontrado</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-6">
              Que tal ser o primeiro a pedir um desenho retrô que você sente falta?
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all"
            >
              Fazer Pedido Agora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRequests.map((req) => {
              const hasVoted = user ? req.votedBy.includes(user.uid) : false;

              // Cores e labels de Status
              const statusConfig = {
                pending: {
                  label: "Em Votação",
                  color: "bg-zinc-800 text-zinc-300 border-white/10",
                },
                approved: {
                  label: "Aprovado pela Equipe",
                  color: "bg-blue-500/15 text-blue-300 border-blue-500/30",
                },
                in_progress: {
                  label: "Buscando Episódios",
                  color: "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse",
                },
                added: {
                  label: "Disponível no Catálogo!",
                  color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                },
              }[req.status || "pending"];

              return (
                <div
                  key={req.id}
                  className={`group rounded-3xl border p-4 sm:p-5 flex flex-col justify-between backdrop-blur-xl transition-all ${
                    req.isVipRequest
                      ? "bg-gradient-to-b from-amber-500/10 via-zinc-900/80 to-zinc-950 border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.08)]"
                      : "bg-zinc-900/60 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
                    {/* Header do Card: Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>

                      {req.isVipRequest && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                          <Crown className="h-3 w-3" />
                          <span>Pedido VIP</span>
                        </span>
                      )}
                    </div>

                    {/* Conteúdo Principal: Imagem + Info */}
                    <div className="flex gap-3.5 mb-3">
                      <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-2xl overflow-hidden bg-black/60 border border-white/10 shrink-0 shadow-sm relative">
                        {req.tmdbPoster ? (
                          <img
                            src={req.tmdbPoster}
                            alt={req.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
                            <Film className="h-6 w-6 text-amber-400/60 mb-1" />
                            <span className="text-[9px] font-bold leading-tight">Sem Capa</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {req.title}
                        </h3>
                        {req.year && (
                          <span className="inline-block mt-0.5 text-xs text-muted-foreground font-semibold">
                            Ano: {req.year}
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {req.description || "Sem observações adicionais."}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-2 truncate">
                          Por: <strong className="text-foreground/90">{req.requestedByName}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card: Ação de Voto / Assistir */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 mt-2">
                    {req.status === "added" && req.addedSlug ? (
                      <Link
                        to="/assistir/$slug"
                        params={{ slug: req.addedSlug }}
                        className="h-10 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500 active:scale-95 transition-all shadow-md"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Assistir Agora</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        {req.votesCount} {req.votesCount === 1 ? "voto" : "votos"}
                      </span>
                    )}

                    {/* Botão de Upvote com Efeito Tátil */}
                    <button
                      onClick={() => handleVote(req)}
                      className={`h-10 px-4 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-90 cursor-pointer ${
                        hasVoted
                          ? "bg-amber-500 text-zinc-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                          : "border border-white/15 bg-white/5 hover:bg-white/10 text-foreground"
                      }`}
                      title={hasVoted ? "Você já votou! Clique para remover o voto" : "Votar neste desenho"}
                    >
                      <ChevronUp
                        className={`h-4 w-4 stroke-[3] ${
                          hasVoted ? "text-zinc-950" : "text-amber-400"
                        }`}
                      />
                      <span>{hasVoted ? "Votado" : "Votar"}</span>
                      <span className="ml-0.5 font-mono text-[11px] opacity-80">
                        ({req.votesCount})
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de Criar Novo Pedido com Busca TMDB e Anti-Duplicação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full border border-white/10 bg-secondary/40 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 grid place-items-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Fazer Pedido de Desenho
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isVip
                    ? "Como membro VIP, seu pedido entra no topo com 2 votos!"
                    : "Plano Free: 1 pedido por mês na comunidade."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {/* Título com Autocomplete */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Nome do Desenho *
                </label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Samurai Jack, YuYu Hakusho, Doug..."
                  className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-3.5 text-sm text-foreground focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                />
              </div>

              {/* Alerta Anti-Duplicidade: Já temos no Catálogo! */}
              {matchingCatalogShow && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 animate-in fade-in duration-200 flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-white">Já temos no acervo!</p>
                    <p className="text-emerald-200/90 mt-0.5">
                      "{matchingCatalogShow.title}" já está disponível para assistir com episódios completos.
                    </p>
                    <Link
                      to="/assistir/$slug"
                      params={{ slug: matchingCatalogShow.slug }}
                      className="inline-flex items-center gap-1.5 mt-2 font-bold text-emerald-300 hover:text-white underline"
                    >
                      <span>Assistir agora</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Alerta Anti-Duplicidade: Já está no Mural! */}
              {matchingExistingRequest && !matchingCatalogShow && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 animate-in fade-in duration-200 flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-white">Esse desenho já foi pedido!</p>
                    <p className="text-amber-200/90 mt-0.5">
                      Outro membro já pediu "{matchingExistingRequest.title}". Em vez de duplicar,
                      some seu voto ao pedido existente para ele subir mais rápido!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        handleVote(matchingExistingRequest);
                      }}
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold hover:brightness-110 active:scale-95 transition-all"
                    >
                      <ChevronUp className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Votar no Pedido Existente</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sugestões do TMDB com Capa HD */}
              {tmdbSuggestions.length > 0 && (
                <div>
                  <span className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase">
                    Sugestões Oficiais Encontradas (Clique para preencher capa e ano):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {tmdbSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setNewTitle(item.title);
                          setNewYear(item.year || "");
                          setNewPoster(item.posterUrl || item.poster || "");
                          setTmdbSuggestions([]);
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl border border-white/10 bg-secondary/30 hover:bg-secondary/60 text-left transition-all cursor-pointer"
                      >
                        {item.posterUrl || item.poster ? (
                          <img
                            src={item.posterUrl || item.poster}
                            alt={item.title}
                            className="w-8 h-12 object-cover rounded-md shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-12 bg-black/40 rounded-md grid place-items-center text-muted-foreground shrink-0">
                            <Film className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground">{item.year || "S/ ano"}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ano e Capa Selecionados */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Ano (Opcional)</label>
                  <input
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="Ex: 1995"
                    className="w-full h-11 rounded-xl border border-white/10 bg-secondary/40 px-3 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">URL da Capa (Opcional)</label>
                  <input
                    value={newPoster}
                    onChange={(e) => setNewPoster(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-11 rounded-xl border border-white/10 bg-secondary/40 px-3 text-xs text-foreground focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Descrição / Motivo */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Por que você quer rever esse desenho? (Opcional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Conte alguma memória ou detalhe marcante sobre o desenho..."
                  className="w-full rounded-xl border border-white/10 bg-secondary/40 p-3 text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              {/* Botões do Modal */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 h-12 rounded-xl border border-white/10 bg-secondary/40 text-foreground font-bold text-xs hover:bg-secondary/70 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Publicar Pedido</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
