#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod timer;
mod logger;
mod commands;

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{SystemTray, SystemTrayMenu, CustomMenuItem, Manager};
use timer::TimerState;

fn main() {
    tauri::Builder::default()
        .manage(Arc::new(Mutex::new(TimerState::new())))
        .setup(|app| {
            let log_dir = app.path_resolver().app_log_dir()
                .unwrap_or_else(|| std::env::current_dir().unwrap());
            logger::init_logger(log_dir);
            log::info!("EVENT: APP_START");
            Ok(())
        })
        .system_tray(SystemTray::new().with_menu(
            SystemTrayMenu::new()
                .add_item(CustomMenuItem::new("show".to_string(), "Show Window"))
                .add_item(CustomMenuItem::new("quit".to_string(), "Quit"))
        ))
        .on_system_tray_event(|app, event| {
            if let tauri::SystemTrayEvent::MenuItemClick { id, .. } = event {
                match id.as_str() {
                    "quit" => {
                        log::info!("EVENT: APP_EXIT");
                        app.exit(0); // 🟢 优雅退出，优于 std::process::exit
                    }
                    "show" => {
                        if let Some(window) = app.get_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_timer_cmd,
            commands::stop_timer_cmd,
            commands::get_stats_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}