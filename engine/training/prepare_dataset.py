import os
import glob
import soundfile as sf
import numpy as np
import whisper

CLIPS_DIR = r'C:\Users\tiago\Desktop\UncleFred_AudioClips'
DATASET_OUT = r'engine\training\dataset'
WAVS_DIR = os.path.join(DATASET_OUT, 'wavs')
os.makedirs(WAVS_DIR, exist_ok=True)

print('Loading Whisper model on GPU for automated transcription and phoneme alignment...')
model = whisper.load_model('base', device='cuda')

wav_files = glob.glob(os.path.join(CLIPS_DIR, '*.wav'))
print(f'Found {len(wav_files)} studio audio clips to process.')

metadata_train = []
metadata_eval = []

target_sr = 22050

count = 0
for idx, wav_path in enumerate(wav_files):
    base_name = os.path.splitext(os.path.basename(wav_path))[0]
    out_wav_name = f'uf_{idx+1:03d}.wav'
    out_wav_path = os.path.join(WAVS_DIR, out_wav_name)
    
    data, sr = sf.read(wav_path)
    if len(data.shape) > 1:
        data = np.mean(data, axis=1)

    # Convert to 16kHz float32 for Whisper without relying on ffmpeg executable
    num_samples_16k = int(len(data) * 16000 / sr)
    audio_16k = np.interp(
        np.linspace(0, len(data), num_samples_16k, endpoint=False),
        np.arange(len(data)),
        data
    ).astype(np.float32)

    res = model.transcribe(audio_16k, language='en')
    text = res['text'].strip()

    text = text.replace('|', ' ').replace('\n', ' ').strip()
    if not text:
        continue

    # Resample to 22.05kHz for fine-tuning
    num_samples_target = int(len(data) * target_sr / sr)
    audio_target = np.interp(
        np.linspace(0, len(data), num_samples_target, endpoint=False),
        np.arange(len(data)),
        data
    ).astype(np.float32)

    sf.write(out_wav_path, audio_target, target_sr)
    
    line = f'wavs/{out_wav_name}|{text}|UncleFred'
    if idx % 10 == 0:
        metadata_eval.append(line)
    else:
        metadata_train.append(line)
    
    count += 1
    if (idx + 1) % 10 == 0 or (idx + 1) == len(wav_files):
        print(f'  Processed [{idx+1}/{len(wav_files)}] clips...')

header = 'audio_file|text|speaker_name'
with open(os.path.join(DATASET_OUT, 'metadata_train.csv'), 'w', encoding='utf-8') as f:
    f.write(header + '\n' + '\n'.join(metadata_train))

with open(os.path.join(DATASET_OUT, 'metadata_eval.csv'), 'w', encoding='utf-8') as f:
    f.write(header + '\n' + '\n'.join(metadata_eval))

print(f'\nSUCCESS! Prepared {count} paired audio samples.')
print(f'Train samples: {len(metadata_train)} | Validation samples: {len(metadata_eval)}')
print(f'Dataset location: {DATASET_OUT}')
