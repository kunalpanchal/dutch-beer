# Directory data

Listings live in this folder and **only enter the site through a GitHub pull request**.

| Kind | Path | Open a PR |
| --- | --- | --- |
| Brewery | `data/breweries/<slug>.json` | [New brewery file](https://github.com/kunalpanchal/dutchbeer/new/main?filename=data/breweries/brewery-name.json) |
| Beer | `data/beers/<slug>.json` | [New beer file](https://github.com/kunalpanchal/dutchbeer/new/main?filename=data/beers/beer-name.json) |
| Correction | `data/corrections/<slug>.json` | [New correction file](https://github.com/kunalpanchal/dutchbeer/new/main?filename=data/corrections/entry-name.json) |
| Claim | `data/claims/<slug>.json` | [New claim file](https://github.com/kunalpanchal/dutchbeer/new/main?filename=data/claims/brewery-name.json) |

Prefer the website form at `/contribute`. It prefills the file. On GitHub, choose **Create a new branch and start a pull request**. Do not commit to `main`.

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
  "breweryName": "Brouwerij De Molen",
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

Do not invent records. A public primary source is required.

## Claim

A brewery claim proves someone at the brewery stands behind the listing. The contact email and evidence URL must use the same domain as the official website. Consumer mailboxes (Gmail, Outlook, and similar) are not accepted.

```json
{
  "slug": "brouwerij-de-molen",
  "brewery": "Brouwerij De Molen",
  "claimedBy": "Taproom",
  "email": "info@brouwerijdemolen.nl",
  "website": "https://www.brouwerijdemolen.nl",
  "status": "pending_review",
  "trustLevel": "new",
  "sources": [
    {
      "sourceKind": "brewery_submission",
      "url": "https://www.brouwerijdemolen.nl/contact",
      "capturedAt": "2026-08-31",
      "note": "We run the Bodegraven taproom."
    }
  ]
}
```

After review, set `"status": "published"`. The site shows a verified badge; it does not display the email. Do not copy `claimedBy` into the brewery listing file.

Optional profile fields must come from a public source. Do not invent them. They may live on the brewery listing or on a published claim.

Supported optional fields (omit any that are unknown):

| Field | Purpose |
| --- | --- |
| `description` | Short, sourced about copy |
| `coverImage`, `logo`, `photos` | Owner- or source-supplied images only |
| `accentColor` | Brand hex color (`#c41230`) |
| `social` | Instagram, Facebook, X, YouTube |
| `telephone`, `contactUrl` | Phone and public contact page |
| `openingHours`, `taproom`, `tours` | Visit info |
| `foundedYear`, `founder` | History |
| `branches` | Extra locations (taproom, shop, …) |
| `events`, `news` | Upcoming events and brewery updates |
| `highlightLinks` | Extra CTAs (`[{ "label", "url" }]`) |
| `featuredBeerSlugs` | Brewery-ranked beer order |
| `featured` | Featured placement flag |
| `previewOnly` | Hide from directory lists; page still works by direct URL |

```json
{
  "slug": "example-brewery",
  "name": "Example Brewery",
  "website": "https://example.beer",
  "accentColor": "#1a3a5c",
  "foundedYear": 2014,
  "contactUrl": "https://example.beer/contact",
  "highlightLinks": [{ "label": "Webshop", "url": "https://example.beer/shop" }],
  "featuredBeerSlugs": ["house-ipa", "seasonal-stout"],
  "address": {
    "locality": "Breda",
    "region": "Noord-Brabant",
    "countryCode": "NL"
  },
  "status": "pending_review",
  "trustLevel": "new",
  "sources": [
    {
      "sourceKind": "official_website",
      "url": "https://example.beer",
      "capturedAt": "2026-09-05"
    }
  ]
}
```

Local layout preview: `data/breweries/dummy.json` (`previewOnly: true`) plus `data/preview/dummy-beers.json` are reachable at `/en/directory/breweries/dummy` and are omitted from brewery/beer indexes, places, sitemap counts, and the home board.

After review, set `"status": "published"`. The site shows a verified badge; it does not display the email. Do not copy `claimedBy` into the brewery listing file.

## Catalog files

Each brewery and beer is its own JSON file. Edit that file to correct a listing. Published claims in `data/claims/` overlay a verified badge at read time. See [ATTRIBUTION.md](./ATTRIBUTION.md) for seed licenses and why OpenStreetMap data is not stored here.
