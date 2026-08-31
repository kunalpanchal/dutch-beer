import { readFile, unlink } from "fs/promises";
import path from "path";
import { writeListingFiles } from "../lib/catalog/listings";
import { sanitizeImportedBrewery } from "../lib/catalog/odbl";
import type { CatalogFile } from "../lib/catalog/merge";

async function main() {
  const directory = path.join(process.cwd(), "data");
  const catalogPath = path.join(directory, "catalog.json");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8")) as CatalogFile;
  const breweries = [];
  let droppedOsmOnly = 0;
  for (const brewery of catalog.breweries) {
    const sanitized = sanitizeImportedBrewery(brewery);
    if (!sanitized) {
      droppedOsmOnly += 1;
      continue;
    }
    breweries.push(sanitized);
  }
  const beers = catalog.beers ?? [];
  const written = await writeListingFiles(directory, { breweries, beers }, { overwrite: true });
  await unlink(catalogPath);
  console.log(
    JSON.stringify(
      {
        breweries: { kept: breweries.length, droppedOsmOnly, written: written.breweries.written },
        beers: { kept: beers.length, written: written.beers.written },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
