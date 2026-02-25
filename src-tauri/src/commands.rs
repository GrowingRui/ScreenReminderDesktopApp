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
        s.total_seconds = seconds; // 🟢 同步更新总时长，确保 UI 和逻辑一致
    }
    let state_clone = state.inner().clone();
    // 使用 Tauri 推荐的托管运行时
    async_runtime::spawn(start_timer_logic(state_clone, app));
    Ok(())
}

#[tauri::command]
pub async fn stop_timer_cmd(state: State<'_, Arc<Mutex<TimerState>>>) -> Result<(), String> {
    let mut s = state.lock().await;
    s.running = false;
    Ok(())
}