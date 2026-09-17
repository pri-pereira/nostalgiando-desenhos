import { db, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "./firebase";

const LOCAL_FAVORITES_KEY = "nostalgiando_favorites";
const LOCAL_RATINGS_KEY = "nostalgiando_ratings";

// --- Favoritos --- //

export const getFavoriteShows = async (userId?: string): Promise<string[]> => {
  if (typeof window === "undefined") return [];

  // Se logado e com DB, tenta buscar da nuvem
  if (userId && db) {
    try {
      const favCol = collection(db, "users", userId, "favorites");
      const snapshot = await getDocs(favCol);
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => doc.id);
      }
    } catch (e) {
      console.warn("Aviso ao buscar favoritos do Firestore (usando local fallback):", e);
    }
  }

  // Fallback para LocalStorage
  try {
    const saved = localStorage.getItem(LOCAL_FAVORITES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Erro ao ler favoritos do LocalStorage:", e);
  }
  return [];
};

export const toggleFavoriteShow = async (slug: string, isFavorite: boolean, userId?: string): Promise<void> => {
  if (typeof window === "undefined") return;

  // Atualiza no LocalStorage sempre
  try {
    const current = localStorage.getItem(LOCAL_FAVORITES_KEY);
    let favs: string[] = current ? JSON.parse(current) : [];
    
    if (isFavorite) {
      if (!favs.includes(slug)) favs.push(slug);
    } else {
      favs = favs.filter(f => f !== slug);
    }
    localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(favs));
    window.dispatchEvent(new CustomEvent("favorites_updated", { detail: favs }));
  } catch (e) {
    console.error("Erro ao atualizar favoritos no LocalStorage:", e);
  }

  // Atualiza no Firestore se logado
  if (userId && db) {
    try {
      const favRef = doc(db, "users", userId, "favorites", slug);
      if (isFavorite) {
        await setDoc(favRef, { slug, savedAt: new Date().toISOString() });
      } else {
        await deleteDoc(favRef);
      }
    } catch (e) {
      console.warn("Erro ao atualizar favorito no Firestore:", e);
    }
  }
};

// --- Avaliações (Estrelas) --- //

export const getShowRating = async (slug: string, userId?: string): Promise<number | null> => {
  if (typeof window === "undefined") return null;

  // Tenta do Firestore
  if (userId && db) {
    try {
      const ratingRef = doc(db, "shows", slug, "ratings", userId);
      const snap = await getDoc(ratingRef);
      if (snap.exists()) {
        return snap.data().rating;
      }
    } catch (e) {
      console.warn("Aviso ao buscar avaliação do Firestore:", e);
    }
  }

  // Tenta do LocalStorage
  try {
    const current = localStorage.getItem(LOCAL_RATINGS_KEY);
    if (current) {
      const ratings = JSON.parse(current);
      if (ratings[slug]) return ratings[slug];
    }
  } catch (e) {
    console.error("Erro ao ler avaliações locais:", e);
  }

  return null;
};

export const getShowAverageRating = async (slug: string): Promise<number> => {
  if (typeof window === "undefined") return 0;
  
  let totalRating = 0;
  let count = 0;

  // Busca do Firestore (Médias reais requerem leitura da subcoleção no client para apps sem backend,
  // ou aggregation queries, mas vamos usar getDocs para garantir compatibilidade simplificada aqui)
  if (db) {
    try {
      const ratingsRef = collection(db, "shows", slug, "ratings");
      const snap = await getDocs(ratingsRef);
      if (!snap.empty) {
        snap.forEach(doc => {
          const val = doc.data().rating;
          if (typeof val === 'number') {
            totalRating += val;
            count++;
          }
        });
      }
    } catch (e) {
      console.warn("Aviso ao buscar média do Firestore:", e);
    }
  }

  // Fallback ou mescla local se não houver nuvem
  if (count === 0) {
    try {
      const current = localStorage.getItem(LOCAL_RATINGS_KEY);
      if (current) {
        const ratings = JSON.parse(current);
        if (ratings[slug]) {
          totalRating += ratings[slug];
          count++;
        }
      }
    } catch (e) {}
  }

  return count > 0 ? totalRating / count : 0;
};

export const rateShow = async (slug: string, rating: number, userId?: string): Promise<void> => {
  if (typeof window === "undefined") return;

  // Salva no LocalStorage
  try {
    const current = localStorage.getItem(LOCAL_RATINGS_KEY);
    const ratings = current ? JSON.parse(current) : {};
    ratings[slug] = rating;
    localStorage.setItem(LOCAL_RATINGS_KEY, JSON.stringify(ratings));
    window.dispatchEvent(new CustomEvent("ratings_updated", { detail: { slug, rating } }));
  } catch (e) {
    console.error("Erro ao salvar avaliação local:", e);
  }

  // Salva no Firestore se logado
  if (userId && db) {
    try {
      const ratingRef = doc(db, "shows", slug, "ratings", userId);
      await setDoc(ratingRef, { 
        rating, 
        userId, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    } catch (e) {
      console.warn("Erro ao salvar avaliação no Firestore:", e);
    }
  }
};
