import { importBreweries, writeCatalog } from "../lib/import/run";

async function main() {
  const result = await importBreweries();
  const file = await writeCatalog(result.catalog);
  console.log(`Wrote ${file}`);
  console.log(JSON.stringify(result.counts, null, 2));
  if (result.counts.published !== 0) {
    throw new Error("Open-data import must not publish listings");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
