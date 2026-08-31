# Dutch.beer

An independent, community-maintained directory of Dutch breweries and beers. Live at [dutch.beer](https://dutch.beer).

Every listing should point back to a public source. Community additions, corrections, and brewery claims land through GitHub pull requests.

## Contribute

Use the form at [dutch.beer/en/contribute](https://dutch.beer/en/contribute), or add a JSON file yourself. See [CONTRIBUTING.md](./CONTRIBUTING.md) and [data/README.md](./data/README.md).

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. English is at `/en`, Dutch at `/nl`. Unprefixed routes redirect to English.

```bash
npm run lint
npm run typecheck
npm run test
npm run validate:listings
npm run build
```

Refresh the open-data catalog (`data/catalog.json`):

```bash
npm run import:breweries
npm run import:beers
```

Beers come from Wikidata (CC0) only. Source licenses and matching rules are in [data/ATTRIBUTION.md](./data/ATTRIBUTION.md).

## License

Source code is [MIT](./LICENSE). Imported catalog data keeps its original licenses. See [data/ATTRIBUTION.md](./data/ATTRIBUTION.md).
