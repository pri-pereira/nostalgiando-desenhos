import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "./firebase";
import {
  createUserProfile,
  updateUserLastLogin,
  ADMIN_EMAIL,
  saveAdminTotpSecret,
  getAdminTotpSecret,
  resetAdminTotpSecret,
  verifyAdmin2FAPin,
} from "./users";
import { verifyTotpCode } from "./totp";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  is2FAVerified: boolean;
  isLoading: boolean;
  isTotpConfigured: boolean;
  totpSecret: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsAdmin: (code: string) => boolean;
  verify2FA: (pinOrCode: string) => Promise<boolean>;
  confirmTotpSetup: (secret: string, code: string) => Promise<boolean>;
  resetTotp: () => Promise<void>;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_CODE = "2525";
const ADMIN_KEY = "nostalgiando_admin_session";
const TWO_FA_SESSION_KEY = "nostalgiando_admin_2fa_ok";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [isTotpConfigured, setIsTotpConfigured] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Observar estado de autenticação do Firebase
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const isMaster =
          firebaseUser.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (isMaster) {
          setIsAdmin(true);

          // Verifica se já tem segredo TOTP cadastrado
          try {
            const secret = await getAdminTotpSecret(firebaseUser.uid);
            if (secret) {
              setTotpSecret(secret);
              setIsTotpConfigured(true);
            } else {
              setIsTotpConfigured(false);
            }
          } catch (err) {
            console.warn("Aviso ao carregar TOTP:", err);
          }

          // Verifica se 2FA já foi validado na sessão atual
          if (typeof window !== "undefined") {
            const has2fa = sessionStorage.getItem(TWO_FA_SESSION_KEY);
            if (has2fa === "true") {
              setIs2FAVerified(true);
            }
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Verificar sessão admin de emergência no sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminSession = sessionStorage.getItem(ADMIN_KEY);
      if (adminSession === "true") {
        setIsAdmin(true);
        setIs2FAVerified(true);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth não inicializado");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const isMaster =
      cred.user.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (isMaster) {
      setIsAdmin(true);
      // Carrega o segredo TOTP
      const secret = await getAdminTotpSecret(cred.user.uid);
      if (secret) {
        setTotpSecret(secret);
        setIsTotpConfigured(true);
      } else {
        setIsTotpConfigured(false);
      }
    }

    // Registra último login no Firestore
    updateUserLastLogin(cred.user.uid).catch(() => {});
  };

  const register = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth não inicializado");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const isMaster =
      cred.user.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (isMaster) {
      setIsAdmin(true);
    }

    // Cria documento oficial do seguidor no Firestore
    await createUserProfile(cred.user.uid, email);
  };

  /**
   * Valida o código do aplicativo autenticador (ou o PIN padrão/código de emergência)
   */
  const verify2FA = async (code: string): Promise<boolean> => {
    const clean = code.trim();

    // 1. Se tem segredo TOTP configurado, valida pelo algoritmo RFC 6238 do Authenticator
    if (totpSecret) {
      const isValid = await verifyTotpCode(clean, totpSecret);
      if (isValid) {
        setIs2FAVerified(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(TWO_FA_SESSION_KEY, "true");
        }
        return true;
      }
    }

    // 2. Fallback para PIN padrão de contingência
    if (verifyAdmin2FAPin(clean)) {
      setIs2FAVerified(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(TWO_FA_SESSION_KEY, "true");
      }
      return true;
    }

    return false;
  };

  /**
   * Confirma a ativação inicial do 2FA escaneado via QR Code
   */
  const confirmTotpSetup = async (secret: string, code: string): Promise<boolean> => {
    const isValid = await verifyTotpCode(code, secret);
    if (!isValid) {
      return false;
    }

    if (user) {
      await saveAdminTotpSecret(user.uid, secret);
    }
    setTotpSecret(secret);
    setIsTotpConfigured(true);
    setIs2FAVerified(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(TWO_FA_SESSION_KEY, "true");
    }
    return true;
  };

  /**
   * Permite reconfigurar o QR Code caso o admin queira
   */
  const resetTotp = async () => {
    if (user) {
      await resetAdminTotpSecret(user.uid);
    }
    setTotpSecret(null);
    setIsTotpConfigured(false);
    setIs2FAVerified(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(TWO_FA_SESSION_KEY);
    }
  };

  const logout = async () => {
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn("Erro ao deslogar Firebase:", err);
      }
    }
    setUser(null);
    setIsAdmin(false);
    setIs2FAVerified(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ADMIN_KEY);
      sessionStorage.removeItem(TWO_FA_SESSION_KEY);
    }
  };

  const loginAsAdmin = (code: string): boolean => {
    if (code === ADMIN_CODE) {
      setIsAdmin(true);
      setIs2FAVerified(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(ADMIN_KEY, "true");
        sessionStorage.setItem(TWO_FA_SESSION_KEY, "true");
      }
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        is2FAVerified,
        isLoading,
        isTotpConfigured,
        totpSecret,
        login,
        register,
        logout,
        loginAsAdmin,
        verify2FA,
        confirmTotpSetup,
        resetTotp,
        logoutAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
