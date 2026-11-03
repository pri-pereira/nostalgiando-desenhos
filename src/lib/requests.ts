import {
  db,
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  arrayUnion,
  arrayRemove,
  increment,
} from "./firebase";

export type RequestStatus = "pending" | "approved" | "in_progress" | "added";

export interface DrawingRequest {
  id: string;
  title: string;
  year?: string;
  tmdbPoster?: string;
  description?: string;
  requestedByUid: string;
  requestedByName: string;
  isVipRequest: boolean;
  votesCount: number;
  votedBy: string[];
  status: RequestStatus;
  addedSlug?: string;
  createdAt: string;
}

export const REQUESTS_COLLECTION = "drawing_requests";

/**
 * Busca todos os pedidos do mural ordenados por relevância e votos
 */
export async function fetchDrawingRequests(): Promise<DrawingRequest[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, REQUESTS_COLLECTION), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) return [];

    const list: DrawingRequest[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title || "",
        year: data.year || "",
        tmdbPoster: data.tmdbPoster || "",
        description: data.description || "",
        requestedByUid: data.requestedByUid || "",
        requestedByName: data.requestedByName || "Nostálgico Anônimo",
        isVipRequest: Boolean(data.isVipRequest),
        votesCount: typeof data.votesCount === "number" ? data.votesCount : (data.votedBy?.length || 0),
        votedBy: Array.isArray(data.votedBy) ? data.votedBy : [],
        status: (data.status as RequestStatus) || "pending",
        addedSlug: data.addedSlug || "",
        createdAt: data.createdAt || new Date().toISOString(),
      };
    });

    // Ordenação combinada:
    // 1. Pedidos VIP com votos no topo
    // 2. Quantidade de votos decrescente
    // 3. Mais recentes
    return list.sort((a, b) => {
      if (a.isVipRequest && !b.isVipRequest) return -1;
      if (!a.isVipRequest && b.isVipRequest) return 1;
      if (b.votesCount !== a.votesCount) return b.votesCount - a.votesCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (err) {
    console.warn("Aviso ao buscar pedidos da comunidade:", err);
    return [];
  }
}

/**
 * Verifica se um usuário comum já atingiu o limite mensal de 1 pedido
 */
export async function checkUserMonthlyRequestLimit(
  uid: string,
  isVip: boolean
): Promise<{ canRequest: boolean; reason?: string }> {
  // Usuários VIP têm pedidos ilimitados
  if (isVip) {
    return { canRequest: true };
  }

  if (!db || !uid) return { canRequest: false, reason: "Usuário não autenticado." };

  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const q = query(
      collection(db, REQUESTS_COLLECTION),
      where("requestedByUid", "==", uid)
    );
    const snap = await getDocs(q);

    const recentRequest = snap.docs.find((d) => {
      const data = d.data();
      const createdAt = new Date(data.createdAt || 0).getTime();
      return createdAt > oneMonthAgo.getTime();
    });

    if (recentRequest) {
      return {
        canRequest: false,
        reason:
          "Usuários do plano Free podem fazer até 1 pedido por mês. Torne-se VIP para fazer pedidos ilimitados com prioridade!",
      };
    }

    return { canRequest: true };
  } catch (err) {
    console.warn("Aviso ao checar limite mensal de pedidos:", err);
    return { canRequest: true };
  }
}

/**
 * Cria um novo pedido de desenho
 */
export async function createDrawingRequest(params: {
  title: string;
  year?: string;
  tmdbPoster?: string;
  description?: string;
  requestedByUid: string;
  requestedByName: string;
  isVipRequest: boolean;
}): Promise<DrawingRequest> {
  if (!db) throw new Error("Banco de dados não disponível.");

  const cleanTitle = params.title.trim().slice(0, 100);
  if (!cleanTitle) {
    throw new Error("O título do desenho é obrigatório.");
  }

  const payload = {
    title: cleanTitle,
    year: (params.year || "").trim().slice(0, 10),
    tmdbPoster: (params.tmdbPoster || "").trim(),
    description: (params.description || "").trim().slice(0, 500),
    requestedByUid: params.requestedByUid,
    requestedByName: params.requestedByName.trim().slice(0, 60) || "Nostálgico",
    isVipRequest: Boolean(params.isVipRequest),
    votesCount: params.isVipRequest ? 2 : 1,
    votedBy: [params.requestedByUid],
    status: "pending" as RequestStatus,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), payload);

  return {
    id: docRef.id,
    ...payload,
  };
}

/**
 * Vota ou remove o voto de um pedido (Optimistic UI com Firestore arrayUnion/arrayRemove)
 */
export async function toggleVoteDrawingRequest(
  requestId: string,
  uid: string,
  isVip: boolean,
  currentVoted: boolean
): Promise<{ voted: boolean; delta: number }> {
  if (!db || !uid) throw new Error("Usuário não autenticado.");

  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  const voteWeight = isVip ? 2 : 1;

  if (currentVoted) {
    // Remover voto
    await updateDoc(docRef, {
      votedBy: arrayRemove(uid),
      votesCount: increment(-voteWeight),
    });
    return { voted: false, delta: -voteWeight };
  } else {
    // Adicionar voto
    await updateDoc(docRef, {
      votedBy: arrayUnion(uid),
      votesCount: increment(voteWeight),
    });
    return { voted: true, delta: voteWeight };
  }
}

/**
 * Atualiza o status de um pedido (Função Administrativa)
 */
export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  addedSlug?: string
): Promise<void> {
  if (!db) return;
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  const fields: Record<string, any> = { status };
  if (addedSlug !== undefined) {
    fields.addedSlug = addedSlug;
  }
  await updateDoc(docRef, fields);
}

/**
 * Exclui um pedido de desenho (Função Administrativa)
 */
export async function deleteDrawingRequest(requestId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, REQUESTS_COLLECTION, requestId));
}
