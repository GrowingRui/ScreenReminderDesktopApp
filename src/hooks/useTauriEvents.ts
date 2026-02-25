import { useEffect, useContext } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { TimerContext } from "../context/TimerContext";

export const useTauriEvents = () => {
  const context = useContext(TimerContext);

  useEffect(() => {
    let unlistenTick: UnlistenFn | null = null;
    let unlistenAlert: UnlistenFn | null = null;

    const setupListeners = async () => {
      unlistenTick = await listen<number>("tick", (event) => {
        context?.setSeconds(event.payload);
      });

      unlistenAlert = await listen<string>("reminder_alert", () => {
        context?.setIsAlert(true);
      });
    };

    setupListeners();

    return () => {
      if (unlistenTick) unlistenTick();
      if (unlistenAlert) unlistenAlert();
    };
  }, [context]);
};