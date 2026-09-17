import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { getFavoriteShows, toggleFavoriteShow } from "@/lib/userPreferences";
import { useAuth } from "@/lib/authContext";

interface FavoriteButtonProps {
  slug: string;
  className?: string;
}

export function FavoriteButton({ slug, className = "" }: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchFavorite = async () => {
      const favs = await getFavoriteShows(user?.uid);
      setIsFavorite(favs.includes(slug));
      setIsLoaded(true);
    };
    fetchFavorite();

    const handleUpdate = (e: any) => {
      const favs = e.detail || [];
      setIsFavorite(favs.includes(slug));
    };
    window.addEventListener("favorites_updated", handleUpdate);
    return () => window.removeEventListener("favorites_updated", handleUpdate);
  }, [slug, user]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoaded) return;

    const newValue = !isFavorite;
    // Atualização otimista
    setIsFavorite(newValue);
    await toggleFavoriteShow(slug, newValue, user?.uid);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!isLoaded}
      className={`grid place-items-center rounded-full bg-black/40 backdrop-blur-md p-1.5 transition-all duration-300 focus:outline-none active:scale-90 border border-white/10 shadow-sm ${
        isFavorite ? "hover:bg-red-500/20 hover:border-red-500/30" : "hover:bg-white/10"
      } ${!isLoaded ? "opacity-50 cursor-default" : "cursor-pointer"} ${className}`}
      title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart
        className={`h-4 w-4 transition-all duration-300 ${
          isFavorite
            ? "fill-red-500 text-red-500 scale-110 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]"
            : "fill-transparent text-white/80 hover:text-white"
        }`}
      />
    </button>
  );
}
