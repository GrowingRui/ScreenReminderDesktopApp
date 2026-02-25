import { useContext } from "react";
// ❗ 明确导入 Provider 和 Context
import { TimerContext, TimerProvider } from "./context/TimerContext";
import { useTauriEvents } from "./hooks/useTauriEvents";
import { invoke } from "@tauri-apps/api/tauri";

// 内部业务组件
function InnerApp() {
  useTauriEvents(); // 激活监听

  const context = useContext(TimerContext);

  // 类型保护
  if (!context) {
    return <div className="text-white">Error: Context not found</div>;
  }

  const { seconds, isAlert, setIsAlert } = context;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  const handleStart = (targetSeconds: number) => {
    // 调用 Rust 命令，传入自定义时长
    invoke("start_timer_cmd", { seconds: targetSeconds }).catch(console.error);
  };

  const handleStop = () => {
    invoke("stop_timer_cmd").catch(console.error);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-xl text-white p-8 border border-white/10 rounded-[2rem] select-none">
      <header className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Screen Reminder
        </h1>
      </header>

      <main className="flex flex-col items-center">
        <div className="text-7xl font-mono font-black mb-12 tracking-tighter drop-shadow-2xl">
          {formatTime(seconds)}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => handleStart(1200)}
            className="bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-full transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            20 Min
          </button>
          <button
            onClick={() => handleStart(1800)}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-full transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            30 Min
          </button>
          <button
            onClick={handleStop}
            className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-full transition-all active:scale-95"
          >
            Pause
          </button>
        </div>
      </main>

      {/* 弹窗提醒层 */}
      {isAlert && (
        <div className="absolute inset-0 bg-blue-600 flex flex-col items-center justify-center animate-in zoom-in duration-300 z-50">
          <h2 className="text-4xl font-black mb-8 animate-bounce">Time to Rest! 🥤</h2>
          <button
            onClick={() => setIsAlert(false)}
            className="bg-white text-blue-600 px-10 py-4 rounded-full font-bold text-xl shadow-2xl active:scale-95"
          >
            I'm Back
          </button>
        </div>
      )}
    </div>
  );
}

// 根入口：负责提供 Context
export default function App() {
  return (
    <TimerProvider>
      <InnerApp />
    </TimerProvider>
  );
}