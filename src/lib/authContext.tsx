import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "./firebase";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsAdmin: (code: string) => boolean;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_CODE = "2525";
const ADMIN_KEY = "nostalgiando_admin_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
        setIsAdmin(true);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Verificar sessão admin no localStorage/sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminSession = sessionStorage.getItem(ADMIN_KEY);
      if (adminSession === "true") {
        setIsAdmin(true);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth não inicializado");
    await signInWithEmailAndPassword(auth, email, password);
    setIsAdmin(true);
  };

  const register = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth não inicializado");
    await createUserWithEmailAndPassword(auth, email, password);
    setIsAdmin(true);
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
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ADMIN_KEY);
    }
  };

  const loginAsAdmin = (code: string): boolean => {
    if (code === ADMIN_CODE) {
      setIsAdmin(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(ADMIN_KEY, "true");
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
        isLoading,
        login,
        register,
        logout,
        loginAsAdmin,
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
