## Claim a brewery

Add `data/claims/<slug>.json` and open a **pull request**. See [data/README.md](../../data/README.md). Do not file an issue.

The website form at https://dutch.beer/en/contribute?kind=claim prefills the file.

A reviewer should check that:

- [ ] The contact email is on the brewery’s official website domain (not Gmail/Outlook)
- [ ] The evidence URL is a page on that same website
- [ ] The claim names an existing brewery slug
- [ ] Optional cover, logo, description, and social URLs are sourced (never invented)

To publish after review, set `"status": "published"` in the claim file. Do not put `claimedBy` into the brewery listing file.

### Source URL

-
