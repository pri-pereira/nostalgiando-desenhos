import { useState } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Play,
  X,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ExternalLink,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import type { Episode } from "@/data/shows";

interface EpisodesBatchManagerProps {
  episodes: Episode[];
  onChange: (episodes: Episode[]) => void;
  showTitle?: string;
}

export function EpisodesBatchManager({
  episodes,
  onChange,
  showTitle,
}: EpisodesBatchManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "batch">("list");
  const [batchText, setBatchText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  // Adicionar um único episódio manualmente
  const handleAddSingle = () => {
    const nextNum = episodes.length + 1;
    const newEp: Episode = {
      id: `ep-${nextNum}-${Date.now().toString().slice(-4)}`,
      number: nextNum,
      title: `Episódio ${nextNum}`,
      videoUrl: "",
      duration: "22 min",
      synopsis: "",
    };
    onChange([...episodes, newEp]);
  };

  // Atualizar campo de um episódio
  const handleUpdate = (index: number, field: keyof Episode, val: any) => {
    const updated = [...episodes];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  // Remover episódio
  const handleRemove = (index: number) => {
    const updated = episodes
      .filter((_, i) => i !== index)
      .map((ep, i) => ({ ...ep, number: i + 1 }));
    onChange(updated);
  };

  // Mover episódio para cima
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...episodes];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    onChange(updated.map((ep, i) => ({ ...ep, number: i + 1 })));
  };

  // Mover episódio para baixo
  const handleMoveDown = (index: number) => {
    if (index === episodes.length - 1) return;
    const updated = [...episodes];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    onChange(updated.map((ep, i) => ({ ...ep, number: i + 1 })));
  };

  // Processar importação em lote
  const handleProcessBatch = () => {
    if (!batchText.trim()) {
      toast.error("Cole ao menos uma linha com título e URL.");
      return;
    }

    const lines = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const newEpisodes: Episode[] = [];
    let startNum = episodes.length + 1;

    for (const line of lines) {
      let title = "";
      let url = "";

      if (line.includes("|")) {
        const parts = line.split("|").map((p) => p.trim());
        title = parts[0];
        url = parts[1] || "";
      } else if (line.startsWith("http")) {
        title = `Episódio ${startNum}`;
        url = line;
      } else {
        title = line;
        url = "";
      }

      newEpisodes.push({
        id: `ep-${startNum}-${Date.now().toString().slice(-4)}`,
        number: startNum,
        title: title || `Episódio ${startNum}`,
        videoUrl: url,
        duration: "22 min",
        synopsis: "",
      });
      startNum++;
    }

    onChange([...episodes, ...newEpisodes]);
    setBatchText("");
    setActiveSubTab("list");
    toast.success(`${newEpisodes.length} episódios adicionados com sucesso!`);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
      {/* Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h4 className="text-sm font-bold text-foreground">
            Gerenciador de Episódios ({episodes.length})
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "list"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            Lista de Episódios
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("batch")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === "batch"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Adicionar em Lote
          </button>
        </div>
      </div>

      {/* Tab: Lista de Episódios */}
      {activeSubTab === "list" && (
        <div className="space-y-2.5">
          {episodes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs border border-dashed border-white/10 rounded-xl space-y-2">
              <Film className="h-6 w-6 mx-auto opacity-40" />
              <p>Nenhum episódio cadastrado individualmente.</p>
              <p className="text-[11px] opacity-70">
                (Se o desenho utilizar Internet Archive, os episódios podem vir pelo Archive ID)
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {episodes.map((ep, idx) => (
                <div
                  key={ep.id || idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl border border-white/5 bg-zinc-950/60 text-xs"
                >
                  <span className="grid h-6 w-6 place-items-center rounded bg-primary/20 text-primary font-bold shrink-0">
                    {idx + 1}
                  </span>

                  <input
                    type="text"
                    value={ep.title}
                    onChange={(e) => handleUpdate(idx, "title", e.target.value)}
                    placeholder="Título do Episódio"
                    className="flex-1 min-w-[140px] h-8 px-2.5 rounded-lg border border-white/10 bg-secondary/30 text-foreground text-xs focus:outline-none focus:border-primary"
                  />

                  <input
                    type="text"
                    value={ep.videoUrl || ""}
                    onChange={(e) => handleUpdate(idx, "videoUrl", e.target.value)}
                    placeholder="URL do Vídeo / Iframe (YouTube / MP4 / Archive)"
                    className="flex-[1.5] min-w-[180px] h-8 px-2.5 rounded-lg border border-white/10 bg-secondary/30 text-foreground text-xs font-mono focus:outline-none focus:border-primary"
                  />

                  <div className="flex items-center gap-1 shrink-0 justify-end">
                    {ep.videoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl(ep.videoUrl || null);
                          setPreviewTitle(ep.title);
                        }}
                        title="Testar Link no Mini-Player"
                        className="h-8 px-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Play className="h-3 w-3 fill-emerald-400" />
                        Testar
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      title="Mover para cima"
                      className="h-8 w-8 rounded-lg bg-secondary/40 text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === episodes.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      title="Mover para baixo"
                      className="h-8 w-8 rounded-lg bg-secondary/40 text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      title="Remover episódio"
                      className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleAddSingle}
            className="w-full py-2 rounded-xl border border-dashed border-white/15 hover:border-primary/50 text-xs font-bold text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Episódio Individual
          </button>
        </div>
      )}

      {/* Tab: Adicionar em Lote */}
      {activeSubTab === "batch" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Cole as linhas de episódios no formato{" "}
            <code className="text-foreground bg-white/5 px-1 py-0.5 rounded">
              Nome do Episódio | URL do Vídeo
            </code>{" "}
            (uma por linha):
          </p>

          <textarea
            rows={5}
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder={`Episódio 1: A Lenda Começa | https://archive.org/embed/exemplo_ep1\nEpisódio 2: O Retorno | https://archive.org/embed/exemplo_ep2\nhttps://archive.org/embed/exemplo_ep3`}
            className="w-full rounded-xl border border-white/10 bg-secondary/30 p-3 text-xs text-foreground font-mono focus:outline-none focus:border-primary resize-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab("list")}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleProcessBatch}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Importar Linhas
            </button>
          </div>
        </div>
      )}

      {/* Mini-Player Modal de Preview */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-emerald-400 fill-emerald-400" />
                <span className="font-bold text-sm text-foreground">
                  Preview: {previewTitle || showTitle || "Episódio"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="h-8 w-8 rounded-lg bg-secondary/40 text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/5 relative">
              {previewUrl.endsWith(".mp4") ? (
                <video src={previewUrl} controls className="w-full h-full object-contain" />
              ) : (
                <iframe
                  src={previewUrl}
                  title="Preview do Vídeo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span className="truncate max-w-md font-mono">{previewUrl}</span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
              >
                Abrir em Nova Aba
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
