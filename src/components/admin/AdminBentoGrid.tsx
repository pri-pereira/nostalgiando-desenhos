import {
  Film,
  AlertTriangle,
  Users,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  FolderOpen,
  Image,
} from "lucide-react";
import type { Show } from "@/data/shows";
import type { UserProfile } from "@/lib/users";
import { isFragilePoster } from "@/lib/tmdb";

interface AdminBentoGridProps {
  shows: Show[];
  users: UserProfile[];
  brokenLinksCount: number;
  onNavigateTab: (tab: any) => void;
  onQuickSync: () => void;
  isSyncing?: boolean;
}

export function AdminBentoGrid({
  shows,
  users,
  brokenLinksCount,
  onNavigateTab,
  onQuickSync,
  isSyncing,
}: AdminBentoGridProps) {
  // Quantidade de capas frágeis (ML, gstatic, eBay)
  const fragilePostersCount = shows.filter((s) => isFragilePoster(s.poster)).length;

  // Episódios totais
  const totalEpisodes = shows.reduce((acc, s) => acc + (s.episodes?.length || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
      {/* CARD 1: Total de Desenhos + Alerta de Capas Frágeis */}
      <div
        onClick={() => onNavigateTab("titulos")}
        className="group cursor-pointer rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl p-5 shadow-card hover:border-primary/50 transition-all flex flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all" />

        <div className="flex items-center justify-between">
          <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-amber-600 text-white shadow-md">
            <Film className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-muted-foreground group-hover:text-primary flex items-center gap-1 transition-colors">
            Gerenciar
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold text-foreground">
            {shows.length}
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            Total de Desenhos no Acervo
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Capas instáveis:</span>
          {fragilePostersCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              <AlertTriangle className="h-3 w-3" />
              {fragilePostersCount} a corrigir
            </span>
          ) : (
            <span className="font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
              ✓ 100% HD
            </span>
          )}
        </div>
      </div>

      {/* CARD 2: Links Quebrados Pendentes (Alerta Crítico) */}
      <div
        onClick={() => onNavigateTab("manutencao")}
        className={`group cursor-pointer rounded-2xl border backdrop-blur-xl p-5 shadow-card transition-all flex flex-col justify-between relative overflow-hidden ${
          brokenLinksCount > 0
            ? "border-amber-500/40 bg-amber-950/20 hover:border-amber-500/70"
            : "border-white/10 bg-zinc-900/70 hover:border-emerald-500/40"
        }`}
      >
        <div className="flex items-center justify-between">
          <div
            className={`inline-grid h-12 w-12 place-items-center rounded-2xl text-white shadow-md ${
              brokenLinksCount > 0
                ? "bg-gradient-to-br from-amber-500 to-red-600 animate-pulse"
                : "bg-gradient-to-br from-emerald-500 to-teal-600"
            }`}
          >
            <ShieldAlert className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground flex items-center gap-1 transition-colors">
            Ver Reports
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <p
            className={`text-3xl sm:text-4xl font-extrabold ${
              brokenLinksCount > 0 ? "text-amber-400" : "text-foreground"
            }`}
          >
            {brokenLinksCount}
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            Links Quebrados Reportados
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Status do Player:</span>
          {brokenLinksCount > 0 ? (
            <span className="font-bold text-amber-400">Revisão Necessária</span>
          ) : (
            <span className="font-bold text-emerald-400">Tudo Funcionando</span>
          )}
        </div>
      </div>

      {/* CARD 3: Usuários Cadastrados */}
      <div
        onClick={() => onNavigateTab("usuarios")}
        className="group cursor-pointer rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl p-5 shadow-card hover:border-blue-500/50 transition-all flex flex-col justify-between relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
            <Users className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-muted-foreground group-hover:text-blue-400 flex items-center gap-1 transition-colors">
            Gerenciar
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold text-foreground">
            {users.length}
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            Usuários Cadastrados no Firebase
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Episódios no Acervo:</span>
          <span className="font-bold text-foreground">{totalEpisodes}</span>
        </div>
      </div>

      {/* CARD 4: Ação Rápida: Sincronizar TMDB & Higienizar */}
      <div
        onClick={() => onNavigateTab("tmdb")}
        className="group cursor-pointer rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-zinc-900/80 to-zinc-950 backdrop-blur-xl p-5 shadow-card hover:border-primary transition-all flex flex-col justify-between relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
            Ação Rápida
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <h4 className="text-base sm:text-lg font-bold text-foreground">
            Sincronizar TMDB
          </h4>
          <p className="text-xs text-muted-foreground">
            Buscar capas HD e metadados oficiais em 1 clique
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10">
          <button
            type="button"
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Abrir Sincronizador
          </button>
        </div>
      </div>
    </div>
  );
}

