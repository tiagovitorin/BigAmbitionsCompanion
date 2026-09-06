import os
import io
import time
import tempfile
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import torch
import soundfile as sf
import numpy as np

os.environ['COQUI_TOS_AGREED'] = '1'
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

app = FastAPI(title='Uncle Fred Voice Engine (RTX 3060 Fine-Tuned)')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

RUN_DIR = r'C:\Users\tiago\Desktop\CODING PROJECTS\BigAmbitionsTool\engine\training\checkpoints\UncleFred_XTTS_FT-September-06-2026_03+21PM-0000000'
CHECKPOINT_PATH = os.path.join(RUN_DIR, 'best_model.pth')
BASE_DIR = r'C:\Users\tiago\AppData\Local\tts\tts_models--multilingual--multi-dataset--xtts_v2'
CLIPS_DIR = r'C:\Users\tiago\Desktop\UncleFred_AudioClips'
PRIMARY_REF = os.path.join(CLIPS_DIR, 'Quest_01_QuestRentYourApartment_QuestRentYourApartmentUncleFredAudio.wav')

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
GPU_NAME = torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'

print('=' * 65)
print(f'[Uncle Fred Voice Engine] Loading fine-tuned weights on {GPU_NAME}...')
print('=' * 65)

config = XttsConfig()
if os.path.exists(os.path.join(RUN_DIR, 'config.json')):
    config.load_json(os.path.join(RUN_DIR, 'config.json'))
else:
    config.load_json(os.path.join(BASE_DIR, 'config.json'))

model = Xtts.init_from_config(config)
if os.path.exists(CHECKPOINT_PATH):
    print(f'[Uncle Fred Voice Engine] Loading best fine-tuned checkpoint: {CHECKPOINT_PATH}')
    model.load_checkpoint(config, checkpoint_path=CHECKPOINT_PATH, checkpoint_dir=BASE_DIR, eval=True, use_deepspeed=False)
else:
    print(f'[Uncle Fred Voice Engine] Fine-tuned checkpoint not found, loading base model from {BASE_DIR}')
    model.load_checkpoint(config, checkpoint_dir=BASE_DIR, eval=True, use_deepspeed=False)

if torch.cuda.is_available():
    model.cuda()

# Precompute and cache Uncle Fred's voice conditioning latent
gpt_cond_latent = None
speaker_embedding = None
if os.path.exists(PRIMARY_REF):
    print(f'[Uncle Fred Voice Engine] Precomputing Uncle Fred speaker conditioning latents...')
    gpt_cond_latent, speaker_embedding = model.get_conditioning_latents(audio_path=PRIMARY_REF)
    print(f'[Uncle Fred Voice Engine] Speaker conditioning ready!')
else:
    print(f'[Uncle Fred Voice Engine] Warning: Primary reference clip not found at {PRIMARY_REF}')

print(f'[Uncle Fred Voice Engine] Server fully initialized and listening on http://127.0.0.1:8020')

class SpeakRequest(BaseModel):
    text: str
    language: str = 'en'
    speed: float = 1.0

@app.get('/health')
def health():
    return {
        'status': 'online',
        'device': GPU_NAME,
        'cuda_available': torch.cuda.is_available(),
        'model': 'XTTS-v2 Fine-Tuned (RTX 3060 12GB)',
        'checkpoint_loaded': os.path.exists(CHECKPOINT_PATH),
        'clips_available': os.path.exists(CLIPS_DIR),
        'speaker_ready': gpt_cond_latent is not None
    }

def split_into_sentence_chunks(text: str, max_chars: int = 220):
    import re
    # Split text cleanly on sentence boundaries (. ! ?)
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
            # If a single sentence is longer than max_chars, split on commas or clauses
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

@app.post('/api/speak')
def speak(req: SpeakRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail='Text cannot be empty.')
    
    if gpt_cond_latent is None or speaker_embedding is None:
        raise HTTPException(status_code=500, detail='Speaker latents not initialized.')
    
    t0 = time.time()
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
        
        # Write to in-memory WAV buffer
        buf = io.BytesIO()
        sf.write(buf, full_audio, 24000, format='WAV')
        buf.seek(0)
        audio_bytes = buf.read()

        dur = round(time.time() - t0, 2)
        print(f'[Synthesized] \"{text[:45]}...\" ({len(chunks)} chunks, {lang_code}) in {dur}s')

        return Response(content=audio_bytes, media_type='audio/wav')
    except Exception as e:
        print(f'[Error Synthesizing] {e}')
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8020)