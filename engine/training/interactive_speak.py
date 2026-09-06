import os
import sys
import time
import soundfile as sf
os.environ['COQUI_TOS_AGREED'] = '1'
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

RUN_DIR = r'C:\Users\tiago\Desktop\CODING PROJECTS\BigAmbitionsTool\engine\training\checkpoints\UncleFred_XTTS_FT-September-06-2026_03+21PM-0000000'
CHECKPOINT_PATH = os.path.join(RUN_DIR, 'best_model.pth')
BASE_DIR = r'C:\Users\tiago\AppData\Local\tts\tts_models--multilingual--multi-dataset--xtts_v2'
CLIPS_DIR = r'C:\Users\tiago\Desktop\UncleFred_AudioClips'
REF_WAV = os.path.join(CLIPS_DIR, 'Quest_01_QuestRentYourApartment_QuestRentYourApartmentUncleFredAudio.wav')

print('='*60)
print('  UNCLE FRED INTERACTIVE VOICE STUDIO (FINE-TUNED RTX 3060)')
print('='*60)
print('Loading fine-tuned model checkpoint into RTX 3060 VRAM...')
config = XttsConfig()
config.load_json(os.path.join(RUN_DIR, 'config.json'))
model = Xtts.init_from_config(config)
model.load_checkpoint(config, checkpoint_path=CHECKPOINT_PATH, checkpoint_dir=BASE_DIR, eval=True, use_deepspeed=False)
model.cuda()

print('Caching speaker conditioning latent...')
gpt_cond_latent, speaker_embedding = model.get_conditioning_latents(audio_path=REF_WAV)
print('\nReady! Uncle Fred is listening.')
print('Type any sentence and press ENTER to hear him speak.')
print('Type exit or quit to close.\n')

output_idx = 1
while True:
    try:
        phrase = input('Uncle Fred > ').strip()
        if not phrase:
            continue
        if phrase.lower() in ['exit', 'quit', 'q']:
            print('Goodbye kid!')
            break

        out_name = f'speech_{output_idx:02d}.wav'
        out_path = os.path.join(r'engine\training', out_name)
        
        t0 = time.time()
        print('  Synthesizing...')
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
        sf.write(out_path, out['wav'], 24000)
        dur = round(time.time() - t0, 2)
        print(f'  Saved to: engine\training\{out_name} (in {dur}s)')
        
        # Play audio directly in Windows
        try:
            import winsound
            winsound.PlaySound(out_path, winsound.SND_FILENAME | winsound.SND_ASYNC)
        except Exception:
            pass
            
        output_idx += 1
        print()
    except (KeyboardInterrupt, EOFError):
        print('\nExiting...')
        break
