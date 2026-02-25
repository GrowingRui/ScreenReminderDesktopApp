import { useContext } from "react";
// ❗ 明确导入 Provider 和 Context
import { TimerContext, TimerProvider } from "./context/TimerContext";
import { useTauriEvents } from "./hooks/useTauriEvents";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window"; // 🟢 导入窗口 API

// 内部业务组件
function InnerApp() {
  useTauriEvents();
  const context = useContext(TimerContext);
  if (!context) return null;

  const { seconds, isAlert, setIsAlert } = context;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    // 🟢 背景改为白色 (bg-white)，文字改为深色 (text-slate-900)，边框加深
    // 🟢 重新将拖拽区域直接写在最外层 div
    <div
      data-tauri-drag-region
      className="h-screen w-screen flex flex-col items-center justify-center bg-white text-slate-900 p-8 rounded-3xl select-none relative border-2 border-slate-200 shadow-2xl"
    >
      {/* 功能按钮：使用 pointer-events-auto 确保在拖拽区域上方仍可点击 */}
      <div className="absolute top-5 right-5 flex space-x-3 z-50 pointer-events-auto">
        <button
          onClick={() => appWindow.minimize()}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all"
        >
          _
        </button>
        <button
          onClick={() => appWindow.hide()}
          className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-all"
        >
          ✕
        </button>
      </div>

      <header className="mb-6 pointer-events-none">
        <h1 className="text-lg font-black tracking-widest text-slate-400">
          SCREEN REMINDER
        </h1>
      </header>

      <main className="flex flex-col items-center w-full pointer-events-none">
        <div className="text-8xl font-mono font-black mb-10 tracking-tighter text-slate-800 tabular-nums">
          {formatTime(seconds)}
        </div>

        {/* 按钮组需要恢复点击 */}
        <div className="flex flex-col space-y-3 w-full px-4 pointer-events-auto">
          <div className="flex space-x-3">
            <button
              onClick={() => invoke("start_timer_cmd", { seconds: 1200 })}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              20 Min
            </button>
            <button
              onClick={() => invoke("start_timer_cmd", { seconds: 1800 })}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-300"
            >
              30 Min
            </button>
          </div>

          <button
            onClick={() => invoke("stop_timer_cmd")}
            className="w-full bg-white hover:bg-slate-50 text-slate-600 py-3 rounded-2xl font-bold transition-all active:scale-95 border-2 border-slate-100"
          >
            PAUSE / RESET
          </button>
        </div>
      </main>

      {/* 提醒遮罩层 */}
      {isAlert && (
        <div className="absolute inset-0 bg-indigo-600 flex flex-col items-center justify-center z-[100] rounded-3xl">
          <h2 className="text-4xl font-black text-white mb-8">REST TIME!</h2>
          <button
            onClick={() => setIsAlert(false)}
            className="bg-white text-indigo-600 px-12 py-4 rounded-full font-black text-xl shadow-xl active:scale-95"
          >
            I'M BACK
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