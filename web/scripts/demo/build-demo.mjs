// Generates the static telemetry the web app's Demo Mode shows, from the same
// deterministic world the local mock server serves (scripts/demo/simulationEngine.mjs).
//
// The web app runs this automatically before `next dev` and `next build`
// (predev/prebuild in web/package.json), so the demo always matches the generator.
// The output (web/public/demo/telemetry.json) is committed; regenerate it whenever the
// generator changes. It contains fictional in-game state only - NO real save data.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BigAmbitionsSimulation, MOD_VERSION, START_DAY } from './simulationEngine.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..', '..');
const DEMO_DIR = path.join(REPO_ROOT, 'public', 'demo');

fs.mkdirSync(DEMO_DIR, { recursive: true });

const sim = new BigAmbitionsSimulation();
const cycleSnapshots = [];

for (let day = START_DAY; day <= START_DAY + 5; day++) {
  const payload = sim.generateTelemetrySnapshot(day, 0, 0);
  payload.modVersion = MOD_VERSION;
  payload.isConnected = true;
  payload.lastHeartbeat = new Date(0).toISOString();

  cycleSnapshots.push(payload);

  // Day 95 is the main telemetry.json for backward compatibility
  if (day === START_DAY) {
    const mainFile = path.join(DEMO_DIR, 'telemetry.json');
    fs.writeFileSync(mainFile, JSON.stringify(payload));
  }
}

// Write the complete cycle array for client-side interval cycling
const cycleFile = path.join(DEMO_DIR, 'telemetry-cycle.json');
fs.writeFileSync(cycleFile, JSON.stringify(cycleSnapshots));

const mainFile = path.join(DEMO_DIR, 'telemetry.json');
const kb = Math.round(fs.statSync(mainFile).size / 1024);
const cycleKb = Math.round(fs.statSync(cycleFile).size / 1024);
process.stdout.write(
  `[demo] wrote ${path.relative(REPO_ROOT, mainFile).replace(/\\/g, '/')} (${kb} KB) and ` +
  `telemetry-cycle.json (${cycleKb} KB, 6 days: ${START_DAY}..${START_DAY + 5})\n`
);

