"""Build per-vehicle+colour 360 sprite sheets (WebP) with an imperceptible,
compression-robust pixel watermark.

The 36 export frames for a colour live at
  web/public/images/vehicles/<id>_360/<color>/<id>_NN.png
and are composed into a COLS x ROWS grid (6x6 = 3072x3072) then encoded as WebP.

The watermark is a low-amplitude, zero-mean tiled mark added to the luminance
before encoding. It is invisible (about +-DELTA/255) but survives lossy WebP
because it is low-frequency; the sheet can be revealed / correlated to check.

Usage:
  python scripts/build_vehicle_sprites.py --vehicle anselmoaf90 [--color red] [--delta 2]
"""

import argparse
import os
import time
from PIL import Image, ImageDraw, ImageFont
import numpy as np

FRAME_SIZE = 512
COLS = 6
ROWS = 6
FRAMES = COLS * ROWS
SHEET = COLS * FRAME_SIZE  # 3072

WEB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'web', 'public', 'images')
SRC_ROOT = os.path.join(WEB_DIR, 'vehicles')
OUT_ROOT = os.path.join(WEB_DIR, 'vehicle_sprites')
REVEAL_ROOT = os.path.join(WEB_DIR, 'vehicle_sprites_reveal')


def find_font(size):
    for name in ('arial.ttf', 'segoeui.ttf', 'calibri.ttf'):
        path = os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts', name)
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def build_sheet(vehicle_id, color):
    folder = os.path.join(SRC_ROOT, f'{vehicle_id}_360', color)
    sheet = Image.new('RGB', (SHEET, SHEET), (227, 228, 229))
    missing = 0
    for i in range(FRAMES):
        path = os.path.join(folder, f'{vehicle_id}_{i:02d}.png')
        if not os.path.exists(path):
            missing += 1
            continue
        img = Image.open(path).convert('RGB')
        r, c = divmod(i, COLS)
        sheet.paste(img, (c * FRAME_SIZE, r * FRAME_SIZE))
    return sheet, missing


def make_text_carrier(vehicle_id, color):
    """Readable tiled text carrier in [-1, 1] (visible - reference only)."""
    mask = Image.new('L', (SHEET, SHEET), 0)
    draw = ImageDraw.Draw(mask)
    font = find_font(44)
    label = f'BAC {vehicle_id} {color}'
    for y in range(0, SHEET, 300):
        for x in range(-100, SHEET, 620):
            draw.text((x, y), label, fill=255, font=font)
    return np.asarray(mask, dtype=np.float32) / 127.5 - 1.0


def make_noise_carrier(seed, scale):
    """Smooth low-frequency noise carrier in [-1, 1] (invisible, compression-robust)."""
    rng = np.random.default_rng(seed)
    small = rng.uniform(-1.0, 1.0, (scale, scale)).astype(np.float32)
    img = Image.fromarray(((small + 1.0) * 127.5).astype(np.uint8), 'L').resize((SHEET, SHEET), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 127.5 - 1.0


CHANNEL_INDEX = {'r': 0, 'g': 1, 'b': 2}


def embed(sheet, carrier, delta, channel):
    arr = np.asarray(sheet, dtype=np.float32).copy()
    if channel == 'all':
        arr += carrier[:, :, None] * delta
    else:
        arr[:, :, CHANNEL_INDEX[channel]] += carrier * delta
    return np.clip(arr, 0, 255).astype(np.uint8)


def psnr(a, b):
    a = a.astype(np.float64)
    b = b.astype(np.float64)
    mse = np.mean((a - b) ** 2)
    return 99.0 if mse == 0 else 10.0 * np.log10((255.0 ** 2) / mse)


def save_webp(img, path):
    """Atomic-ish save with retries (Windows can transiently lock the target)."""
    tmp = path + '.tmp'
    last = None
    for _ in range(8):
        try:
            img.save(tmp, 'WEBP', quality=88, method=6)
            os.replace(tmp, path)
            return
        except OSError as exc:
            last = exc
            time.sleep(0.4)
    raise last


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--vehicle', default=None, help='single vehicle id; omit with --all')
    ap.add_argument('--all', action='store_true', help='process every <id>_360 folder')
    ap.add_argument('--color', default=None)
    ap.add_argument('--delta', type=float, default=4.0)
    ap.add_argument('--mode', choices=['noise', 'text'], default='noise')
    ap.add_argument('--channel', choices=['r', 'g', 'b', 'all'], default='b')
    ap.add_argument('--seed', type=int, default=1337)
    ap.add_argument('--scale', type=int, default=64)
    ap.add_argument('--tag', default='')
    ap.add_argument('--no-reveal', action='store_true')
    args = ap.parse_args()

    if args.all:
        vehicles = sorted(d[:-4] for d in os.listdir(SRC_ROOT) if d.endswith('_360') and os.path.isdir(os.path.join(SRC_ROOT, d)))
    elif args.vehicle:
        vehicles = [args.vehicle]
    else:
        ap.error('pass --vehicle <id> or --all')

    os.makedirs(OUT_ROOT, exist_ok=True)
    if not args.no_reveal:
        os.makedirs(REVEAL_ROOT, exist_ok=True)

    ci = 0 if args.channel == 'all' else CHANNEL_INDEX[args.channel]

    for vehicle in vehicles:
        base = os.path.join(SRC_ROOT, f'{vehicle}_360')
        colors = [args.color] if args.color else sorted(d for d in os.listdir(base) if os.path.isdir(os.path.join(base, d)))
        for color in colors:
            sheet, missing = build_sheet(vehicle, color)
            if args.mode == 'text':
                carrier = make_text_carrier(vehicle, color)
            else:
                carrier = make_noise_carrier(args.seed, args.scale)
            watermarked = embed(sheet, carrier, args.delta, args.channel)

            suffix = f'_{args.tag}' if args.tag else ''
            out_path = os.path.join(OUT_ROOT, f'{vehicle}_{color}{suffix}.webp')
            save_webp(Image.fromarray(watermarked), out_path)

            original = np.asarray(sheet, dtype=np.float32)
            decoded = np.asarray(Image.open(out_path).convert('RGB'), dtype=np.float32)
            resid = (decoded - original).mean(axis=2) if args.channel == 'all' else decoded[:, :, ci] - original[:, :, ci]
            corr = float(np.corrcoef(resid.ravel(), carrier.ravel())[0, 1])

            if not args.no_reveal:
                reveal = np.clip(128.0 + resid * 24.0, 0, 255).astype(np.uint8)
                reveal_path = os.path.join(REVEAL_ROOT, f'{vehicle}_{color}{suffix}_reveal.png')
                Image.fromarray(reveal, 'L').resize((768, 768), Image.LANCZOS).save(reveal_path)

            webp_bytes = os.path.getsize(out_path)
            print(f'{vehicle:24} {color:9} {args.mode:5} ch={args.channel} delta={args.delta} '
                  f'webp={webp_bytes/1024:6.0f}KB PSNR={psnr(original, decoded):5.1f}dB markCorr={corr:+.3f}')
            if missing:
                print(f'   WARNING: {missing} frames missing for {vehicle} {color}')


if __name__ == '__main__':
    main()
