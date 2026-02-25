import { useEffect, useContext } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { TimerContext } from "../context/TimerContext";

export const useTauriEvents = () => {
  const context = useContext(TimerContext);

  useEffect(() => {
    // 🟡 严谨的 Guard 模式
    if (!context) return;

    let unlistenTick: UnlistenFn | null = null;
    let unlistenAlert: UnlistenFn | null = null;

    const setupListeners = async () => {
      // 记录 tick 事件
      unlistenTick = await listen<number>("tick", (event) => {
        context.setSeconds(event.payload);
      });

      // 记录提醒事件
      unlistenAlert = await listen<string>("reminder_alert", () => {
        context.setIsAlert(true);
      });
    };

    setupListeners();

    // 🟢 完美的清理函数
    return () => {
      if (unlistenTick) unlistenTick();
      if (unlistenAlert) unlistenAlert();
    };
  }, []); // 🟢 依赖项设为空，监听器只在挂载时创建一次
};