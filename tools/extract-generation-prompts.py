from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
SOURCES = {
    ROOT / "docs" / "简单词+复合词.docx": ROOT / "server" / "prompts" / "simple-or-compound.txt",
    ROOT / "docs" / "2谐音记忆法画面更新.docx": ROOT / "server" / "prompts" / "complex-root-affix.txt",
}


def extract(source: Path) -> str:
    with ZipFile(source) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    paragraphs = []
    for paragraph in root.iter(f"{NS}p"):
        text = "".join(node.text or "" for node in paragraph.iter(f"{NS}t")).strip()
        if text:
            paragraphs.append(text)
    return "\n".join(paragraphs) + "\n"


for source, target in SOURCES.items():
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(extract(source), encoding="utf-8")
    print(f"{source.name} -> {target.relative_to(ROOT)}")
