import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { SiteHeader } from "@/components/SiteHeader";
import { 
  User, 
  Settings, 
  KeyRound, 
  Mail, 
  Save, 
  Brush, 
  Send,
  Loader2,
  Clock,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { updateProfile, updatePassword } from "firebase/auth";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [{ title: "Meu Perfil — Nostalgiando Desenhos" }],
  }),
  component: ProfilePage,
});

type DrawingRequest = {
  id: string;
  title: string;
  description: string;
  status: "pendente" | "analise" | "atendido";
  createdAt: string;
};

// Simulando um banco de dados local para os pedidos do usuário para efeitos de demonstração
const getLocalRequests = (): DrawingRequest[] => {
  try {
    const saved = localStorage.getItem("nostalgiando_user_requests");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocalRequests = (reqs: DrawingRequest[]) => {
  localStorage.setItem("nostalgiando_user_requests", JSON.stringify(reqs));
};

function ProfilePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"conta" | "pedidos">("conta");
  
  // Conta states
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Pedidos states
  const [requests, setRequests] = useState<DrawingRequest[]>([]);
  const [reqTitle, setReqTitle] = useState("");
  const [reqDesc, setReqDesc] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
    if (user) {
      setDisplayName(user.displayName || "");
      setRequests(getLocalRequests());
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let updated = false;
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
        updated = true;
      }
      if (newPassword) {
        await updatePassword(user, newPassword);
        setNewPassword("");
        updated = true;
      }

      if (updated) {
        toast.success("Perfil atualizado com sucesso!");
      } else {
        toast.info("Nenhuma alteração foi feita.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar perfil. Talvez você precise fazer login novamente para alterar a senha.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;

    const newReq: DrawingRequest = {
      id: Date.now().toString(),
      title: reqTitle,
      description: reqDesc,
      status: "pendente",
      createdAt: new Date().toISOString(),
    };

    const newRequests = [newReq, ...requests];
    setRequests(newRequests);
    saveLocalRequests(newRequests);
    setReqTitle("");
    setReqDesc("");
    toast.success("Seu pedido foi enviado! Nossa equipe vai analisar.");
  };

  return (
    <div className="min-h-screen bg-background pt-24 sm:pt-28 pb-16">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas informações, senha e seus pedidos de desenhos.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Menu Lateral */}
          <aside className="w-full lg:w-64 shrink-0 space-y-2 animate-in fade-in slide-in-from-left-4 duration-500">
            <button
              onClick={() => setActiveTab("conta")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                activeTab === "conta"
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Settings className="h-5 w-5" />
              Configurações
            </button>
            <button
              onClick={() => setActiveTab("pedidos")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                activeTab === "pedidos"
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Brush className="h-5 w-5" />
              Pedidos de Desenhos
            </button>
          </aside>

          {/* Conteúdo */}
          <div className="flex-1 w-full bg-card/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === "conta" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
                    <User className="h-6 w-6 text-primary" />
                    Informações da Conta
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Altere como você é chamado e sua senha de acesso.
                  </p>
                </div>

                <div className="bg-secondary/20 rounded-2xl p-4 flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground font-black text-2xl shadow-lg border border-white/20">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      E-mail Conectado
                    </p>
                    <p className="text-lg font-bold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      {user.email}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase">
                      Nome de Exibição
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full h-12 rounded-xl border border-white/10 bg-secondary/50 px-4 text-sm text-foreground focus:border-primary/50 focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase">
                      Nova Senha (deixe em branco para não alterar)
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-12 rounded-xl border border-white/10 bg-secondary/50 pl-11 pr-4 text-sm text-foreground focus:border-primary/50 focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full sm:w-auto px-8 h-12 rounded-xl bg-gradient-to-r from-primary to-amber-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "pedidos" && (
              <div className="space-y-8">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
                    <Brush className="h-6 w-6 text-primary" />
                    Pedidos de Desenhos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Não encontrou seu desenho favorito? Peça para nossa equipe adicionar!
                  </p>
                </div>

                <form onSubmit={handleCreateRequest} className="bg-secondary/20 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                  
                  <h4 className="font-bold text-base flex items-center gap-2 mb-2 relative z-10">
                    <Send className="h-4 w-4 text-primary" />
                    Fazer novo pedido
                  </h4>
                  
                  <div className="relative z-10">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase">
                      Qual desenho você quer ver?
                    </label>
                    <input
                      type="text"
                      value={reqTitle}
                      onChange={(e) => setReqTitle(e.target.value)}
                      placeholder="Ex: Coragem, o Cão Covarde"
                      required
                      className="w-full h-11 rounded-xl border border-white/10 bg-background/50 px-4 text-sm text-foreground focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  
                  <div className="relative z-10">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase">
                      Algum detalhe ou temporada específica? (Opcional)
                    </label>
                    <textarea
                      value={reqDesc}
                      onChange={(e) => setReqDesc(e.target.value)}
                      placeholder="Ex: Quero a 1ª temporada dublada"
                      className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none h-20"
                    />
                  </div>

                  <div className="flex justify-end pt-2 relative z-10">
                    <button
                      type="submit"
                      className="rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.5)] transition-all flex items-center gap-2"
                    >
                      Enviar Pedido
                    </button>
                  </div>
                </form>

                <div className="pt-4 border-t border-white/10">
                  <h4 className="font-bold text-lg mb-4">Meus Pedidos Anteriores</h4>
                  
                  {requests.length === 0 ? (
                    <div className="text-center py-8 bg-secondary/10 rounded-2xl border border-white/5 border-dashed">
                      <Brush className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        Você ainda não fez nenhum pedido de desenho.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((req) => (
                        <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-secondary/20 border border-white/5 hover:bg-secondary/30 transition-colors">
                          <div>
                            <h5 className="font-bold text-foreground">{req.title}</h5>
                            {req.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{req.description}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1.5 opacity-70">
                              Pedido feito em: {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            {req.status === "pendente" && (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 text-[11px] font-bold border border-amber-500/20">
                                <Clock className="h-3 w-3" />
                                Na Fila
                              </span>
                            )}
                            {req.status === "analise" && (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-500 text-[11px] font-bold border border-blue-500/20">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Em Análise
                              </span>
                            )}
                            {req.status === "atendido" && (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-[11px] font-bold border border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3" />
                                Atendido
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
