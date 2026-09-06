import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODAL_SPEAK_URL = process.env.UNCLE_FRED_MODAL_SPEAK_URL || 'https://tiagovitorinop--unclefred-voice-engine-unclefredtts-speak.modal.run';
const MODAL_HEALTH_URL = process.env.UNCLE_FRED_MODAL_HEALTH_URL || 'https://tiagovitorinop--unclefred-voice-engine-health.modal.run';
const LOCAL_TTS_URL = process.env.UNCLE_FRED_LOCAL_TTS_URL || 'http://127.0.0.1:8020';

export async function GET() {
  // 1. Try Modal Serverless Health Endpoint
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(MODAL_HEALTH_URL, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        online: true,
        model: data.model || 'Uncle Fred XTTS-v2 Cloud',
        device: data.device || 'NVIDIA T4 Serverless',
        speakerReady: true
      });
    }
  } catch (_) {}

  // 2. Fallback to Local Port 8020 if running locally
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${LOCAL_TTS_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        online: true,
        model: data.model || 'XTTS-v2 Local',
        device: data.device || 'Local GPU',
        speakerReady: true
      });
    }
  } catch (_) {}

  return NextResponse.json({
    online: false,
    model: 'None',
    device: 'Offline',
    speakerReady: false
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = (body.text || '').trim();
    const language = body.language || 'en';

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 1. Primary: Stream speech directly from Modal Serverless GPU
    try {
      const modalRes = await fetch(MODAL_SPEAK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language
        }),
      });

      if (modalRes.ok) {
        const audioBuffer = await modalRes.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=86400, immutable',
          },
        });
      }
    } catch (_) {}

    // 2. Fallback: Local port 8020 if testing on dev machine
    try {
      const localRes = await fetch(`${LOCAL_TTS_URL}/api/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language
        }),
      });

      if (localRes.ok) {
        const audioBuffer = await localRes.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=86400, immutable',
          },
        });
      }
    } catch (_) {}

    return NextResponse.json(
      { error: 'Voice synthesis service unreachable' },
      { status: 503 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}