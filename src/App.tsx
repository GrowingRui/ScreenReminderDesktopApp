import { useContext, useState, useEffect } from "react";
import { TimerContext, TimerProvider } from "./context/TimerContext";
import { useTauriEvents } from "./hooks/useTauriEvents";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

type ReminderType = "water" | "eye" | "move" | "breath";

function InnerApp() {
  useTauriEvents();
  const context = useContext(TimerContext);
  const [activeType, setActiveType] = useState<ReminderType>("water");
  const [customMin, setCustomMin] = useState("20");
  const [autoLoop, setAutoLoop] = useState(false);
  const [stats, setStats] = useState({ water: 0, eye: 0, move_body: 0, breath: 0 });

  if (!context) return null;
  const { seconds, setSeconds } = context;

  useEffect(() => {
    invoke("get_stats_cmd").then((res: any) => setStats(res));
    const unlistenStats = listen("stats-update", (event: any) => setStats(event.payload));
    const unlistenFinish = listen("timer-finished", (event: any) => {
      new Notification("Screen Reminder", { body: `完成一次 ${event.payload}！` });
      if (autoLoop) handleStart();
    });
    return () => {
      unlistenStats.then(f => f());
      unlistenFinish.then(f => f());
    };
  }, [autoLoop, activeType, customMin, seconds]);

  const handleStart = () => {
    // 如果当前有剩余秒数则继续，否则读取输入框
    const s = seconds > 0 ? seconds : parseInt(customMin) * 60;
    invoke("start_timer_cmd", { seconds: s, timerType: activeType });
  };

  const handleReset = () => {
    invoke("stop_timer_cmd");
    setSeconds(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  const menuItems = [
    { id: "water", label: "喝水", icon: "💧" },
    { id: "eye", label: "护眼", icon: "👁️" },
    { id: "move", label: "活动", icon: "🚶" },
    { id: "breath", label: "呼吸", icon: "🫁" },
  ];

  return (
    <div data-tauri-drag-region className="h-screen w-screen bg-white flex flex-col rounded-3xl overflow-hidden border border-slate-200 shadow-2xl select-none font-sans">
      <div data-tauri-drag-region className="h-12 flex items-center justify-between px-6 bg-slate-50/50 border-b border-slate-100">
        <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase pointer-events-none">Health Dashboard</span>
        <div className="flex space-x-3 pointer-events-auto">
          <button onClick={() => appWindow.minimize()} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors">_</button>
          <button onClick={() => appWindow.hide()} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 text-red-500 transition-colors">✕</button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col space-y-5 pointer-events-none">
        <div className="grid grid-cols-2 gap-3 pointer-events-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { handleReset(); setActiveType(item.id as ReminderType); }}
              className={`p-4 rounded-2xl flex items-center space-x-3 border-2 transition-all duration-200 ${
                activeType === item.id ? 'border-indigo-500 bg-white shadow-md' : 'border-transparent bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-700">{item.label}</div>
                <div className="text-[10px] font-medium text-slate-400">今日: {stats[item.id as keyof typeof stats] || 0}次</div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center p-8 pointer-events-auto relative">
          <div className="text-7xl font-mono font-black text-slate-800 tracking-tighter mb-4 tabular-nums">{formatTime(seconds)}</div>

          <div className="flex items-center space-x-3 mb-8 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <input
              type="number"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              className="w-14 text-center bg-transparent border-none font-black text-indigo-600 focus:ring-0 text-lg"
              disabled={seconds > 0}
            />
            <span className="text-[10px] font-bold text-slate-400 pr-2">MINUTES</span>
          </div>

          <div className="flex space-x-3 w-full">
            <button onClick={handleStart} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all">
              {seconds > 0 ? "RESUME" : "START"}
            </button>
            <button onClick={() => invoke("stop_timer_cmd")} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-4 rounded-2xl font-bold active:scale-95 transition-all">PAUSE</button>
          </div>

          <button onClick={handleReset} className="mt-4 text-[10px] font-bold text-slate-300 hover:text-slate-500 transition-colors uppercase tracking-widest">Reset Timer</button>
        </div>

        <div className="flex items-center justify-between px-2 pointer-events-auto">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={autoLoop} onChange={e => setAutoLoop(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">自动循环提醒</span>
          </label>
          <span className="text-[10px] font-bold text-indigo-400">LOGS ACTIVE</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TimerProvider>
      <InnerApp />
    </TimerProvider>
  );
}