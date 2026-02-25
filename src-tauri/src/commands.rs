use tauri::{State, AppHandle, async_runtime};
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::timer::{TimerState, start_timer_logic};

#[tauri::command]
pub async fn start_timer_cmd(
    app: AppHandle,
    state: State<'_, Arc<Mutex<TimerState>>>,
    seconds: u32
) -> Result<(), String> {
    {
        let mut s = state.lock().await;
        s.seconds_remaining = seconds;
    }
    let state_clone = state.inner().clone();
    // 使用 Tauri 推荐的 async_runtime
    async_runtime::spawn(start_timer_logic(state_clone, app));
    Ok(())
}

#[tauri::command]
pub async fn stop_timer_cmd(state: State<'_, Arc<Mutex<TimerState>>>) -> Result<(), String> {
    let mut s = state.lock().await;
    s.running = false;
    Ok(())
}