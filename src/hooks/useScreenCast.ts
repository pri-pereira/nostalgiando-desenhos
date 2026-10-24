import { useState, useEffect, useCallback, RefObject } from "react";

export type CastState = "idle" | "connecting" | "connected" | "not_supported";

interface UseScreenCastOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoTitle?: string | undefined;
  videoUrl?: string | undefined;
  posterUrl?: string | undefined;
}

export function useScreenCast({
  videoRef,
  videoTitle,
  videoUrl,
  posterUrl,
}: UseScreenCastOptions) {
  const [castState, setCastState] = useState<CastState>("idle");
  const [targetDeviceName, setTargetDeviceName] = useState<string>("");
  const [isRemotePlaybackSupported, setIsRemotePlaybackSupported] = useState(false);
  const [isAirPlaySupported, setIsAirPlaySupported] = useState(false);
  const [isCastFrameworkSupported, setIsCastFrameworkSupported] = useState(false);
  const [isDisplayMediaSupported, setIsDisplayMediaSupported] = useState(false);

  // Detecta capacidades do navegador
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Suporte a Display Media (Compartilhamento de tela do navegador / SO)
    const hasDisplayMedia =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === "function";
    setIsDisplayMediaSupported(hasDisplayMedia);

    // 2. Verifica video element e APIs
    const checkVideoSupport = () => {
      const video = videoRef.current;
      if (!video) return;

      // Remote Playback API (W3C - Chrome, Edge, Chromium)
      if ("remote" in video && video.remote) {
        setIsRemotePlaybackSupported(true);

        const handleConnecting = () => setCastState("connecting");
        const handleConnect = () => setCastState("connected");
        const handleDisconnect = () => {
          setCastState("idle");
          setTargetDeviceName("");
        };

        try {
          video.remote.addEventListener("connecting", handleConnecting);
          video.remote.addEventListener("connect", handleConnect);
          video.remote.addEventListener("disconnect", handleDisconnect);

          // Estado atual se já estiver conectado
          if (video.remote.state === "connected") {
            setCastState("connected");
          } else if (video.remote.state === "connecting") {
            setCastState("connecting");
          }
        } catch {
          // ignore
        }
      }

      // WebKit AirPlay API (Safari no iOS e Mac)
      const isAirPlay =
        typeof (video as any).webkitShowPlaybackTargetPicker === "function" ||
        "WebKitPlaybackTargetAvailabilityEvent" in window;
      if (isAirPlay) {
        setIsAirPlaySupported(true);

        const handleAirPlayAvailability = (event: any) => {
          if (event.availability === "available") {
            setIsAirPlaySupported(true);
          }
        };

        const handleAirPlayTargetChange = () => {
          const isWireless = (video as any).webkitCurrentPlaybackTargetIsWireless;
          if (isWireless) {
            setCastState("connected");
            setTargetDeviceName("Apple TV / AirPlay");
          } else {
            setCastState("idle");
            setTargetDeviceName("");
          }
        };

        try {
          video.addEventListener(
            "webkitplaybacktargetavailabilitychanged",
            handleAirPlayAvailability
          );
          video.addEventListener(
            "webkitcurrentplaybacktargetiswirelesschanged",
            handleAirPlayTargetChange
          );
        } catch {
          // ignore
        }
      }
    };

    checkVideoSupport();

    // 3. Google Cast Framework API
    const checkGoogleCast = () => {
      const anyWin = window as any;
      if (anyWin.chrome && anyWin.chrome.cast && anyWin.cast && anyWin.cast.framework) {
        setIsCastFrameworkSupported(true);
        try {
          const context = anyWin.cast.framework.CastContext.getInstance();
          context.addEventListener(
            anyWin.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
            (event: any) => {
              const state = event.castState;
              if (state === anyWin.cast.framework.CastState.CONNECTED) {
                setCastState("connected");
                const session = context.getCurrentSession();
                const receiverName = session?.getCastDevice()?.friendlyName;
                if (receiverName) setTargetDeviceName(receiverName);
              } else if (state === anyWin.cast.framework.CastState.CONNECTING) {
                setCastState("connecting");
              } else {
                setCastState("idle");
                setTargetDeviceName("");
              }
            }
          );
        } catch {
          // ignore
        }
      }
    };

    checkGoogleCast();
    const interval = setInterval(() => {
      checkVideoSupport();
      checkGoogleCast();
    }, 2000);

    return () => clearInterval(interval);
  }, [videoRef]);

  // Função para acionar o espelhamento / transmissão nativa
  const triggerCast = useCallback(async () => {
    const video = videoRef.current;
    const anyWin = window as any;

    // 1. Tentar Remote Playback API nativa (Chrome, Edge, etc.)
    if (video && "remote" in video && video.remote) {
      try {
        setCastState("connecting");
        await video.remote.prompt();
        setCastState("connected");
        return { success: true, method: "remote-playback" };
      } catch (err: any) {
        // Se o usuário cancelou a caixa de diálogo
        if (err?.name === "AbortError" || err?.name === "NotAllowedError") {
          setCastState("idle");
          return { success: false, method: "remote-playback", cancelled: true };
        }
      }
    }

    // 2. Tentar Apple AirPlay Picker (iOS / Safari)
    if (video && typeof (video as any).webkitShowPlaybackTargetPicker === "function") {
      try {
        setCastState("connecting");
        (video as any).webkitShowPlaybackTargetPicker();
        return { success: true, method: "airplay" };
      } catch (err) {
        console.warn("Erro ao abrir seletor AirPlay:", err);
      }
    }

    // 3. Tentar Google Cast SDK Framework
    if (anyWin.cast && anyWin.cast.framework) {
      try {
        setCastState("connecting");
        const context = anyWin.cast.framework.CastContext.getInstance();
        await context.requestSession();
        setCastState("connected");
        return { success: true, method: "google-cast" };
      } catch (err: any) {
        setCastState("idle");
        if (err !== "cancel") {
          console.warn("Google Cast requestSession erro:", err);
        }
      }
    }

    // Caso não suporte prompt direto pelo video
    setCastState("idle");
    return { success: false, method: "fallback-needed" };
  }, [videoRef]);

  // Função para transmitir tela/aba inteira (Notebooks / Desktops)
  const triggerScreenShare = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getDisplayMedia !== "function"
    ) {
      return { success: false, error: "not_supported" };
    }

    try {
      setCastState("connecting");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setCastState("connected");
      setTargetDeviceName("Tela Transmitida");

      // Quando o usuário parar de compartilhar
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setCastState("idle");
        setTargetDeviceName("");
      });

      return { success: true, method: "display-media", stream };
    } catch (err: any) {
      setCastState("idle");
      return { success: false, error: err?.name || "cancelled" };
    }
  }, []);

  // Desconectar transmissão
  const disconnect = useCallback(() => {
    const video = videoRef.current;
    const anyWin = window as any;

    if (anyWin.cast && anyWin.cast.framework) {
      try {
        const context = anyWin.cast.framework.CastContext.getInstance();
        context.endCurrentSession(true);
      } catch {
        // ignore
      }
    }

    setCastState("idle");
    setTargetDeviceName("");
  }, [videoRef]);

  return {
    castState,
    targetDeviceName,
    isAvailable:
      isRemotePlaybackSupported ||
      isAirPlaySupported ||
      isCastFrameworkSupported ||
      isDisplayMediaSupported,
    isRemotePlaybackSupported,
    isAirPlaySupported,
    isCastFrameworkSupported,
    isDisplayMediaSupported,
    triggerCast,
    triggerScreenShare,
    disconnect,
  };
}
