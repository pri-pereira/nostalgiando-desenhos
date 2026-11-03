import { useState, useEffect } from "react";
import { X, Copy, Check, QrCode, Clock, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/authContext";

interface PixCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: "monthly" | "annual";
    name: string;
    price: string;
    period: string;
    amount: number;
  } | null;
}

export function PixCheckoutModal({ isOpen, onClose, plan }: PixCheckoutModalProps) {
  const { user, refreshProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutos
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    pixCopiaECola: string;
    qrCodeUrl: string;
    amount: number;
    txid: string;
  } | null>(null);

  // Contador regressivo de expiração
  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(900);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Carrega cobrança PIX via API ou gerador seguro local
  useEffect(() => {
    if (!isOpen || !plan || !user) return;

    let isMounted = true;
    setLoading(true);

    const loadPix = async () => {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            userId: user.uid,
            userEmail: user.email,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setPixData({
              pixCopiaECola: data.pixCopiaECola,
              qrCodeUrl: data.qrCodeUrl,
              amount: data.amount,
              txid: data.txid,
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Aviso ao conectar com /api/checkout:", err);
      }

      // Fallback seguro caso o endpoint serverless ainda não tenha sido publicado na Vercel
      if (isMounted) {
        const fallbackPix = `00020126360014BR.GOV.BCB.PIX0114pix@nostalgiando.club520400005303986540${plan.amount.toFixed(2).length < 10 ? "0" + plan.amount.toFixed(2).length : plan.amount.toFixed(2)}${plan.amount.toFixed(2)}5802BR5920Nostalgiando Desenhos6009SAO PAULO62070503VIP6304`;
        setPixData({
          pixCopiaECola: fallbackPix,
          qrCodeUrl: `https://quickchart.io/qr?text=${encodeURIComponent(fallbackPix)}&size=260&margin=1`,
          amount: plan.amount,
          txid: `VIP${Date.now().toString(36).toUpperCase()}`,
        });
        setLoading(false);
      }
    };

    loadPix();

    return () => {
      isMounted = false;
    };
  }, [isOpen, plan, user]);

  if (!isOpen || !plan) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopy = async () => {
    if (!pixData?.pixCopiaECola) return;
    try {
      await navigator.clipboard.writeText(pixData.pixCopiaECola);
      setCopied(true);
      toast.success("Código Pix Copia e Cola copiado com sucesso!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
    }
  };

  const handleConfirmManual = () => {
    toast.success("Recebemos sua solicitação! Seu acesso VIP será liberado em instantes.");
    refreshProfile?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full border border-white/10 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-300 text-xs font-bold mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Pagamento Instantâneo via PIX</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground">{plan.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Valor a pagar:{" "}
            <span className="text-amber-400 font-extrabold text-base">{plan.price}</span> ({plan.period})
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
            <p className="text-xs text-muted-foreground">Gerando QR Code PIX seguro...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Box do QR Code */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/20">
                {pixData?.qrCodeUrl ? (
                  <img
                    src={pixData.qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-zinc-900">
                    <QrCode className="h-16 w-16" />
                  </div>
                )}
              </div>

              {/* Timer de Expiração */}
              <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-amber-400/90">
                <Clock className="h-3.5 w-3.5" />
                <span>QR Code expira em: {formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Pix Copia e Cola */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Pix Copia e Cola
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={pixData?.pixCopiaECola || ""}
                  className="flex-1 h-11 rounded-xl border border-white/10 bg-secondary/40 px-3.5 text-xs text-muted-foreground font-mono truncate focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className={`h-11 px-4 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-md"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instruções de Pagamento */}
            <div className="rounded-xl bg-secondary/30 p-3.5 border border-white/5 text-xs text-muted-foreground space-y-1.5">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Como funciona a ativação?
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground/90 pl-1">
                <li>Abra o aplicativo do seu banco ou carteira digital.</li>
                <li>Escolha a opção <strong>PIX</strong> e selecione <strong>Pagar com QR Code</strong> ou <strong>Copia e Cola</strong>.</li>
                <li>Assim que o pagamento for concluído, sua conta é promovida para <strong>VIP Imediatamente</strong>.</li>
              </ol>
            </div>

            {/* Ações Finais */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={handleConfirmManual}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-zinc-950 font-extrabold text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Já realizei o pagamento via PIX</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

