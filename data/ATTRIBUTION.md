# Open catalog data

Dutch.beer imports public brewery records from Wikidata, Open Brewery DB, and OpenStreetMap, and beers from Wikidata only (CC0). They appear in the public directory with their source URLs attached.

Refresh the catalog:

```bash
npm run import:breweries
npm run import:beers
```

Beer import does not copy SENB, Wikipedia, Open Food Facts, or other sources that require extra attribution or forbid bulk reuse.

## Sources

| Source | License | What we take |
| --- | --- | --- |
| [Wikidata](https://www.wikidata.org/) | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | Breweries: name, official website, locality, coordinates, SENB id. Beers: name, manufacturer, style, ABV, website, SENB id |
| [Open Brewery DB](https://www.openbrewerydb.org/) | [MIT](https://github.com/openbrewerydb/openbrewerydb/blob/master/LICENSE) | Breweries: name, website, city, province, coordinates |
| [OpenStreetMap](https://www.openstreetmap.org/) | [ODbL](https://opendatacommons.org/licenses/odbl/) | Breweries: name, website, address, coordinates, Wikidata link |

OpenStreetMap data is © OpenStreetMap contributors. Coordinate and address facts copied from OSM remain available under ODbL; the source URL on each record points back to the OSM object.

## Matching

Records are merged when they share a Wikidata id, a non-generic website host, or the same normalized name and locality. Each merged listing keeps every source URL and capture date.
