import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Tv, Mail, Lock, Eye, EyeOff, ArrowLeft, Sparkles, User } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { isAdminEmail } from "@/lib/users";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Nostalgiando Desenhos" },
      { name: "description", content: "Faça login ou crie sua conta para acessar o catálogo completo do Nostalgiando Desenhos." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const { login, register, user } = useAuth();
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

    if (!email || !password) {
      setError("Preencha todos os campos.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
        setSuccess("Conta criada com sucesso! Redirecionando...");
        setTimeout(() => navigate({ to: "/" }), 1500);
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
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Email ou senha incorretos.");
      } else if (code === "auth/email-already-in-use") {
        setError("Este email já está cadastrado.");
      } else if (code === "auth/invalid-email") {
        setError("Email inválido.");
      } else if (code === "auth/too-many-requests") {
        setError("Muitas tentativas. Tente novamente em alguns minutos.");
      } else {
        setError("Erro ao autenticar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Voltar */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium mb-6">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Início
          </Link>

          <div className="flex justify-center mb-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground shadow-[0_0_30px_rgba(217,119,6,0.4)]">
              <Tv className="h-8 w-8" />
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            <span className="text-primary">Nostalgiando</span> Desenhos
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRegister
              ? "Crie sua conta e mergulhe na nostalgia"
              : "Entre na sua conta e continue nostalgiando"}
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="rounded-3xl border border-white/10 bg-card/80 backdrop-blur-2xl p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
          <div className="flex rounded-2xl bg-secondary/30 p-1 mb-6 border border-white/5">
            <button
              onClick={() => { setIsRegister(false); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                !isRegister
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isRegister
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-13 rounded-2xl border border-white/10 bg-secondary/40 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-13 rounded-2xl border border-white/10 bg-secondary/40 pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha (somente registro) */}
            {isRegister && (
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
                    className="w-full h-13 rounded-2xl border border-white/10 bg-secondary/40 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {/* Mensagens de erro/sucesso */}
            {error && (
              <div className="rounded-xl bg-destructive/15 border border-destructive/30 px-4 py-3 text-sm text-destructive font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                <Sparkles className="inline h-4 w-4 mr-1.5" />
                {success}
              </div>
            )}

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-amber-600 text-primary-foreground font-bold text-base shadow-[0_0_20px_rgba(217,119,6,0.35)] transition-all hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-6 w-6 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              ) : (
                <>
                  <User className="h-5 w-5" />
                  {isRegister ? "Criar Conta Gratuita" : "Entrar na Conta"}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Nostalgiando Desenhos · Seu portal de animações retrô
        </p>
      </div>
    </div>
  );
}
