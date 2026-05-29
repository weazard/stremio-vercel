# Stremio Service on Vercel

A deployable [Vercel](https://vercel.com) app that runs the Stremio **streaming
server** (`server.js`) — the same component the desktop
[Stremio Service](../README.md) launches — as a serverless function.

The function boots the bundled `server.js` inside the warm container and proxies
all HTTP traffic to it, so a Stremio client can use the deployment URL as its
streaming server.

## Layout

```
vercel/
├── api/server.js        # catch-all serverless function (landing + health + proxy)
├── lib/stremio.js       # boots server.js child process, readiness polling
├── lib/landing.js       # human-facing landing page
├── scripts/fetch-server.js  # downloads server.js at build time (version-pinned)
├── scripts/dev.js       # local dev server mimicking the Vercel rewrite
├── vercel.json          # rewrites + function config
└── package.json
```

## Deploy

1. Install the [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`.
2. From this directory, link and deploy:

   ```sh
   cd vercel
   vercel        # preview
   vercel --prod # production
   ```

   Or import the repo in the Vercel dashboard and set **Root Directory** to
   `vercel`. The build command (`node scripts/fetch-server.js`) downloads
   `server.js` automatically.

### Configuration (environment variables)

| Variable                   | Default        | Purpose                                              |
| -------------------------- | -------------- | ---------------------------------------------------- |
| `STREMIO_SERVER_VERSION`   | `v4.20.17`     | server.js version pulled from `dl.strem.io`          |
| `STREMIO_INTERNAL_PORT`    | `11470`        | port the upstream server.js binds inside the container |
| `STREMIO_DATA_DIR`         | `/tmp/stremio` | writable cache/app dir (must be under `/tmp`)        |
| `STREMIO_READY_TIMEOUT_MS` | `25000`        | how long to wait for server.js to become ready       |

## Local development

```sh
cd vercel
npm run dev   # downloads server.js, then serves the handler on :3000
```

Then probe it:

```sh
curl http://127.0.0.1:3000/__health
curl http://127.0.0.1:3000/settings
```

## Serverless limitations

Vercel functions are **stateless and short-lived**, and this image ships
**without `ffmpeg`/`ffprobe`**. As a result:

- ✅ Lightweight API endpoints work: `/settings`, addon manifest, metadata,
  proxying.
- ⚠️ Torrent downloads, HLS transcoding, and disk caching do **not** persist
  between invocations — each cold start is a fresh `/tmp`, and functions are
  killed after `maxDuration` (60s here).

For real streaming, run the desktop Stremio Service or host `server.js` on a
long-lived server. This Vercel app is best suited to lightweight/API use and as
a deployable reference.
