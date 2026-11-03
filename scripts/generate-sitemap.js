import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.resolve(__dirname, "../src/data/catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const baseUrl = "https://nostalgiando-desenhos.vercel.app";
const today = new Date().toISOString().split("T")[0];

const categories = [
  "anos50-60",
  "anos70",
  "anos80",
  "anos90",
  "anos2000",
  "hanna-barbera",
  "tokusatsu",
  "animes-classicos",
  "disney-classicos",
  "looney-tunes",
];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

// Home
xml += "  <url>\n";
xml += `    <loc>${baseUrl}/</loc>\n`;
xml += `    <lastmod>${today}</lastmod>\n`;
xml += "    <changefreq>daily</changefreq>\n";
xml += "    <priority>1.0</priority>\n";
xml += "  </url>\n";

// Mural de Pedidos Comunitários
xml += "  <url>\n";
xml += `    <loc>${baseUrl}/pedidos</loc>\n`;
xml += `    <lastmod>${today}</lastmod>\n`;
xml += "    <changefreq>daily</changefreq>\n";
xml += "    <priority>0.9</priority>\n";
xml += "  </url>\n";

// Planos VIP
xml += "  <url>\n";
xml += `    <loc>${baseUrl}/vip</loc>\n`;
xml += `    <lastmod>${today}</lastmod>\n`;
xml += "    <changefreq>monthly</changefreq>\n";
xml += "    <priority>0.8</priority>\n";
xml += "  </url>\n";

// Categorias
for (const cat of categories) {
  xml += "  <url>\n";
  xml += `    <loc>${baseUrl}/categoria/${cat}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += "    <changefreq>weekly</changefreq>\n";
  xml += "    <priority>0.8</priority>\n";
  xml += "  </url>\n";
}

// Shows
for (const show of catalog) {
  if (!show.slug) continue;
  xml += "  <url>\n";
  xml += `    <loc>${baseUrl}/assistir/${encodeURIComponent(show.slug)}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += "    <changefreq>weekly</changefreq>\n";
  xml += "    <priority>0.9</priority>\n";
  xml += "  </url>\n";
}

xml += "</urlset>\n";

const outputPath = path.resolve(__dirname, "../public/sitemap.xml");
fs.writeFileSync(outputPath, xml, "utf8");
console.log(`Sitemap gerado com sucesso: ${catalog.length} desenhos incluídos.`);

