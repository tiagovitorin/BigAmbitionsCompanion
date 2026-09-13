// Registry of vehicles/boats that have a pre-rendered 360 spin set, in every
// available paint colour.
//
// Frames are evenly spaced around the vehicle (36 frames = 10 degrees apart) and
// live at `/images/vehicles/<id>_360/<color>/<id>_NN.png` (`00` is the front-on
// frame); `color` is a lowercased colour name (e.g. "red", "darkblue").
//
// Cars use the game's global palette (GlobalReferences.vehicleColors, 12 colours);
// boats use their own 4-colour palette (GlobalReferences.boatColors). The static
// catalogue image is the default paint's frame 0.
//
// The exported frames (and the static catalogue images) are opaque with a flat
// studio background, so each vehicle also carries the colour of that background.
// The containers use it so the image edge does not stand out, especially in dark
// mode. Boats were rendered on a lighter backdrop than the cars.

import vehicleColorsRaw from '@/data/vehicle_colors.json';
import boatColorsRaw from '@/data/boat_colors.json';

export interface VehicleSpin {
  id: string;
  frames: number;
  background: string;
  color: string;
  // The frames are packed into one grid image (scripts/build_vehicle_sprites.py);
  // the viewer crops a cell from it.
  sheetUrl: string;
  cols: number;
  rows: number;
  frameSize: number;
}

export interface VehicleColorOption {
  key: string;
  name: string;
  hex: string;
}

interface SpinConfig {
  frames: number;
  background: string;
  defaultColor: string;
}

const CAR_BACKGROUND = '#e2e3e4';
const BOAT_BACKGROUND = '#f1f1f1';

// The extractor rewrites the vehicle art under the same filenames, and /images/*
// is served with a one-year immutable cache (next.config.ts). Bump this whenever
// the art is re-exported so browsers fetch the fresh files instead of a stale copy.
export const VEHICLE_ASSET_VERSION = '4';

export function vehicleImageUrl(path: string): string {
  return `${path}?v=${VEHICLE_ASSET_VERSION}`;
}

// The frame shown by default (viewer and icons): image 29 of the exported sequence.
export const VEHICLE_DEFAULT_FRAME = 29;

// The default frame if the spin is long enough, otherwise the front frame.
export function getVehicleDefaultFrame(spin: VehicleSpin): number {
  return VEHICLE_DEFAULT_FRAME < spin.frames ? VEHICLE_DEFAULT_FRAME : 0;
}

// Every vehicle in `web/src/data/vehicles.json` plus the three boat types in
// `web/src/data/boats.ts` has a full 36-frame 360 set.
const CAR_IDS = [
  'freighttruckt1',
  'deliverytruck',
  'mersaididash',
  'vordv150',
  'umcnunavut',
  'umcdesert',
  'vordtiaravic',
  'bima320',
  'petrollsfanton',
  'anselmoaf90',
  'limo',
  'mersaidimgagt',
  'vordpony',
  'missamvillian',
  'ferdinand112',
  'mersaidis500',
  'honzamimic',
  'electricscooter'
];

const BOAT_IDS = ['speedboat', 'yacht', 'luxuryyacht'];

// Frames are packed into a single WebP sprite sheet per vehicle+colour (built by
// scripts/build_vehicle_sprites.py).
const SHEET_COLS = 6;
const SHEET_ROWS = 6;
const SHEET_FRAME_SIZE = 512;

// The paint each vehicle was baked in before colour variants existed (matches the
// extractor's canonical colours); used as the initially-selected swatch.
const DEFAULT_COLOR: Record<string, string> = {
  freighttruckt1: 'white',
  deliverytruck: 'black',
  mersaididash: 'white',
  vordv150: 'red',
  umcnunavut: 'black',
  umcdesert: 'white',
  vordtiaravic: 'yellow',
  bima320: 'red',
  petrollsfanton: 'black',
  anselmoaf90: 'red',
  limo: 'black',
  mersaidimgagt: 'yellow',
  vordpony: 'blue',
  missamvillian: 'grey',
  ferdinand112: 'grey',
  mersaidis500: 'black',
  honzamimic: 'red',
  electricscooter: 'black',
  speedboat: 'white',
  yacht: 'white',
  luxuryyacht: 'white'
};

interface RawCarColor { name: string; tint: { r: number; g: number; b: number } }
interface RawBoatColor { name: string; primaryColor: { r: number; g: number; b: number } }

const rgb = (c: { r: number; g: number; b: number }) => `rgb(${c.r}, ${c.g}, ${c.b})`;

const CAR_COLORS: VehicleColorOption[] = (vehicleColorsRaw as RawCarColor[]).map(c => ({
  key: c.name.toLowerCase(),
  name: c.name,
  hex: rgb(c.tint)
}));

const BOAT_COLORS: VehicleColorOption[] = (boatColorsRaw as RawBoatColor[]).map(c => ({
  key: c.name.toLowerCase(),
  name: c.name,
  hex: rgb(c.primaryColor)
}));

const SPIN_CONFIG: Record<string, SpinConfig> = {};
for (const id of CAR_IDS) SPIN_CONFIG[id] = { frames: 36, background: CAR_BACKGROUND, defaultColor: DEFAULT_COLOR[id] ?? 'white' };
for (const id of BOAT_IDS) SPIN_CONFIG[id] = { frames: 36, background: BOAT_BACKGROUND, defaultColor: DEFAULT_COLOR[id] ?? 'white' };

export function getVehicleColors(id: string | undefined | null): VehicleColorOption[] {
  if (!id) return [];
  if (BOAT_IDS.includes(id)) return BOAT_COLORS;
  if (SPIN_CONFIG[id]) return CAR_COLORS;
  return [];
}

export function getVehicleDefaultColor(id: string | undefined | null): string {
  if (!id) return 'white';
  return SPIN_CONFIG[id]?.defaultColor ?? 'white';
}

export function getVehicleSpin(id: string | undefined | null, colorKey?: string | null): VehicleSpin | null {
  if (!id) return null;
  const config = SPIN_CONFIG[id];
  if (!config) return null;
  const color = (colorKey || config.defaultColor).toLowerCase();
  return {
    id,
    frames: config.frames,
    background: config.background,
    color,
    sheetUrl: vehicleImageUrl(`/images/vehicle_sprites/${id}_${color}.webp`),
    cols: SHEET_COLS,
    rows: SHEET_ROWS,
    frameSize: SHEET_FRAME_SIZE
  };
}

// The flat studio background colour a vehicle's images were rendered on.
export function getVehicleBackground(id: string | undefined | null): string {
  if (id && SPIN_CONFIG[id]) return SPIN_CONFIG[id].background;
  return CAR_BACKGROUND;
}

// The image to use in list/table thumbnails: the static catalogue icon (the 360
// frames are packed into sheets, which an <img> cannot crop).
export function getVehicleThumbnail(_id: string | undefined | null, fallback: string): string {
  return vehicleImageUrl(fallback);
}
