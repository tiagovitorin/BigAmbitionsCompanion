#!/usr/bin/env python3
"""Apply game-localized street display names onto the committed web building data.

Reads the street_names.json dump produced by the in-game extractor
(data/raw/street_names.json, e.g. "ba:street_thirdstreet" -> "3rd Street") and
rewrites web/src/data/buildings.json so every property address matches what the
game UI shows (number first, e.g. "45 3rd Street").

Run after a fresh in-game extraction:
    python scripts/apply_street_names.py
"""

import json
import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_STREETS = BASE_DIR / "data" / "raw" / "street_names.json"
WEB_BUILDINGS = BASE_DIR / "web" / "src" / "data" / "buildings.json"


def clean_id(raw):
    if not raw:
        return ""
    return re.sub(r"^ba:[a-z_]+_", "", raw.lower().strip())


def main():
    if not RAW_STREETS.exists():
        sys.exit("data/raw/street_names.json not found. Run the in-game extractor first.")
    if not WEB_BUILDINGS.exists():
        sys.exit(f"Web buildings file not found: {WEB_BUILDINGS}")

    street_map = {}
    for s in json.loads(RAW_STREETS.read_text(encoding="utf-8")):
        raw = (s.get("streetName") or "").strip()
        display = (s.get("displayName") or "").strip()
        if not raw or not display or display.lower() == raw.lower():
            continue
        street_map.setdefault(clean_id(raw), display)
        street_map.setdefault(raw.lower(), display)

    with WEB_BUILDINGS.open(encoding="utf-8") as f:
        buildings = json.load(f)

    changed = 0
    skipped = []
    for b in buildings:
        name = (b.get("street_name") or "").strip()
        token = clean_id(name)
        display = street_map.get(token) or street_map.get(name.lower())
        if not display:
            skipped.append(name or "<empty>")
            continue
        if display == name:
            continue
        number = b.get("street_number")
        b["street_name"] = display
        if number is not None:
            b["address"] = f"{number} {display}"
        changed += 1

    with WEB_BUILDINGS.open("w", encoding="utf-8") as f:
        json.dump(buildings, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Updated {changed} buildings in web/src/data/buildings.json")
    if skipped:
        print(f"Unmapped street names ({len(skipped)}): {sorted(set(skipped))}")


if __name__ == "__main__":
    main()
