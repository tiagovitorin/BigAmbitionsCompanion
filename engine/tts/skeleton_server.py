import os
import io
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import torch
import torchaudio

app = FastAPI(title=Uncle Fred Local Voice Engine (RTX 3060))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[*],
    allow_credentials=True,
    allow_methods=[*],
    allow_headers=[*],
)

CLIPS_DIR = rC:\Users\tiago\Desktop\UncleFred_AudioClips
REFERENCE_CLIP = os.path.join(CLIPS_DIR, Quest_01_QuestRentYourApartment_QuestRentYourApartmentUncleFredAudio.wav)

DEVICE = cuda if torch.cuda.is_available() else cpu
GPU_NAME = torch.cuda.get_device_name(0) if torch.cuda.is_available() else CPU

class SpeakRequest(BaseModel):
    text: string = "
 language: str = en
 speed: float = 1.0

print(f[Uncle Fred Voice Engine] Running on {GPU_NAME} (Device: {DEVICE}))

@app.get(/health)
def health():
 return {
 status: online,
 device: GPU_NAME,
 cuda_available: torch.cuda.is_available(),
 clips_found: os.path.exists(CLIPS_DIR),
 reference_clip: os.path.basename(REFERENCE_CLIP) if os.path.exists(REFERENCE_CLIP) else None
 }

if __name__ == __main__:
 import uvicorn
 uvicorn.run(app, host=127.0.0.1, port=8020)
