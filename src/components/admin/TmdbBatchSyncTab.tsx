import { useState } from "react";
import {
  Sparkles,
  Key,
  Search,
  CheckCheck,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Film,
  Calendar,
  Save,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { Show } from "@/data/shows";
import {
  getStoredTmdbKey,
  setStoredTmdbKey,
  isFragilePoster,
  findBestTmdbMatch,
  cleanTitleForTmdb,
  type TmdbResult,
} from "@/lib/tmdb";
import { db, doc, updateDoc, setDoc } from "@/lib/firebase";

interface TmdbBatchSyncTabProps {
  shows: Show[];
  onShowsUpdated: (shows: Show[]) => void;
}

interface ScannedItem {
  show: Show;
  reason: string;
  tmdbMatch?: TmdbResult | null;
  status: "pending" | "searching" | "found" | "not_found" | "approved" | "error";
}

export function TmdbBatchSyncTab({ shows, onShowsUpdated }: TmdbBatchSyncTabProps) {
  const [apiKey, setApiKey] = useState(() => getStoredTmdbKey());
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  // 1. Escanear desenhos com capas frágeis ou dados incompletos
  const handleScanCatalog = () => {
    setIsScanning(true);
    const critical: ScannedItem[] = [];

    for (const show of shows) {
      const fragile = isFragilePoster(show.poster);
      const isYearMissing = !show.year || show.year === "Clássico" || !/\b(19\d\d|20\d\d)\b/.test(show.year);
      const isSynopsisMissing = !show.synopsis || show.synopsis.length < 20;

      if (fragile || isYearMissing || isSynopsisMissing) {
        let reason = "";
        if (fragile) reason = "Capa frágil (Mercado Livre / gstatic / eBay)";
        else if (isYearMissing) reason = "Ano não numérico ou 'Clássico'";
        else if (isSynopsisMissing) reason = "Sem sinopse oficial";

        critical.push({
          show,
          reason,
          status: "pending",
        });
      }
    }

    setScannedItems(critical);
    setIsScanning(false);

    if (critical.length === 0) {
      toast.success("Parabéns! Todas as capas e dados do acervo já estão em alta definição!");
    } else {
      toast.info(`Varredura concluída: ${critical.length} desenhos identificados para atualização.`);
    }
  };

  // 2. Consultar o TMDB para todos os itens escaneados
  const handleFetchTmdbForAll = async () => {
    const key = apiKey || getStoredTmdbKey();
    if (!key) {
      toast.error("Informe uma chave de API do TMDB antes de iniciar a busca.");
      return;
    }

    if (scannedItems.length === 0) {
      toast.info("Escaneie o acervo primeiro antes de consultar o TMDB.");
      return;
    }

    setIsSearchingTmdb(true);
    setProgress({ current: 0, total: scannedItems.length });

    const updatedList = [...scannedItems];

    for (let i = 0; i < updatedList.length; i++) {
      const item = updatedList[i];
      if (item.status === "approved") continue;

      updatedList[i] = { ...item, status: "searching" };
      setScannedItems([...updatedList]);
      setProgress({ current: i + 1, total: updatedList.length });

      try {
        const match = await findBestTmdbMatch(item.show.title, item.show.year, key);
        if (match && match.posterUrl) {
          updatedList[i] = { ...item, tmdbMatch: match, status: "found" };
        } else {
          updatedList[i] = { ...item, tmdbMatch: null, status: "not_found" };
        }
      } catch (err) {
        updatedList[i] = { ...item, status: "error" };
      }

      setScannedItems([...updatedList]);
      // Pequeno throttle de 200ms para evitar rate-limit no TMDB
      await new Promise((res) => setTimeout(res, 200));
    }

    setIsSearchingTmdb(false);
    setProgress(null);
    const foundCount = updatedList.filter((it) => it.status === "found").length;
    toast.success(`Busca TMDB concluída: ${foundCount} novas capas HD encontradas!`);
  };

  // 3. Aprovação Individual de um Desenho
  const handleApproveSingle = async (item: ScannedItem, index: number) => {
    if (!item.tmdbMatch || !item.tmdbMatch.posterUrl) return;

    try {
      const match = item.tmdbMatch;
      const patchData: Partial<Show> = {
        poster: match.posterUrl,
        year: match.year || item.show.year,
        synopsis: match.overview || item.show.synopsis,
        updatedAt: new Date().toISOString(),
      };

      // Salva no Firestore
      if (db) {
        await setDoc(doc(db, "shows", item.show.slug), patchData, { merge: true });
      }

      // Atualiza estado local
      const updatedShows = shows.map((s) =>
        s.slug === item.show.slug ? { ...s, ...patchData } : s
      );
      onShowsUpdated(updatedShows);

      // Marca item como aprovado na lista
      const nextScanned = [...scannedItems];
      nextScanned[index] = { ...item, status: "approved" };
      setScannedItems(nextScanned);

      toast.success(`Capa HD gravada para "${item.show.title}"!`);
    } catch (err: any) {
      toast.error(`Erro ao salvar no Firestore: ${err?.message || "Falha de conexão"}`);
    }
  };

  // 4. Aprovação em Lote ("Aprovar Todos")
  const handleApproveAll = async () => {
    const toApprove = scannedItems
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.status === "found" && item.tmdbMatch?.posterUrl);

    if (toApprove.length === 0) {
      toast.info("Nenhum item pronto para aprovação. Consulte o TMDB primeiro.");
      return;
    }

    setIsApprovingAll(true);
    setProgress({ current: 0, total: toApprove.length });

    let approvedCount = 0;
    const nextScanned = [...scannedItems];
    let workingShows = [...shows];

    for (let i = 0; i < toApprove.length; i++) {
      const { item, idx } = toApprove[i];
      const match = item.tmdbMatch!;

      const patchData: Partial<Show> = {
        poster: match.posterUrl!,
        year: match.year || item.show.year,
        synopsis: match.overview || item.show.synopsis,
        updatedAt: new Date().toISOString(),
      };

      try {
        if (db) {
          await setDoc(doc(db, "shows", item.show.slug), patchData, { merge: true });
        }

        workingShows = workingShows.map((s) =>
          s.slug === item.show.slug ? { ...s, ...patchData } : s
        );

        nextScanned[idx] = { ...item, status: "approved" };
        approvedCount++;
      } catch (err) {
        console.warn("Erro ao salvar item:", item.show.slug, err);
      }

      setProgress({ current: i + 1, total: toApprove.length });
    }

    onShowsUpdated(workingShows);
    setScannedItems(nextScanned);
    setIsApprovingAll(false);
    setProgress(null);

    toast.success(`Sucesso! ${approvedCount} capas e metadados gravados no Firestore.`);
  };

  const handleSaveApiKey = () => {
    setStoredTmdbKey(apiKey);
    toast.success("Chave TMDB gravada!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header com Glassmorphism */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-primary flex items-center justify-center text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Sincronizador TMDB em Lote
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Substitua capas instáveis do Mercado Livre/gstatic por imagens oficiais em alta resolução (w780)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScanCatalog}
              disabled={isScanning || isSearchingTmdb || isApprovingAll}
              className="px-4 py-2.5 rounded-xl border border-white/15 bg-secondary/40 text-foreground text-xs sm:text-sm font-bold hover:bg-secondary/70 flex items-center gap-2 transition-all active:scale-95"
            >
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Escanear Acervo
            </button>

            {scannedItems.length > 0 && (
              <button
                onClick={handleFetchTmdbForAll}
                disabled={isSearchingTmdb || isApprovingAll}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                {isSearchingTmdb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Buscar no TMDB
              </button>
            )}

            {scannedItems.some((it) => it.status === "found") && (
              <button
                onClick={handleApproveAll}
                disabled={isApprovingAll}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-emerald-500 flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                {isApprovingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                Aprovar Todos
              </button>
            )}
          </div>
        </div>

        {/* API Key Bar */}
        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Key className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground">TMDB API Key:</span>
          </div>
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole sua TMDB API Key v3 aqui..."
              className="flex-1 h-9 px-3 rounded-lg border border-white/10 bg-black/40 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-3 h-9 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-all shrink-0"
            >
              Salvar
            </button>
          </div>
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 shrink-0"
          >
            Obter chave gratuita
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Barra de Progresso */}
        {progress && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
              <span>Processando acervo...</span>
              <span>
                {progress.current} de {progress.total} (
                {Math.round((progress.current / progress.total) * 100)}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Revisão Lado a Lado */}
      {scannedItems.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-white/10 bg-card/40 space-y-3">
          <Film className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <h3 className="text-lg font-bold text-foreground">Nenhuma varredura ativa</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Clique no botão <strong>"Escanear Acervo"</strong> acima para localizar todos os desenhos com capas do Mercado Livre, gstatic, eBay ou sem ano numérico.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-card/90 overflow-hidden shadow-card">
          <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">
              Itens para Revisão ({scannedItems.length})
            </span>
            <div className="flex gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">
                {scannedItems.filter((i) => i.status === "approved").length} Aprovados
              </span>
              <span className="px-2.5 py-1 rounded-md bg-primary/20 text-primary font-bold">
                {scannedItems.filter((i) => i.status === "found").length} Prontos
              </span>
            </div>
          </div>

          <div className="divide-y divide-white/5 overflow-x-auto">
            {scannedItems.map((item, idx) => {
              const isApproved = item.status === "approved";
              const match = item.tmdbMatch;

              return (
                <div
                  key={item.show.slug}
                  className={`p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 transition-colors ${
                    isApproved ? "bg-emerald-950/10 opacity-75" : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Lado Esquerdo: Capa Atual */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-24 shrink-0 rounded-xl overflow-hidden bg-secondary border border-white/10 shadow-sm relative">
                      <img
                        src={item.show.poster}
                        alt={item.show.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/800x1200/111827/ffffff?text=Quebrado";
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        {item.reason}
                      </span>
                      <h4 className="font-bold text-foreground text-sm sm:text-base">
                        {item.show.title}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Ano Atual: <strong className="text-foreground">{item.show.year}</strong>
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 line-clamp-2 max-w-sm">
                        {item.show.synopsis || "Sem sinopse cadastrada."}
                      </p>
                    </div>
                  </div>

                  {/* Divisor / Seta */}
                  <div className="hidden lg:flex items-center justify-center text-muted-foreground/40 px-2 font-bold text-xl">
                    ➔
                  </div>

                  {/* Lado Direito: Nova Capa HD do TMDB */}
                  <div className="flex items-start gap-4 flex-1">
                    {item.status === "searching" ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        Consultando TMDB...
                      </div>
                    ) : match && match.posterUrl ? (
                      <>
                        <div className="w-16 h-24 shrink-0 rounded-xl overflow-hidden bg-zinc-900 border border-primary/40 shadow-lg relative ring-2 ring-primary/20">
                          <img
                            src={match.posterUrl}
                            alt={match.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="space-y-1 flex-1">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ TMDB HD (w780)
                          </span>
                          <h4 className="font-bold text-foreground text-sm">
                            {match.title}
                          </h4>
                          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Ano Oficial: <strong>{match.year || "Ano não informado"}</strong>
                          </p>
                          <p className="text-[11px] text-muted-foreground/90 line-clamp-2">
                            {match.overview || "Sinopse do TMDB."}
                          </p>
                        </div>
                      </>
                    ) : item.status === "not_found" ? (
                      <div className="text-xs text-muted-foreground py-4 space-y-1">
                        <p className="font-bold text-amber-400">Não localizado no TMDB</p>
                        <p className="text-[11px]">
                          Tente ajustar o título manualmente no modal de edição.
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground/60 py-6 italic">
                        Aguardando busca no TMDB...
                      </div>
                    )}
                  </div>

                  {/* Ação */}
                  <div className="shrink-0 flex items-center justify-end">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <Check className="h-4 w-4" />
                        Gravado
                      </span>
                    ) : match?.posterUrl ? (
                      <button
                        onClick={() => handleApproveSingle(item, idx)}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Aprovar Capa HD
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
