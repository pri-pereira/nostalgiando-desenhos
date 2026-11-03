import { useState, useEffect } from "react";
import { Download, Share2, PlusSquare, X, Smartphone, Tv, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Registro do Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registrado com sucesso:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Falha ao registrar Service Worker:", err);
        });
    }

    // 2. Verifica se o app já está em modo standalone (PWA instalado)
    if (typeof window !== "undefined") {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      // Detecta iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isIosDevice);
    }

    // 3. Captura evento beforeinstallprompt (Android / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Se já estiver instalado em standalone, não precisa exibir o banner
  if (isStandalone) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  // Se o usuário não tem suporte a beforeinstallprompt e não é iOS, não mostra nada
  if (!deferredPrompt && !isIos) return null;

  return (
    <>
      {/* Botão no topo ou inline (visível quando disponível) */}
      {!dismissed && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 border-b border-amber-500/30 px-3.5 py-2">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-500 text-zinc-950 font-bold">
                <Tv className="h-3.5 w-3.5" />
              </span>
              <span className="text-foreground font-medium hidden sm:inline">
                Instale o <strong>Nostalgiando</strong> no seu celular ou Smart TV para abrir direto em tela cheia!
              </span>
              <span className="text-foreground font-medium sm:hidden">
                Instale o App em tela cheia!
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="h-8 px-3 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Instalar App</span>
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Sheet Explicativo para iOS (Safari no iPhone) */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-2 rounded-full border border-white/10 bg-secondary/40 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center text-zinc-950">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Como instalar no iPhone</h3>
                <p className="text-xs text-muted-foreground">Em 2 passos rápidos pelo Safari:</p>
              </div>
            </div>

            <div className="space-y-3 my-5 text-xs text-foreground">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500 text-zinc-950 font-bold text-xs">
                  1
                </span>
                <div>
                  <p className="font-semibold">
                    Toque no botão <strong className="text-amber-400">Compartilhar</strong>
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    É o ícone de um quadrado com uma seta para cima na barra inferior do Safari:
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-amber-300 font-medium">
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Compartilhar</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500 text-zinc-950 font-bold text-xs">
                  2
                </span>
                <div>
                  <p className="font-semibold">
                    Role e selecione <strong className="text-amber-400">Adicionar à Tela de Início</strong>
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    O ícone do Nostalgiando será adicionado ao seu celular como um app nativo em tela cheia!
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-emerald-400 font-medium">
                    <PlusSquare className="h-3.5 w-3.5" />
                    <span>Adicionar à Tela de Início</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full h-11 rounded-xl bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 active:scale-95 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

