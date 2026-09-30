# Zemlya deployment fixes

This build includes compatibility fixes for Vercel, Tatnet.ru, Onreza, Layero and similar Next.js hosts.

## Fixed

- `tsconfig.json` includes the `@/*` path alias used by the app.
- `app/sitemap.ts` explicitly uses `MetadataRoute.Sitemap` so Next.js/TypeScript keeps `changeFrequency` as the required literal union instead of widening it to `string`.

The sitemap fix addresses errors such as:

`Type 'string' is not assignable to type '"daily" | "always" | "hourly" | "weekly" | "monthly" | "yearly" | "never"'`.
