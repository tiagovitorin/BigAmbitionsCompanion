import os
import sys
import gc
import torch
os.environ['COQUI_TOS_AGREED'] = '1'

from trainer import Trainer, TrainerArgs
from TTS.config.shared_configs import BaseDatasetConfig
from TTS.tts.datasets import load_tts_samples
from TTS.tts.layers.xtts.trainer.gpt_trainer import GPTArgs, GPTTrainer, GPTTrainerConfig
from TTS.tts.models.xtts import XttsAudioConfig

def main():
    DATASET_PATH = os.path.abspath(r'engine\training\dataset')
    TRAIN_CSV = os.path.join(DATASET_PATH, 'metadata_train.csv')
    EVAL_CSV = os.path.join(DATASET_PATH, 'metadata_eval.csv')
    CHECKPOINTS_OUT = os.path.abspath(r'engine\training\checkpoints')
    BASE_MODEL_DIR = os.path.abspath(r'C:\Users\tiago\AppData\Local\tts\tts_models--multilingual--multi-dataset--xtts_v2')

    os.makedirs(CHECKPOINTS_OUT, exist_ok=True)

    print('='*65)
    print('   UNCLE FRED XTTS-v2 FINE-TUNING PIPELINE (RTX 3060 12GB)')
    print('='*65)
    print(f'Device: {torch.cuda.get_device_name(0)}')
    print(f'Dataset: {DATASET_PATH}')
    print(f'Checkpoints will be saved to: {CHECKPOINTS_OUT}')

    # 1. Dataset Config
    config_dataset = BaseDatasetConfig(
        formatter='coqui',
        dataset_name='uncle_fred',
        path=DATASET_PATH,
        meta_file_train='metadata_train.csv',
        meta_file_val='metadata_eval.csv',
        language='en',
    )

    # 2. Paths to original XTTS-v2 files
    MEL_NORM_FILE = os.path.join(BASE_MODEL_DIR, 'mel_stats.pth')
    DVAE_CHECKPOINT = os.path.join(BASE_MODEL_DIR, 'dvae.pth')
    XTTS_CHECKPOINT = os.path.join(BASE_MODEL_DIR, 'model.pth')
    TOKENIZER_FILE = os.path.join(BASE_MODEL_DIR, 'vocab.json')

    # 3. Model Training Args
    model_args = GPTArgs(
        max_conditioning_length=132300,
        min_conditioning_length=66150,
        debug_loading_failures=False,
        max_wav_length=255995,
        max_text_length=300,
        mel_norm_file=MEL_NORM_FILE,
        dvae_checkpoint=DVAE_CHECKPOINT,
        xtts_checkpoint=XTTS_CHECKPOINT,
        tokenizer_file=TOKENIZER_FILE,
        gpt_num_audio_tokens=1026,
        gpt_start_audio_token=1024,
        gpt_stop_audio_token=1025,
        gpt_use_masking_gt_prompt_approach=True,
        gpt_use_perceiver_resampler=True,
    )

    audio_config = XttsAudioConfig(sample_rate=22050, dvae_sample_rate=22050, output_sample_rate=24000)

    # Note: num_loader_workers=0 is mandatory on Windows to avoid DataLoader multiprocessing fork crash
    config = GPTTrainerConfig(
        epochs=10,
        output_path=CHECKPOINTS_OUT,
        model_args=model_args,
        run_name='UncleFred_XTTS_FT',
        project_name='UncleFred_Voice',
        run_description='Uncle Fred Big Ambitions Voice Fine-Tuning',
        dashboard_logger='tensorboard',
        audio=audio_config,
        batch_size=2,
        batch_group_size=48,
        eval_batch_size=2,
        num_loader_workers=0,
        eval_split_max_size=256,
        print_step=25,
        plot_step=50,
        log_model_step=50,
        save_step=250,
        save_n_checkpoints=2,
        save_checkpoints=True,
        print_eval=False,
        optimizer='AdamW',
        optimizer_wd_only_on_weights=True,
        optimizer_params={'betas': [0.9, 0.96], 'eps': 1e-8, 'weight_decay': 1e-2},
        lr=5e-6,
        lr_scheduler='MultiStepLR',
        lr_scheduler_params={'milestones': [50000, 150000], 'gamma': 0.5, 'last_epoch': -1},
        test_sentences=[],
    )

    print('\nInitializing GPTTrainer from official XTTS fine-tuning architecture...')
    model = GPTTrainer.init_from_config(config)

    train_samples, eval_samples = load_tts_samples(
        [config_dataset],
        eval_split=True,
        eval_split_max_size=config.eval_split_max_size,
        eval_split_size=config.eval_split_size,
    )

    print(f'Loaded {len(train_samples)} training samples and {len(eval_samples)} validation samples.')

    trainer = Trainer(
        TrainerArgs(
            restore_path='',
            skip_train_epoch=False,
            start_with_eval=False,
            grad_accum_steps=2,
        ),
        config,
        output_path=CHECKPOINTS_OUT,
        model=model,
        train_samples=train_samples,
        eval_samples=eval_samples,
    )

    print('\nStarting fine-tuning loop on NVIDIA RTX 3060!')
    trainer.fit()
    print('\n[SUCCESS] Uncle Fred voice fine-tuning completed successfully!')

if __name__ == '__main__':
    from multiprocessing import freeze_support
    freeze_support()
    main()
