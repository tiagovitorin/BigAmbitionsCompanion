// Generates the static telemetry the web app's Demo Mode shows, from the same
// deterministic world the local mock server serves (scripts/demo/generator.mjs).
//
// The web app runs this automatically before `next dev` and `next build`
// (predev/prebuild in web/package.json), so the demo always matches the generator.
// The output (web/public/demo/telemetry.json) is committed; regenerate it whenever the
// generator changes. It contains fictional in-game state only - NO real save data.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWorld, snapshot } from './generator.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..', '..');
const OUT_FILE = path.join(REPO_ROOT, 'public', 'demo', 'telemetry.json');
const CONTEXT_FILE = path.join(REPO_ROOT, 'src', 'context', 'LiveSyncContext.tsx');

// Keep the demo's reported mod version equal to what the web app expects, so Demo Mode
// never shows a version-mismatch banner.
function expectedModVersion() {
  try {
    const source = fs.readFileSync(CONTEXT_FILE, 'utf8');
    const match = source.match(/EXPECTED_MOD_VERSION\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const world = buildWorld();
// A fixed, mid-day snapshot: Demo Mode is frozen and never advances.
world.startHour = 14;
world.startMinute = 0;
const payload = snapshot(world, world.startReal);
payload.modVersion = expectedModVersion();
payload.isConnected = true;
payload.lastHeartbeat = new Date(0).toISOString();

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(payload));
const kb = Math.round(fs.statSync(OUT_FILE).size / 1024);
process.stdout.write(
  `[demo] wrote ${path.relative(REPO_ROOT, OUT_FILE).replace(/\\/g, '/')} - ` +
  `day ${payload.gameDay}, ${payload.businesses.length} sites, ${payload.employees.length} staff, ${kb} KB\n`
);
