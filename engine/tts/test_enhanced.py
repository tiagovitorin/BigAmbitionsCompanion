import os
import time
import torch
import soundfile as sf
os.environ['COQUI_TOS_AGREED'] = '1'
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

clips_dir = r'C:\Users\tiago\Desktop\UncleFred_AudioClips'
selected_clips = [
    os.path.join(clips_dir, 'Quest_01_QuestRentYourApartment_QuestRentYourApartmentUncleFredAudio.wav'),
    os.path.join(clips_dir, 'Quest_03_QuestGetSomeSleep_QuestGetSomeSleepUncleFredAudio.wav'),
    os.path.join(clips_dir, 'Quest_05_QuestEstablishFirstBusiness_QuestEstablishFirstBusinessUncleFredAudio.wav'),
    os.path.join(clips_dir, 'Quest_18_QuestMultipleStores_QuestMultipleStoresUncleFredAudio.wav'),
    os.path.join(clips_dir, 'Quest_40_QuestCasino_QuestCasinoUncleFredAudio.wav')
]

print('Loading model...')
config = XttsConfig()
config.load_json(r'C:\Users\tiago\AppData\Local\tts\tts_models--multilingual--multi-dataset--xtts_v2\config.json')
model = Xtts.init_from_config(config)
model.load_checkpoint(config, checkpoint_dir=r'C:\Users\tiago\AppData\Local\tts\tts_models--multilingual--multi-dataset--xtts_v2', use_deepspeed=False)
model.cuda()

print('Extracting multi-clip conditioning latents...')
t0 = time.time()
gpt_cond_latent, speaker_embedding = model.get_conditioning_latents(audio_path=selected_clips)
print(f'Conditioning latents extracted in {round(time.time() - t0, 2)}s!')

phrase = 'Listen to your Uncle Fred, kid. In New York City, revenue is vanity, profit is sanity, but cash flow is king!'

print('Generating high-fidelity speech...')
t0 = time.time()
out = model.inference(
    text=phrase,
    language='en',
    gpt_cond_latent=gpt_cond_latent,
    speaker_embedding=speaker_embedding,
    temperature=0.65,
    top_p=0.85,
    repetition_penalty=5.0,
    enable_text_splitting=True
)
sf.write(r'engine\tts\enhanced_voice_sample.wav', out['wav'], 24000)
print(f'Generated enhanced_voice_sample.wav in {round(time.time() - t0, 2)}s!')
