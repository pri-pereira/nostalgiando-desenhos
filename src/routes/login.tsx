import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Tv, Mail, Lock, Eye, EyeOff, ArrowLeft, Sparkles, User, KeyRound, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { isAdminEmail } from "@/lib/users";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Nostalgiando Desenhos" },
      {
        name: "description",
        content:
          "Faça login, crie sua conta ou recupere sua senha para acessar o acervo completo do Nostalgiando Desenhos.",
      },
    ],
  }),
  component: LoginPage,
});

type AuthMode = "login" | "register" | "forgot";

function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const { login, register, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  // Se já está logado, redireciona para home
  if (user) {
    navigate({ to: "/" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Por favor, informe seu e-mail.");
      return;
    }

    if (mode === "forgot") {
      setLoading(true);
      try {
        await resetPassword(email);
        setSuccess(
          "Enviamos um link de redefinição de senha para o seu e-mail! Verifique também sua caixa de spam."
        );
      } catch (err: any) {
        const code = err?.code || "";
        if (code === "auth/user-not-found") {
          setError("Nenhuma conta encontrada com este e-mail.");
        } else if (code === "auth/invalid-email") {
          setError("E-mail com formato inválido.");
        } else {
          setError("Não foi possível enviar o e-mail de recuperação. Tente novamente.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError("Por favor, informe sua senha.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await register(email, password);
        setSuccess("Conta criada com sucesso! Redirecionando para os desenhos...");
        setTimeout(() => navigate({ to: "/" }), 1200);
      } else {
        await login(email, password);
        const isAdminUser = isAdminEmail(email);
        if (isAdminUser) {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/" });
        }
      }
    } catch (err: any) {
      const code = err?.code || "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("E-mail ou senha incorretos.");
      } else if (code === "auth/email-already-in-use") {
        setError("Este e-mail já está cadastrado. Tente entrar ou recupere sua senha.");
      } else if (code === "auth/invalid-email") {
        setError("E-mail inválido.");
      } else if (code === "auth/too-many-requests") {
        setError("Muitas tentativas sem sucesso. Aguarde alguns instantes.");
      } else {
        setError("Erro ao autenticar. Verifique sua conexão e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Cabeçalho de Navegação */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Voltar para o Início
          </Link>

          <div className="flex justify-center mb-4">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-primary via-amber-500 to-amber-600 text-primary-foreground shadow-[0_0_35px_rgba(217,119,6,0.45)] border border-white/20">
              <Tv className="h-8 w-8" />
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            <span className="text-primary">Nostalgiando</span> Desenhos
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" && "Entre na sua conta e continue nostalgiando"}
            {mode === "register" && "Crie sua conta e mergulhe na infância"}
            {mode === "forgot" && "Recuperação segura de senha por e-mail"}
          </p>
        </div>

        {/* Card do Formulário em Glassmorphism */}
        <div className="rounded-3xl border border-white/10 bg-card/85 backdrop-blur-2xl p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]">
          {mode !== "forgot" ? (
            <div className="flex rounded-2xl bg-secondary/40 p-1 mb-6 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  mode === "register"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Criar Conta
              </button>
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <KeyRound className="h-4 w-4" />
                <span>Recuperar Acesso</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccess("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
              >
                Voltar ao Login
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo E-mail */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-12 sm:h-13 rounded-2xl border border-white/10 bg-secondary/40 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Campos de Senha (quando não está no modo 'forgot') */}
            {mode !== "forgot" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-foreground">Senha</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          setError("");
                          setSuccess("");
                        }}
                        className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 sm:h-13 rounded-2xl border border-white/10 bg-secondary/40 pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      autoComplete={mode === "register" ? "new-password" : "current-password"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                      title={showPassword ? "Ocultar senha" : "Ver senha"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Senha no Registro */}
                {mode === "register" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-bold text-foreground mb-1.5">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-12 sm:h-13 rounded-2xl border border-white/10 bg-secondary/40 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Feedback de Erro */}
            {error && (
              <div className="rounded-2xl bg-destructive/15 border border-destructive/30 px-4 py-3 text-sm text-destructive font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </div>
            )}

            {/* Feedback de Sucesso */}
            {success && (
              <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400 font-semibold animate-in fade-in slide-in-from-top-1 duration-200 flex items-start gap-2">
                <Sparkles className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Botão de Envio (CTA Principal - Fitts) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] h-13 sm:h-14 rounded-2xl bg-gradient-to-r from-primary to-amber-600 text-primary-foreground font-bold text-base shadow-[0_0_25px_rgba(217,119,6,0.35)] transition-all hover:shadow-[0_0_35px_rgba(217,119,6,0.55)] hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span className="h-6 w-6 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              ) : (
                <>
                  {mode === "login" && (
                    <>
                      <User className="h-5 w-5" />
                      <span>Entrar na Conta</span>
                    </>
                  )}
                  {mode === "register" && (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Criar Conta Gratuita</span>
                    </>
                  )}
                  {mode === "forgot" && (
                    <>
                      <KeyRound className="h-5 w-5" />
                      <span>Enviar Link de Redefinição</span>
                    </>
                  )}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Rodapé com Dica de Segurança */}
        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          Autenticação criptografada com Firebase Auth · Nostalgiando Desenhos
        </p>
      </div>
    </div>
  );
}
