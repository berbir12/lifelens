import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = join(process.cwd(), "node_modules", "@supabase");
const oldOrigin = "http://localhost:9999";
const productionOrigin = "https://lifelens.bitlabsbuild.com";

async function patchDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await patchDirectory(path);
      continue;
    }
    if (![".js", ".mjs", ".cjs"].includes(extname(entry.name))) continue;
    const source = await readFile(path, "utf8");
    if (source.includes(oldOrigin)) {
      await writeFile(path, source.replaceAll(oldOrigin, productionOrigin));
    }
  }
}

await patchDirectory(root);
