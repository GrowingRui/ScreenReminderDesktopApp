use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ReminderStats {
    pub water: u32,
    pub eye: u32,
    pub move_body: u32,
    pub breath: u32,
}

pub struct TimerState {
    pub seconds_remaining: u32,
    pub running: bool,
    pub stats: ReminderStats,
    // 如果你还需要统计总会话数，可以保留这个：
    pub session_count: u32,
}

impl TimerState {
    pub fn new() -> Self {
        Self {
            seconds_remaining: 0,
            running: false,
            session_count: 0,
            stats: ReminderStats {
                water: 0,
                eye: 0,
                move_body: 0,
                breath: 0,
            },
        }
    }
}