import { NextRequest, NextResponse } from 'next/server';

// IP-based in-memory sliding window rate limiter (max 4 submissions per 10 minutes per IP)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 4;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, validTimestamps);
    return true;
  }
  
  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

const ALLOWED_EXTENSIONS = ['.hsg', '.meta', '.save', '.json', '.png', '.jpg', '.jpeg', '.txt', '.log'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_FILES = 3;

export async function POST(req: NextRequest) {
  try {
    const webhookUrl = process.env.DISCORD_BUG_REPORT_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('DISCORD_BUG_REPORT_WEBHOOK_URL is not configured.');
      return NextResponse.json(
        { error: 'Bug reporting system is temporarily misconfigured. Please contact support on Discord or Steam.' },
        { status: 503 }
      );
    }

    // Rate limiting check
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'You have submitted too many bug reports recently. Please wait a few minutes before submitting again.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();

    // Honeypot check for bots
    const honeypot = formData.get('website');
    if (honeypot) {
      // Return fake success so bots do not learn they were trapped
      return NextResponse.json({ ok: true });
    }

    const category = String(formData.get('category') || 'Other');
    const contact = String(formData.get('contact') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const stepsToReproduce = String(formData.get('stepsToReproduce') || '').trim();
    const diagnosticsRaw = String(formData.get('diagnostics') || '{}');

    if (!description) {
      return NextResponse.json({ error: 'Bug description is required.' }, { status: 400 });
    }

    let diagnostics: any = {};
    try {
      diagnostics = JSON.parse(diagnosticsRaw);
    } catch {
      diagnostics = { raw: diagnosticsRaw.slice(0, 500) };
    }

    // Inspect and sanitize files
    const incomingFiles = formData.getAll('files') as File[];
    const validFiles: { file: Blob; name: string }[] = [];

    for (const f of incomingFiles) {
      if (!(f instanceof File) || f.size === 0) continue;

      if (f.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File "${f.name}" exceeds the 15MB limit.` }, { status: 400 });
      }

      // 1. Sanitize file name: strip directory traversal, control characters, and keep only safe characters
      const sanitizedBaseName = f.name
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\.\./g, '_')
        .replace(/[\x00-\x1f\x80-\x9f]/g, '')
        .trim();

      const ext = '.' + (sanitizedBaseName.split('.').pop() || '').toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ error: `File extension "${ext}" is not permitted.` }, { status: 400 });
      }

      // 2. Binary inspection of initial bytes (non-aggressive, targeted safety check):
      // Reads first 16 bytes to detect Windows / DOS / ELF / Mach-O executables masquerading as saves or images.
      const buffer = Buffer.from(await f.slice(0, 16).arrayBuffer());
      if (buffer.length >= 2) {
        // 'MZ' (0x4D, 0x5A) -> Windows / DOS executable (.exe, .dll, .scr)
        if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
          return NextResponse.json(
            { error: `Attachment "${sanitizedBaseName}" was recognized as an executable file and cannot be uploaded.` },
            { status: 400 }
          );
        }
        // ELF header (0x7F, 'E', 'L', 'F') -> Linux executable
        if (buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
          return NextResponse.json(
            { error: `Attachment "${sanitizedBaseName}" was recognized as a binary executable and cannot be uploaded.` },
            { status: 400 }
          );
        }
      }

      validFiles.push({ file: f, name: sanitizedBaseName });
    }

    if (validFiles.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum of ${MAX_FILES} attachments allowed.` }, { status: 400 });
    }

    // Generate short report ID
    const reportId = 'BA-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Prepare Discord message payload
    // Discord Embed Colors: Red = Crash/Connection, Amber = Data/UI, Emerald = Other
    let embedColor = 0x10B981; // emerald
    if (category.toLowerCase().includes('crash')) embedColor = 0xEF4444; // red
    else if (category.toLowerCase().includes('connection')) embedColor = 0xF97316; // orange
    else if (category.toLowerCase().includes('data')) embedColor = 0xF59E0B; // amber
    else if (category.toLowerCase().includes('ui')) embedColor = 0x3B82F6; // blue

    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: 'Category', value: category, inline: true },
      { name: 'Report ID', value: `\`${reportId}\``, inline: true },
    ];

    if (contact) {
      fields.push({
        name: 'Reporter / Contact',
        value: `\`${contact.slice(0, 100)}\``,
        inline: true
      });
    }

    if (diagnostics.connectionStatus) {
      const cs = diagnostics.connectionStatus;
      fields.push({
        name: 'Mod Connection',
        value: `Connected: **${cs.isConnected ? 'YES' : 'NO'}** | City: **${cs.isCityLoaded ? 'Loaded' : 'No'}**\nMod Version: \`${cs.modVersion || 'Unknown'}\` (Expected: \`${cs.expectedModVersion}\`)\nLatency: \`${cs.lastLatencyMs ?? 'N/A'}ms\`${cs.permissionError ? `\nError: *${cs.permissionError}*` : ''}`,
        inline: false
      });
    }

    if (diagnostics.gameSnapshot) {
      const gs = diagnostics.gameSnapshot;
      const fmtCurrency = (val: number) => (val < 0 ? `-$${Math.abs(val).toLocaleString()}` : `$${val.toLocaleString()}`);
      fields.push({
        name: `Game Snapshot (${gs.source})`,
        value: `Day: **${gs.gameDay || 1}** | Cash: **${fmtCurrency(gs.playerCash || 0)}**\nNet Worth: **${fmtCurrency(gs.netWorth || 0)}** | Stores: **${gs.businessCount}** | Staff: **${gs.employeeCount}**`,
        inline: false
      });
    }

    if (stepsToReproduce) {
      fields.push({
        name: 'Steps to Reproduce',
        value: stepsToReproduce.length > 1000 ? stepsToReproduce.slice(0, 1000) + '...' : stepsToReproduce,
        inline: false
      });
    }

    if (diagnostics.appInfo) {
      const ai = diagnostics.appInfo;
      const hwStr = [
        ai.deviceMemoryGb ? `~${ai.deviceMemoryGb}GB RAM` : null,
        ai.cpuCores ? `${ai.cpuCores} CPU Cores` : null,
        ai.gpuRenderer ? `GPU: ${ai.gpuRenderer}` : null,
      ].filter(Boolean).join(' • ');

      fields.push({
        name: 'Environment & Client',
        value: `System: **${ai.browser || 'Unknown Browser'}** on **${ai.os || 'Unknown OS'}**\nTheme: \`${ai.theme || 'Light'}\` | Network: \`${ai.isOnline !== false ? 'Online' : 'Offline'}\`${hwStr ? `\nHardware: \`${hwStr}\`` : ''}\nPage: \`${ai.page || '/'}\` | Screen: \`${ai.viewport?.width}x${ai.viewport?.height}\``,
        inline: false
      });
    }

    const embeds = [
      {
        title: `━━━━━━━━━━━━━━━━━━━━━\nBug Report: ${category} [${reportId}]`,
        description: `**User Description:**\n${description.length > 2000 ? description.slice(0, 1990) + '...' : description}`,
        color: embedColor,
        fields,
        footer: {
          text: `Big Ambitions Companion | ID: ${reportId} | Submitted at ${new Date().toISOString()}`
        }
      }
    ];

    // Build Discord multipart request with content divider + payload_json + files
    const discordPayload = new FormData();
    discordPayload.append(
      'payload_json',
      JSON.stringify({
        content: `──────────────────────────────────────────\n### New Bug Report \`#${reportId}\` [${category}]`,
        embeds
      })
    );

    // Append files (Discord accepts files under file0, file1, file2)
    for (let i = 0; i < validFiles.length; i++) {
      const { file, name } = validFiles[i];
      discordPayload.append(`file${i}`, file, name);
    }

    // Also attach diagnostics JSON as a file if recentLogs or full details exist
    if (diagnostics.recentLogs && diagnostics.recentLogs.length > 0) {
      const logsText = diagnostics.recentLogs.map((l: any) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.tag}] ${l.message}`).join('\n');
      const logsBlob = new Blob([logsText], { type: 'text/plain' });
      discordPayload.append(`file${validFiles.length}`, logsBlob, `logs-${reportId}.log`);
    }

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      body: discordPayload,
    });

    if (!discordRes.ok) {
      const errorText = await discordRes.text();
      console.error('Discord webhook failed:', discordRes.status, errorText);
      return NextResponse.json({ error: 'Failed to deliver bug report to Discord.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, reportId });
  } catch (err: any) {
    console.error('Unhandled bug report error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred while submitting.' }, { status: 500 });
  }
}
