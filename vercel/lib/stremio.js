'use strict';

// Boots the bundled Stremio streaming server (server.js) as a child process
// and keeps a single instance alive for the lifetime of a warm serverless
// container. Callers await `ensureServer()` to get the local port to proxy to.

const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const INTERNAL_HOST = '127.0.0.1';
const INTERNAL_PORT = Number(process.env.STREMIO_INTERNAL_PORT || 11470);
// On Vercel only /tmp is writable.
const DATA_DIR = process.env.STREMIO_DATA_DIR || '/tmp/stremio';
const READY_TIMEOUT_MS = Number(process.env.STREMIO_READY_TIMEOUT_MS || 25000);

function serverEntryPath() {
  const candidates = [
    path.join(process.cwd(), 'server.js'),
    path.join(__dirname, '..', 'server.js'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    'server.js not found. Run `node scripts/fetch-server.js` during the build.'
  );
}

function checkReady() {
  return new Promise((resolve) => {
    const req = http.get(
      { host: INTERNAL_HOST, port: INTERNAL_PORT, path: '/settings', timeout: 1500 },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitUntilReady() {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await checkReady()) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('Stremio server did not become ready in time');
}

function spawnServer() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const env = {
    ...process.env,
    PORT: String(INTERNAL_PORT),
    HOME: DATA_DIR,
    APP_PATH: DATA_DIR,
    // Serverless containers have no usable TLS cert store / fixed hostname,
    // and we terminate HTTPS at the Vercel edge already.
    NO_HTTPS_SERVER: '1',
    // The Vercel edge handles CORS; let the upstream be permissive too.
    NO_CORS: '1',
    // Avoid scanning network interfaces / mDNS casting in a sandbox.
    NO_NETWORK_INTERFACES: '1',
    CASTING_DISABLED: '1',
  };

  const child = spawn(process.execPath, [serverEntryPath()], {
    env,
    cwd: DATA_DIR,
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  child.on('exit', (code, signal) => {
    console.error(`Stremio server exited (code=${code}, signal=${signal})`);
    // Allow a fresh boot on the next request within this container.
    if (globalThis.__stremioServer && globalThis.__stremioServer.child === child) {
      globalThis.__stremioServer = null;
    }
  });

  return child;
}

function ensureServer() {
  if (globalThis.__stremioServer && globalThis.__stremioServer.ready) {
    return globalThis.__stremioServer.ready;
  }

  const child = spawnServer();
  const ready = waitUntilReady().then(() => ({
    host: INTERNAL_HOST,
    port: INTERNAL_PORT,
  }));

  globalThis.__stremioServer = { child, ready };
  return ready;
}

module.exports = { ensureServer, INTERNAL_HOST, INTERNAL_PORT };
