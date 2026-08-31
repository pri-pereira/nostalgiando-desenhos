import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc } from "firebase/firestore";

// TODO: O usuário precisará substituir as chaves abaixo (apiKey e appId) com as reais geradas pelo Firebase.
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI", // ⚠️ IMPORTANTE: Substitua pela sua API Key real
  authDomain: "nostalgiando-desenhos.firebaseapp.com",
  projectId: "nostalgiando-desenhos",
  storageBucket: "nostalgiando-desenhos.firebasestorage.app",
  messagingSenderId: "934707372124",
  appId: "SUA_APP_ID_AQUI", // ⚠️ IMPORTANTE: Substitua pelo seu App ID real
  measurementId: "G-552210905"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
