import { getWebSqlDb } from "./webSql";

/**
 * Trim a raw CC-CEDICT definition list down to the most essential meanings.
 */
function trimDefinitions(raw: string[]): string[] {
  const cleaned: string[] = [];
  for (const def of raw) {
    if (/^CL:/i.test(def)) continue;
    let d = def.replace(/\s*\([^)]*\)/g, "").trim();
    d = d.replace(/^CL:\S+\s*/, "").trim();
    if (d) cleaned.push(d);
  }
  return cleaned.slice(0, 2);
}

/**
 * Check if a character is Chinese (CJK Unified Ideographs).
 */
function isChinese(ch: string): boolean {
  return /[\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff]/.test(ch);
}

/**
 * Given raw editor content, extract all unique Chinese characters and 2-char
 * words, look each up in CC-CEDICT, and return formatted flashcard text.
 *
 * Only merges consecutive Chinese chars into 2-char words when they are
 * actually adjacent on the same line (no line break between them).
 */
export async function generateFlashcards(content: string): Promise<string> {
  console.log("[Flashcards] Starting generation, content length:", content.length);
  const db = await getWebSqlDb();
  console.log("[Flashcards] Database loaded");

  // 1. Split into lines, extract Chinese chars per line (preserving adjacency)
  const lines = content.split("\n");
  const lineChinese: string[][] = [];
  for (const line of lines) {
    const chars: string[] = [];
    for (const ch of line) {
      if (isChinese(ch)) chars.push(ch);
    }
    if (chars.length > 0) {
      lineChinese.push(chars);
    }
  }

  const totalChars = lineChinese.reduce((sum, l) => sum + l.length, 0);
  console.log("[Flashcards] Found", totalChars, "Chinese characters across", lineChinese.length, "lines");

  if (totalChars === 0) {
    return "(No Chinese characters found in this document.)";
  }

  // 2. Build unique 2-char word candidates ONLY from chars adjacent on the same line
  const twoCharWords = new Set<string>();
  for (const lineChars of lineChinese) {
    for (let i = 0; i < lineChars.length - 1; i++) {
      twoCharWords.add(lineChars[i] + lineChars[i + 1]);
    }
  }

  // Collect unique single chars
  const singleChars = new Set<string>();
  for (const lineChars of lineChinese) {
    for (const ch of lineChars) {
      singleChars.add(ch);
    }
  }

  // 3. Batch-query dictionary for all candidates
  const allCandidates = [...twoCharWords, ...singleChars];
  console.log("[Flashcards] Querying dictionary for", allCandidates.length, "candidates");

  const placeholders = allCandidates.map(() => "?").join(",");
  const query = `SELECT simplified, traditional, pinyin_accent, definitions FROM dictionary WHERE simplified IN (${placeholders}) OR traditional IN (${placeholders})`;
  const params = [...allCandidates, ...allCandidates];

  const stmt = db.prepare(query);
  stmt.bind(params);

  const dictMap: Record<string, { pinyin: string; definitions: string[] }> = {};
  while (stmt.step()) {
    const row = stmt.get();
    const simplified = row[0] as string;
    const traditional = row[1] as string;
    const pinyin_accent = row[2] as string;
    const definitions_json = row[3] as string;

    let definitions: string[];
    try {
      definitions = JSON.parse(definitions_json);
    } catch {
      definitions = [definitions_json];
    }

    if (!dictMap[simplified]) {
      dictMap[simplified] = { pinyin: pinyin_accent, definitions };
    }
    if (traditional !== simplified && !dictMap[traditional]) {
      dictMap[traditional] = { pinyin: pinyin_accent, definitions };
    }
  }
  stmt.free();

  console.log("[Flashcards] Dictionary matches:", Object.keys(dictMap).length);

  // 4. Walk each line independently, greedily match 2-char words first
  const seenGlobal = new Set<string>();
  const entries: { word: string; pinyin: string; defs: string[] }[] = [];

  for (const lineChars of lineChinese) {
    let i = 0;
    while (i < lineChars.length) {
      // Try 2-char match first
      if (i < lineChars.length - 1) {
        const pair = lineChars[i] + lineChars[i + 1];
        if (dictMap[pair] && !seenGlobal.has(pair)) {
          seenGlobal.add(pair);
          const entry = dictMap[pair];
          entries.push({ word: pair, pinyin: entry.pinyin, defs: trimDefinitions(entry.definitions) });
          i += 2;
          continue;
        }
      }

      // Fallback to single char
      const ch = lineChars[i];
      if (!seenGlobal.has(ch)) {
        seenGlobal.add(ch);
        if (dictMap[ch]) {
          const entry = dictMap[ch];
          entries.push({ word: ch, pinyin: entry.pinyin, defs: trimDefinitions(entry.definitions) });
        } else {
          entries.push({ word: ch, pinyin: "—", defs: ["—"] });
        }
      }
      i++;
    }
  }

  console.log("[Flashcards] Final entries:", entries.length);

  if (entries.length === 0) {
    return "(No dictionary entries found.)";
  }

  // 5. Calculate column widths for alignment
  const colWidths = { word: 0, pinyin: 0 };
  for (const e of entries) {
    colWidths.word = Math.max(colWidths.word, e.word.length);
    colWidths.pinyin = Math.max(colWidths.pinyin, e.pinyin.length);
  }

  // Pad helper: pad string to fixed width (accounts for CJK double-width)
  const pad = (str: string, width: number) => {
    const visualLen = [...str].reduce((acc, ch) => acc + (isChinese(ch) ? 2 : 1), 0);
    return str + " ".repeat(Math.max(1, width - visualLen + 3));
  };

  // 6. Build plain text output
  const resultLines: string[] = [];
  for (const e of entries) {
    const defStr = e.defs.length > 0 ? e.defs.join(" / ") : "—";
    resultLines.push(`${pad(e.word, colWidths.word)}${pad(e.pinyin, colWidths.pinyin)}${defStr}`);
  }

  const result = resultLines.join("\n");
  console.log("[Flashcards] Output length:", result.length);
  return result;
}
