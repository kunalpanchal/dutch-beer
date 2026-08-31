# Directory data

Listings live in this folder and **only enter the site through a GitHub pull request**.

| Kind | Path | Open a PR |
| --- | --- | --- |
| Brewery | `data/breweries/<slug>.json` | [New brewery file](https://github.com/kunalpanchal/dutchbeer/new/main?filename=data/breweries/brewery-name.json) |
| Beer | `data/beers/<slug>.json` | [New beer file](https://github.com/kunalpanchal/dutchbeer/new/main?filename=data/beers/beer-name.json) |
| Correction | `data/corrections/<slug>.json` | [New correction file](https://github.com/kunalpanchal/dutchbeer/new/main?filename=data/corrections/entry-name.json) |
| Claim | `data/claims/<slug>.json` | [New claim file](https://github.com/kunalpanchal/dutchbeer/new/main?filename=data/claims/brewery-name.json) |

Prefer the website form at `/contribute` — it prefills the file. On GitHub, choose **Create a new branch and start a pull request**. Do not commit to `main`.

## Brewery

```json
{
  "slug": "brouwerij-de-molen",
  "name": "Brouwerij De Molen",
  "website": "https://www.brouwerijdemolen.nl",
  "address": {
    "locality": "Bodegraven",
    "region": "Zuid-Holland",
    "countryCode": "NL"
  },
  "status": "pending_review",
  "trustLevel": "new",
  "sources": [
    {
      "sourceKind": "official_website",
      "url": "https://www.brouwerijdemolen.nl",
      "capturedAt": "2026-08-31"
    }
  ]
}
```

## Beer

```json
{
  "slug": "hel-en-verdoemenis",
  "name": "Hel & Verdoemenis",
  "brewery": "Brouwerij De Molen",
  "style": "Imperial Stout",
  "abv": 10,
  "availability": "year_round",
  "status": "pending_review",
  "trustLevel": "new",
  "sources": [
    {
      "sourceKind": "official_website",
      "url": "https://www.brouwerijdemolen.nl",
      "capturedAt": "2026-08-31"
    }
  ]
}
```

`availability` is one of `year_round`, `seasonal`, `one_off`, or `unknown`.

## Correction

```json
{
  "entry": "Brouwerij De Molen",
  "change": "What is wrong and what it should be.",
  "status": "pending_review",
  "sources": [
    {
      "sourceKind": "official_website",
      "url": "https://www.brouwerijdemolen.nl",
      "capturedAt": "2026-08-31"
    }
  ]
}
```

Do not invent records. A public primary source is required. Do not add stock photos, guessed opening hours, or unsourced descriptions.

## Claim and brewery-owned profile

A brewery claims its page through the same pull-request flow (`/contribute?kind=claim`, or a file under `data/claims/`). After a reviewer verifies the official domain, set `claimedBy` on the brewery listing and copy any sourced profile fields onto `data/breweries/<slug>.json`. Those overlay the imported catalog.

Optional owner-supplied fields (only include a field when it is real and sourced):

```json
{
  "slug": "kompaan",
  "name": "Kompaan",
  "claimedBy": "kompaan",
  "description": "A short description from the brewery.",
  "coverImage": "https://example.com/cover.jpg",
  "logo": "https://example.com/logo.png",
  "social": {
    "instagram": "https://instagram.com/example"
  },
  "telephone": "+31 70 000 0000",
  "openingHours": "Tu-Su 12:00-22:00",
  "taproom": { "name": "Taproom name" },
  "status": "published",
  "trustLevel": "verified_brewery",
  "sources": [
    {
      "sourceKind": "brewery_submission",
      "url": "https://kompaanbier.nl/nl/",
      "capturedAt": "2026-08-31"
    }
  ]
}
```

## Claim file

```json
{
  "kind": "claim",
  "slug": "kompaan",
  "name": "Kompaan",
  "website": "https://kompaanbier.nl/nl/",
  "status": "pending_review",
  "trustLevel": "new",
  "sources": [
    {
      "sourceKind": "brewery_submission",
      "url": "https://kompaanbier.nl/nl/",
      "note": "How the reviewer can tell this is the brewery.",
      "capturedAt": "2026-08-31"
    }
  ]
}
```

## Open-data catalog

`data/catalog.json` is a bulk import from Wikidata, Open Brewery DB, and OpenStreetMap. Those records stay `pending_review` until a moderator publishes them. See [ATTRIBUTION.md](./ATTRIBUTION.md). Do not treat `catalog.json` as a listing file for `/contribute` — community additions still go in `data/breweries/`, `data/beers/`, `data/corrections/`, or `data/claims/`.
