#!/usr/bin/env node
// Downloads the Stremio streaming server bundle (server.js) so it can be
// shipped inside the Vercel serverless function. Run at build time.
//
// The version is pinned to match the desktop service (Cargo.toml
// `package.metadata.server.version`). Override with STREMIO_SERVER_VERSION.

'use strict';

const fs = require('fs');
const path = require('path');

const VERSION = process.env.STREMIO_SERVER_VERSION || 'v4.20.17';
const DOWNLOAD_URL = `https://dl.strem.io/server/${VERSION}/desktop/server.js`;

const OUT_FILE = path.join(__dirname, '..', 'server.js');
const VERSION_FILE = path.join(__dirname, '..', '.server-version');

async function main() {
  if (fs.existsSync(OUT_FILE) && fs.existsSync(VERSION_FILE)) {
    const have = fs.readFileSync(VERSION_FILE, 'utf8').trim();
    if (have === VERSION && fs.statSync(OUT_FILE).size > 0) {
      console.log(`server.js ${VERSION} already present, skipping download.`);
      return;
    }
  }

  console.log(`Downloading Stremio server.js ${VERSION} from ${DOWNLOAD_URL} ...`);
  const res = await fetch(DOWNLOAD_URL, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to download server.js: HTTP ${res.status} ${res.statusText}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) {
    throw new Error('Downloaded server.js is empty');
  }

  fs.writeFileSync(OUT_FILE, buf);
  fs.writeFileSync(VERSION_FILE, `${VERSION}\n`);
  console.log(`Wrote ${OUT_FILE} (${(buf.length / 1024 / 1024).toFixed(1)} MB), version ${VERSION}.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
