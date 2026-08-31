# Dutch.beer

An independent, community-maintained and source-aware directory of Dutch breweries and beers.

## What is here

- A polished Next.js directory and contribution landing experience
- A brewery directory sheet with search, sort, and pagination
- A persistence-neutral TypeScript domain model for breweries, beers, sources, contributors, and moderation
- Importers for Wikidata (CC0), Open Brewery DB (MIT), and OpenStreetMap (ODbL)
- A file-backed catalog (`data/catalog.json`) of brewery listings with provenance
- Brewery claims via official-domain email and evidence, reviewed as pull requests
- A clear trust and provenance model so community submissions stay traceable

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

The public site defaults to English at `/en`; Dutch is available at `/nl`. Language is switched from the footer (`EN` is selected by default). Unprefixed routes redirect to English.

Quality checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run validate:listings
npm run build
```

Refresh the brewery catalog from open data (writes `data/catalog.json`, all records `pending_review`):

```bash
npm run import:breweries
```

See [data/ATTRIBUTION.md](./data/ATTRIBUTION.md) for licenses and matching rules.

## Data and trust principles

We do not fabricate or scrape entries into the public directory. Each fact should have a source and capture date. The initial workflow is intentionally conservative:

1. A contributor opens a pull request with a sourced listing file (or a code change).
2. The listing stays `pending_review` until the PR is merged.
3. A maintainer reviews the source, then merges or requests changes.
4. A brewery can claim a profile: an email and evidence page on the official domain, reviewed in a pull request.

The `lib/schema.ts` model preserves sources, status, contributor context, and an audit trail at the domain boundary. Add a database adapter/migrations as the next increment; PostgreSQL is the expected production target, configured with `DATABASE_URL`.

Open-data imports are stored in `data/catalog.json` and listed in `/directory/breweries`. Corrections and brewery claims go through `/contribute`. Published claims in `data/claims/` overlay onto the catalog at read time.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md). Add a brewery, beer, correction, or claim from `/contribute` — the form prefills a JSON file and opens a GitHub pull request. Listings, corrections, claims, and code changes all land through PRs, never through issues or a direct commit to `main`.

## Next increments

- Choose and add a PostgreSQL ORM/migration layer
- Connect a persistent store and render merged `data/` listings in the directory
- Overlay published brewery claims onto imported catalog records
- Add automated email/DNS verification for brewery claims (today a reviewer checks the domain)
- Add per-field provenance and historical revisions

## License

The repository does not yet declare a license. Add one before making the project public.
