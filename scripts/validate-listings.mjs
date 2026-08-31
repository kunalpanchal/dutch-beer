import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";

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
    if (data.slug && `${data.slug}.json` !== basename(path)) {
      throw new Error(`${path} slug does not match the file name`);
    }
    if (Array.isArray(data.sources) && data.sources.some((source) => source.origin === "openstreetmap")) {
      throw new Error(`${path} still contains OpenStreetMap (ODbL) source facts`);
    }
    if (data.externalIds?.osm) {
      throw new Error(`${path} still contains an OpenStreetMap id`);
    }
  }
}

await validate("data/breweries", ["slug", "name", "sources"]);
await validate("data/beers", ["slug", "name", "sources"]);
for (const name of await filesIn("data/beers")) {
  const beerPath = join("data/beers", name);
  const data = JSON.parse(await readFile(beerPath, "utf8"));
  if (!data.breweryName && !data.brewery) throw new Error(`${beerPath} is missing breweryName`);
}
await validate("data/corrections", ["entry", "change", "sources"]);
await validate("data/claims", ["slug", "brewery", "claimedBy", "email", "sources"]);
console.log("Listing files are valid.");
