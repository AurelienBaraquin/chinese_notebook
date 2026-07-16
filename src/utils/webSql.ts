let SQL: any = null;
let dbInstance: any = null;
let loadPromise: Promise<any> | null = null;

export async function getWebSqlDb(): Promise<any> {
  if (dbInstance) return dbInstance;

  if (!loadPromise) {
    loadPromise = (async () => {
      // 1. Inject the sql-wasm.js script dynamically if it's not already on the page
      if (!(window as any).initSqlJs) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist/sql-wasm.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load sql.js from CDN"));
          document.head.appendChild(script);
        });
      }

      // 2. Initialize sql.js WebAssembly
      SQL = await (window as any).initSqlJs({
        locateFile: (filename: string) => `https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist/${filename}`,
      });

      // 3. Fetch the SQLite database file
      console.log("Web Mode: Fetching CC-CEDICT SQLite database (~17MB)...");
      const res = await fetch("/cedict.db");
      if (!res.ok) {
        throw new Error(`Failed to fetch /cedict.db: ${res.statusText}`);
      }
      const buffer = await res.arrayBuffer();

      // 4. Load database in WebAssembly memory
      dbInstance = new SQL.Database(new Uint8Array(buffer));
      console.log("Web Mode: SQLite database loaded in memory successfully!");
      return dbInstance;
    })();
  }

  return loadPromise;
}

export interface WebTranslation {
  word: string;
  entries: {
    traditional: string;
    simplified: string;
    pinyin: string;
    pinyin_accent: string;
    definitions: string[];
  }[];
}

// Client-side Maximum Forward Matching segmenter powered by SQLite lookups
export async function segmentAndTranslateWeb(text: string): Promise<WebTranslation[]> {
  try {
    const db = await getWebSqlDb();
    const cleanText = text.trim();
    if (!cleanText) return [];

    // Generate all possible substrings of length 1 to 8 in the text
    const substrings: string[] = [];
    const maxLen = 8;
    for (let i = 0; i < cleanText.length; i++) {
      for (let len = 1; len <= Math.min(maxLen, cleanText.length - i); len++) {
        substrings.push(cleanText.substring(i, i + len));
      }
    }

    if (substrings.length === 0) return [];

    // Query SQLite database for all substrings in a single query
    const placeholders = substrings.map(() => "?").join(",");
    const query = `SELECT traditional, simplified, pinyin, pinyin_accent, definitions FROM dictionary WHERE simplified IN (${placeholders}) OR traditional IN (${placeholders})`;
    
    // We bind the parameters twice (once for simplified match, once for traditional match)
    const params = [...substrings, ...substrings];
    const stmt = db.prepare(query);
    stmt.bind(params);

    const wordMap: Record<string, any[]> = {};
    while (stmt.step()) {
      const row = stmt.get();
      const traditional = row[0] as string;
      const simplified = row[1] as string;
      const pinyin = row[2] as string;
      const pinyin_accent = row[3] as string;
      const definitions_json = row[4] as string;

      let definitions: string[];
      try {
        definitions = JSON.parse(definitions_json);
      } catch {
        definitions = [definitions_json];
      }

      const entry = { traditional, simplified, pinyin, pinyin_accent, definitions };

      // Map by simplified
      if (!wordMap[simplified]) wordMap[simplified] = [];
      wordMap[simplified].push(entry);

      // Map by traditional
      if (traditional !== simplified) {
        if (!wordMap[traditional]) wordMap[traditional] = [];
        wordMap[traditional].push(entry);
      }
    }
    stmt.free();

    // Segment input using Maximum Forward Matching on matched dictionary keys
    const result: WebTranslation[] = [];
    let remaining = cleanText;

    while (remaining.length > 0) {
      let matched = false;
      for (let len = Math.min(maxLen, remaining.length); len >= 1; len--) {
        const sub = remaining.substring(0, len);
        if (wordMap[sub]) {
          result.push({
            word: sub,
            entries: wordMap[sub],
          });
          remaining = remaining.substring(len);
          matched = true;
          break;
        }
      }

      if (!matched) {
        const char = remaining.substring(0, 1);
        result.push({
          word: char,
          entries: wordMap[char] || [],
        });
        remaining = remaining.substring(1);
      }
    }

    return result;
  } catch (err) {
    console.error("Web lookup query failed:", err);
    return [];
  }
}
