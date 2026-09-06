import os
import time
import soundfile as sf
import numpy as np
os.environ['COQUI_TOS_AGREED'] = '1'
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

RUN_DIR = r'C:\Users\tiago\Desktop\CODING PROJECTS\BigAmbitionsTool\engine\training\checkpoints\UncleFred_XTTS_FT-September-06-2026_03+21PM-0000000'
CHECKPOINT_PATH = os.path.join(RUN_DIR, 'best_model.pth')
BASE_DIR = r'C:\Users\tiago\AppData\Local\tts\tts_models--multilingual--multi-dataset--xtts_v2'
CLIPS_DIR = r'C:\Users\tiago\Desktop\UncleFred_AudioClips'
REF_WAV = os.path.join(CLIPS_DIR, 'Quest_01_QuestRentYourApartment_QuestRentYourApartmentUncleFredAudio.wav')

print('Loading fine-tuned Uncle Fred model into RTX 3060 VRAM...')
config = XttsConfig()
config.load_json(os.path.join(RUN_DIR, 'config.json'))
model = Xtts.init_from_config(config)
model.load_checkpoint(config, checkpoint_path=CHECKPOINT_PATH, checkpoint_dir=BASE_DIR, eval=True, use_deepspeed=False)
model.cuda()

print('Caching conditioning latents...')
gpt_cond_latent, speaker_embedding = model.get_conditioning_latents(audio_path=REF_WAV)

# Split sentences cleanly in Python so spacy is not needed
sentences = [
    "Look kid, you've got thirty-four grand in cash and you're pulling in almost one hundred and fifty grand a week from Ambition Mart and Burger Haven.",
    "You're in prime shape to expand!",
    "Murray Hill is begging for a nice Coffee Shop or a Florist, and it'll only run you about eighteen grand to get the doors open.",
    "You can pull the trigger tomorrow!",
    "Just keep an eye on that fifteen grand tax bill coming up on Sunday so you don't get caught with your pants down."
]

print('Synthesizing audio on RTX 3060...')
t0 = time.time()
audio_chunks = []
silence = np.zeros(int(24000 * 0.25), dtype=np.float32) # 250ms natural breathing pause

for idx, sentence in enumerate(sentences):
    print(f'  Synthesizing chunk [{idx+1}/{len(sentences)}]: \"{sentence[:40]}...\"')
    out = model.inference(
        text=sentence,
        language='en',
        gpt_cond_latent=gpt_cond_latent,
        speaker_embedding=speaker_embedding,
        temperature=0.65,
        top_p=0.85,
        repetition_penalty=5.0,
        enable_text_splitting=False
    )
    audio_chunks.append(np.array(out['wav'], dtype=np.float32))
    audio_chunks.append(silence)

full_audio = np.concatenate(audio_chunks)
out_file = r'engine\training\uncle_fred_expansion_advice.wav'
sf.write(out_file, full_audio, 24000)
dur = round(time.time() - t0, 2)
print(f'SUCCESS! Audio synthesized in {dur}s and saved to: {out_file}')

try:
    import winsound
    winsound.PlaySound(out_file, winsound.SND_FILENAME | winsound.SND_ASYNC)
    print('Playing audio through your speakers right now!')
except Exception as e:
    print('Winsound error:', e)