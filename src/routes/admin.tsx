import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  Tv,
  Film,
  Clock,
  TrendingUp,
  FolderOpen,
  ArrowLeft,
  LogOut,
  ChevronDown,
  AlertTriangle,
  Check,
  Sparkles,
  History,
  Eye,
  ExternalLink,
  Settings,
  BarChart3,
  Grid3X3,
  Layers,
  Filter,
  Menu,
  Download,
  Upload,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import {
  CATEGORIES,
  type Show,
  type CategoryId,
  getAllShows,
  getCachedShows,
  saveShowToStorage,
  updateShowInStorage,
  deleteShowFromStorage,
  exportCatalog,
  importCatalog,
} from "@/data/shows";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin — Nostalgiando Desenhos" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

// Tabs do painel
type AdminTab = "dashboard" | "titulos" | "adicionar" | "categorias";

function AdminPage() {
  const { isAdmin, loginAsAdmin, logoutAdmin } = useAuth();
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");

  if (!isAdmin) {
    return (
      <AdminAccessGate
        accessCode={accessCode}
        setAccessCode={setAccessCode}
        accessError={accessError}
        setAccessError={setAccessError}
        loginAsAdmin={loginAsAdmin}
      />
    );
  }

  return <AdminDashboard />;
}

// ============================================================================
// TELA DE ACESSO (GATE)
// ============================================================================
function AdminAccessGate({
  accessCode,
  setAccessCode,
  accessError,
  setAccessError,
  loginAsAdmin,
}: {
  accessCode: string;
  setAccessCode: (v: string) => void;
  accessError: string;
  setAccessError: (v: string) => void;
  loginAsAdmin: (code: string) => boolean;
}) {
  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAsAdmin(accessCode)) {
      setAccessError("");
    } else {
      setAccessError("Código de acesso incorreto!");
      setAccessCode("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-base font-medium mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar para o Início
        </Link>

        <div className="rounded-3xl border border-white/10 bg-card/90 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
          <div className="text-center mb-6">
            <span className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] mb-4">
              <Settings className="h-8 w-8" />
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Painel Admin
            </h1>
            <p className="text-base text-muted-foreground mt-2">
              Digite a senha de administrador (4 dígitos)
            </p>
          </div>

          <form onSubmit={handleAccess} className="space-y-4">
            <div>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Código de acesso (ex: 2525)"
                maxLength={10}
                className="w-full h-14 rounded-2xl border border-white/10 bg-secondary/40 px-4 text-center text-2xl font-bold tracking-[0.25em] text-foreground placeholder:text-muted-foreground/50 placeholder:tracking-normal placeholder:text-base placeholder:font-normal focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                autoFocus
              />
            </div>

            {accessError && (
              <div className="rounded-xl bg-destructive/15 border border-destructive/30 px-4 py-3 text-sm font-semibold text-destructive text-center animate-in fade-in duration-200">
                {accessError}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold text-base shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-[0.98]"
            >
              Acessar Painel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD PRINCIPAL
// ============================================================================
function AdminDashboard() {
  const { logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [shows, setShows] = useState<Show[]>(() => getCachedShows());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("todos");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAllShows();

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

  const loadAllShows = async () => {
    try {
      const data = await getAllShows();
      if (data && data.length > 0) {
        setShows(data);
      }
    } catch (e) {
      console.warn("Aviso ao carregar shows:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddShow = (newShow: Show) => {
    const updated = saveShowToStorage(newShow);
    setShows(updated);
  };

  const handleUpdateShow = (slug: string, data: Partial<Show>) => {
    const updated = updateShowInStorage(slug, data);
    setShows(updated);
  };

  const handleDeleteShow = (slug: string) => {
    const updated = deleteShowFromStorage(slug);
    setShows(updated);
  };

  const handleResetCatalog = () => {
    if (
      window.confirm(
        "Deseja realmente restaurar todos os títulos padrão de fábrica? Modificações personalizadas serão restauradas para os clássicos originais."
      )
    ) {
      const reset = resetCatalogToDefault();
      setShows(reset);
    }
  };

  const filteredShows = useMemo(() => {
    return shows.filter((s) => {
      const matchesQuery =
        !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.archiveId && s.archiveId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.year && s.year.includes(searchQuery));

      const matchesCategory =
        selectedCategoryFilter === "todos" || s.category === selectedCategoryFilter;

      return matchesQuery && matchesCategory;
    });
  }, [shows, searchQuery, selectedCategoryFilter]);

  const menuItems: { id: AdminTab; icon: any; label: string }[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "titulos", icon: Film, label: "Todos os Títulos" },
    { id: "adicionar", icon: Plus, label: "Adicionar Novo" },
    { id: "categorias", icon: FolderOpen, label: "Categorias" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================================================================
          SIDEBAR RESPONSIVA
          ================================================================ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 shadow-2xl lg:shadow-none lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-md">
              <Settings className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-foreground truncate">
                Painel Admin
              </h2>
              <p className="text-xs text-primary font-bold tracking-wider uppercase">
                Nostalgiando
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden grid h-9 w-9 place-items-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-semibold transition-all ${
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.id === "titulos" && (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-foreground">
                    {shows.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/60 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all border border-transparent"
          >
            <Eye className="h-4 w-4" />
            Ver Catálogo na Home
          </Link>
          <button
            onClick={() => {
              logoutAdmin();
              navigate({ to: "/" });
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all border border-transparent"
          >
            <LogOut className="h-4 w-4" />
            Sair do Admin
          </button>
        </div>
      </aside>

      {/* ================================================================
          CONTEÚDO PRINCIPAL
          ================================================================ */}
      <div className="flex-1 min-w-0">
        {/* Top Bar Mobile & Desktop */}
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/60 px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden grid h-11 w-11 place-items-center rounded-xl border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
                aria-label="Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                  {menuItems.find((m) => m.id === activeTab)?.label}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {shows.length} títulos cadastrados no total
                </p>
              </div>
            </div>

            {/* Ações do Topo */}
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl border border-white/10 bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-secondary/80 hover:border-primary/40 text-sm font-bold transition-all active:scale-95"
                title="Voltar para a Home"
              >
                <Eye className="h-4 w-4" />
                <span>Ver Home</span>
              </Link>

              {activeTab !== "adicionar" && (
                <button
                  onClick={() => setActiveTab("adicionar")}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Adicionar</span> Título
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 max-w-6xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Film className="h-10 w-10 animate-spin mb-3 text-primary opacity-60" />
              <p className="text-base">Carregando catálogo completo...</p>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardView
                  shows={shows}
                  setShows={setShows}
                  setActiveTab={setActiveTab}
                />
              )}
              {activeTab === "titulos" && (
                <TitulosView
                  shows={filteredShows}
                  totalCount={shows.length}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategoryFilter={selectedCategoryFilter}
                  setSelectedCategoryFilter={setSelectedCategoryFilter}
                  deleteShow={handleDeleteShow}
                  updateShow={handleUpdateShow}
                  setActiveTab={setActiveTab}
                />
              )}
              {activeTab === "adicionar" && (
                <AdicionarView addShow={handleAddShow} setActiveTab={setActiveTab} />
              )}
              {activeTab === "categorias" && (
                <CategoriasView
                  shows={shows}
                  onSelectCategory={(catId) => {
                    setSelectedCategoryFilter(catId);
                    setActiveTab("titulos");
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD VIEW
// ============================================================================
function DashboardView({
  shows,
  setShows,
  setActiveTab,
}: {
  shows: Show[];
  setShows: (shows: Show[]) => void;
  setActiveTab: (tab: AdminTab) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const dataStr = exportCatalog();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `nostalgiando-catalogo-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setBackupStatus("Backup exportado com sucesso! Guarde este arquivo em segurança.");
      setTimeout(() => setBackupStatus(null), 5000);
    } catch (e) {
      console.error("Erro ao exportar:", e);
      setBackupStatus("Erro ao gerar backup.");
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const updated = await importCatalog(parsed);
            setShows(updated);
            setBackupStatus(`Sucesso! ${updated.length} títulos foram importados e sincronizados na nuvem.`);
            setTimeout(() => setBackupStatus(null), 6000);
          } else {
            alert("Arquivo JSON inválido. Certifique-se de que é um backup exportado do Nostalgiando.");
          }
        } catch (err) {
          alert("Erro ao processar arquivo JSON. Verifique a formatação.");
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error("Erro ao importar arquivo:", err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const stats = [
    {
      label: "Total no Catálogo",
      value: shows.length,
      icon: Film,
      color: "from-primary to-amber-600",
      glow: "rgba(217,119,6,0.3)",
    },
    {
      label: "Categorias Ativas",
      value: CATEGORIES.filter((c) => c.id !== "todos").length,
      icon: FolderOpen,
      color: "from-emerald-500 to-teal-600",
      glow: "rgba(160,185,129,0.3)",
    },
    {
      label: "Com Streaming / Player",
      value: shows.filter((s) => s.archiveId || s.episodes.length > 0).length,
      icon: Tv,
      color: "from-blue-500 to-indigo-600",
      glow: "rgba(59,130,246,0.3)",
    },
    {
      label: "Episódios Mapeados",
      value: shows.reduce((acc, s) => acc + (s.episodes?.length || 0), 0),
      icon: Layers,
      color: "from-purple-500 to-fuchsia-600",
      glow: "rgba(168,85,247,0.3)",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Mensagem de Feedback do Backup */}
      {backupStatus && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-emerald-400 font-bold text-sm flex items-center gap-2 animate-in fade-in duration-300">
          <Check className="h-5 w-5 shrink-0" />
          <span>{backupStatus}</span>
        </div>
      )}

      {/* Input Oculto de Importação */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group rounded-2xl border border-white/10 bg-card/90 p-4 sm:p-5 shadow-card transition-all hover:border-white/20 relative overflow-hidden"
            >
              <div
                className={`inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-md mb-3`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions + All Titles Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ações Rápidas & Backup */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-card/90 p-5 sm:p-6 shadow-card">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              Ações Rápidas
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab("adicionar")}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary/15 border border-primary/30 text-primary font-bold text-base hover:bg-primary/25 transition-all active:scale-95"
              >
                <Plus className="h-5 w-5" />
                Adicionar Novo Título
              </button>
              <button
                onClick={() => setActiveTab("titulos")}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-secondary/50 border border-white/10 text-foreground font-semibold text-base hover:bg-secondary/70 transition-all active:scale-95"
              >
                <Film className="h-5 w-5" />
                Gerenciar Todos os {shows.length} Títulos
              </button>
              <button
                onClick={() => setActiveTab("categorias")}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-secondary/50 border border-white/10 text-foreground font-semibold text-base hover:bg-secondary/70 transition-all active:scale-95"
              >
                <FolderOpen className="h-5 w-5" />
                Gerenciar por Categoria
              </button>
            </div>
          </div>

          {/* Backup & Proteção Contra Versionamentos */}
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-card p-5 sm:p-6 shadow-card">
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2 mb-2">
              <Save className="h-4 w-4 text-amber-400" />
              Backup & Sincronização
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Exporte seus títulos personalizados em arquivo JSON para garantir que nenhuma edição seja perdida entre atualizações do site.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-sm font-bold border border-white/10 transition-all active:scale-95"
              >
                <Download className="h-4 w-4 text-primary" />
                Baixar Backup (.json)
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-sm font-bold border border-white/10 transition-all active:scale-95"
              >
                <Upload className="h-4 w-4 text-amber-400" />
                Restaurar do Backup (.json)
              </button>
            </div>
          </div>

          {/* Distribuição rápida */}
          <div className="rounded-2xl border border-white/10 bg-card/90 p-5 sm:p-6 shadow-card">
            <h3 className="font-display text-base font-bold text-foreground mb-3">
              Títulos por Categoria
            </h3>
            <div className="space-y-2.5">
              {CATEGORIES.filter((c) => c.id !== "todos").map((cat) => {
                const count = shows.filter((s) => s.category === cat.id).length;
                return (
                  <div key={cat.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate font-medium">{cat.label}</span>
                    <span className="font-bold text-foreground bg-secondary px-2.5 py-0.5 rounded-md text-xs">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lista Resumo dos Títulos Cadastrados */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-card/90 p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              Títulos no Catálogo ({shows.length})
            </h3>
            <button
              onClick={() => setActiveTab("titulos")}
              className="text-sm text-primary hover:underline font-bold"
            >
              Gerenciar todos →
            </button>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {shows.map((show) => {
              const catObj = CATEGORIES.find((c) => c.id === show.category);
              return (
                <div
                  key={show.slug}
                  className="flex items-center gap-3.5 rounded-2xl bg-secondary/30 border border-white/5 p-3 hover:bg-secondary/60 transition-all"
                >
                  <div className="w-12 h-16 sm:w-14 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-secondary border border-white/10">
                    <img
                      src={show.poster}
                      alt={show.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/800x1200/111827/ffffff?text=Sem+Poster";
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-foreground truncate">{show.title}</p>
                      <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary shrink-0 border border-primary/20">
                        {show.year}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                      {catObj?.label || show.category}
                      {show.archiveId ? ` · Archive: ${show.archiveId}` : ""}
                    </p>
                  </div>

                  <Link
                    to="/assistir/$slug"
                    params={{ slug: show.slug }}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-secondary/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shrink-0"
                    title="Assistir no site"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TÍTULOS VIEW (GERENCIAMENTO RESPONSIVO)
// ============================================================================
function TitulosView({
  shows,
  totalCount,
  searchQuery,
  setSearchQuery,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  deleteShow,
  updateShow,
  setActiveTab,
}: {
  shows: Show[];
  totalCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (cat: string) => void;
  deleteShow: (slug: string) => void;
  updateShow: (slug: string, data: Partial<Show>) => void;
  setActiveTab: (tab: AdminTab) => void;
}) {
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Show>>({});
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);

  const startEdit = (show: Show) => {
    setEditingSlug(show.slug);
    setEditData({
      title: show.title,
      poster: show.poster,
      category: show.category,
      synopsis: show.synopsis,
      year: show.year,
      archiveId: show.archiveId || "",
    });
  };

  const saveEdit = (slug: string) => {
    updateShow(slug, editData);
    setEditingSlug(null);
    setEditData({});
  };

  const cancelEdit = () => {
    setEditingSlug(null);
    setEditData({});
  };

  const confirmDelete = (slug: string) => {
    deleteShow(slug);
    setConfirmDeleteSlug(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Search & Category Filter Bar */}
      <div className="rounded-2xl border border-white/10 bg-card/90 p-4 sm:p-5 shadow-card space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, ano ou archive..."
              className="h-12 w-full rounded-xl border border-white/10 bg-secondary/40 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <span className="text-sm text-muted-foreground font-semibold">
              <strong className="text-foreground text-base">{shows.length}</strong> de{" "}
              <strong className="text-foreground text-base">{totalCount}</strong> títulos
            </span>

            <button
              onClick={() => setActiveTab("adicionar")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/90 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              Novo
            </button>
          </div>
        </div>

        {/* Filtro rápido de Categorias com scroll horizontal suave */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button
            onClick={() => setSelectedCategoryFilter("todos")}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              selectedCategoryFilter === "todos"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70"
            }`}
          >
            Todos ({totalCount})
          </button>
          {CATEGORIES.filter((c) => c.id !== "todos").map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategoryFilter === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Títulos */}
      {shows.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-secondary/10">
          <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-foreground font-bold text-lg">Nenhum título encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente buscar com outros termos ou limpe o filtro
          </p>
          {(searchQuery || selectedCategoryFilter !== "todos") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryFilter("todos");
              }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-bold hover:bg-secondary/80 transition-all"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {shows.map((show) => {
            const isEditing = editingSlug === show.slug;
            const isConfirmingDelete = confirmDeleteSlug === show.slug;
            const categoryInfo = CATEGORIES.find((c) => c.id === show.category);

            return (
              <div
                key={show.slug}
                className="group rounded-2xl border border-white/10 bg-card/90 p-4 sm:p-5 shadow-sm transition-all hover:border-white/20"
              >
                {isEditing ? (
                  // ================= MODAL / FORMULÁRIO DE EDIÇÃO =================
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <span className="text-sm font-bold text-primary uppercase tracking-wider">
                        Editando: {show.title}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        slug: {show.slug}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-foreground mb-1.5">
                          Título do Desenho
                        </label>
                        <input
                          value={editData.title || ""}
                          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                          className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-3.5 text-base text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-1.5">
                          Ano
                        </label>
                        <input
                          value={editData.year || ""}
                          onChange={(e) => setEditData({ ...editData, year: e.target.value })}
                          className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-3.5 text-base text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-1.5">
                          Categoria / Prateleira
                        </label>
                        <select
                          value={editData.category || show.category}
                          onChange={(e) =>
                            setEditData({ ...editData, category: e.target.value as CategoryId })
                          }
                          className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-3.5 text-base text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                          {CATEGORIES.filter((c) => c.id !== "todos").map((c) => (
                            <option key={c.id} value={c.id} className="bg-card text-foreground">
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-foreground mb-1.5">
                          ID do Internet Archive (para player)
                        </label>
                        <input
                          value={editData.archiveId || ""}
                          onChange={(e) => setEditData({ ...editData, archiveId: e.target.value })}
                          placeholder="Ex: caverna-do-dragao_202508"
                          className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-3.5 text-base text-foreground font-mono focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-foreground mb-1.5">
                        URL da Imagem / Pôster
                      </label>
                      <input
                        value={editData.poster || ""}
                        onChange={(e) => setEditData({ ...editData, poster: e.target.value })}
                        className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-3.5 text-base text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-foreground mb-1.5">
                        Sinopse
                      </label>
                      <textarea
                        value={editData.synopsis || ""}
                        onChange={(e) => setEditData({ ...editData, synopsis: e.target.value })}
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-secondary/40 px-3.5 py-2.5 text-base text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2 border-t border-white/5">
                      <button
                        onClick={cancelEdit}
                        className="h-12 px-5 rounded-xl border border-border text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => saveEdit(show.slug)}
                        className="h-12 px-6 rounded-xl bg-primary text-primary-foreground text-base font-bold hover:bg-primary/90 transition-colors shadow-md"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                ) : (
                  // ================= MODO VISUALIZAÇÃO CARD (RESPONSIVO) =================
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Header Mobile: Pôster + Título */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-16 h-24 sm:w-16 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-secondary border border-white/10 shadow-sm relative">
                        <img
                          src={show.poster}
                          alt={show.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/800x1200/111827/ffffff?text=Sem+Poster";
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0 sm:hidden">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-black/70 px-2 py-0.5 text-xs font-bold text-white border border-white/10">
                            {show.year}
                          </span>
                          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                            {categoryInfo?.label || show.category}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-foreground mt-1 leading-snug">
                          {show.title}
                        </h4>
                        {show.archiveId && (
                          <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                            ID: {show.archiveId}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Informações Desktop */}
                    <div className="hidden sm:block flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-bold text-foreground truncate">
                          {show.title}
                        </h4>
                        <span className="rounded bg-black/70 px-2 py-0.5 text-xs font-bold text-white border border-white/10">
                          {show.year}
                        </span>
                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
                          {categoryInfo?.label || show.category}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                        {show.synopsis}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground/80">
                        <span className="font-mono">slug: {show.slug}</span>
                        {show.archiveId && (
                          <span>
                            · Archive: <span className="font-mono text-foreground font-semibold">{show.archiveId}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sinopse Mobile */}
                    <div className="sm:hidden">
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {show.synopsis}
                      </p>
                    </div>

                    {/* Ações (Touch-friendly para mobile) */}
                    <div className="flex items-center gap-2.5 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <Link
                        to="/assistir/$slug"
                        params={{ slug: show.slug }}
                        className="h-11 px-3.5 rounded-xl border border-white/10 bg-secondary/50 text-sm font-bold text-muted-foreground hover:text-primary hover:border-primary/50 transition-all flex items-center gap-1.5 active:scale-95"
                        title="Assistir no site"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Ver</span>
                      </Link>

                      <button
                        onClick={() => startEdit(show)}
                        className="h-11 px-3.5 rounded-xl border border-white/10 bg-secondary/50 text-sm font-bold text-muted-foreground hover:text-blue-400 hover:border-blue-400/50 transition-all flex items-center gap-1.5 active:scale-95"
                        title="Editar título"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Editar</span>
                      </button>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                          <button
                            onClick={() => confirmDelete(show.slug)}
                            className="h-11 px-3.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:bg-destructive/90 transition-all flex items-center gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteSlug(null)}
                            className="h-11 px-3 rounded-xl border border-white/10 bg-secondary text-muted-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteSlug(show.slug)}
                          className="h-11 w-11 grid place-items-center rounded-xl border border-white/10 bg-secondary/50 text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all active:scale-95"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADICIONAR VIEW (RESPONSIVO)
// ============================================================================
function AdicionarView({
  addShow,
  setActiveTab,
}: {
  addShow: (show: Show) => void;
  setActiveTab: (tab: AdminTab) => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [archiveId, setArchiveId] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [year, setYear] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [category, setCategory] = useState<CategoryId>("catalogo");
  const [success, setSuccess] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(val));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      alert("Por favor, preencha o Título do desenho!");
      return;
    }

    const finalSlug = slug.trim() || generateSlug(title);

    const newShow: Show = {
      slug: finalSlug,
      title: title.trim(),
      year: year.trim() || "Clássico",
      category,
      poster:
        posterUrl.trim() ||
        "https://via.placeholder.com/800x1200/111827/ffffff?text=" + encodeURIComponent(title),
      synopsis:
        synopsis.trim() || "Desenho clássico adicionado através do painel de administração.",
      archiveId: archiveId.trim() || undefined,
      episodes: [],
    };

    addShow(newShow);

    setSuccess(true);
    setTitle("");
    setSlug("");
    setArchiveId("");
    setPosterUrl("");
    setYear("");
    setSynopsis("");
    setCategory("catalogo");

    setTimeout(() => {
      setSuccess(false);
    }, 4000);
  };

  return (
    <div className="max-w-2xl animate-in fade-in duration-300">
      {success && (
        <div className="mb-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 sm:p-5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Check className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold text-emerald-400">Título adicionado com sucesso!</p>
              <p className="text-sm text-emerald-400/80 mt-0.5">
                Já está disponível no catálogo e na Home do site.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("titulos")}
            className="text-sm font-bold text-emerald-400 hover:underline shrink-0"
          >
            Ver todos →
          </button>
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-card/90 p-5 sm:p-7 shadow-card">
        <div className="mb-6 pb-4 border-b border-white/5">
          <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Plus className="h-6 w-6 text-primary" />
            Adicionar Novo Título ao Catálogo
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Preencha os dados abaixo para publicar um desenho
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                Título do Desenho *
              </label>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: As Aventuras de Jackie Chan"
                className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                Identificador URL (Slug)
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: jackie-chan-adventures"
                className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-4 text-base text-foreground font-mono placeholder:text-muted-foreground focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-foreground mb-1.5">
                Categoria / Prateleira *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-4 text-base text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
              >
                {CATEGORIES.filter((c) => c.id !== "todos").map((c) => (
                  <option key={c.id} value={c.id} className="bg-card text-foreground">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                Ano de Lançamento
              </label>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Ex: 1995"
                className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              ID do Internet Archive (para player automático)
            </label>
            <input
              value={archiveId}
              onChange={(e) => setArchiveId(e.target.value)}
              placeholder="Ex: caverna-do-dragao_202508 ou corrida-malucadublado"
              className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Os episódios .mp4 desta coleção no archive.org serão carregados automaticamente no player de vídeo.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              URL da Imagem / Pôster
            </label>
            <input
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="https://exemplo.com/poster.jpg"
              className="w-full h-12 rounded-xl border border-white/10 bg-secondary/40 px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Sinopse do Desenho
            </label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="História do desenho..."
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-secondary/40 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
          </div>

          {posterUrl && (
            <div className="rounded-2xl border border-white/10 bg-secondary/30 p-3.5 flex items-center gap-3.5 animate-in fade-in duration-200">
              <img
                src={posterUrl}
                alt="Preview"
                className="w-16 h-24 rounded-xl object-cover border border-white/10 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div>
                <span className="text-xs uppercase font-bold text-primary tracking-wider">
                  Pré-visualização
                </span>
                <p className="text-base font-bold text-foreground">
                  {title || "Título do Desenho"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {year || "Ano"} · {CATEGORIES.find((c) => c.id === category)?.label}
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-amber-600 text-primary-foreground font-bold text-base shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Salvar e Publicar no Catálogo
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// CATEGORIAS VIEW (RESPONSIVO)
// ============================================================================
function CategoriasView({
  shows,
  onSelectCategory,
}: {
  shows: Show[];
  onSelectCategory: (catId: string) => void;
}) {
  const categoryStats = useMemo(() => {
    return CATEGORIES.filter((c) => c.id !== "todos").map((cat) => {
      const categoryShows = shows.filter((s) => s.category === cat.id);
      return { ...cat, count: categoryShows.length, shows: categoryShows };
    });
  }, [shows]);

  const totalShows = shows.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
          Categorias & Prateleiras
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Distribuição dos {totalShows} títulos pelas prateleiras do site
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categoryStats.map((cat) => {
          const percentage = totalShows > 0 ? Math.round((cat.count / totalShows) * 100) : 0;
          return (
            <div
              key={cat.id}
              className="group rounded-2xl border border-white/10 bg-card/90 p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {cat.label}
                  </h4>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
                    {cat.count} título{cat.count !== 1 ? "s" : ""}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {cat.description}
                </p>
              </div>

              <div>
                {cat.shows.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 overflow-hidden">
                    {cat.shows.slice(0, 5).map((s) => (
                      <div
                        key={s.slug}
                        className="w-10 h-14 rounded-lg bg-secondary overflow-hidden shrink-0 border border-white/10 shadow-sm"
                        title={s.title}
                      >
                        <img src={s.poster} alt={s.title} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {cat.shows.length > 5 && (
                      <span className="text-xs text-muted-foreground font-bold pl-1">
                        +{cat.shows.length - 5}
                      </span>
                    )}
                  </div>
                )}

                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 4)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2.5 text-xs sm:text-sm">
                  <span className="text-muted-foreground font-medium">{percentage}% do total</span>
                  <button
                    onClick={() => onSelectCategory(cat.id)}
                    className="font-bold text-primary hover:underline"
                  >
                    Ver títulos da prateleira →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
