use serde::{Serialize, Deserialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ReminderConfig {
    pub interval_minutes: u32,
    pub enabled: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ReminderStats {
    pub counts: HashMap<String, u32>,
}

pub struct TimerState {
    pub seconds_remaining: u32,
    pub running: bool,
    pub active_type: Option<String>,
    pub loop_enabled: bool,
    pub configs: HashMap<String, ReminderConfig>,
    pub stats: ReminderStats,
}

impl TimerState {
    pub fn new() -> Self {
        let mut configs = HashMap::new();

        configs.insert("water".into(), ReminderConfig { interval_minutes: 30, enabled: true });
        configs.insert("eye".into(), ReminderConfig { interval_minutes: 60, enabled: true });
        configs.insert("long_sitting".into(), ReminderConfig { interval_minutes: 45, enabled: true });

        Self {
            seconds_remaining: 0,
            running: false,
            active_type: None,
            loop_enabled: true,
            configs,
            stats: ReminderStats {
                counts: HashMap::new(),
            },
        }
    }
}