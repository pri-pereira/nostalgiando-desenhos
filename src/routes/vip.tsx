import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Crown,
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Tv,
  HeartHandshake,
  Clock,
  Flame,
  HelpCircle,
  Film,
  Lock,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/authContext";
import { PixCheckoutModal } from "@/components/vip/PixCheckoutModal";

export const Route = createFileRoute("/vip")({
  component: VipPage,
  head: () => ({
    meta: [
      { title: "Clube VIP Nostalgia | Nostalgiando Desenhos" },
      {
        name: "description",
        content:
          "Assine o Clube VIP Nostalgiando e garanta acesso prioritário, pedidos exclusivos de desenhos, alta definição sem anúncios e apoio à preservação da memória da animação.",
      },
    ],
  }),
});

interface Plan {
  id: "monthly" | "annual";
  name: string;
  badge?: string;
  isPopular?: boolean;
  price: string;
  rawPrice: number;
  period: string;
  monthlyEquivalent?: string;
  description: string;
  features: string[];
  ctaText: string;
}

export function VipPage() {
  const { user, isVip, profile } = useAuth();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const plans: Plan[] = [
    {
      id: "monthly",
      name: "VIP Mensal — Sábado Animado",
      badge: "Flexibilidade",
      price: "R$ 14,90",
      rawPrice: 14.9,
      period: "por mês",
      description: "Ideal para matar a saudade dos clássicos da infância com benefícios exclusivos.",
      features: [
        "Selo VIP Dourado oficial no perfil",
        "Prioridade máxima na fila de Pedidos de Desenhos",
        "Voto com peso duplo no Mural Comunitário",
        "Acesso antecipado aos lançamentos da semana",
        "Modo TV de Tubo e Player Retrô liberados",
        "Experiência 100% limpa e sem interrupções",
        "Cancelamento a qualquer momento",
      ],
      ctaText: "Assinar VIP Mensal",
    },
    {
      id: "annual",
      name: "VIP Anual — Mestre dos Clássicos",
      badge: "Mais Popular • Economize 40%",
      isPopular: true,
      price: "R$ 97,00",
      rawPrice: 97.0,
      period: "por ano",
      monthlyEquivalent: "Apenas R$ 8,08/mês",
      description: "O melhor custo-benefício para quem ama desenhos e deseja apoiar o projeto a longo prazo.",
      features: [
        "Todos os benefícios do VIP Mensal",
        "Seu nome gravado no Mural de Patronos do Nostalgiando",
        "Pedidos de desenhos ilimitados na comunidade",
        "Selo exclusivo 'Mestre dos Clássicos' no perfil",
        "40% de desconto em relação ao plano mensal",
        "Acesso garantido a todos os futuros recursos",
        "Apoio direto à restauração e acervo digital",
      ],
      ctaText: "Garantir VIP com 40% OFF",
    },
  ];

  const handleSelectPlan = (plan: Plan) => {
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/vip" } as any });
      return;
    }
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      <SiteHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
        {/* Banner do Usuário VIP Atual (se já for VIP) */}
        {isVip && (
          <div className="mb-10 rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-orange-500/15 p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-500 text-zinc-950 grid place-items-center shrink-0 shadow-lg font-black">
                <Crown className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">Você é um Membro VIP Ativo!</h3>
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                    {profile?.plan === "annual" ? "Mestre dos Clássicos" : profile?.plan === "admin" ? "Administrador" : "Sábado Animado"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {profile?.vipExpiresAt
                    ? `Sua assinatura está ativa até ${new Date(profile.vipExpiresAt).toLocaleDateString("pt-BR")}. Aproveite todos os benefícios!`
                    : "Acesso VIP vitalício liberado. Obrigado por apoiar a preservação dos desenhos clássicos!"}
                </p>
              </div>
            </div>

            <Link
              to="/pedidos"
              className="h-11 px-5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shrink-0 shadow-md"
            >
              <Sparkles className="h-4 w-4" />
              <span>Fazer Pedido VIP</span>
            </Link>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 text-xs sm:text-sm font-bold mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Crown className="h-4 w-4" />
            <span>Clube Nostalgia VIP</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Reviva os melhores anos da sua vida com{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              experiência premium
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-lg text-muted-foreground leading-relaxed">
            Tenha voz ativa no acervo, peça seus desenhos favoritos com prioridade e apoie a preservação
            digital das animações que marcaram época na TV brasileira.
          </p>
        </div>

        {/* Bento Grid de Planos (Lei de Hick: 3 Opções Claras) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16">
          {/* 1. Plano Free */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Básico
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  Gratuito
                </span>
              </div>

              <h2 className="text-xl font-bold text-foreground">Nostálgico Free</h2>
              <p className="text-xs text-muted-foreground mt-1 mb-5">
                Para quem quer apenas dar uma espiada no acervo público.
              </p>

              <div className="mb-6">
                <div className="text-3xl font-extrabold text-foreground">R$ 0</div>
                <div className="text-xs text-muted-foreground mt-0.5">Acesso livre para sempre</div>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground border-t border-white/10 pt-5">
                <div className="flex items-center gap-2.5 text-foreground font-medium">
                  <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Acesso ao catálogo padrão público</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground font-medium">
                  <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Lista de favoritos básica</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground font-medium">
                  <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Até 1 pedido de desenho por mês</span>
                </div>
                <div className="flex items-center gap-2.5 opacity-40">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Sem prioridade na busca de episódios</span>
                </div>
                <div className="flex items-center gap-2.5 opacity-40">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Voto padrão simples no mural</span>
                </div>
                <div className="flex items-center gap-2.5 opacity-40">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Sem selo VIP no perfil</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5">
              <Link
                to="/"
                className="w-full h-12 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-foreground font-bold text-sm flex items-center justify-center transition-all"
              >
                Continuar Grátis
              </Link>
            </div>
          </div>

          {/* 2. Plano VIP Mensal */}
          <div className="rounded-3xl border border-white/15 bg-zinc-900/80 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between hover:border-amber-500/40 transition-all relative">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Intermediário
                </span>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                  {plans[0].badge}
                </span>
              </div>

              <h2 className="text-xl font-bold text-foreground">{plans[0].name}</h2>
              <p className="text-xs text-muted-foreground mt-1 mb-5">{plans[0].description}</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground">{plans[0].price}</span>
                  <span className="text-xs text-muted-foreground">{plans[0].period}</span>
                </div>
                <div className="text-xs text-amber-400/90 mt-0.5">Pagamento mensal seguro no PIX</div>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground border-t border-white/10 pt-5">
                {plans[0].features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-foreground font-medium">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5">
              <button
                onClick={() => handleSelectPlan(plans[0])}
                className="w-full h-12 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground font-bold text-sm border border-white/10 hover:border-amber-500/40 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4 text-amber-400" />
                <span>{plans[0].ctaText}</span>
              </button>
            </div>
          </div>

          {/* 3. Plano VIP Anual (Efeito Von Restorff - Destaque Máximo) */}
          <div className="rounded-3xl border-2 border-amber-500/70 bg-gradient-to-b from-amber-500/15 via-zinc-900/90 to-zinc-950 backdrop-blur-2xl p-6 sm:p-7 flex flex-col justify-between shadow-[0_0_45px_rgba(245,158,11,0.22)] relative scale-[1.02] md:-translate-y-2">
            {/* Badge de Destaque Superior */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-zinc-950 shadow-lg flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5" />
                <span>Mais Escolhido • Economize 40%</span>
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Plano Definitivo
                </span>
                <span className="rounded-full bg-amber-500/25 border border-amber-400/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
                  40% OFF
                </span>
              </div>

              <h2 className="text-xl font-bold text-foreground">{plans[1].name}</h2>
              <p className="text-xs text-muted-foreground mt-1 mb-5">{plans[1].description}</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-amber-400">{plans[1].price}</span>
                  <span className="text-xs text-muted-foreground">{plans[1].period}</span>
                </div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  {plans[1].monthlyEquivalent}
                </div>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground border-t border-amber-500/20 pt-5">
                {plans[1].features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-foreground font-semibold">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Primário - Lei de Fitts */}
            <div className="mt-8 pt-4 border-t border-amber-500/20">
              <button
                onClick={() => handleSelectPlan(plans[1])}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-zinc-950 font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown className="h-4 w-4 text-zinc-950" />
                <span>{plans[1].ctaText}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Prova Social & Perguntas Frequentes (FAQ) */}
        <div className="max-w-3xl mx-auto rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-8 space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
              <HelpCircle className="h-5 w-5 text-amber-400" />
              <span>Dúvidas Frequentes sobre o VIP</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Transparência total e segurança para você apoiar com tranquilidade.
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <h4 className="font-bold text-foreground mb-1">Como meu acesso é liberado após o PIX?</h4>
              <p className="text-muted-foreground leading-relaxed">
                A liberação ocorre de forma automática e imediata via confirmação digital. Assim que você
                finalizar no app do seu banco, seu perfil já exibe o selo dourado e todos os privilégios.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <h4 className="font-bold text-foreground mb-1">Como funciona a prioridade nos pedidos de desenhos?</h4>
              <p className="text-muted-foreground leading-relaxed">
                Membros VIP têm seus pedidos marcados com uma coroa dourada no topo da fila e recebem peso duplo
                em qualquer votação comunitária no Mural de Pedidos.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <h4 className="font-bold text-foreground mb-1">Posso cancelar quando quiser?</h4>
              <p className="text-muted-foreground leading-relaxed">
                Sim! Os pagamentos são feitos via PIX único por período (30 dias ou 1 ano). Não cobramos nada
                recorrente no seu cartão sem seu consentimento.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Pagamento PIX */}
      <PixCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={
          selectedPlan
            ? {
                id: selectedPlan.id,
                name: selectedPlan.name,
                price: selectedPlan.price,
                period: selectedPlan.period,
                amount: selectedPlan.rawPrice,
              }
            : null
        }
      />
    </div>
  );
}
