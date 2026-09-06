import os
import sys
from huggingface_hub import HfApi

RUN_DIR = r'C:\Users\tiago\Desktop\CODING PROJECTS\BigAmbitionsTool\engine\training\checkpoints\UncleFred_XTTS_FT-September-06-2026_03+21PM-0000000'
CHECKPOINT_PATH = os.path.join(RUN_DIR, 'best_model.pth')
CONFIG_PATH = os.path.join(RUN_DIR, 'config.json')
BASE_DIR = r'C:\Users\tiago\AppData\Local\tts\tts_models--multilingual--multi-dataset--xtts_v2'
REF_WAV = r'C:\Users\tiago\Desktop\UncleFred_AudioClips\Quest_01_QuestRentYourApartment_QuestRentYourApartmentUncleFredAudio.wav'

token = os.environ.get('HF_TOKEN')
repo_id = 'tiagovito/unclefred-xtts-weights'

api = HfApi(token=token)

print(f'Uploading to free Model repo: {repo_id}...')

print('Uploading reference audio...')
api.upload_file(
    path_or_fileobj=REF_WAV,
    path_in_repo='reference.wav',
    repo_id=repo_id,
    repo_type='model'
)

print('Uploading config.json...')
api.upload_file(
    path_or_fileobj=CONFIG_PATH,
    path_in_repo='config.json',
    repo_id=repo_id,
    repo_type='model'
)

print('Uploading extra support files (vocab.json, dvae.pth, mel_stats.pth)...')
for extra in ['vocab.json', 'dvae.pth', 'mel_stats.pth']:
    p = os.path.join(BASE_DIR, extra)
    if os.path.exists(p):
        print(f'  Uploading {extra}...')
        api.upload_file(
            path_or_fileobj=p,
            path_in_repo=extra,
            repo_id=repo_id,
            repo_type='model'
        )

print('Uploading best_model.pth (5.6 GB)...')
api.upload_file(
    path_or_fileobj=CHECKPOINT_PATH,
    path_in_repo='best_model.pth',
    repo_id=repo_id,
    repo_type='model'
)

print('SUCCESS! Model weights securely backed up to Hugging Face Model Hub!')