# Open catalog data

The public directory is the JSON files under `data/breweries/` and `data/beers/`. They were seeded once from open data; after that, listings change through GitHub pull requests. Do not copy OpenStreetMap geometries into those files.

## Seed sources

| Source | License | What we kept |
| --- | --- | --- |
| [Wikidata](https://www.wikidata.org/) | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | Breweries: name, official website, locality, coordinates, SENB id. Beers: name, manufacturer, style, ABV, website, SENB id |
| [Open Brewery DB](https://www.openbrewerydb.org/) | [MIT](https://github.com/openbrewerydb/openbrewerydb/blob/master/LICENSE) | Breweries: name, website, city, province, coordinates |

Open Brewery DB remains MIT. Keep that notice when redistributing brewery records that came from it.

## OpenStreetMap (ODbL)

[OpenStreetMap](https://www.openstreetmap.org/) is [ODbL](https://opendatacommons.org/licenses/odbl/). ODbL is a database share-alike license: if we copy OSM coordinates, addresses, or OSM-only POIs into this git catalog, the catalog (or that subset) would have to stay ODbL, and we could not treat brewery websites as the later source of those facts.

The 2026-08-31 seed used OSM only to match Wikidata / Open Brewery DB rows. It did **not** copy OSM into listing files:

- **0 beers** came from OSM (beers are Wikidata / CC0 only)
- **110 of 1,061** brewery rows had an OSM source
- **35** existed only in OSM; **17** of those had no official website and were dropped; **18** with a website were kept and now cite that website
- Mixed rows dropped the OSM source, OSM id, and coordinates (those pins may have been OSM)

A map link to osm.org from a Wikidata coordinate is a pointer, not a copy of the OSM database.

Do not add `origin: "openstreetmap"` or `externalIds.osm` to listing files.

## Matching

Records were merged when they shared a Wikidata id, a non-generic website host, or the same normalized name and locality. Each listing keeps the remaining source URLs and capture dates.

## Refresh

`npm run import:breweries` and `npm run import:beers` only **add** files that are not already present (matched by slug or Wikidata / Open Brewery DB id). They do not overwrite owner edits and they do not fetch OSM. The seed is done; prefer pull requests for corrections.
