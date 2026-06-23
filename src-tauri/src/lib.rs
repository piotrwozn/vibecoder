use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    process::Command,
};

use tauri::{AppHandle, Manager, WindowEvent};

const SAVE_FILE: &str = "vibecoder_save.json";
const TEMP_FILE: &str = "vibecoder_save.json.tmp";
const BACKUP_COUNT: usize = 3;
const CORRUPT_BACKUP_COUNT: usize = 3;

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

    fs::rename(&temp_path, &path).map_err(|error| format!("save commit failed: {error}"))
}

#[tauri::command]
fn backup_corrupt_save(app: AppHandle, data: String, timestamp_ms: i64) -> Result<(), String> {
    let dir = save_dir(&app)?;
    let name = format!("{SAVE_FILE}.corrupt.{}", timestamp_ms.max(0));
    write_synced(&dir.join(name), data.as_bytes())?;
    prune_corrupt_backups(&dir, CORRUPT_BACKUP_COUNT)
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
fn load_backup(app: AppHandle, name: String) -> Result<Option<String>, String> {
    if !is_backup_name(&name) {
        return Err("backup name rejected".into());
    }

    let path = save_dir(&app)?.join(name);

    match fs::read_to_string(path) {
        Ok(data) => Ok(Some(data)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("backup load failed: {error}")),
    }
}

#[tauri::command]
fn export_file(app: AppHandle, name: String, data: String) -> Result<(), String> {
    let dir = save_dir(&app)?;
    let safe_name = sanitize_export_name(&name);

    if is_reserved_export_name(&safe_name) {
        return Err("export name rejected".into());
    }

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
    if !is_safe_external_url(&url) {
        return Err("external URL rejected".into());
    }

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut command = Command::new("explorer");
        command.arg(&url);
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

fn is_safe_external_url(url: &str) -> bool {
    if url
        .chars()
        .any(|character| character.is_control() || character.is_whitespace())
    {
        return false;
    }

    let rest = if let Some(rest) = url.strip_prefix("https://") {
        rest
    } else if let Some(rest) = url.strip_prefix("http://") {
        rest
    } else {
        return false;
    };

    let authority = rest.split(['/', '?', '#']).next().unwrap_or_default();

    !authority.is_empty() && !authority.contains(['[', ']'])
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
            backup_corrupt_save,
            export_file,
            list_backups,
            load_backup,
            load_save,
            open_external,
            quit_app,
            save_game,
            set_window_title
        ])
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if let Some(webview) = window.app_handle().get_webview_window(window.label()) {
                    let _ = webview.eval("window.__VIBECODER_HANDLE_CLOSE_REQUEST__?.()");
                }
            }
        })
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
                fs::remove_file(&to).map_err(|error| format!("backup rotation failed: {error}"))?;
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

fn is_backup_name(name: &str) -> bool {
    (1..=BACKUP_COUNT).any(|index| name == backup_name(index))
}

fn prune_corrupt_backups(dir: &Path, keep: usize) -> Result<(), String> {
    let prefix = format!("{SAVE_FILE}.corrupt.");
    let mut corrupt_files = Vec::new();

    for entry in
        fs::read_dir(dir).map_err(|error| format!("corrupt backup scan failed: {error}"))?
    {
        let entry = entry.map_err(|error| format!("corrupt backup scan failed: {error}"))?;
        let name = entry.file_name().to_string_lossy().to_string();

        if !name.starts_with(&prefix) {
            continue;
        }

        let timestamp = name[prefix.len()..].parse::<i64>().unwrap_or(0);
        corrupt_files.push((timestamp, entry.path()));
    }

    corrupt_files.sort_by(|left, right| right.0.cmp(&left.0));

    for (_, path) in corrupt_files.into_iter().skip(keep) {
        fs::remove_file(path).map_err(|error| format!("corrupt backup prune failed: {error}"))?;
    }

    Ok(())
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

fn is_reserved_export_name(name: &str) -> bool {
    let name = name.to_ascii_lowercase();
    let save_file = SAVE_FILE.to_ascii_lowercase();
    let temp_file = TEMP_FILE.to_ascii_lowercase();
    let corrupt_prefix = format!("{SAVE_FILE}.corrupt.");
    let corrupt_prefix = corrupt_prefix.to_ascii_lowercase();
    name == save_file
        || name == temp_file
        || is_backup_name(&name)
        || name.starts_with(&corrupt_prefix)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        env,
        time::{SystemTime, UNIX_EPOCH},
    };

    #[test]
    fn prune_corrupt_backups_keeps_the_newest_entries() {
        let dir = unique_temp_dir();
        fs::create_dir_all(&dir).expect("create temp save dir");

        for timestamp in [1, 2, 3, 4] {
            fs::write(
                dir.join(format!("{SAVE_FILE}.corrupt.{timestamp}")),
                format!("bad {timestamp}"),
            )
            .expect("write corrupt sidecar");
        }

        prune_corrupt_backups(&dir, 3).expect("prune corrupt sidecars");

        let mut names = fs::read_dir(&dir)
            .expect("read temp save dir")
            .map(|entry| {
                entry
                    .expect("read temp entry")
                    .file_name()
                    .to_string_lossy()
                    .to_string()
            })
            .collect::<Vec<_>>();
        names.sort();

        assert_eq!(
            names,
            vec![
                format!("{SAVE_FILE}.corrupt.2"),
                format!("{SAVE_FILE}.corrupt.3"),
                format!("{SAVE_FILE}.corrupt.4"),
            ]
        );

        fs::remove_dir_all(dir).expect("remove temp save dir");
    }

    #[test]
    fn external_url_allows_query_strings_without_shell_filtering() {
        assert!(is_safe_external_url(
            "https://example.com/search?a=1&b=two%20words"
        ));
        assert!(is_safe_external_url("http://example.com/path?q=a^b|c\"d'"));
    }

    #[test]
    fn external_url_still_rejects_non_web_schemes_and_control_chars() {
        assert!(!is_safe_external_url("file:///etc/passwd"));
        assert!(!is_safe_external_url("https://example.com/\ncalc"));
        assert!(!is_safe_external_url("https://example.com/\0calc"));
    }

    #[test]
    fn external_url_rejects_invalid_http_urls() {
        assert!(!is_safe_external_url("https://"));
        assert!(!is_safe_external_url("http://[::1"));
        assert!(!is_safe_external_url("https://exa mple.com"));
    }

    #[test]
    fn export_file_rejects_reserved_save_names() {
        assert!(is_reserved_export_name(SAVE_FILE));
        assert!(is_reserved_export_name("VIBECODER_SAVE.JSON"));
        assert!(is_reserved_export_name(TEMP_FILE));
        assert!(is_reserved_export_name(&backup_name(1)));
        assert!(is_reserved_export_name(&format!("{SAVE_FILE}.corrupt.1")));
        assert!(!is_reserved_export_name(&sanitize_export_name(
            "manual-export.txt"
        )));
    }

    fn unique_temp_dir() -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock")
            .as_nanos();
        env::temp_dir().join(format!("vibecoder_corrupt_backup_test_{nanos}"))
    }
}
