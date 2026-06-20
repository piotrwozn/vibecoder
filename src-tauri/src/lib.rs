use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    process::Command,
};

use tauri::{AppHandle, Manager};

const SAVE_FILE: &str = "vibecoder_save.json";
const TEMP_FILE: &str = "vibecoder_save.json.tmp";
const BACKUP_COUNT: usize = 3;

#[tauri::command]
fn load_save(app: AppHandle) -> Result<Option<String>, String> {
    let path = save_path(&app)?;

    match fs::read_to_string(path) {
        Ok(data) => Ok(Some(data)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("save load failed: {error}")),
    }
}

#[tauri::command]
fn save_game(app: AppHandle, data: String) -> Result<(), String> {
    let dir = save_dir(&app)?;
    let path = dir.join(SAVE_FILE);
    let temp_path = dir.join(TEMP_FILE);

    write_synced(&temp_path, data.as_bytes())?;
    rotate_backups(&dir, &path)?;

    if path.exists() {
        fs::remove_file(&path).map_err(|error| format!("save replace failed: {error}"))?;
    }

    fs::rename(&temp_path, &path).map_err(|error| format!("save commit failed: {error}"))
}

#[tauri::command]
fn list_backups(app: AppHandle) -> Result<Vec<String>, String> {
    let dir = save_dir(&app)?;
    let mut backups = Vec::new();

    for index in 1..=BACKUP_COUNT {
        let name = backup_name(index);
        if dir.join(&name).exists() {
            backups.push(name);
        }
    }

    Ok(backups)
}

#[tauri::command]
fn export_file(app: AppHandle, name: String, data: String) -> Result<(), String> {
    let dir = save_dir(&app)?;
    let safe_name = sanitize_export_name(&name);
    write_synced(&dir.join(safe_name), data.as_bytes())
}

#[tauri::command]
fn set_window_title(app: AppHandle, title: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .set_title(&title)
            .map_err(|error| format!("title update failed: {error}"))?;
    }

    Ok(())
}

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    if !url.starts_with("https://") && !url.starts_with("http://") {
        return Err("external URL rejected".into());
    }

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut command = Command::new("cmd");
        command.args(["/C", "start", "", &url]);
        command
    };

    #[cfg(target_os = "macos")]
    let mut command = {
        let mut command = Command::new("open");
        command.arg(&url);
        command
    };

    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = {
        let mut command = Command::new("xdg-open");
        command.arg(&url);
        command
    };

    command
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("external open failed: {error}"))
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            export_file,
            list_backups,
            load_save,
            open_external,
            quit_app,
            save_game,
            set_window_title
        ])
        .run(tauri::generate_context!())
        .expect("error while running VIBECODER");
}

fn save_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("app data directory unavailable: {error}"))?;

    fs::create_dir_all(&dir).map_err(|error| format!("save directory unavailable: {error}"))?;
    Ok(dir)
}

fn save_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(save_dir(app)?.join(SAVE_FILE))
}

fn write_synced(path: &Path, data: &[u8]) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .create(true)
        .truncate(true)
        .write(true)
        .open(path)
        .map_err(|error| format!("file write failed: {error}"))?;

    file.write_all(data)
        .map_err(|error| format!("file write failed: {error}"))?;
    file.sync_all()
        .map_err(|error| format!("file sync failed: {error}"))
}

fn rotate_backups(dir: &Path, save_path: &Path) -> Result<(), String> {
    for index in (1..BACKUP_COUNT).rev() {
        let from = dir.join(backup_name(index));
        let to = dir.join(backup_name(index + 1));

        if from.exists() {
            if to.exists() {
                fs::remove_file(&to)
                    .map_err(|error| format!("backup rotation failed: {error}"))?;
            }

            fs::rename(&from, &to).map_err(|error| format!("backup rotation failed: {error}"))?;
        }
    }

    if save_path.exists() {
        fs::copy(save_path, dir.join(backup_name(1)))
            .map_err(|error| format!("backup copy failed: {error}"))?;
    }

    Ok(())
}

fn backup_name(index: usize) -> String {
    format!("{SAVE_FILE}.bak{index}")
}

fn sanitize_export_name(name: &str) -> String {
    let sanitized: String = name
        .chars()
        .filter(|character| {
            character.is_ascii_alphanumeric()
                || *character == '.'
                || *character == '-'
                || *character == '_'
        })
        .collect();

    if sanitized.is_empty() {
        "vibecoder_export.txt".into()
    } else {
        sanitized
    }
}
