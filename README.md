# SHIN

SHIN was founded with the aim of achieving equal representation of women in all power centers in Israel. We struggle for equal representation of women in politics and in all public and economic spheres of life, with the goal of changing society in a way that will promise social justice to all groups and communities in Israel.

The English site is an Angular app in `web/`, migrated from the WordPress export `documents/shin.WordPress.2026-11-03.xml`.

## Run locally

```bash
cd web
npm ci
node ../scripts/build-site.js
npm start
```

Open http://localhost:4200. The layout is built for phone screens as well as desktop.

## Deploy

A push to `main` builds `Dockerfile` and deploys Cloud Run service `shin` in project `shin-512818` (`us-central1`). The image tag matches w-parliament: `YYYYMMDD-HHMM-<short sha>-run<run number>`, plus `sha-<commit>` and `latest`.

The site is https://shin-1056654439816.us-central1.run.app.

GitHub Actions uses the deploy service account `shin-run-deploy@shin-512818.iam.gserviceaccount.com`. That account can update Cloud Run services and push images to the `shin` Artifact Registry repository. It signs in with Workload Identity Federation, restricted to the `Natalia-Gordon/SHIN` repository:

`projects/1056654439816/locations/global/workloadIdentityPools/github/providers/shin`

## Chrome translation

Pages are English text in the document (`lang="en"`), so Chrome can offer its built-in translation. `web/public/chrome-translate.js` loads before Angular and ignores the DOM moves Chrome makes while translating, which otherwise crash the app. Translated text is left in place instead of being rewritten on the next update.
