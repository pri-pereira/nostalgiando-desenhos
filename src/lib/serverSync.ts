import { createServerFn } from "@tanstack/react-start";
import type { Show } from "@/data/shows";

export const persistCatalogToDiskServerFn = createServerFn({ method: "POST" })
  .validator((shows: unknown): Show[] => {
    if (!Array.isArray(shows)) {
      throw new Error("Catálogo inválido");
    }
    return shows as Show[];
  })
  .handler(async ({ data: shows }) => {
    try {
      // Executa apenas no Node.js / Server
      if (typeof process !== "undefined" && process.versions?.node) {
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "src", "data", "catalog.json");
        await fs.writeFile(filePath, JSON.stringify(shows, null, 2), "utf-8");
        return { success: true, message: "Catálogo gravado fisicamente no disco do projeto!" };
      }
      return { success: false, message: "Ambiente sem acesso ao disco" };
    } catch (e: any) {
      console.warn("Aviso ao persistir no disco local:", e?.message);
      return { success: false, message: e?.message };
    }
  });
