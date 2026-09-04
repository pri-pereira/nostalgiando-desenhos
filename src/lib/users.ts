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
 * Permite ao admin alterar o PIN de 2 fatores
 */
export function setAdmin2FAPin(newPin: string): boolean {
  if (newPin.trim().length !== 6 || isNaN(Number(newPin))) {
    return false;
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(PIN_STORAGE_KEY, newPin.trim());
    return true;
  }
  return false;
}
