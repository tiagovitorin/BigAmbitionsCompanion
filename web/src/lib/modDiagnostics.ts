// Client for the mod's on-demand diagnostics export endpoints.
// Flow: 1) POST-less GET ?export=diagnostics asks the mod to build a file on its main
// thread (no game interaction needed), 2) the web polls ?diagnostics=1 until the JSON
// is ready, 3) the returned text is attached to a bug report as mod-diagnostics.json.

export interface GenerateModDiagnosticsOptions {
  serverHost?: string;
  serverPort?: number;
  timeoutMs?: number;
  pollMs?: number;
}

export async function generateModDiagnostics(
  options: GenerateModDiagnosticsOptions = {}
): Promise<{ text: string; object: any }> {
  const { serverHost = '127.0.0.1', serverPort = 8765, timeoutMs = 15000, pollMs = 250 } = options;
  const base = `http://${serverHost}:${serverPort}`;

  const exportRes = await fetch(`${base}/?export=diagnostics`, { cache: 'no-store' });
  if (!exportRes.ok && exportRes.status !== 202) {
    throw new Error(`export-${exportRes.status}`);
  }

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await fetch(`${base}/?diagnostics=1`, { cache: 'no-store' });
    if (res.status === 200) {
      const text = await res.text();
      let object: any = {};
      try {
        object = JSON.parse(text);
      } catch {
        // keep partial object empty; text is still attached
      }
      return { text, object };
    }
    // Still building (404 + {"status":"pending"}): poll again shortly.
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  throw new Error('timeout');
}
