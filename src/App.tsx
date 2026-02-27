import { useContext, useState, useEffect } from "react";
import { TimerContext, TimerProvider } from "./context/TimerContext";
import { useTauriEvents } from "./hooks/useTauriEvents";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

type ReminderType = "water" | "eye" | "long_sitting";

function InnerApp() {
  useTauriEvents();
  const context = useContext(TimerContext);
  const [activeType, setActiveType] = useState<ReminderType>("water");
  const [customMin, setCustomMin] = useState("20");
  const [stats, setStats] = useState({ water: 0, eye: 0, long_sitting: 0 });

  if (!context) return null;
  const { seconds, setSeconds } = context;

  useEffect(() => {
    invoke("get_stats_cmd").then((res: any) => setStats(res));
    const unlistenStats = listen("stats-update", (event: any) => setStats(event.payload));
    const unlistenFinish = listen("timer-finished", (type: any) => {
      new Notification("SCREEN REMINDER", { body: `Time to ${type.payload}!` });
    });
    return () => {
      unlistenStats.then(f => f());
      unlistenFinish.then(f => f());
    };
  }, []);

  const handleStart = () => {
    // 关键逻辑：如果 seconds > 0 说明是恢复，否则读取输入框
    const startSec = seconds > 0 ? seconds : parseInt(customMin) * 60;
    invoke("start_timer_cmd", { seconds: startSec, timerType: activeType });
  };

  const handleReset = () => {
    invoke("stop_timer_cmd");
    setSeconds(0);
  };

  return (
    <div
      data-tauri-drag-region
      className="h-screen w-screen bg-[#121212] text-white flex flex-col rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl select-none font-sans"
    >
      {/* 顶部标题栏 - 名字修正 */}
      <div data-tauri-drag-region className="h-14 flex items-center justify-between px-8 bg-black/20">
        <span className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase pointer-events-none">SCREEN REMINDER</span>
        <div className="flex space-x-3 pointer-events-auto">
          <button onClick={() => appWindow.minimize()} className="text-white/40 hover:text-white transition-colors">_</button>
          <button onClick={() => appWindow.hide()} className="text-red-500/60 hover:text-red-500 transition-colors">✕</button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col space-y-6 pointer-events-none">
        {/* 类型卡片 - 改为深色高级感 */}
        <div className="grid grid-cols-1 gap-3 pointer-events-auto">
          {[
            { id: "water", label: "定时喝水", icon: "💧", count: stats.water },
            { id: "eye", label: "远眺护眼", icon: "👁️", count: stats.eye },
            { id: "long_sitting", label: "久坐活动", icon: "🏃", count: stats.long_sitting },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => { handleReset(); setActiveType(item.id as ReminderType); }}
              className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${
                activeType === item.id ? 'bg-white/10 border-white/20' : 'bg-transparent border-transparent opacity-40 hover:opacity-100'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded-lg uppercase">Done: {item.count}</span>
            </div>
          ))}
        </div>

        {/* 计时器核心面板 - 极简主义设计 */}
        <div className="flex-1 bg-gradient-to-br from-[#1E1E1E] to-[#121212] rounded-[2rem] border border-white/5 flex flex-col items-center justify-center p-8 pointer-events-auto relative">
          <div className="text-[5.5rem] font-mono font-thin tracking-tighter tabular-nums leading-none mb-6">
            {Math.floor(seconds / 60).toString().padStart(2, '0')}:
            {(seconds % 60).toString().padStart(2, '0')}
          </div>

          <div className="flex items-center space-x-4 mb-8 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Interval</span>
            <input
              type="number"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              className="w-12 text-center bg-transparent border-none font-bold text-white focus:ring-0 text-lg"
              disabled={seconds > 0}
            />
            <span className="text-[10px] font-bold text-white/30 uppercase">Min</span>
          </div>

          <div className="flex space-x-3 w-full">
            <button
              onClick={handleStart}
              className="flex-[2] bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/5"
            >
              {seconds > 0 ? "Resume" : "Start Tracking"}
            </button>
            <button
              onClick={() => invoke("stop_timer_cmd")}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold text-xs uppercase transition-all"
            >
              Pause
            </button>
          </div>

          <button onClick={handleReset} className="mt-6 text-[9px] font-bold text-white/20 hover:text-white/60 transition-colors uppercase tracking-[0.3em]">Reset Session</button>
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