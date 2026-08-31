# Contributing to Dutch.beer

Thank you for helping make the Dutch beer record more complete and more accurate.

**Every change goes through a GitHub pull request.** That includes new breweries, beers, corrections, claims, docs, and code. Do not commit to `main`, and do not file an issue for a listing.

## Add a brewery or beer

The preferred path is the website form at `/contribute`. It prefills a JSON file on GitHub. Choose **Create a new branch and start a pull request**.

You can also add the file yourself:

1. Read [data/README.md](./data/README.md).
2. Add `data/breweries/<slug>.json`, `data/beers/<slug>.json`, `data/corrections/<slug>.json`, or `data/claims/<slug>.json`.
3. Open a pull request against `main`.
4. Wait for review. Listings are not published until the PR is merged.

A useful brewery submission includes name, official website, and Dutch locality. A useful beer submission includes brewery, beer name, and the best available primary source. A link to the brewery’s own site is preferred; a clear photograph of a label can also help.

Please distinguish facts from guesses. If a beer is discontinued, seasonal, contract-brewed, or has a changed ABV, say how you know and when the source was checked.

## Sources and attribution

Every submitted fact needs provenance: source kind, URL or explanatory note, and the date it was captured. Do not copy large amounts of copyrighted text or submit personal information that is not already public and relevant to the listing.

## Review and publication

Pull requests stay `pending_review` in the listing file until a maintainer merges them. A brewery can claim a listing by opening a claim pull request: contact email and evidence URL must be on the official website domain. After a maintainer sets the claim file to `published`, the directory shows the listing as a verified brewery.

## Code contributions

1. Open a pull request with a focused change.
2. Include tests when behavior changes.
3. Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
4. Never add production secrets or invented directory records.

By contributing, you agree that your contribution may be published as part of this open community project once a repository license is chosen.
