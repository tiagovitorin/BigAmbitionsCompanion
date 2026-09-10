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

const ALLOWED_EXTENSIONS = ['.hsg', '.meta', '.save', '.json', '.png', '.jpg', '.jpeg', '.txt', '.log', '.zip'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_FILES = 3;
// Discord webhook messages cap total uploads around 8MB. Keep user files within a
// safer 6MB so the embed, auto-attached telemetry snapshot, and logs still fit.
const MAX_WEBHOOK_TOTAL_BYTES = 6 * 1024 * 1024;

// Forum channels used by the bot for tagged posts (override via env if the channels change)
const BUG_REPORTS_FORUM_CHANNEL_ID = '1547372420774494208';
const SUGGESTIONS_FORUM_CHANNEL_ID = '1547372457415942215';

// Map report category (as sent by the form) to the forum tag name created in each channel.
const BUG_TAG_BY_CATEGORY: Record<string, string> = {
  'Live Sync Connection Issue': 'Connection Issue',
  'Incorrect In-Game Numbers / Telemetry': 'Wrong Numbers',
  'Mod Lag / Performance': 'Mod Lag / Perf',
  'Crash or Game Freezing': 'Crash / Freeze',
  'UI Bug or Visual Glitch': 'UI / Visual Bug',
  'Other Bug': 'Other Bug'
};

const SUGGESTION_TAG_BY_CATEGORY: Record<string, string> = {
  'New Feature / Tool': 'New Feature / Tool',
  'UI / UX Improvement': 'UI / UX Improve',
  'Game Data / Accuracy': 'Data / Accuracy',
  'Quality of Life': 'Quality of Life',
  'General Suggestion': 'General Feedback'
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const reportType = String(formData.get('reportType') || 'bug').toLowerCase();
    const isSuggestion = reportType === 'suggestion';

    // Delivery is bot + forum first; legacy webhook remains an optional fallback only if
    // a DISCORD_*_WEBHOOK_URL env var is still configured.
    const webhookUrl = isSuggestion
      ? process.env.DISCORD_SUGGESTIONS_WEBHOOK_URL
      : process.env.DISCORD_BUG_REPORT_WEBHOOK_URL;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const forumChannelId = isSuggestion
      ? process.env.DISCORD_SUGGESTIONS_FORUM_CHANNEL_ID || SUGGESTIONS_FORUM_CHANNEL_ID
      : process.env.DISCORD_BUG_REPORT_FORUM_CHANNEL_ID || BUG_REPORTS_FORUM_CHANNEL_ID;

    if (!botToken && !webhookUrl) {
      console.error('Neither DISCORD_BOT_TOKEN nor a Discord webhook URL is configured.');
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

    const totalBytes = validFiles.reduce((sum, f) => sum + f.file.size, 0);
    if (totalBytes > MAX_WEBHOOK_TOTAL_BYTES) {
      return NextResponse.json(
        {
          error:
            'Attachments are too large for the report channel (Discord limit ~8MB). For big saves, please zip them or upload to a file host and paste the link instead.'
        },
        { status: 400 }
      );
    }

    const telemetryFile = formData.get('telemetryFile');

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

    // Build Discord multipart request with content divider + payload_json + files.
    // Each report becomes its own thread: the webhook payload includes a thread_name so
    // Discord auto-creates a thread in the channel. If the channel/webhook cannot create
    // threads we fall back to a normal message so a report is never lost.
    const buildPayload = (withThread: boolean, isBot: boolean = false) => {
      const payload = new FormData();
      const payloadJson: any = {
        content: isSuggestion
          ? `──────────────────────────────────────────\n### New Suggestion \`#${reportId}\` [${category}]`
          : `──────────────────────────────────────────\n### New Bug Report \`#${reportId}\` [${category}]`,
        embeds
      };

      if (isSuggestion && !isBot) {
        payloadJson.username = 'BA Suggestions Bot';
      }

      if (withThread) {
        payloadJson.thread_name = `[${reportId}] ${category}`;
      }

      payload.append('payload_json', JSON.stringify(payloadJson));

      // Append files (Discord accepts files under file0, file1, file2, ...)
      let fileIndex = 0;
      for (let i = 0; i < validFiles.length; i++) {
        const { file, name } = validFiles[i];
        payload.append(`file${fileIndex++}`, file, name);
      }

      // Auto-attached telemetry snapshot (privacy-scrubbed JSON generated client-side)
      if (!isSuggestion && telemetryFile instanceof Blob && telemetryFile.size > 0 && telemetryFile.size <= 2 * 1024 * 1024) {
        payload.append(`file${fileIndex++}`, telemetryFile, 'telemetry-report.json');
      }

      // Attach technical logs ONLY for Bug Reports
      if (!isSuggestion && diagnostics.recentLogs && diagnostics.recentLogs.length > 0) {
        const logsText = diagnostics.recentLogs.map((l: any) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.tag}] ${l.message}`).join('\n');
        const logsBlob = new Blob([logsText], { type: 'text/plain' });
        payload.append(`file${fileIndex++}`, logsBlob, `logs-${reportId}.log`);
      }

      return payload;
    };

    // Legacy webhook fallback - only used when a webhook env var is configured.
    const sendViaWebhook = async (): Promise<boolean> => {
      if (!webhookUrl) return false;
      let res = await fetch(webhookUrl, { method: 'POST', body: buildPayload(true, false) });
      if (!res.ok) {
        // Thread creation unsupported (e.g. channel lacks thread permissions) - retry without a thread.
        res = await fetch(webhookUrl, { method: 'POST', body: buildPayload(false, false) });
      }
      return res.ok;
    };

    // Forum delivery: create a tagged forum post (used when forum channels are configured).
    const postViaForum = async (): Promise<boolean> => {
      try {
        const token = botToken;
        if (!token || !forumChannelId) return false;
        const threadName = `[${reportId}] ${category}`.slice(0, 100);

        const channelRes = await fetch(`https://discord.com/api/channels/${forumChannelId}`, {
          headers: { Authorization: `Bot ${token}` }
        });
        if (!channelRes.ok) return false;
        const channelInfo: any = await channelRes.json();
        const wantedTag = (isSuggestion ? SUGGESTION_TAG_BY_CATEGORY : BUG_TAG_BY_CATEGORY)[category];
        const availableTags: { id: string; name: string }[] = Array.isArray(channelInfo?.available_tags) ? channelInfo.available_tags : [];
        const matchedTag = wantedTag ? availableTags.find((tag) => tag.name.toLowerCase() === wantedTag.toLowerCase()) : undefined;

        const payload = new FormData();
        const payloadJson: any = {
          name: threadName,
          message: {
            content: isSuggestion
              ? `**New Suggestion \`#${reportId}\`**`
              : `**New Bug Report \`#${reportId}\`**`,
            embeds
          }
        };
        if (matchedTag) {
          payloadJson.applied_tags = [matchedTag.id];
        }

        payload.append('payload_json', JSON.stringify(payloadJson));

        let fileIndex = 0;
        for (let i = 0; i < validFiles.length; i++) {
          const { file, name } = validFiles[i];
          payload.append(`file${fileIndex++}`, file, name);
        }
        // Auto-attached telemetry snapshot (privacy-scrubbed JSON generated client-side)
        if (!isSuggestion && telemetryFile instanceof Blob && telemetryFile.size > 0 && telemetryFile.size <= 2 * 1024 * 1024) {
          payload.append(`file${fileIndex++}`, telemetryFile, 'telemetry-report.json');
        }
        // Attach technical logs ONLY for Bug Reports
        if (!isSuggestion && diagnostics.recentLogs && diagnostics.recentLogs.length > 0) {
          const logsText = diagnostics.recentLogs.map((l: any) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.tag}] ${l.message}`).join('\n');
          const logsBlob = new Blob([logsText], { type: 'text/plain' });
          payload.append(`file${fileIndex++}`, logsBlob, `logs-${reportId}.log`);
        }

        const res = await fetch(`https://discord.com/api/channels/${forumChannelId}/threads`, {
          method: 'POST',
          headers: { Authorization: `Bot ${token}` },
          body: payload
        });
        if (!res.ok) {
          console.warn('Discord forum post failed:', res.status);
          return false;
        }
        return true;
      } catch (err) {
        console.error('Discord forum delivery failed:', err);
        return false;
      }
    };

    let delivered = false;
    if (botToken && forumChannelId) {
      delivered = await postViaForum();
    }
    if (!delivered) {
      delivered = await sendViaWebhook();
    }

    if (!delivered) {
      return NextResponse.json({ error: 'Failed to deliver bug report to Discord.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, reportId });
  } catch (err: any) {
    console.error('Unhandled bug report error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred while submitting.' }, { status: 500 });
  }
}
