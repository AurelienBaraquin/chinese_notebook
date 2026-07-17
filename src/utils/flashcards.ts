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
 * words, look each up in CC-CEDICT, and return a markdown table.
 *
 * - Scans the ENTIRE content for Chinese text
 * - Groups consecutive Chinese chars into 2-char word candidates
 * - Single chars are shown if no 2-char word covers them
 * - Everything is deduplicated
 */
export async function generateFlashcards(content: string): Promise<string> {
  const db = await getWebSqlDb();

  // 1. Extract all Chinese characters from the content, preserving order
  const allChinese: string[] = [];
  for (const ch of content) {
    if (isChinese(ch)) {
      allChinese.push(ch);
    }
  }

  if (allChinese.length === 0) {
    return "(No Chinese characters found in this document.)";
  }

  // 2. Build unique 2-char word candidates from consecutive chars
  const twoCharWords = new Set<string>();
  for (let i = 0; i < allChinese.length - 1; i++) {
    twoCharWords.add(allChinese[i] + allChinese[i + 1]);
  }

  // Also collect unique single chars
  const singleChars = new Set(allChinese);

  // 3. Batch-query dictionary for all candidates
  const allCandidates = [...twoCharWords, ...singleChars];
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

  // 4. Walk through the text, greedily match 2-char words first, then single chars
  const seen = new Set<string>();
  const entries: { word: string; pinyin: string; defs: string[] }[] = [];
  let i = 0;

  while (i < allChinese.length) {
    // Try 2-char match first
    if (i < allChinese.length - 1) {
      const pair = allChinese[i] + allChinese[i + 1];
      if (dictMap[pair] && !seen.has(pair)) {
        seen.add(pair);
        const entry = dictMap[pair];
        entries.push({ word: pair, pinyin: entry.pinyin, defs: trimDefinitions(entry.definitions) });
        i += 2;
        continue;
      }
    }

    // Fallback to single char
    const ch = allChinese[i];
    if (!seen.has(ch)) {
      seen.add(ch);
      if (dictMap[ch]) {
        const entry = dictMap[ch];
        entries.push({ word: ch, pinyin: entry.pinyin, defs: trimDefinitions(entry.definitions) });
      } else {
        entries.push({ word: ch, pinyin: "—", defs: ["—"] });
      }
    }
    i++;
  }

  if (entries.length === 0) {
    return "(No dictionary entries found.)";
  }

  // 5. Build markdown table
  const rows: string[] = ["| 字 | 拼音 | 释义 |", "|---|---|---|"];
  for (const e of entries) {
    const defStr = e.defs.length > 0 ? e.defs.join(" / ") : "—";
    rows.push(`| ${e.word} | ${e.pinyin} | ${defStr} |`);
  }

  return rows.join("\n");
}
