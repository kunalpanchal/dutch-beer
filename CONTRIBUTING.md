# Contributing to Dutch.beer

Thank you for helping make the Dutch beer record more complete and more accurate.

## Add a brewery or beer

The preferred path is the website form at `/contribute`. It prefills a GitHub issue so maintainers can review the source before anything is published. Email is only a fallback if you cannot use GitHub.

You can also open a structured issue from this repository:

1. Click **New issue**.
2. Choose **Add a brewery**, **Add a beer**, or **Correct a listing**.
3. Fill every required field, especially the primary source URL.
4. Wait for review. Listings are not published automatically.

A useful brewery submission includes name, official website, and Dutch locality. A useful beer submission includes brewery, beer name, and the best available primary source. A link to the brewery’s own site is preferred; a clear photograph of a label can also help.

Please distinguish facts from guesses. If a beer is discontinued, seasonal, contract-brewed, or has a changed ABV, say how you know and when the source was checked.

## Sources and attribution

Every submitted fact needs provenance: source kind, URL or explanatory note, and the date it was captured. Do not copy large amounts of copyrighted text or submit personal information that is not already public and relevant to the listing.

## Review and publication

Initial contributions are not published automatically. They are recorded as `pending_review` and can be published by a moderator after evidence has been checked. A future verified brewery account will be able to maintain its own listing, with changes retaining an audit trail.

## Code contributions

1. Open an issue describing the proposed change.
2. Keep changes focused and include tests when behavior changes.
3. Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` before opening a pull request.
4. Never add production secrets or invented directory records. Open-data imports must stay `pending_review` until a moderator has checked the source.

By contributing, you agree that your contribution may be published as part of this open community project once a repository license is chosen.
