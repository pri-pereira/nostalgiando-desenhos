import { db, collection, getDocs, doc, setDoc, getDoc, updateDoc } from "./firebase";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: string;
  lastLogin: string;
  status: "ativo" | "inativo";
}

export const ADMIN_EMAIL = "priscillasantosp24@gmail.com";
export const USERS_COLLECTION = "users";

// Chave e PIN padrão de segurança de 2 fatores (2FA)
export const DEFAULT_2FA_PIN = "252525";
export const PIN_STORAGE_KEY = "nostalgiando_admin_pin";

/**
 * Cria ou atualiza o perfil do usuário no Firestore
 */
export async function createUserProfile(
  uid: string,
  email: string,
  customName?: string
): Promise<UserProfile> {
  const isMasterAdmin = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const name =
    customName?.trim() ||
    email.split("@")[0]?.replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
    "Nostálgico";

  const userProfile: UserProfile = {
    uid,
    email: email.trim().toLowerCase(),
    name,
    role: isMasterAdmin ? "admin" : "user",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: "ativo",
  };

  if (db) {
    try {
      await setDoc(doc(db, USERS_COLLECTION, uid), userProfile, { merge: true });
    } catch (err) {
      console.warn("Aviso ao salvar perfil de usuário no Firestore:", err);
    }
  }

  return userProfile;
}

/**
 * Atualiza o timestamp do último login do usuário
 */
export async function updateUserLastLogin(uid: string): Promise<void> {
  if (!db) return;
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      lastLogin: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Aviso ao atualizar último login:", err);
  }
}

/**
 * Busca todos os usuários cadastrados (Apenas acessível pelo Admin)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    if (snapshot.empty) return [];

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data.email || "",
        name: data.name || "Nostálgico",
        role: (data.role as "admin" | "user") || "user",
        createdAt: data.createdAt || new Date().toISOString(),
        lastLogin: data.lastLogin || data.createdAt || new Date().toISOString(),
        status: (data.status as "ativo" | "inativo") || "ativo",
      };
    });
  } catch (err) {
    console.error("Erro ao buscar usuários do Firestore:", err);
    return [];
  }
}

/**
 * Verifica se o PIN de 2 fatores está correto
 */
export function verifyAdmin2FAPin(inputPin: string): boolean {
  if (typeof window !== "undefined") {
    const customPin = localStorage.getItem(PIN_STORAGE_KEY);
    if (customPin && inputPin.trim() === customPin.trim()) {
      return true;
    }
  }
  return inputPin.trim() === DEFAULT_2FA_PIN;
}

/**
 * Salva a chave secreta TOTP do Administrador
 */
export const TOTP_STORAGE_KEY = "nostalgiando_totp_secret";

export async function saveAdminTotpSecret(uid: string, secret: string): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOTP_STORAGE_KEY, secret);
  }
  if (db) {
    try {
      await setDoc(
        doc(db, USERS_COLLECTION, uid),
        { totpSecret: secret, totpEnabled: true },
        { merge: true }
      );
    } catch (err) {
      console.warn("Aviso ao salvar segredo TOTP no Firestore:", err);
    }
  }
}

/**
 * Recupera a chave secreta TOTP do Administrador
 */
export async function getAdminTotpSecret(uid: string): Promise<string | null> {
  if (typeof window !== "undefined") {
    const local = localStorage.getItem(TOTP_STORAGE_KEY);
    if (local) return local;
  }
  if (db) {
    try {
      const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (snap.exists() && snap.data()?.totpSecret) {
        const secret = snap.data().totpSecret as string;
        if (typeof window !== "undefined") {
          localStorage.setItem(TOTP_STORAGE_KEY, secret);
        }
        return secret;
      }
    } catch (err) {
      console.warn("Aviso ao buscar segredo TOTP do Firestore:", err);
    }
  }
  return null;
}

/**
 * Reseta a chave TOTP do Administrador (para reconfigurar QR Code)
 */
export async function resetAdminTotpSecret(uid: string): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOTP_STORAGE_KEY);
  }
  if (db) {
    try {
      await updateDoc(doc(db, USERS_COLLECTION, uid), {
        totpSecret: null,
        totpEnabled: false,
      });
    } catch (err) {
      console.warn("Aviso ao resetar segredo TOTP no Firestore:", err);
    }
  }
}
