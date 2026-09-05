import { NextRequest, NextResponse } from 'next/server';

// IP-based in-memory sliding window rate limiter (max 4 submissions per 10 minutes per IP)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 4;
let lastPruneTime = Date.now();

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Periodic pruning of stale IPs every 5 minutes to prevent memory leak
  if (now - lastPruneTime > 5 * 60 * 1000) {
    lastPruneTime = now;
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const active = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, active);
      }
    }
  }

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

// Default fallback suggestion webhook URL if not provided via env var
const DEFAULT_SUGGESTIONS_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1545861691999264851/uzjdvC3NwPA42E0CQxfvz363ZSS0SOFKfqb-z44x_cgkCLt-wXnDH9_emhCIK1QaFPkO';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const reportType = String(formData.get('reportType') || 'bug').toLowerCase();
    const isSuggestion = reportType === 'suggestion';

    const webhookUrl = isSuggestion
      ? process.env.DISCORD_SUGGESTIONS_WEBHOOK_URL || DEFAULT_SUGGESTIONS_WEBHOOK_URL
      : process.env.DISCORD_BUG_REPORT_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error(`${isSuggestion ? 'DISCORD_SUGGESTIONS_WEBHOOK_URL' : 'DISCORD_BUG_REPORT_WEBHOOK_URL'} is not configured.`);
      return NextResponse.json(
        { error: `${isSuggestion ? 'Suggestions' : 'Bug reporting'} system is temporarily misconfigured. Please contact support on Discord or Steam.` },
        { status: 503 }
      );
    }

    // Rate limiting check
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'You have submitted too many requests recently. Please wait a few minutes before submitting again.' },
        { status: 429 }
      );
    }

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
    const idPrefix = isSuggestion ? 'SUGG-' : 'BA-';
    const reportId = idPrefix + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Prepare Discord message payload
    // Discord Embed Colors: Purple/Amber for Suggestions, Red/Orange/Amber/Blue/Emerald for Bugs
    let embedColor = isSuggestion ? 0x8B5CF6 : 0x10B981; // purple or emerald
    if (!isSuggestion) {
      if (category.toLowerCase().includes('crash')) embedColor = 0xEF4444; // red
      else if (category.toLowerCase().includes('connection')) embedColor = 0xF97316; // orange
      else if (category.toLowerCase().includes('data')) embedColor = 0xF59E0B; // amber
      else if (category.toLowerCase().includes('ui')) embedColor = 0x3B82F6; // blue
    } else {
      if (category.toLowerCase().includes('feature') || category.toLowerCase().includes('tool')) embedColor = 0x8B5CF6; // violet
      else if (category.toLowerCase().includes('ui') || category.toLowerCase().includes('quality')) embedColor = 0x06B6D4; // cyan
      else embedColor = 0xF59E0B; // amber
    }

    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: 'Category', value: category, inline: true },
      { name: isSuggestion ? 'Suggestion ID' : 'Report ID', value: `\`${reportId}\``, inline: true },
    ];

    if (contact) {
      fields.push({
        name: 'Submitted By / Contact',
        value: `\`${contact.slice(0, 100)}\``,
        inline: true
      });
    }

    // Only attach mod telemetry and hardware diagnostics for Bug Reports, NOT suggestions
    if (!isSuggestion) {
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
    }

    if (stepsToReproduce) {
      fields.push({
        name: isSuggestion ? 'Additional Context / Why this helps' : 'Steps to Reproduce',
        value: stepsToReproduce.length > 1000 ? stepsToReproduce.slice(0, 1000) + '...' : stepsToReproduce,
        inline: false
      });
    }

    if (!isSuggestion && diagnostics.appInfo) {
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

    const reportHeaderTitle = isSuggestion ? 'Feature Suggestion' : 'Bug Report';
    const descriptionLabel = isSuggestion ? 'Suggestion / Idea' : 'User Description';

    const embeds = [
      {
        title: `━━━━━━━━━━━━━━━━━━━━━\n${reportHeaderTitle}: ${category} [${reportId}]`,
        description: `**${descriptionLabel}:**\n${description.length > 2000 ? description.slice(0, 1990) + '...' : description}`,
        color: embedColor,
        fields,
        footer: {
          text: `Big Ambitions Companion | ID: ${reportId} | Submitted at ${new Date().toISOString()}`
        }
      }
    ];

    // Build Discord multipart request with content divider + payload_json + files
    const discordPayload = new FormData();
    const discordPayloadJson: any = {
      content: isSuggestion
        ? `──────────────────────────────────────────\n### New Suggestion \`#${reportId}\` [${category}]`
        : `──────────────────────────────────────────\n### New Bug Report \`#${reportId}\` [${category}]`,
      embeds
    };

    if (isSuggestion) {
      discordPayloadJson.username = 'BA Suggestions Bot';
    }

    discordPayload.append('payload_json', JSON.stringify(discordPayloadJson));

    // Append files (Discord accepts files under file0, file1, file2)
    for (let i = 0; i < validFiles.length; i++) {
      const { file, name } = validFiles[i];
      discordPayload.append(`file${i}`, file, name);
    }

    // Attach technical logs ONLY for Bug Reports
    if (!isSuggestion && diagnostics.recentLogs && diagnostics.recentLogs.length > 0) {
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
