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
  ADMIN_EMAILS,
  isAdminEmail,
  saveAdminTotpSecret,
  getAdminTotpSecret,
  resetAdminTotpSecret,
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
        const isMaster = isAdminEmail(firebaseUser.email);
        if (isMaster) {
          setIsAdmin(true);

          // Busca segredo TOTP do Firestore
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
        }
      } else {
        setIsAdmin(false);
        setIs2FAVerified(false);
        setTotpSecret(null);
        setIsTotpConfigured(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth não inicializado");
    // Garante que o 2FA não fique pré-validado de logins anteriores
    setIs2FAVerified(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ADMIN_KEY);
      sessionStorage.removeItem(TWO_FA_SESSION_KEY);
    }

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const isMaster = isAdminEmail(cred.user.email);

    if (isMaster) {
      setIsAdmin(true);
      setIs2FAVerified(false); // Sempre exige o 2FA para o admin
      // Carrega o segredo TOTP do respectivo admin
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
    const isMaster = isAdminEmail(cred.user.email);

    if (isMaster) {
      setIsAdmin(true);
    }

    // Cria documento oficial do seguidor no Firestore
    await createUserProfile(cred.user.uid, email);
  };

  /**
   * Valida o código do aplicativo Google Authenticator (TOTP)
   */
  const verify2FA = async (code: string): Promise<boolean> => {
    const clean = code.trim();

    // Valida pelo algoritmo RFC 6238 do Google Authenticator
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

  const loginAsAdmin = (_code: string): boolean => {
    // Autenticação oficial de admin agora é exclusivamente via Firebase Auth + 2FA
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
