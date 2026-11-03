import { useState, useEffect } from "react";
import {
  Sparkles,
  Crown,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Film,
  Plus,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchDrawingRequests,
  updateRequestStatus,
  deleteDrawingRequest,
  type DrawingRequest,
  type RequestStatus,
} from "@/lib/requests";

interface AdminRequestsTabProps {
  onConvertToCatalog?: (request: DrawingRequest) => void;
}

export function AdminRequestsTab({ onConvertToCatalog }: AdminRequestsTabProps) {
  const [requests, setRequests] = useState<DrawingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await fetchDrawingRequests();
    setRequests(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: RequestStatus,
    addedSlug?: string
  ) => {
    setActionInProgressId(requestId);
    try {
      await updateRequestStatus(requestId, newStatus, addedSlug);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: newStatus, addedSlug: addedSlug ?? r.addedSlug }
            : r
        )
      );
      toast.success(`Status atualizado para: ${newStatus}`);
    } catch {
      toast.error("Erro ao atualizar status do pedido.");
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDelete = async (requestId: string, title: string) => {
    if (!window.confirm(`Deseja realmente excluir o pedido "${title}"?`)) return;
    setActionInProgressId(requestId);
    try {
      await deleteDrawingRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Pedido excluído com sucesso.");
    } catch {
      toast.error("Erro ao excluir pedido.");
    } finally {
      setActionInProgressId(null);
    }
  };

  const handlePromptAddSlug = (requestId: string) => {
    const slug = window.prompt("Informe o slug do desenho no catálogo (ex: caverna-do-dragao):");
    if (slug && slug.trim()) {
      handleUpdateStatus(requestId, "added", slug.trim().toLowerCase());
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestedByName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const vipRequestsCount = requests.filter((r) => r.isVipRequest).length;
  const inProgressCount = requests.filter((r) => r.status === "in_progress").length;
  const addedCount = requests.filter((r) => r.status === "added").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-foreground flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-amber-400" />
            Pedidos da Comunidade & Upvotes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os desenhos solicitados pelos usuários, priorize pedidos VIP e converta em títulos do acervo.
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-secondary/50 text-foreground hover:bg-secondary transition-all text-xs font-semibold active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>{loading ? "Atualizando..." : "Recarregar"}</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/10 bg-card p-4">
          <div className="text-[11px] font-bold text-muted-foreground uppercase">Total de Pedidos</div>
          <div className="text-3xl font-black text-foreground mt-1">{requests.length}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Sugestões registradas</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="text-[11px] font-bold text-amber-400 uppercase flex items-center gap-1">
            <Crown className="h-3.5 w-3.5" />
            <span>Pedidos VIP</span>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-1">{vipRequestsCount}</div>
          <p className="text-[11px] text-amber-400/80 mt-0.5">Prioridade máxima</p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="text-[11px] font-bold text-blue-400 uppercase">Buscando Episódios</div>
          <div className="text-3xl font-black text-blue-400 mt-1">{inProgressCount}</div>
          <p className="text-[11px] text-blue-400/80 mt-0.5">Em processamento</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="text-[11px] font-bold text-emerald-400 uppercase">Atendidos / No Ar</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">{addedCount}</div>
          <p className="text-[11px] text-emerald-400/80 mt-0.5">Publicados no acervo</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "all", label: "Todos" },
            { id: "pending", label: "Em Votação" },
            { id: "in_progress", label: "Buscando Episódios" },
            { id: "added", label: "Adicionados" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterStatus(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-white/10 bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título ou autor..."
            className="w-full h-9 rounded-xl border border-white/10 bg-secondary/40 pl-9 pr-3 text-xs text-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Tabela de Pedidos */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">Carregando pedidos...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card p-12 text-center text-xs text-muted-foreground">
          Nenhum pedido encontrado neste filtro.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 border-b border-white/10 text-muted-foreground uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">Desenho Solicitado</th>
                  <th className="px-4 py-3 text-center">Votos</th>
                  <th className="px-4 py-3">Solicitante</th>
                  <th className="px-4 py-3">Status Atual</th>
                  <th className="px-4 py-3 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Imagem + Título */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                          {r.tmdbPoster ? (
                            <img src={r.tmdbPoster} alt={r.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-muted-foreground">
                              <Film className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                            <span className="truncate">{r.title}</span>
                            {r.isVipRequest && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30 shrink-0">
                                <Crown className="h-2.5 w-2.5" /> VIP
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {r.year ? `Ano: ${r.year} · ` : ""}
                            {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                          </div>
                          {r.description && (
                            <div className="text-[11px] text-muted-foreground/80 line-clamp-1 italic mt-0.5">
                              "{r.description}"
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Votos */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 font-extrabold text-xs border border-amber-500/25">
                        <ChevronUp className="h-3.5 w-3.5 stroke-[3]" />
                        <span>{r.votesCount}</span>
                      </span>
                    </td>

                    {/* Autor */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground">{r.requestedByName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                        {r.requestedByUid}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === "added"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : r.status === "in_progress"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            : "bg-zinc-800 text-zinc-300 border-white/10"
                        }`}
                      >
                        {r.status === "added"
                          ? "✓ Disponível"
                          : r.status === "in_progress"
                          ? "⚡ Buscando Episódios"
                          : "Em Votação"}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Converter em Desenho no Catálogo */}
                        {onConvertToCatalog && (
                          <button
                            onClick={() => onConvertToCatalog(r)}
                            className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                            title="Abrir formulário de criação com este desenho"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Cadastrar</span>
                          </button>
                        )}

                        {/* Mudar para Buscando Episódios */}
                        {r.status !== "in_progress" && r.status !== "added" && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, "in_progress")}
                            disabled={actionInProgressId === r.id}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 font-bold text-[11px] transition-all cursor-pointer"
                          >
                            Buscando
                          </button>
                        )}

                        {/* Vincular como Adicionado */}
                        {r.status !== "added" && (
                          <button
                            onClick={() => handlePromptAddSlug(r.id)}
                            disabled={actionInProgressId === r.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 font-bold text-[11px] transition-all cursor-pointer"
                          >
                            Marcar Adicionado
                          </button>
                        )}

                        {/* Excluir Spam */}
                        <button
                          onClick={() => handleDelete(r.id, r.title)}
                          disabled={actionInProgressId === r.id}
                          className="p-1.5 rounded-lg border border-white/10 bg-secondary/40 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all cursor-pointer"
                          title="Excluir pedido"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
