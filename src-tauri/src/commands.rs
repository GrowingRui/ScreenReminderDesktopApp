use crate::timer::{TimerState, ReminderStats};
use tauri::{AppHandle, Manager, State};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::fs::OpenOptions;
use std::io::Write;
use chrono::Local;

#[tauri::command]
pub async fn start_timer_cmd(
    seconds: u32,
    timer_type: String,
    state: State<'_, Arc<Mutex<TimerState>>>,
    app: AppHandle
) -> Result<(), String> {
    let mut s = state.lock().await;
    s.seconds_remaining = seconds;

    if s.running { return Ok(()); }
    s.running = true;

    let state_clone = state.inner().clone();
    let app_clone = app.clone();

    tokio::spawn(async move {
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            let mut s = state_clone.lock().await;

            if !s.running { break; }

            if s.seconds_remaining > 0 {
                s.seconds_remaining -= 1;
                let _ = app_clone.emit_all("tick", s.seconds_remaining);
            }

            if s.seconds_remaining == 0 {
                s.running = false;
                s.session_count += 1;

                match timer_type.as_str() {
                    "water" => s.stats.water += 1,
                    "eye" => s.stats.eye += 1,
                    "move" => s.stats.move_body += 1,
                    "breath" => s.stats.breath += 1,
                    _ => {}
                }

                let log_entry = format!("{} | 完成提醒: {}\n", Local::now().format("%Y-%m-%d %H:%M:%S"), timer_type);
                if let Ok(mut file) = OpenOptions::new().append(true).create(true).open("reminder_history.txt") {
                    let _ = file.write_all(log_entry.as_bytes());
                }

                let _ = app_clone.emit_all("timer-finished", timer_type);
                let _ = app_clone.emit_all("stats-update", s.stats.clone());
                break;
            }
        }
    });
    Ok(())
}

#[tauri::command]
pub async fn stop_timer_cmd(state: State<'_, Arc<Mutex<TimerState>>>) -> Result<(), String> {
    let mut s = state.lock().await;
    s.running = false;
    Ok(())
}

#[tauri::command]
pub async fn get_stats_cmd(state: State<'_, Arc<Mutex<TimerState>>>) -> Result<ReminderStats, String> {
    let s = state.lock().await;
    Ok(s.stats.clone())
}