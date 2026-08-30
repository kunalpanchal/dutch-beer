# Dutch.beer

An independent, community-maintained and source-aware directory of Dutch breweries and beers. The project is at an intentionally early stage: it has **no seeded brewery or beer data**.

## What is here

- A polished Next.js directory and contribution landing experience
- Empty directory routes, ready to list published breweries and beers
- A persistence-neutral TypeScript domain model for breweries, beers, sources, contributors, and moderation
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
npm run build
```

## Data and trust principles

We do not fabricate or scrape entries into the public directory. Each fact should have a source and capture date. The initial workflow is intentionally conservative:

1. A contributor submits a new listing or correction with a source.
2. The submission receives a trust level and stays `pending_review`.
3. A moderator publishes, rejects, or requests a correction.
4. A brewery can eventually claim a profile through verification of its official domain.

The `lib/schema.ts` model preserves sources, status, contributor context, and an audit trail at the domain boundary. Add a database adapter/migrations as the next increment; PostgreSQL is the expected production target, configured with `DATABASE_URL`.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md). Add a brewery or beer from `/contribute` — the form prefills a GitHub issue for review. You can also use the **Add a brewery** and **Add a beer** issue templates in this repository.

## Next increments

- Choose and add a PostgreSQL ORM/migration layer
- Connect a persistent store and moderation inbox for submitted GitHub issues
- Add email/domain verification for brewery claims
- Render only `published` records in each directory
- Add per-field provenance and historical revisions

## License

The repository does not yet declare a license. Add one before making the project public.
