import os
import zipfile
import urllib.request
import sqlite3
import json

# Correct CC-CEDICT URL
URL = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.zip"

def convert_pinyin(pinyin_str):
    syllables = pinyin_str.split()
    results = []
    for syl in syllables:
        if "'" in syl:
            results.append("'".join(convert_syllable(s) for s in syl.split("'")))
        else:
            results.append(convert_syllable(syl))
    return " ".join(results)

def convert_syllable(syl):
    syl = syl.replace("u:", "ü").replace("v", "ü").replace("U:", "Ü").replace("V", "Ü")
    if not syl or not syl[-1].isdigit():
        return syl
    tone = int(syl[-1])
    syl = syl[:-1]
    if tone < 1 or tone > 4:
        return syl

    tone_idx = tone - 1
    vowel_pos = -1

    # Check ui or iu
    for i in range(len(syl) - 1):
        c1 = syl[i].lower()
        c2 = syl[i+1].lower()
        if (c1 == 'u' and c2 == 'i') or (c1 == 'i' and c2 == 'u'):
            vowel_pos = i + 1
            break

    if vowel_pos == -1:
        priority = ['a', 'e', 'o', 'i', 'u', 'ü', 'A', 'E', 'O', 'I', 'U', 'Ü']
        for v in priority:
            idx = syl.find(v)
            if idx != -1:
                vowel_pos = idx
                break

    if vowel_pos != -1:
        target = syl[vowel_pos]
        tone_map = {
            'a': ['ā', 'á', 'ǎ', 'à'],
            'A': ['Ā', 'Á', 'Ǎ', 'À'],
            'o': ['ō', 'ó', 'ǒ', 'ò'],
            'O': ['Ō', 'Ó', 'Ǒ', 'Ò'],
            'e': ['ē', 'é', 'ě', 'è'],
            'E': ['Ē', 'É', 'Ě', 'È'],
            'i': ['ī', 'í', 'ǐ', 'ì'],
            'I': ['Ī', 'Í', 'Ǐ', 'Ì'],
            'u': ['ū', 'ú', 'ǔ', 'ù'],
            'U': ['Ū', 'Ú', 'Ǔ', 'Ù'],
            'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
            'Ü': ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ']
        }
        if target in tone_map:
            syl_list = list(syl)
            syl_list[vowel_pos] = tone_map[target][tone_idx]
            syl = "".join(syl_list)

    return syl

def build_db():
    print("=== Downloading CC-CEDICT zip ===")
    req = urllib.request.Request(
        URL, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    with urllib.request.urlopen(req) as response, open("cedict.zip", 'wb') as out_file:
        out_file.write(response.read())

    print("=== Extracting ZIP ===")
    with zipfile.ZipFile("cedict.zip", "r") as zip_ref:
        zip_ref.extractall(".")

    db_dir = "src-tauri/resources"
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, "cedict.db")

    # Remove old DB if exists to start fresh
    if os.path.exists(db_path):
        os.remove(db_path)

    print(f"=== Creating SQLite database at {db_path} ===")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dictionary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        traditional TEXT NOT NULL,
        simplified TEXT NOT NULL,
        pinyin TEXT NOT NULL,
        pinyin_accent TEXT NOT NULL,
        definitions TEXT NOT NULL
    );
    """)

    # Open extraction file
    txt_filename = "cedict_ts.u8"
    if not os.path.exists(txt_filename):
        # Check files extracted
        for file in os.listdir("."):
            if file.startswith("cedict_") and file.endswith(".u8"):
                txt_filename = file
                break

    print(f"=== Parsing {txt_filename} and loading entries ===")
    entries = []
    
    with open(txt_filename, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            bracket_start = line.find("[")
            bracket_end = line.find("]")
            if bracket_start == -1 or bracket_end == -1 or bracket_start >= bracket_end:
                continue

            # Characters
            chars_part = line[:bracket_start].strip()
            chars = chars_part.split()
            traditional = chars[0]
            simplified = chars[1] if len(chars) > 1 else traditional

            # Pinyin
            pinyin = line[bracket_start + 1:bracket_end].strip()
            pinyin_accent = convert_pinyin(pinyin)

            # Definitions
            defs_part = line[bracket_end + 1:].strip()
            if not defs_part.startswith("/") or not defs_part.endswith("/"):
                continue

            definitions = [d.strip() for d in defs_part.split("/") if d.strip()]
            definitions_json = json.dumps(definitions)

            entries.append((traditional, simplified, pinyin, pinyin_accent, definitions_json))

    print(f"=== Inserting {len(entries)} entries into SQLite ===")
    cursor.executemany("""
    INSERT INTO dictionary (traditional, simplified, pinyin, pinyin_accent, definitions)
    VALUES (?, ?, ?, ?, ?);
    """, entries)

    print("=== Creating index search optimizers ===")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_simplified ON dictionary (simplified);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_traditional ON dictionary (traditional);")

    conn.commit()
    conn.close()

    print("=== Cleaning up temporary files ===")
    if os.path.exists("cedict.zip"):
        os.remove("cedict.zip")
    if os.path.exists(txt_filename):
        os.remove(txt_filename)

    print("=== CC-CEDICT SQLite database compile complete! ===")

if __name__ == "__main__":
    build_db()
