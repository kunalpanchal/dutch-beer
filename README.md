# Dutch.beer

An independent, community-maintained and source-aware directory of Dutch breweries and beers. The public board starts empty: open-data imports land in a **review inbox** and are not published until a moderator checks the source.

## What is here

- A polished Next.js directory and contribution landing experience
- A directory that lists only `published` breweries, with empty beers until those are sourced
- A persistence-neutral TypeScript domain model for breweries, beers, sources, contributors, and moderation
- Importers for Wikidata (CC0), Open Brewery DB (MIT), and OpenStreetMap (ODbL)
- A file-backed catalog (`data/catalog.json`) of pending brewery listings with provenance
- A review inbox at `/review` so imports can be checked before they appear on the public board
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
npm run build
```

Refresh the brewery catalog from open data (writes `data/catalog.json`, all records `pending_review`):

```bash
npm run import:breweries
```

See [data/ATTRIBUTION.md](./data/ATTRIBUTION.md) for licenses and matching rules.

## Data and trust principles

We do not fabricate or scrape entries into the public directory. Each fact should have a source and capture date. The initial workflow is intentionally conservative:

1. A contributor submits a new listing or correction with a source.
2. The submission receives a trust level and stays `pending_review`.
3. A moderator publishes, rejects, or requests a correction.
4. A brewery can eventually claim a profile through verification of its official domain.

The `lib/schema.ts` model preserves sources, status, contributor context, and an audit trail at the domain boundary. Add a database adapter/migrations as the next increment; PostgreSQL is the expected production target, configured with `DATABASE_URL`.

Open-data imports are stored in `data/catalog.json`. They keep `status: pending_review` and are listed at `/review`. Only `published` records render in `/directory/breweries`.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md). Add a brewery or beer from `/contribute` — the form prefills a GitHub issue for review. You can also use the **Add a brewery** and **Add a beer** issue templates in this repository.

## Next increments

- Choose and add a PostgreSQL ORM/migration layer
- Connect a persistent store and moderation inbox for submitted GitHub issues
- Add email/domain verification for brewery claims
- Add a moderator publish action (today, publishing is a catalog status change)
- Add per-field provenance and historical revisions

## License

The repository does not yet declare a license. Add one before making the project public.
