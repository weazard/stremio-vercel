'use strict';

// Minimal human-facing landing page served at `/`. All other paths are
// proxied to the Stremio streaming server.

const VERSION = (() => {
  try {
    return require('fs')
      .readFileSync(require('path').join(__dirname, '..', '.server-version'), 'utf8')
      .trim();
  } catch (_) {
    return 'v4.20.17';
  }
})();

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Stremio Service on Vercel</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:#0b0b16; color:#e6e6f0; display:flex; min-height:100vh; align-items:center; justify-content:center; }
  main { max-width:640px; padding:2.5rem; }
  h1 { font-size:1.8rem; margin:0 0 .5rem; }
  .badge { display:inline-block; background:#7b5bf5; color:#fff; border-radius:999px;
    padding:.15rem .7rem; font-size:.8rem; margin-bottom:1rem; }
  a { color:#9b86ff; }
  code { background:#1c1c2e; padding:.15rem .4rem; border-radius:4px; font-size:.9em; }
  ul { line-height:1.7; }
  .note { margin-top:1.5rem; padding:1rem; background:#16162a; border-left:3px solid #7b5bf5; border-radius:6px; font-size:.92rem; }
</style>
</head>
<body>
<main>
  <span class="badge">Stremio Streaming Server ${VERSION}</span>
  <h1>Stremio Service &mdash; Vercel deployment</h1>
  <p>This deployment runs the Stremio streaming server (<code>server.js</code>) as a
  Vercel serverless function. Point a Stremio client at this origin to use it as a
  streaming server.</p>
  <ul>
    <li>Health: <a href="/__health">/__health</a></li>
    <li>Settings: <a href="/settings">/settings</a></li>
    <li>Open Stremio Web: <a href="https://web.stremio.com" target="_blank" rel="noopener">web.stremio.com</a></li>
  </ul>
  <p>In Stremio Web, set the streaming server URL to this deployment&rsquo;s URL under
  <em>Settings &rarr; Streaming server</em>.</p>
  <div class="note">
    <strong>Serverless limitations:</strong> Vercel functions are stateless and
    short-lived, and this image ships without <code>ffmpeg</code>/<code>ffprobe</code>.
    API endpoints (settings, manifest, metadata) work, but long-running torrent
    downloads, on-the-fly transcoding (HLS), and persistent caching do not survive
    between invocations. For full streaming, run the desktop service or a long-lived
    host. See <code>vercel/README.md</code>.
  </div>
</main>
</body>
</html>`;

module.exports = { HTML, VERSION };
