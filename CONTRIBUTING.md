# Contributing

Thank you for helping keep the Dutch beer record complete and accurate.

**Every change goes through a GitHub pull request** — listings, claims, docs, and code. Do not commit to `main`. Do not file an issue for a listing.

## Add a brewery, beer, correction, or claim

Prefer the form at [dutch.beer/en/contribute](https://dutch.beer/en/contribute). It prefills a JSON file on GitHub. Choose **Create a new branch and start a pull request**.

To add the file yourself:

1. Follow [data/README.md](./data/README.md).
2. Add `data/breweries/<slug>.json`, `data/beers/<slug>.json`, `data/corrections/<slug>.json`, or `data/claims/<slug>.json`.
3. Open a pull request against `main`.

A brewery needs a name, official website, and Dutch locality. A beer needs a brewery, a name, and a primary source (the brewery’s own site is preferred; a clear label photo can also help). If a beer is discontinued, seasonal, or contract-brewed, say how you know and when the source was checked.

Every fact needs provenance: source kind, URL or note, and the date it was captured. Do not copy copyrighted text in bulk, and do not submit personal information that is not already public and relevant.

A brewery claim needs a contact email and evidence URL on the official website domain. Consumer mailboxes (Gmail, Outlook, and similar) are not accepted. After review, `"status": "published"` marks the listing as verified.

## Code

1. Open a focused pull request.
2. Include tests when behavior changes.
3. Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run validate:listings`, and `npm run build`.
4. Do not add production secrets or invented directory records.

By contributing, you agree your contribution is licensed under the [MIT License](./LICENSE).
