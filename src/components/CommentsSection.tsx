import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { db, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "@/lib/firebase";
import { Send, Trash2, MessageSquare, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: any;
}

interface CommentsSectionProps {
  slug: string;
}

// Utilitário para formatar texto e destacar @menções
const formatMentions = (text: string) => {
  if (!text) return null;
  const words = text.split(/(\s+)/); // divide preservando os espaços
  return words.map((word, i) => {
    if (word.startsWith("@") && word.length > 1) {
      return (
        <span key={i} className="text-primary font-semibold hover:underline cursor-pointer">
          {word}
        </span>
      );
    }
    return <span key={i}>{word}</span>;
  });
};

// Utilitário para tempo relativo (ex: "há 2 horas")
const timeAgo = (dateStr: string) => {
  if (!dateStr) return "Agora mesmo";
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " anos atrás";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " meses atrás";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " dias atrás";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " horas atrás";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutos atrás";
  return "Agora mesmo";
};

export const CommentsSection: React.FC<CommentsSectionProps> = ({ slug }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !slug) return;

    // Escuta em tempo real a coleção de comentários do desenho
    const q = query(
      collection(db, "shows", slug, "comments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsList: Comment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          commentsList.push({
            id: docSnap.id,
            userId: data.userId,
            userName: data.userName || "Usuário Anônimo",
            userPhoto: data.userPhoto,
            text: data.text,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          });
        });
        setComments(commentsList);
      },
      (err) => {
        console.error("Erro ao carregar comentários:", err);
      }
    );

    return () => unsubscribe();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Você precisa fazer login para comentar.");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, "shows", slug, "comments"), {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Usuário",
        userPhoto: user.photoURL || null,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch (err: any) {
      console.error("Erro ao postar comentário:", err);
      setError("Não foi possível enviar o comentário. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Deseja mesmo apagar este comentário?")) return;
    try {
      await deleteDoc(doc(db, "shows", slug, "comments", commentId));
    } catch (err) {
      console.error("Erro ao excluir comentário:", err);
      alert("Erro ao excluir comentário. Você tem permissão?");
    }
  };

  return (
    <div className="w-full mt-6 bg-card border border-border/50 rounded-3xl p-5 sm:p-6 shadow-card">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xl font-bold text-foreground">
          Comentários <span className="text-muted-foreground text-sm font-normal">({comments.length})</span>
        </h3>
      </div>

      {/* Caixa de Entrada de Novo Comentário */}
      <div className="mb-8">
        {!user ? (
          <div className="bg-secondary/30 rounded-2xl p-6 text-center border border-border/50">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Entre na sua conta para participar da conversa e deixar sua opinião.</p>
            <Link to="/login" className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-6 text-xs font-bold text-primary-foreground">
              Fazer Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 sm:gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-secondary/80 shrink-0 overflow-hidden border border-border/50">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground text-sm uppercase">
                  {user.email?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário... (Use @ para marcar alguém)"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-y placeholder:text-muted-foreground/50 transition-all"
                disabled={isSubmitting}
              />
              {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="h-9 px-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting ? "Enviando..." : "Comentar"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Lista de Comentários */}
      <div className="flex flex-col gap-5 sm:gap-6">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          comments.map((comment) => {
            // Verifica se o usuário é o dono do comentário (ou é admin de forma simplificada: o firebase barrou deleções proibidas, mas não mostra botão se não for dono). 
            // Para admin, deixaremos a UI apagar se bater erro de permissão no server.
            const isOwner = user?.uid === comment.userId;
            
            return (
              <div key={comment.id} className="flex gap-3 sm:gap-4 animate-in fade-in duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/80 shrink-0 overflow-hidden border border-border/50">
                  {comment.userPhoto ? (
                    <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground text-sm uppercase">
                      {comment.userName.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-foreground">{comment.userName}</span>
                    <span className="text-xs text-muted-foreground">• {timeAgo(comment.createdAt)}</span>
                  </div>
                  
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
                    {formatMentions(comment.text)}
                  </p>
                  
                  <div className="mt-2 flex items-center gap-4">
                    {/* Botão de Responder fake (Placeholder para UX) */}
                    <button className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                      Responder
                    </button>
                    
                    {isOwner && (
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs font-bold text-rose-500/70 hover:text-rose-500 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
