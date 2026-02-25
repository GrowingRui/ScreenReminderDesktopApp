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
        // 1. 初始化全局状态
        .manage(Arc::new(Mutex::new(TimerState::new())))
        // 2. 初始化日志（在 setup 中获取正确的系统路径）
        .setup(|app| {
            let log_dir = app.path_resolver().app_log_dir()
                .unwrap_or_else(|| std::env::current_dir().unwrap());
            logger::init_logger(log_dir);
            log::info!("EVENT: APP_START");
            Ok(())
        })
        // 3. 配置系统托盘
        .system_tray(SystemTray::new().with_menu(
            SystemTrayMenu::new()
                .add_item(CustomMenuItem::new("show".to_string(), "显示窗口"))
                .add_item(CustomMenuItem::new("quit".to_string(), "完全退出"))
        ))
        .on_system_tray_event(|app, event| {
            if let tauri::SystemTrayEvent::MenuItemClick { id, .. } = event {
                match id.as_str() {
                    "quit" => {
                        log::info!("EVENT: APP_EXIT");
                        std::process::exit(0);
                    }
                    "show" => {
                        let window = app.get_window("main").unwrap();
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                    _ => {}
                }
            }
        })
        // 4. 注册前后端通信指令
        .invoke_handler(tauri::generate_handler![
            commands::start_timer_cmd,
            commands::stop_timer_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}