import { getWebSqlDb } from "./webSql";

/**
 * Regex matching a line that contains ONLY Chinese characters (1 or 2).
 * Allows optional whitespace around them but nothing else.
 */
const STANDALONE_LINE_RE = /^[\s]*([\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff]{1,2})[\s]*$/;

/**
 * Check if a character is Chinese (CJK Unified Ideographs).
 */
function isChinese(ch: string): boolean {
  return /[\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff]/.test(ch);
}

/**
 * Trim a raw CC-CEDICT definition list down to the most essential meanings.
 * - Removes classifier annotations (CL:...)
 * - Removes dialect/Archaic/ Literary markers
 * - Takes only the first 2 concise definitions
 */
function trimDefinitions(raw: string[]): string[] {
  const cleaned: string[] = [];
  for (const def of raw) {
    // Skip classifier lines
    if (/^CL:/i.test(def)) continue;
    // Strip parenthetical qualifiers like "(dialect)", "(archaic)", "Literary"
    let d = def.replace(/\s*\([^)]*\)/g, "").trim();
    // Strip leading "CL:..." if attached
    d = d.replace(/^CL:\S+\s*/, "").trim();
    if (d) cleaned.push(d);
  }
  // Return at most 2 concise definitions
  return cleaned.slice(0, 2);
}

/**
 * Given raw editor content (markdown), extract all unique standalone Chinese
 * characters and 2-character words (lines containing ONLY that word/char),
 * look each up in the CC-CEDICT dictionary, and return a markdown table.
 *
 * Output format:
 * | 字 | 拼音 | 释义 |
 * |---|---|---|
 * | 人 | rén | person |
 */
export async function generateFlashcards(content: string): Promise<string> {
  const db = await getWebSqlDb();

  // 1. Extract unique tokens from standalone lines
  const lines = content.split("\n");
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const line of lines) {
    const match = line.match(STANDALONE_LINE_RE);
    if (match) {
      const token = match[1];
      // For 2-char tokens, both chars must be Chinese
      if (token.length === 2 && (!isChinese(token[0]) || !isChinese(token[1]))) {
        continue;
      }
      if (!seen.has(token)) {
        seen.add(token);
        tokens.push(token);
      }
    }
  }

  if (tokens.length === 0) {
    return "(No standalone Chinese characters found on their own lines.)";
  }

  // 2. Query dictionary for all tokens in one batch
  const placeholders = tokens.map(() => "?").join(",");
  const query = `SELECT simplified, traditional, pinyin_accent, definitions FROM dictionary WHERE simplified IN (${placeholders}) OR traditional IN (${placeholders})`;
  const params = [...tokens, ...tokens];

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

    // Prefer simplified key, but also store traditional if different
    if (!dictMap[simplified]) {
      dictMap[simplified] = { pinyin: pinyin_accent, definitions };
    }
    if (traditional !== simplified && !dictMap[traditional]) {
      dictMap[traditional] = { pinyin: pinyin_accent, definitions };
    }
  }
  stmt.free();

  // 3. Build markdown table
  const rows: string[] = ["| 字 | 拼音 | 释义 |", "|---|---|---|"];
  for (const token of tokens) {
    const entry = dictMap[token];
    if (entry) {
      const defs = trimDefinitions(entry.definitions);
      const defStr = defs.length > 0 ? defs.join(" / ") : "—";
      rows.push(`| ${token} | ${entry.pinyin} | ${defStr} |`);
    } else {
      rows.push(`| ${token} | — | — |`);
    }
  }

  return rows.join("\n");
}
