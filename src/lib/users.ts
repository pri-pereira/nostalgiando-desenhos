import { db, collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc } from "./firebase";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  whatsapp?: string;
  role: "admin" | "user";
  paymentStatus: "ativo" | "pendente" | "cancelado";
  planName?: string;
  planActivatedAt?: string;
  createdAt: string;
  lastLogin: string;
  status: "ativo" | "inativo";
}

// Carrega lista de administradores a partir de variável de ambiente segura (Vercel/.env)
const envAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

export const ADMIN_EMAILS: string[] =
  envAdminEmails.length > 0
    ? envAdminEmails
    : [
        "priscillasantosp24@gmail.com",
        "juniordrones1981@gmail.com",
      ];

// Mantém exportação para compatibilidade com código existente
export const ADMIN_EMAIL = ADMIN_EMAILS[0];
export const USERS_COLLECTION = "users";

/**
 * Verifica se um e-mail pertence ao grupo de administradores
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((adm) => adm.toLowerCase() === clean);
}

/**
 * Cria ou atualiza o perfil do usuário no Firestore
 */
export async function createUserProfile(
  uid: string,
  email: string,
  customName?: string
): Promise<UserProfile> {
  const isMasterAdmin = isAdminEmail(email);
  const name =
    customName?.trim() ||
    email.split("@")[0]?.replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
    (isMasterAdmin ? "Administrador" : "Nostálgico");

  const userProfile: UserProfile = {
    uid,
    email: email.trim().toLowerCase(),
    name,
    role: isMasterAdmin ? "admin" : "user",
    // Admins têm plano ativo automaticamente; novos usuários ficam pendentes
    paymentStatus: isMasterAdmin ? "ativo" : "pendente",
    planName: isMasterAdmin ? "Admin" : undefined,
    planActivatedAt: isMasterAdmin ? new Date().toISOString() : undefined,
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
 * Garante que o perfil do usuário autenticado exista no Firestore com os dados corretos
 */
export async function ensureUserProfile(
  uid: string,
  email: string,
  customName?: string
): Promise<UserProfile> {
  if (!db) {
    return createUserProfile(uid, email, customName);
  }
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const isMasterAdmin = isAdminEmail(email);
      const updatedFields: Record<string, any> = {
        lastLogin: new Date().toISOString(),
      };

      if (!data.email) {
        updatedFields.email = email.trim().toLowerCase();
      }
      if (isMasterAdmin && data.role !== "admin") {
        updatedFields.role = "admin";
      }
      if (!data.status) {
        updatedFields.status = "ativo";
      }
      // Garantir que admins sempre tenham paymentStatus=ativo
      if (isMasterAdmin && data.paymentStatus !== "ativo") {
        updatedFields.paymentStatus = "ativo";
        updatedFields.planName = "Admin";
        if (!data.planActivatedAt) {
          updatedFields.planActivatedAt = new Date().toISOString();
        }
      }
      // Inicializar paymentStatus se não existir
      if (!data.paymentStatus) {
        updatedFields.paymentStatus = isMasterAdmin ? "ativo" : "pendente";
      }

      await updateDoc(userDocRef, updatedFields);

      return {
        uid,
        email: (data.email || email).trim().toLowerCase(),
        name: data.name || customName || email.split("@")[0]?.replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Usuário",
        whatsapp: data.whatsapp || undefined,
        role: isMasterAdmin ? "admin" : (data.role as "admin" | "user" || "user"),
        paymentStatus: (isMasterAdmin ? "ativo" : (data.paymentStatus || "pendente")) as "ativo" | "pendente" | "cancelado",
        planName: data.planName || (isMasterAdmin ? "Admin" : undefined),
        planActivatedAt: data.planActivatedAt || undefined,
        createdAt: data.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: (data.status as "ativo" | "inativo") || "ativo",
      };
    }
  } catch (err) {
    console.warn("Aviso ao verificar perfil no Firestore:", err);
  }
  return createUserProfile(uid, email, customName);
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
 * Exclui um usuário do Firestore
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
  } catch (err) {
    console.error("Erro ao excluir perfil de usuário no Firestore:", err);
    throw err;
  }
}

/**
 * Alterna o status do usuário entre ativo e inativo
 */
export async function toggleUserStatus(uid: string, status: "ativo" | "inativo"): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), { status });
  } catch (err) {
    console.error("Erro ao atualizar status do usuário:", err);
    throw err;
  }
}

/**
 * Atualiza o status de assinatura/pagamento do usuário
 */
export async function updateUserPaymentStatus(
  uid: string,
  paymentStatus: "ativo" | "pendente" | "cancelado",
  planName?: string
): Promise<void> {
  if (!db) return;
  try {
    const fields: Record<string, any> = { paymentStatus };
    if (planName) fields.planName = planName;
    if (paymentStatus === "ativo") fields.planActivatedAt = new Date().toISOString();
    await updateDoc(doc(db, USERS_COLLECTION, uid), fields);
  } catch (err) {
    console.error("Erro ao atualizar status de pagamento:", err);
    throw err;
  }
}

/**
 * Atualiza o WhatsApp do usuário
 */
export async function updateUserWhatsapp(uid: string, whatsapp: string): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), { whatsapp: whatsapp.trim() });
  } catch (err) {
    console.warn("Aviso ao atualizar WhatsApp:", err);
    throw err;
  }
}

/**
 * Busca todos os usuários cadastrados (Apenas acessível pelo Admin)
 * Deduplica por e-mail, priorizando o registro com último acesso mais recente.
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    if (snapshot.empty) return [];

    const raw: UserProfile[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data.email || "",
        name: data.name || (data.email ? data.email.split("@")[0] : "Nostálgico"),
        whatsapp: data.whatsapp || undefined,
        role: (data.role as "admin" | "user") || "user",
        paymentStatus: (data.paymentStatus as "ativo" | "pendente" | "cancelado") || "pendente",
        planName: data.planName || undefined,
        planActivatedAt: data.planActivatedAt || undefined,
        createdAt: data.createdAt || new Date().toISOString(),
        lastLogin: data.lastLogin || data.createdAt || new Date().toISOString(),
        status: (data.status as "ativo" | "inativo") || "ativo",
      };
    });

    // Deduplicar por e-mail: manter o registro com último login mais recente
    const emailMap = new Map<string, UserProfile>();
    for (const u of raw) {
      const key = (u.email || u.uid).toLowerCase().trim();
      if (!emailMap.has(key)) {
        emailMap.set(key, u);
      } else {
        const existing = emailMap.get(key)!;
        const existingTs = new Date(existing.lastLogin).getTime();
        const newTs = new Date(u.lastLogin).getTime();
        // Prefere dados com paymentStatus explícito e login mais recente
        if (newTs > existingTs || (u.paymentStatus !== "pendente" && existing.paymentStatus === "pendente")) {
          emailMap.set(key, u);
        }
      }
    }

    return Array.from(emailMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error("Erro ao buscar usuários do Firestore:", err);
    return [];
  }
}

/**
 * Salva a chave secreta TOTP do Administrador
 */
export const TOTP_STORAGE_KEY = "nostalgiando_totp_secret";

export async function saveAdminTotpSecret(uid: string, secret: string): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(`${TOTP_STORAGE_KEY}_${uid}`, secret);
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
    const localUid = localStorage.getItem(`${TOTP_STORAGE_KEY}_${uid}`);
    if (localUid) return localUid;
    const local = localStorage.getItem(TOTP_STORAGE_KEY);
    if (local) return local;
  }
  if (db) {
    try {
      const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (snap.exists() && snap.data()?.totpSecret) {
        const secret = snap.data().totpSecret as string;
        if (typeof window !== "undefined") {
          localStorage.setItem(`${TOTP_STORAGE_KEY}_${uid}`, secret);
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
    localStorage.removeItem(`${TOTP_STORAGE_KEY}_${uid}`);
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
