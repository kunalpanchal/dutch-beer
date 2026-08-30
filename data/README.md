# Directory data

Listings live in this folder and **only enter the site through a GitHub pull request**.

| Kind | Path | Open a PR |
| --- | --- | --- |
| Brewery | `data/breweries/<slug>.json` | [New brewery file](https://github.com/kunalpanchal/dutchbeer/new/main?filename=data/breweries/brewery-name.json) |
| Beer | `data/beers/<slug>.json` | [New beer file](https://github.com/kunalpanchal/dutchbeer/new/main?filename=data/beers/beer-name.json) |
| Correction | `data/corrections/<slug>.json` | [New correction file](https://github.com/kunalpanchal/dutchbeer/new/main?filename=data/corrections/entry-name.json) |

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

Do not invent records. A public primary source is required.
