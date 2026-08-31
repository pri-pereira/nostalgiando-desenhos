import { Link } from "@tanstack/react-router";
import { Search, Tv, Settings } from "lucide-react";
import { CATEGORIES } from "@/data/shows";
import { useState } from "react";

export function SiteHeader() {
  const [showModal, setShowModal] = useState(false);
  const [admTitle, setAdmTitle] = useState("");
  const [admId, setAdmId] = useState("");
  const [admImg, setAdmImg] = useState("");

  const openAdm = () => {
    const pass = window.prompt("Digite a senha de administrador (4 dígitos):");
    if (pass === "1010") {
      setShowModal(true);
    } else if (pass !== null) {
      alert("Senha incorreta!");
    }
  };

  const saveShow = () => {
    if (!admTitle || !admId) {
      alert("Preencha pelo menos o Título e o ID do Archive!");
      return;
    }
    const shows = JSON.parse(localStorage.getItem("nostalgiando_shows") || "[]");
    shows.push({ title: admTitle, id: admId, img: admImg });
    localStorage.setItem("nostalgiando_shows", JSON.stringify(shows));
    
    setShowModal(false);
    setAdmTitle("");
    setAdmId("");
    setAdmImg("");
    window.location.reload();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground shadow-[0_0_15px_rgba(217,119,6,0.5)]">
              <Tv className="h-5 w-5" />
            </span>
            <span className="min-w-0 font-display text-lg tracking-tight">
              <span className="block truncate leading-tight text-primary font-bold text-shadow-premium">Nostalgiando</span>
              <span className="block truncate text-[10px] font-bold leading-tight tracking-[0.3em] text-accent/90">
                DESENHOS
              </span>
            </span>
          </Link>

          <label className="relative hidden w-full max-w-md items-center sm:flex group">
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="search"
              placeholder="Buscar desenhos, heróis, episódios..."
              className="h-10 w-full rounded-full border border-white/10 bg-secondary/30 backdrop-blur-md pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </label>

          <button
            onClick={openAdm}
            aria-label="Admin"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-secondary/30 text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all sm:hidden"
          >
            <Settings className="h-4 w-4" />
          </button>
          
          <button
            onClick={openAdm}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-secondary/30 text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all text-sm font-semibold"
          >
            <Settings className="h-4 w-4" />
            ADM
          </button>
        </div>

        <nav className="mt-4 -mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={c.id === "todos" ? "/" : `/#${c.id}`}
              className="shrink-0 rounded-full border border-white/5 bg-secondary/20 px-5 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground transition-all hover:bg-secondary/40 hover:text-foreground active:scale-95"
            >
              {c.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Modal ADM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4 text-primary">Adicionar Novo Desenho</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título do Desenho</label>
                <input 
                  value={admTitle}
                  onChange={(e) => setAdmTitle(e.target.value)}
                  type="text" 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white outline-none focus:border-primary" 
                  placeholder="Ex: Batman Animated Series" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ID do Internet Archive</label>
                <input 
                  value={admId}
                  onChange={(e) => setAdmId(e.target.value)}
                  type="text" 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white outline-none focus:border-primary" 
                  placeholder="Ex: batman-animated-1992" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL da Imagem (Pôster)</label>
                <input 
                  value={admImg}
                  onChange={(e) => setAdmImg(e.target.value)}
                  type="text" 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white outline-none focus:border-primary" 
                  placeholder="https://link-da-imagem.jpg" 
                />
              </div>
              
              <button 
                onClick={saveShow} 
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-2 rounded mt-4 transition"
              >
                Salvar e Adicionar à Vitrine
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
