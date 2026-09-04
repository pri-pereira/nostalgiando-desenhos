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
  verifyAdmin2FAPin,
} from "./users";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  is2FAVerified: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsAdmin: (code: string) => boolean;
  verify2FA: (pin: string) => boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  // Observar estado de autenticação do Firebase
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const isMaster =
          firebaseUser.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (isMaster) {
          setIsAdmin(true);
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

  const verify2FA = (pin: string): boolean => {
    if (verifyAdmin2FAPin(pin)) {
      setIs2FAVerified(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(TWO_FA_SESSION_KEY, "true");
      }
      return true;
    }
    return false;
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
        login,
        register,
        logout,
        loginAsAdmin,
        verify2FA,
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
