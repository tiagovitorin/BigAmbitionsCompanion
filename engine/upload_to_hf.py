import os
import sys
from huggingface_hub import HfApi, create_repo

RUN_DIR = r'C:\Users\tiago\Desktop\CODING PROJECTS\BigAmbitionsTool\engine\training\checkpoints\UncleFred_XTTS_FT-September-06-2026_03+21PM-0000000'
CHECKPOINT_PATH = os.path.join(RUN_DIR, 'best_model.pth')
CONFIG_PATH = os.path.join(RUN_DIR, 'config.json')
BASE_DIR = r'C:\Users\tiago\AppData\Local\tts\tts_models--multilingual--multi-dataset--xtts_v2'
REF_WAV = r'C:\Users\tiago\Desktop\UncleFred_AudioClips\Quest_01_QuestRentYourApartment_QuestRentYourApartmentUncleFredAudio.wav'

token = os.environ.get('HF_TOKEN')
repo_id = os.environ.get('HF_REPO_ID')

if not token:
    print('ERROR: HF_TOKEN environment variable not set.')
    sys.exit(1)

if not repo_id:
    print('ERROR: HF_REPO_ID environment variable not set (e.g. your_username/unclefred-voice-engine).')
    sys.exit(1)

api = HfApi(token=token)

print(f'Creating/verifying Hugging Face Space: {repo_id}...')
create_repo(repo_id=repo_id, token=token, repo_type='space', space_sdk='docker', exist_ok=True)

print('Uploading deployment files (app.py, Dockerfile, requirements.txt)...')
space_dir = r'C:\Users\tiago\Desktop\CODING PROJECTS\BigAmbitionsTool\engine\deploy_hf_space'
api.upload_folder(
    folder_path=space_dir,
    repo_id=repo_id,
    repo_type='space'
)

print(f'Uploading reference audio clip ({REF_WAV})...')
api.upload_file(
    path_or_fileobj=REF_WAV,
    path_in_repo='reference.wav',
    repo_id=repo_id,
    repo_type='space'
)

print(f'Uploading fine-tuned config ({CONFIG_PATH})...')
api.upload_file(
    path_or_fileobj=CONFIG_PATH,
    path_in_repo='config.json',
    repo_id=repo_id,
    repo_type='space'
)

print('Uploading base vocab, dvae, and mel_stats...')
for extra in ['vocab.json', 'dvae.pth', 'mel_stats.pth']:
    p = os.path.join(BASE_DIR, extra)
    if os.path.exists(p):
        print(f'  Uploading {extra}...')
        api.upload_file(
            path_or_fileobj=p,
            path_in_repo=extra,
            repo_id=repo_id,
            repo_type='space'
        )

print(f'Uploading fine-tuned model checkpoint (~5.6 GB, this will stream to Hugging Face)...')
api.upload_file(
    path_or_fileobj=CHECKPOINT_PATH,
    path_in_repo='best_model.pth',
    repo_id=repo_id,
    repo_type='space'
)

print('\nSUCCESS! Everything uploaded to Hugging Face Space!')
print(f'Your Space is live at: https://huggingface.co/spaces/{repo_id}')