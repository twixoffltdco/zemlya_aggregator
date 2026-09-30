# Земля — build fix

This package contains the full Zemlya project with the build fix discussed for the Vercel `Module not found: Can't resolve '@/lib/...'` errors.

## Included patch

The following required source modules are present under `lib/`:

- `lib/config.ts`
- `lib/fetcher.ts`
- `lib/seo.ts`
- `lib/types.ts`

They are required by pages such as `app/layout.tsx`, `app/tv/[slug]/page.tsx`, `app/video/[slug]/page.tsx`, forum pages, sitemap, robots and the feed API.

## Vercel

Make sure the deployment is building the latest `main` commit. The GitHub repository now contains the `lib/` directory. If Vercel is still showing the old `Can't resolve '@/lib/...'` log, redeploy the newest commit rather than the earlier failed deployment.

Build command:

```bash
npm run build
```
