## Summary

-

## This pull request

- [ ] Adds or updates a brewery (`data/breweries/`)
- [ ] Adds or updates a beer (`data/beers/`)
- [ ] Corrects a listing (`data/corrections/` or an existing data file)
- [ ] Claims a brewery (`data/claims/`)
- [ ] Code, docs, or site change

Every change, including listings, must go through a pull request. Do not commit to `main`.

## Source

Required for directory data. Prefer the brewery’s own website.

URL:

## Test plan

- [ ] JSON is valid (directory data)
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run validate:listings`
- [ ] `npm run build`
