use fern::Dispatch;
use log::LevelFilter;
use chrono::Local;
use std::path::PathBuf;

pub fn init_logger(log_dir: PathBuf) {
    if !log_dir.exists() {
        let _ = std::fs::create_dir_all(&log_dir);
    }
    let log_file = log_dir.join("app_event.log");

    Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "{} [{}] - {}",
                Local::now().format("%Y-%m-%d %H:%M:%S"),
                record.level(),
                message
            ))
        })
        .level(LevelFilter::Info)
        .chain(std::io::stdout())
        .chain(fern::log_file(log_file).expect("Could not create log file"))
        .apply()
        .expect("Could not init logger");
}