import os
import time
os.environ['COQUI_TOS_AGREED'] = '1'
from TTS.api import TTS

ref_clip = r'C:\Users\tiago\Desktop\UncleFred_AudioClips\Quest_01_QuestRentYourApartment_QuestRentYourApartmentUncleFredAudio.wav'
out_wav = r'engine\tts\test_voice_sample.wav'

print('Loading XTTS-v2 on cuda...')
tts = TTS('tts_models/multilingual/multi-dataset/xtts_v2').to('cuda')

phrase = 'Listen to your Uncle Fred, kid. In New York City, revenue is vanity, profit is sanity, but cash flow is king!'

print('Cloning Uncle Fred voice and synthesizing speech...')
t0 = time.time()
tts.tts_to_file(
    text=phrase,
    speaker_wav=ref_clip,
    language='en',
    file_path=out_wav
)
dur = round(time.time() - t0, 2)
print(f'SUCCESS! Synthesized speech in {dur} seconds to {out_wav}!')
