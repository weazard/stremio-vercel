#!/usr/bin/env node
// Local dev server that mimics the Vercel rewrite (everything -> the function),
// so you can exercise the handler without deploying. Run via `npm run dev`.

'use strict';

const http = require('http');
const handler = require('../api/server');

const PORT = Number(process.env.PORT || 3000);

http
  .createServer((req, res) => handler(req, res))
  .listen(PORT, () => {
    console.log(`Stremio Vercel app (dev) listening on http://127.0.0.1:${PORT}`);
  });
