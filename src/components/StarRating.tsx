import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { getShowRating, getShowAverageRating, rateShow } from "@/lib/userPreferences";
import { useAuth } from "@/lib/authContext";

interface StarRatingProps {
  slug: string;
  readOnly?: boolean;
}

export function StarRating({ slug, readOnly = false }: StarRatingProps) {
  const { user } = useAuth();
  const [personalRating, setPersonalRating] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
      // Busca a nota do usuário para saber se ele já votou
      const savedPersonal = await getShowRating(slug, user?.uid);
      if (savedPersonal) {
        setPersonalRating(savedPersonal);
      }
      
      // Busca a média global para exibição
      const average = await getShowAverageRating(slug);
      setAverageRating(average);
      
      setIsLoaded(true);
    };
    fetchRatings();

    const handleUpdate = (e: any) => {
      if (e.detail?.slug === slug) {
        setPersonalRating(e.detail.rating);
        // Atualiza a média otimisticamente (aproximação para feedback visual rápido)
        setAverageRating((prev) => prev === 0 ? e.detail.rating : (prev + e.detail.rating) / 2);
      }
    };
    window.addEventListener("ratings_updated", handleUpdate);
    return () => window.removeEventListener("ratings_updated", handleUpdate);
  }, [slug, user]);

  const handleRate = async (newRating: number) => {
    if (!isLoaded || readOnly) return;
    
    setPersonalRating(newRating);
    setAverageRating((prev) => prev === 0 ? newRating : (prev + newRating) / 2);
    await rateShow(slug, newRating, user?.uid);
  };

  // Determina o valor visual exibido (se usuário tá passando mouse e não é readonly, mostra o hover dele. Senão mostra a média)
  const displayValue = hovered > 0 && !readOnly ? hovered : averageRating;

  return (
    <div 
      className={`flex items-center gap-0.5 mt-2 ${readOnly ? 'pointer-events-none' : ''}`} 
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!readOnly) handleRate(star);
          }}
          onMouseEnter={() => !readOnly && setHovered(star)}
          className={`relative p-0.5 transition-all duration-200 focus:outline-none ${
            !isLoaded 
              ? "opacity-50 cursor-default" 
              : readOnly 
                ? "cursor-default" 
                : "cursor-pointer hover:scale-110 active:scale-90"
          }`}
          title={readOnly ? `Nota média: ${averageRating.toFixed(1)} estrelas` : `Avaliar com ${star} estrelas`}
          disabled={!isLoaded || readOnly}
        >
          <Star
            className={`h-4 w-4 transition-colors duration-200 ${
              displayValue >= star
                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                : displayValue >= star - 0.5 
                  ? "fill-amber-400/50 text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.3)]"
                  : "fill-transparent text-muted-foreground/50 hover:text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
