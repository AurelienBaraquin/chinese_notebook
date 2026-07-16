use std::sync::Mutex;
use tauri::State;
use tauri::Manager;
use tauri::path::BaseDirectory;
use jieba_rs::Jieba;

#[derive(Debug, Clone, serde::Serialize)]
pub struct CedictEntry {
    pub traditional: String,
    pub simplified: String,
    pub pinyin: String,
    pub pinyin_accent: String,
    pub definitions: Vec<String>,
}

pub struct AppState {
    pub db: Mutex<rusqlite::Connection>,
    pub jieba: Jieba,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct WordTranslation {
    pub word: String,
    pub entries: Vec<CedictEntry>,
}

fn has_chinese(s: &str) -> bool {
    s.chars().any(|c| {
        let val = c as u32;
        (0x4e00..=0x9fff).contains(&val) || 
        (0x3400..=0x4dbf).contains(&val) || 
        (0xf900..=0xfaff).contains(&val)
    })
}

#[tauri::command]
fn translate_selection(text: String, state: State<'_, AppState>) -> Result<Vec<WordTranslation>, String> {
    let words = state.jieba.cut(&text, true);
    let mut results = Vec::new();
    
    let db = state.db.lock().map_err(|e| format!("Failed to lock database: {}", e))?;
    
    let mut stmt = db
        .prepare("SELECT traditional, simplified, pinyin, pinyin_accent, definitions FROM dictionary WHERE simplified = ?1 OR traditional = ?1")
        .map_err(|e| format!("Failed to prepare SQL query: {}", e))?;
        
    for word in words {
        let word_str = word.word.to_string();
        if word_str.trim().is_empty() || !has_chinese(&word_str) {
            continue;
        }
        let mut entries = Vec::new();
        
        let rows = stmt.query_map([&word_str], |row| {
            let traditional: String = row.get(0)?;
            let simplified: String = row.get(1)?;
            let pinyin: String = row.get(2)?;
            let pinyin_accent: String = row.get(3)?;
            let definitions_json: String = row.get(4)?;
            
            let definitions: Vec<String> = serde_json::from_str(&definitions_json)
                .unwrap_or_else(|_| vec![definitions_json.clone()]);
                
            Ok(CedictEntry {
                traditional,
                simplified,
                pinyin,
                pinyin_accent,
                definitions,
            })
        }).map_err(|e| format!("Database query error: {}", e))?;
        
        for row in rows {
            if let Ok(entry) = row {
                entries.push(entry);
            }
        }
        
        results.push(WordTranslation {
            word: word_str,
            entries,
        });
    }
    
    Ok(results)
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FileEntry {
    pub title: String,
    pub content: String,
    pub path: String,
}

#[tauri::command]
fn open_folder_dialog() -> Result<Vec<FileEntry>, String> {
    let folder = rfd::FileDialog::new()
        .pick_folder()
        .ok_or_else(|| "No folder selected".to_string())?;

    let mut files = Vec::new();
    let entries = std::fs::read_dir(folder).map_err(|e| e.to_string())?;
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if ext_str == "txt" || ext_str == "md" || ext_str == "html" {
                        let title = path.file_name().unwrap().to_string_lossy().into_owned();
                        let content = std::fs::read_to_string(&path).unwrap_or_default();

                        files.push(FileEntry {
                            title,
                            content,
                            path: path.to_string_lossy().into_owned(),
                        });
                    }
                }
            }
        }
    }
    Ok(files)
}

#[tauri::command]
fn save_file_as_dialog(content: String, default_name: String) -> Result<String, String> {
    let file_path = rfd::FileDialog::new()
        .set_file_name(&default_name)
        .add_filter("Text File", &["txt"])
        .add_filter("Markdown File", &["md"])
        .add_filter("HTML File", &["html"])
        .save_file()
        .ok_or_else(|| "Save cancelled".to_string())?;

    std::fs::write(&file_path, content).map_err(|e| e.to_string())?;
    Ok(file_path.to_string_lossy().into_owned())
}

#[tauri::command]
fn save_file_to_disk(path: String, content: String) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Resolve the path to our bundled SQLite database resource
            let mut db_path = app
                .path()
                .resolve("resources/cedict.db", BaseDirectory::Resource)
                .expect("Failed to resolve resource path for cedict.db");

            // Fallback for development (tauri dev) if resource resolver does not find it in target folders
            if !db_path.exists() {
                let local_paths = [
                    std::path::PathBuf::from("resources/cedict.db"),
                    std::path::PathBuf::from("src-tauri/resources/cedict.db"),
                    std::path::PathBuf::from("../src-tauri/resources/cedict.db"),
                ];
                
                for path in &local_paths {
                    if path.exists() {
                        db_path = path.clone();
                        break;
                    }
                }
            }

            // Open SQLite database in read-only mode to prevent errors in write-protected resource folders
            let db_conn = rusqlite::Connection::open_with_flags(
                db_path,
                rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY
            ).expect("Failed to open SQLite dictionary database as read-only");

            let jieba = Jieba::new();

            // Register state managed by Tauri
            app.manage(AppState {
                db: Mutex::new(db_conn),
                jieba,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            translate_selection,
            open_folder_dialog,
            save_file_as_dialog,
            save_file_to_disk
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_sqlite_lookup() {
        let db_path = std::path::Path::new("resources/cedict.db");
        assert!(db_path.exists(), "Database file does not exist at resources/cedict.db");
        
        let conn = rusqlite::Connection::open_with_flags(
            db_path,
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY
        ).expect("Failed to open SQLite database");
        
        let mut stmt = conn.prepare(
            "SELECT traditional, simplified, pinyin, pinyin_accent, definitions FROM dictionary WHERE simplified = ?1"
        ).expect("Failed to prepare query");
        
        let rows = stmt.query_map(["你"], |row| {
            let traditional: String = row.get(0)?;
            let simplified: String = row.get(1)?;
            let pinyin: String = row.get(2)?;
            let pinyin_accent: String = row.get(3)?;
            let definitions_json: String = row.get(4)?;
            Ok((traditional, simplified, pinyin, pinyin_accent, definitions_json))
        }).expect("Query failed");
        
        let results: Vec<_> = rows.filter_map(|r| r.ok()).collect();
        assert!(!results.is_empty(), "No results found for '你'");
        
        let (_, _, pinyin, pinyin_accent, defs_json) = &results[0];
        assert_eq!(pinyin, "ni3");
        assert_eq!(pinyin_accent, "nǐ");
        println!("Test success: Pinyin is {}, accented: {}, definitions: {}", pinyin, pinyin_accent, defs_json);
    }
}
