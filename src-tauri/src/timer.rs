use tokio::sync::Mutex;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tauri::{AppHandle, Manager};
use log::info;

pub struct TimerState {
    pub seconds_remaining: u32,
    pub running: bool,
    pub total_seconds: u32,     // 统计单次总时长
    pub session_count: u32,     // 统计今日提醒次数
}

impl TimerState {
    pub fn new() -> Self {
        Self {
            seconds_remaining: 1800,
            running: false,
            total_seconds: 1800,
            session_count: 0,
        }
    }
}

pub async fn start_timer_logic(state: Arc<Mutex<TimerState>>, app: AppHandle) {
    {
        let mut s = state.lock().await;
        if s.running { return; }
        s.running = true;
    }

    info!("EVENT: TIMER_STARTED");

    loop {
        {
            let mut s = state.lock().await;
            if !s.running || s.seconds_remaining == 0 {
                if s.seconds_remaining == 0 {
                    s.session_count += 1;
                    info!("EVENT: REMINDER_TRIGGERED (Total sessions: {})", s.session_count);
                    let _ = app.emit_all("reminder_alert", "Time to rest!");
                }
                s.running = false;
                break;
            }
            s.seconds_remaining -= 1;
            // 使用 let _ = 忽略错误，防止窗口关闭导致 panic
            let _ = app.emit_all("tick", s.seconds_remaining);
        }
        sleep(Duration::from_secs(1)).await;
    }
}