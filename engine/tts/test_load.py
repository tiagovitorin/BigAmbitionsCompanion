import os
os.environ['COQUI_TOS_AGREED'] = '1'
from TTS.api import TTS
print('Initializing XTTS-v2 checkpoint...')
tts = TTS('tts_models/multilingual/multi-dataset/xtts_v2').to('cuda')
print('SUCCESS: XTTS-v2 loaded cleanly on GPU!')
