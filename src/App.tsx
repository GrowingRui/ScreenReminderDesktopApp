import { useContext, useState, useEffect } from "react";
import { TimerContext, TimerProvider } from "./context/TimerContext";
import { useTauriEvents } from "./hooks/useTauriEvents";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";

function InnerApp() {
  useTauriEvents();
  const context = useContext(TimerContext);

  const [activeType, setActiveType] = useState("water");
  const [customMin, setCustomMin] = useState("30");
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [reminders, setReminders] = useState<string[]>([
    "water",
    "eye",
    "long_sitting"
  ]);

  const [newName, setNewName] = useState("");
  const [newMinutes, setNewMinutes] = useState("");

  if (!context) return null;
  const { seconds, setSeconds } = context;

  useEffect(() => {
    invoke("get_stats_cmd").then((res: any) => {
      if (res?.counts) setStats(res.counts);
    });
  }, []);

  const handleStart = () => {
    invoke("start_timer_cmd", {
      timerType: activeType,
      customMinutes: parseInt(customMin)
    });
  };

  const handlePause = () => {
    invoke("stop_timer_cmd");
  };

  const handleReset = () => {
    invoke("reset_timer_cmd");
    setSeconds(0);
  };

  const toggleLoop = () => {
    const newVal = !loopEnabled;
    setLoopEnabled(newVal);
    invoke("toggle_loop_cmd", { enabled: newVal });
  };

  const handleAddReminder = () => {
    if (!newName || !newMinutes) return;

    invoke("add_reminder_cmd", {
      name: newName,
      minutes: parseInt(newMinutes)
    });

    setReminders([...reminders, newName]);
    setNewName("");
    setNewMinutes("");
  };

  return (
    <div
      data-tauri-drag-region
      className="h-screen w-screen bg-[#121212] text-white flex flex-col rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl select-none font-sans"
    >
      {/* 顶部栏 */}
      <div
        data-tauri-drag-region
        className="h-14 flex items-center justify-between px-6 bg-black/30"
      >
        <span className="text-xs tracking-widest text-white/40 uppercase">
          SCREEN REMINDER
        </span>
        <div className="flex space-x-3 pointer-events-auto">
          <button
            onClick={() => appWindow.minimize()}
            className="text-white/40 hover:text-white"
          >
            _
          </button>
          <button
            onClick={() => appWindow.hide()}
            className="text-red-500/60 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col space-y-6 pointer-events-none">
        {/* 提醒类型选择 */}
        <div className="pointer-events-auto space-y-2">
          {reminders.map((type) => (
            <div
              key={type}
              onClick={() => setActiveType(type)}
              className={`p-3 rounded-xl cursor-pointer border transition ${
                activeType === type
                  ? "bg-white/10 border-white/20"
                  : "bg-transparent border-transparent opacity-40 hover:opacity-100"
              }`}
            >
              <div className="flex justify-between">
                <span className="font-bold text-sm">{type}</span>
                <span className="text-xs text-white/40">
                  Done: {stats[type] || 0}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 计时器 */}
        <div className="flex-1 bg-gradient-to-br from-[#1E1E1E] to-[#121212] rounded-[2rem] border border-white/5 flex flex-col items-center justify-center p-6 pointer-events-auto">
          <div className="text-[4.5rem] font-mono font-thin tracking-tighter mb-6">
            {Math.floor(seconds / 60)
              .toString()
              .padStart(2, "0")}
            :
            {(seconds % 60).toString().padStart(2, "0")}
          </div>

          {/* 自定义时间 */}
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-xs text-white/40 uppercase">
              Interval
            </span>
            <input
              type="number"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              className="w-16 text-center bg-black/30 rounded-lg py-1"
            />
            <span className="text-xs text-white/40 uppercase">
              Min
            </span>
          </div>

          {/* 控制按钮 */}
          <div className="flex space-x-3 w-full">
            <button
              onClick={handleStart}
              className="flex-1 bg-white text-black py-3 rounded-xl font-bold"
            >
              Start / Resume
            </button>
            <button
              onClick={handlePause}
              className="flex-1 bg-white/10 py-3 rounded-xl"
            >
              Pause
            </button>
          </div>

          <button
            onClick={handleReset}
            className="mt-4 text-xs text-white/40 hover:text-white"
          >
            Reset
          </button>

          {/* 循环开关 */}
          <button
            onClick={toggleLoop}
            className="mt-4 text-xs text-white/60 hover:text-white"
          >
            Loop: {loopEnabled ? "ON" : "OFF"}
          </button>
        </div>

        {/* 添加自定义提醒 */}
        <div className="pointer-events-auto bg-black/30 p-4 rounded-xl">
          <div className="text-xs mb-2 text-white/40 uppercase">
            Add Reminder
          </div>
          <div className="flex space-x-2">
            <input
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-black/40 px-2 py-1 rounded"
            />
            <input
              placeholder="Minutes"
              type="number"
              value={newMinutes}
              onChange={(e) => setNewMinutes(e.target.value)}
              className="w-20 bg-black/40 px-2 py-1 rounded"
            />
            <button
              onClick={handleAddReminder}
              className="bg-white text-black px-3 rounded"
            >
              Add
            </button>
          </div>
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