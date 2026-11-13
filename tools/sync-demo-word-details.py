import csv
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).parents[1]
SOURCE_URL = "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv"
OUTPUT = ROOT / "data" / "demo-word-details.js"


def demo_words() -> set[str]:
    words = set()
    for directory in (ROOT / "data" / "word" / "1" / "1", ROOT / "data" / "word" / "2" / "1"):
        for image in directory.iterdir():
            if image.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                continue
            words.add(re.sub(r"-2$", "", image.stem.lower()))
    return words


def clean_translation(value: str) -> str:
    lines = []
    for line in value.replace("\\n", "\n").splitlines():
        line = line.strip()
        if not line or line.startswith("["):
            continue
        line = line.replace("...", "…").replace(", ", "、").replace(",", "、")
        lines.append(line)
    return "\n".join(lines[:4])


wanted = demo_words()
details = {}
download = subprocess.Popen(
    ["curl.exe", "-L", "-s", "--compressed", SOURCE_URL],
    stdout=subprocess.PIPE,
    text=True,
    encoding="utf-8-sig",
    errors="replace",
)
for line in download.stdout:
    word = line.partition(",")[0].lower()
    if word not in wanted:
        continue
    row = next(csv.reader([line]))
    if len(row) < 4:
        continue
    meaning = clean_translation(row[3])
    if meaning:
        details[word] = {"phonetic": row[1], "meaning": meaning}
    if len(details) == len(wanted):
        download.terminate()
        break
download.wait()

missing = sorted(wanted - details.keys())
content = "// Generated from ECDICT (MIT). Run: python tools/sync-demo-word-details.py\n"
content += f"export const WORD_DETAILS = {json.dumps(details, ensure_ascii=False, indent=2)};\n"
temporary = OUTPUT.with_suffix(".tmp")
temporary.write_text(content, encoding="utf-8")
temporary.replace(OUTPUT)
print(f"ready: {len(details)}/{len(wanted)} words; missing: {', '.join(missing) or 'none'}")
