# Open brewery data

Dutch.beer imports public brewery records as **`pending_review`**. Nothing from these sources is published automatically.

Refresh the catalog:

```bash
npm run import:breweries
```

## Sources

| Source | License | What we take |
| --- | --- | --- |
| [Wikidata](https://www.wikidata.org/) | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | Name, official website, locality, coordinates, SENB id |
| [Open Brewery DB](https://www.openbrewerydb.org/) | [MIT](https://github.com/openbrewerydb/openbrewerydb/blob/master/LICENSE) | Name, website, city, province, coordinates |
| [OpenStreetMap](https://www.openstreetmap.org/) | [ODbL](https://opendatacommons.org/licenses/odbl/) | Name, website, address, coordinates, Wikidata link |

OpenStreetMap data is © OpenStreetMap contributors. Coordinate and address facts copied from OSM remain available under ODbL; the source URL on each record points back to the OSM object.

## Matching

Records are merged when they share a Wikidata id, a non-generic website host, or the same normalized name and locality. Each merged listing keeps every source URL and capture date.

## Publication

Imported listings stay `pending_review` with trust level `new`. The public directory only renders `published` records. Review the inbox at `/review`.
