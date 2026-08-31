import path from "path";
import { assembleCatalogFile } from "../lib/catalog/listings";

async function main() {
  const directory = path.join(process.cwd(), "data");
  const catalog = await assembleCatalogFile(directory, path.join(directory, ".assembled.json"));
  console.log(`Assembled ${catalog.breweries.length} breweries and ${catalog.beers?.length ?? 0} beers`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
