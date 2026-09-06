import io
import re
import os
import modal

app = modal.App("unclefred-voice-engine")

# Function to download and bake weights directly into the image layer
def download_model_weights():
    import os
    from huggingface_hub import hf_hub_download
    repo = "tiagovito/unclefred-xtts-weights"
    token = os.environ.get("HF_TOKEN")
    print("Baking Uncle Fred weights into image build...")
    for f in ["best_model.pth", "config.json", "reference.wav", "vocab.json", "dvae.pth", "mel_stats.pth"]:
        hf_hub_download(repo_id=repo, filename=f, token=token, local_dir="/root/unclefred_model")
    print("All weights baked into container image!")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "ffmpeg")
    .pip_install(
        "torch==2.5.1",
        "torchaudio==2.5.1",
        "transformers==4.47.1",
        "coqui-tts==0.26.2",
        "huggingface_hub",
        "soundfile",
        "numpy",
        "fastapi",
        "pydantic"
    )
    .env({"COQUI_TOS_AGREED": "1"})
    .run_function(download_model_weights)
)

MODEL_DIR = "/root/unclefred_model"

@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
def health():
    return {
        "status": "online",
        "model": "Uncle Fred XTTS-v2 Cloud",
        "device": "NVIDIA T4 Serverless",
        "speakerReady": True
    }

@app.cls(
    gpu="T4",
    image=image,
    scaledown_window=180,
    timeout=300
)
class UncleFredTTS:
    @modal.enter()
    def load_model(self):
        import os
        import torch
        from TTS.tts.configs.xtts_config import XttsConfig
        from TTS.tts.models.xtts import Xtts

        checkpoint_path = os.path.join(MODEL_DIR, "best_model.pth")
        config_path = os.path.join(MODEL_DIR, "config.json")
        ref_path = os.path.join(MODEL_DIR, "reference.wav")

        print("Initializing pre-baked XTTS model on T4 GPU...")
        config = XttsConfig()
        config.load_json(config_path)
        self.model = Xtts.init_from_config(config)
        self.model.load_checkpoint(config, checkpoint_path=checkpoint_path, checkpoint_dir=MODEL_DIR, eval=True, use_deepspeed=False)
        self.model.cuda()

        print("Computing speaker conditioning latent...")
        self.gpt_cond_latent, self.speaker_embedding = self.model.get_conditioning_latents(audio_path=ref_path)
        print("Uncle Fred Cloud GPU ready!")

    @modal.fastapi_endpoint(method="POST")
    def speak(self, req: dict):
        import io
        import numpy as np
        import soundfile as sf
        from fastapi import HTTPException
        from fastapi.responses import Response

        text = (req.get("text") or "").strip()
        lang = (req.get("language") or "en").lower()
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        if lang.startswith("pt"):
            lang_code = "pt"
        elif lang.startswith("es"):
            lang_code = "es"
        elif lang.startswith("de"):
            lang_code = "de"
        elif lang.startswith("fr"):
            lang_code = "fr"
        else:
            lang_code = "en"

        raw_sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        curr = ""
        for s in raw_sentences:
            s = s.strip()
            if not s:
                continue
            if len(curr) + len(s) + 1 <= 220:
                curr = (curr + " " + s).strip()
            else:
                if curr:
                    chunks.append(curr)
                curr = s
        if curr:
            chunks.append(curr)
        if not chunks:
            chunks = [text[:220]]

        silence = np.zeros(int(24000 * 0.22), dtype=np.float32)
        segments = []

        for chunk in chunks:
            out = self.model.inference(
                text=chunk,
                language=lang_code,
                gpt_cond_latent=self.gpt_cond_latent,
                speaker_embedding=self.speaker_embedding,
                temperature=0.65,
                top_p=0.85,
                repetition_penalty=5.0,
                enable_text_splitting=False
            )
            segments.append(np.array(out["wav"], dtype=np.float32))
            segments.append(silence)

        full_audio = np.concatenate(segments) if len(segments) > 1 else segments[0]
        buf = io.BytesIO()
        sf.write(buf, full_audio, 24000, format="WAV")
        buf.seek(0)
        return Response(content=buf.read(), media_type="audio/wav")