import { useEffect, useContext } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { TimerContext } from "../context/TimerContext";

export const useTauriEvents = () => {
  const context = useContext(TimerContext);
  if (!context) return; // 容错处理

  const { setSeconds, setIsAlert } = context;

  useEffect(() => {
    let unlistenTick: UnlistenFn;
    let unlistenAlert: UnlistenFn;

    // 监听 Rust 发送的秒数更新
    const setupListeners = async () => {
      unlistenTick = await listen<number>("tick", (event) => {
        setSeconds(event.payload);
      });

      unlistenAlert = await listen<string>("reminder_alert", () => {
        setIsAlert(true);
      });
    };

    setupListeners();

    // Cleanup: 卸载时取消监听，防止内存泄漏
    return () => {
      if (unlistenTick) unlistenTick();
      if (unlistenAlert) unlistenAlert();
    };
  }, [setSeconds, setIsAlert]);
};