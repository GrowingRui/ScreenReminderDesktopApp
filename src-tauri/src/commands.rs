use crate::timer::{TimerState, ReminderStats, ReminderConfig};
use tauri::{AppHandle, Manager, State};
use tauri::api::notification::Notification;
use std::sync::Arc;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn start_timer_cmd(
    timer_type: String,
    custom_minutes: Option<u32>,
    state: State<'_, Arc<Mutex<TimerState>>>,
    app: AppHandle
) -> Result<(), String> {

    let mut s = state.lock().await;

    if s.running {
        return Ok(()); // Resume 不重复创建线程
    }

    let minutes = if let Some(m) = custom_minutes {
        m
    } else {
        s.configs
            .get(&timer_type)
            .ok_or("Invalid type")?
            .interval_minutes
    };

    if s.seconds_remaining == 0 {
        s.seconds_remaining = minutes * 60;
    }

    s.running = true;
    s.active_type = Some(timer_type.clone());

    let state_clone = state.inner().clone();
    let app_clone = app.clone();

    tokio::spawn(async move {
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

            let mut s = state_clone.lock().await;

            if !s.running {
                break;
            }

            if s.seconds_remaining > 0 {
                s.seconds_remaining -= 1;
                let _ = app_clone.emit_all("tick", s.seconds_remaining);
            }

            if s.seconds_remaining == 0 {
                let t = s.active_type.clone().unwrap();

                *s.stats.counts.entry(t.clone()).or_insert(0) += 1;

                Notification::new(&app_clone.config().tauri.bundle.identifier)
                    .title("SCREEN REMINDER")
                    .body(&format!("Time to {}!", t))
                    .show()
                    .unwrap();

                let _ = app_clone.emit_all("stats-update", s.stats.clone());

                if s.loop_enabled {
                    let interval = s.configs.get(&t).unwrap().interval_minutes;
                    s.seconds_remaining = interval * 60;
                } else {
                    s.running = false;
                    break;
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_timer_cmd(
    state: State<'_, Arc<Mutex<TimerState>>>
) -> Result<(), String> {
    let mut s = state.lock().await;
    s.running = false;
    Ok(())
}

#[tauri::command]
pub async fn reset_timer_cmd(
    state: State<'_, Arc<Mutex<TimerState>>>
) -> Result<(), String> {
    let mut s = state.lock().await;
    s.running = false;
    s.seconds_remaining = 0;
    Ok(())
}

#[tauri::command]
pub async fn toggle_loop_cmd(
    enabled: bool,
    state: State<'_, Arc<Mutex<TimerState>>>
) -> Result<(), String> {
    let mut s = state.lock().await;
    s.loop_enabled = enabled;
    Ok(())
}

#[tauri::command]
pub async fn add_reminder_cmd(
    name: String,
    minutes: u32,
    state: State<'_, Arc<Mutex<TimerState>>>
) -> Result<(), String> {
    let mut s = state.lock().await;

    s.configs.insert(name, ReminderConfig {
        interval_minutes: minutes,
        enabled: true,
    });

    Ok(())
}

#[tauri::command]
pub async fn get_stats_cmd(
    state: State<'_, Arc<Mutex<TimerState>>>
) -> Result<ReminderStats, String> {
    let s = state.lock().await;
    Ok(s.stats.clone())
}