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

## Server and contact form

The container runs `server/server.mjs`, a small Express server. It serves the Angular build and handles `POST /api/contact`, which emails each Contact us message through Gmail SMTP with nodemailer.

| Setting | Value |
|---|---|
| `SMTP_USER` | The Gmail address that sends the messages |
| `SMTP_PASS` | A Google app password for that address (needs 2-Step Verification). Store it in Secret Manager. |
| `CONTACT_TO` | Optional. Comma-separated recipients. Defaults to michal.zeevi@gmail.com, bental4@gmail.com and ishai_r@yahoo.com, as in the old WordPress form. |

While `SMTP_USER` or `SMTP_PASS` is missing, `/config.json` returns `{"contactFormEnabled": false}` and the Send button stays disabled. Once both are set on Cloud Run, the form turns on without a new build:

```bash
printf '%s' 'APP_PASSWORD' | gcloud secrets create shin-smtp-pass --data-file=- --project shin-512818
gcloud secrets add-iam-policy-binding shin-smtp-pass --project shin-512818 \
  --member serviceAccount:1056654439816-compute@developer.gserviceaccount.com \
  --role roles/secretmanager.secretAccessor
gcloud run services update shin --region us-central1 --project shin-512818 \
  --update-env-vars SMTP_USER=sender@gmail.com \
  --update-secrets SMTP_PASS=shin-smtp-pass:latest
```

Deploys from GitHub Actions keep these settings. Each visitor IP can send up to 5 messages per 10 minutes, and a hidden field drops spam bots.

To try the server locally, build the site and run it, then use `npm start` in `web/`. The dev server forwards `/api` and `/config.json` to port 8080:

```bash
cd web && npx ng build
cd ../server && npm ci && PUBLIC_DIR=../web/dist/web/browser node server.mjs
```

## Chrome translation

Pages are English text in the document (`lang="en"`), so Chrome can offer its built-in translation. `web/public/chrome-translate.js` loads before Angular and ignores the DOM moves Chrome makes while translating, which otherwise crash the app. Translated text is left in place instead of being rewritten on the next update.
