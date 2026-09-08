import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
const env = await readFile(".env.local", "utf8");
const secrets = env.split(/\r?\n/).filter((line) => /^(MYSQL_PASSWORD|PUBLIC_SITE_REVALIDATE_SECRET)=/.test(line)).map((line) => line.slice(line.indexOf("=") + 1)).filter(Boolean);
let checked = 0;
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(js|map|json|html)$/.test(entry.name)) {
      const bytes = await readFile(file); checked++;
      if (secrets.some((secret) => bytes.includes(Buffer.from(secret)))) throw new Error(`A server secret appears in client output: ${file}`);
    }
  }
}
for (const root of [".next-build/static", "../ganesh-website/.next-build/static"]) await walk(root);
console.log(`Checked ${checked} client build files: no configured server secrets found.`);
