use tokio::sync::Mutex;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tauri::{AppHandle, Manager};
use log::info;

pub struct TimerState {
    pub seconds_remaining: u32,
    pub running: bool,
    pub total_seconds: u32,
    pub session_count: u32,
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
        if s.running { return; } // 如果已经在跑了，就不重复开启
        s.running = true;
    }

    info!("EVENT: TIMER_STARTED");

    loop {
        {
            let mut s = state.lock().await;
            // 关键：如果用户点击了 Pause (running 为 false) 或者时间到了，就退出循环
            if !s.running || s.seconds_remaining == 0 {
                if s.seconds_remaining == 0 {
                    s.session_count += 1;
                    let _ = app.emit_all("reminder_alert", "Time to rest!");
                }
                s.running = false; // 确保状态同步
                break; // 结束当前协程任务
            }
            s.seconds_remaining -= 1;
            let _ = app.emit_all("tick", s.seconds_remaining);
        }
        sleep(Duration::from_secs(1)).await;
    }
}