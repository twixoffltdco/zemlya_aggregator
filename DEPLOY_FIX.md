# Zemlya deployment fix

This build is prepared for Vercel, Tatnet.ru, Onreza, Layero and similar Next.js build environments.

## Fixed

The project uses imports such as `@/lib/config`, `@/lib/fetcher` and `@/lib/seo`. The TypeScript configuration now explicitly defines the `@/*` alias:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./*"]
}
```

Without this mapping, the production build can fail with `Module not found: Can't resolve '@/lib/...'` even when the `lib/` directory is present.

## Deployment

Use the repository root as the project root and run:

```bash
npm install
npm run build
```

No special path configuration should be required from the hosting provider.
