import os
import io
import re
import tempfile
import torch
import soundfile as sf
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

os.environ['COQUI_TOS_AGREED'] = '1'
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

app = FastAPI(title='Uncle Fred XTTS-v2 Cloud Engine')

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

# Path configurations
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
CHECKPOINT_PATH = os.path.join(MODEL_DIR, 'best_model.pth')
CONFIG_PATH = os.path.join(MODEL_DIR, 'config.json')
REF_AUDIO = os.path.join(MODEL_DIR, 'reference.wav')

print(f'Loading model on {DEVICE}...')
config = XttsConfig()
config.load_json(CONFIG_PATH)
model = Xtts.init_from_config(config)
model.load_checkpoint(config, checkpoint_path=CHECKPOINT_PATH, eval=True, use_deepspeed=False)

if torch.cuda.is_available():
    model.cuda()

# Compute reference latent once on startup
print('Precomputing speaker latent...')
gpt_cond_latent, speaker_embedding = model.get_conditioning_latents(audio_path=REF_AUDIO)
print('Uncle Fred Cloud Engine ready!')

class SpeakRequest(BaseModel):
    text: str
    language: str = 'en'
    speed: float = 1.0

def split_into_sentence_chunks(text: str, max_chars: int = 220):
    raw_sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    chunks = []
    current = ''
    for s in raw_sentences:
        s = s.strip()
        if not s:
            continue
        if len(current) + len(s) + 1 <= max_chars:
            current = (current + ' ' + s).strip()
        else:
            if current:
                chunks.append(current)
            if len(s) > max_chars:
                clauses = re.split(r'(?<=[,;:])\s+', s)
                sub = ''
                for c in clauses:
                    if len(sub) + len(c) + 1 <= max_chars:
                        sub = (sub + ' ' + c).strip()
                    else:
                        if sub:
                            chunks.append(sub)
                        sub = c
                if sub:
                    chunks.append(sub)
                current = ''
            else:
                current = s
    if current:
        chunks.append(current)
    return chunks or [text[:max_chars]]

@app.get('/')
@app.get('/health')
def health():
    return {
        'status': 'online',
        'device': DEVICE,
        'model': 'Uncle Fred Fine-Tuned XTTS-v2'
    }

@app.post('/api/speak')
def speak(req: SpeakRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail='Text cannot be empty.')
    
    try:
        lang = req.language.lower()
        if lang.startswith('pt'):
            lang_code = 'pt'
        elif lang.startswith('es'):
            lang_code = 'es'
        elif lang.startswith('de'):
            lang_code = 'de'
        elif lang.startswith('fr'):
            lang_code = 'fr'
        elif lang.startswith('it'):
            lang_code = 'it'
        elif lang.startswith('nl'):
            lang_code = 'nl'
        elif lang.startswith('pl'):
            lang_code = 'pl'
        elif lang.startswith('ru'):
            lang_code = 'ru'
        elif lang.startswith('zh'):
            lang_code = 'zh-cn'
        elif lang.startswith('ja'):
            lang_code = 'ja'
        elif lang.startswith('ko'):
            lang_code = 'ko'
        else:
            lang_code = 'en'

        chunks = split_into_sentence_chunks(text)
        silence = np.zeros(int(24000 * 0.22), dtype=np.float32)
        audio_segments = []

        for chunk in chunks:
            out = model.inference(
                text=chunk,
                language=lang_code,
                gpt_cond_latent=gpt_cond_latent,
                speaker_embedding=speaker_embedding,
                temperature=0.65,
                top_p=0.85,
                repetition_penalty=5.0,
                enable_text_splitting=False
            )
            audio_segments.append(np.array(out['wav'], dtype=np.float32))
            audio_segments.append(silence)

        full_audio = np.concatenate(audio_segments) if len(audio_segments) > 1 else audio_segments[0]
        
        buf = io.BytesIO()
        sf.write(buf, full_audio, 24000, format='WAV')
        buf.seek(0)
        return Response(content=buf.read(), media_type='audio/wav')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))