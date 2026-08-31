import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function filesIn(dir) {
  try {
    return (await readdir(dir)).filter((name) => name.endsWith(".json"));
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function validate(dir, required) {
  for (const name of await filesIn(dir)) {
    const path = join(dir, name);
    const data = JSON.parse(await readFile(path, "utf8"));
    for (const key of required) {
      if (!data[key]) throw new Error(`${path} is missing ${key}`);
    }
  }
}

await validate("data/breweries", ["slug", "name", "sources"]);
await validate("data/beers", ["slug", "name", "brewery", "sources"]);
await validate("data/corrections", ["entry", "change", "sources"]);
await validate("data/claims", ["slug", "name", "sources"]);
console.log("Listing files are valid.");
