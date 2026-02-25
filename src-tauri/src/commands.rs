use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::timer::{TimerState, start_timer_logic};
use log::info;

#[tauri::command]
pub async fn start_timer_cmd(
    app: tauri::AppHandle,
    state: State<'_, Arc<Mutex<TimerState>>>,
    seconds: u32
) -> Result<(), String> {
    {
        let mut s = state.lock().await;
        s.seconds_remaining = seconds;
    }
    let state_clone = state.inner().clone();
    tokio::spawn(start_timer_logic(state_clone, app));
    Ok(())
}

#[tauri::command]
pub async fn stop_timer_cmd(state: State<'_, Arc<Mutex<TimerState>>>) -> Result<(), String> {
    let mut s = state.lock().await;
    s.running = false;
    info!("EVENT: TIMER_STOPPED_BY_USER");
    Ok(())
}