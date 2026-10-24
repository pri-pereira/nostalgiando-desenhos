import React, { useState } from "react";
import {
  Tv,
  Cast,
  Airplay,
  Wifi,
  Smartphone,
  Laptop,
  CheckCircle2,
  X,
  Radio,
  Sparkles,
  ExternalLink,
  Info,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { CastState } from "@/hooks/useScreenCast";

interface TvCastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerCast: () => Promise<{ success: boolean; method: string; cancelled?: boolean | undefined }>;
  onTriggerScreenShare: () => Promise<{ success: boolean; error?: string | undefined }>;
  castState: CastState;
  targetDeviceName?: string | undefined;
  onDisconnect: () => void;
  showTitle?: string | undefined;
  episodeTitle?: string | undefined;
}

type TabType = "chromecast" | "smarttv" | "airplay" | "pc";

export function TvCastModal({
  isOpen,
  onClose,
  onTriggerCast,
  onTriggerScreenShare,
  castState,
  targetDeviceName,
  onDisconnect,
  showTitle,
  episodeTitle,
}: TvCastModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("chromecast");
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleConnectClick = async () => {
    setIsConnecting(true);
    toast.info("Procurando Smart TVs e aparelhos Chromecast na rede...", {
      description: "Selecione sua TV na janela do navegador.",
      duration: 4000,
    });

    try {
      const res = await onTriggerCast();
      if (res.success) {
        toast.success("Transmitindo com sucesso!", {
          description: "O desenho agora está sendo reproduzido na sua TV.",
        });
      } else if (!res.cancelled) {
        toast.message("Selecione sua TV nas opções abaixo", {
          description: "Siga o passo a passo de acordo com o modelo da sua TV.",
        });
      }
    } catch {
      toast.error("Não foi possível conectar automaticamente", {
        description: "Confira se a TV e o aparelho estão na mesma rede Wi-Fi.",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleScreenShareClick = async () => {
    try {
      const res = await onTriggerScreenShare();
      if (res.success) {
        toast.success("Tela transmitida!", {
          description: "A tela do seu computador está sendo compartilhada na TV.",
        });
        onClose();
      }
    } catch {
      // ignore
    }
  };

  const isConnected = castState === "connected";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black shadow-2xl shadow-amber-950/30 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow de fundo */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        {/* Cabeçalho */}
        <div className="relative border-b border-white/10 px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Tv className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                  Espelhar na TV
                </h2>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  HD / 4K
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[260px] sm:max-w-xs">
                {showTitle ? `${showTitle} • ${episodeTitle || "Episódio"}` : "Assista na sua Smart TV"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Card de Conexão Rápida / Status */}
          {isConnected ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Radio className="h-5 w-5 animate-pulse" />
                </span>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <p className="text-sm font-bold text-emerald-300">
                      Transmitindo para sua TV
                    </p>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dispositivo:{" "}
                    <span className="text-foreground font-medium">
                      {targetDeviceName || "Smart TV Conectada"}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={onDisconnect}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold transition-all cursor-pointer"
              >
                Desconectar TV
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-primary/5 to-amber-600/10 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Conexão Imediata</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Transmitir para TV ou Chromecast
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                    Inicia a busca por aparelhos Smart TV na sua rede Wi-Fi com 1 clique.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleConnectClick}
                    disabled={isConnecting}
                    className="h-11 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Cast className="h-4 w-4" />
                    <span>{isConnecting ? "Buscando TVs..." : "Procurar TVs Agora"}</span>
                  </button>

                  <button
                    onClick={handleScreenShareClick}
                    className="h-11 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    title="Transmitir a aba ou tela inteira para TVs com Miracast ou HDMI sem fio"
                  >
                    <Laptop className="h-4 w-4 text-muted-foreground" />
                    <span className="hidden sm:inline">Compartilhar Tela</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Abas com Instruções Detalhadas por Aparelho */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HelpCircleIcon /> Como espelhar em cada TV
              </span>
              <span className="text-[11px] text-amber-400/90 flex items-center gap-1">
                <Wifi className="h-3 w-3" /> Mesma rede Wi-Fi
              </span>
            </div>

            {/* Seleção de Abas */}
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
              <button
                onClick={() => setActiveTab("chromecast")}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                  activeTab === "chromecast"
                    ? "bg-amber-500 text-black shadow-md"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Cast className="h-3.5 w-3.5" />
                <span>Chromecast</span>
              </button>

              <button
                onClick={() => setActiveTab("smarttv")}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                  activeTab === "smarttv"
                    ? "bg-amber-500 text-black shadow-md"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Tv className="h-3.5 w-3.5" />
                <span>Smart TV</span>
              </button>

              <button
                onClick={() => setActiveTab("airplay")}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                  activeTab === "airplay"
                    ? "bg-amber-500 text-black shadow-md"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Airplay className="h-3.5 w-3.5" />
                <span>AirPlay</span>
              </button>

              <button
                onClick={() => setActiveTab("pc")}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                  activeTab === "pc"
                    ? "bg-amber-500 text-black shadow-md"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>PC / Teclado</span>
              </button>
            </div>

            {/* Conteúdo da Aba Selecionada */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 text-xs space-y-3">
              {activeTab === "chromecast" && (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                      1
                    </span>
                    <p className="text-zinc-300">
                      Certifique-se de que seu celular ou computador está conectado na mesma rede Wi-Fi do seu Chromecast ou Google TV.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                      2
                    </span>
                    <p className="text-zinc-300">
                      Clique no botão dourado <strong className="text-amber-400 font-semibold">"Procurar TVs Agora"</strong> acima.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                      3
                    </span>
                    <p className="text-zinc-300">
                      Escolha o nome da sua TV na caixa de seleção que o navegador exibir. O vídeo começará a rodar imediatamente na tela!
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "smarttv" && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-white/5 p-3 space-y-1">
                    <p className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5" /> Samsung Smart TV (Smart View / Tizen)
                    </p>
                    <p className="text-zinc-300 leading-relaxed">
                      No seu celular Samsung: puxe a barra de notificações de cima para baixo e toque no ícone <strong>Smart View</strong>. Selecione sua TV para espelhar a tela inteira.
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/5 p-3 space-y-1">
                    <p className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Tv className="h-3.5 w-3.5" /> LG Smart TV (webOS / ThinQ)
                    </p>
                    <p className="text-zinc-300 leading-relaxed">
                      Abra o painel rápido do seu Android ou o aplicativo <strong>LG ThinQ</strong> e selecione "Compartilhar Tela".
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2 text-[11px] text-amber-200">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      <strong>Super Dica:</strong> Você também pode abrir o navegador da sua própria Smart TV (Samsung Internet na Samsung ou Navegador Web na LG) e acessar <strong>nostalgiando.com</strong> diretamente pelo controle remoto da TV!
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "airplay" && (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                      1
                    </span>
                    <p className="text-zinc-300">
                      No iPhone ou iPad, deslize o dedo do canto superior direito da tela para abrir a <strong>Central de Controle</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                      2
                    </span>
                    <p className="text-zinc-300">
                      Toque no ícone de dois retângulos <strong>(Espelhamento de Tela)</strong> ou no ícone do <strong>AirPlay</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                      3
                    </span>
                    <p className="text-zinc-300">
                      Selecione sua <strong>Apple TV</strong> ou Smart TV compatível com AirPlay (Samsung, LG, Sony, Roku).
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "pc" && (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                      1
                    </span>
                    <p className="text-zinc-300">
                      <strong>Atalho Rápido do Windows:</strong> Pressione as teclas <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[10px] border border-zinc-700">Windows + K</kbd> no seu teclado.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                      2
                    </span>
                    <p className="text-zinc-300">
                      Uma barra lateral chamada <strong>"Transmitir"</strong> se abrirá com todas as Smart TVs e monitores sem fio detectados na casa.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                      3
                    </span>
                    <p className="text-zinc-300">
                      Ou no Google Chrome / Edge: clique no menu dos 3 pontinhos no topo à direita e escolha <strong>"Transmitir..."</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dica de Rede Wi-Fi */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
              <Wifi className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">
                Dica para transmissão sem travamentos
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Recomendamos conectar a TV e seu aparelho na rede Wi-Fi 5GHz para carregar episódios sem pausas.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé com botão de fechar */}
        <div className="border-t border-white/10 px-6 py-3.5 flex justify-end bg-black/40">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold transition-all cursor-pointer"
          >
            Entendido, fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function HelpCircleIcon() {
  return <Info className="h-3.5 w-3.5" />;
}
