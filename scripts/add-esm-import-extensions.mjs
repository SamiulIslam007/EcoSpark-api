import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, "..", "src");

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name.endsWith(".ts")) patchFile(full);
  }
}

function patchFile(file) {
  let s = fs.readFileSync(file, "utf8");
  const next = s.replace(
    /from\s+(["'])(\.\.?\/[^"']+)\1/g,
    (m, q, spec) => {
      if (spec.endsWith(".js")) return m;
      return `from ${q}${spec}.js${q}`;
    },
  );
  if (next !== s) {
    fs.writeFileSync(file, next, "utf8");
    console.log("patched", path.relative(srcRoot, file));
  }
}

walk(srcRoot);
