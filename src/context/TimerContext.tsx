import React, { createContext, useState, ReactNode } from "react";

interface TimerContextType {
  seconds: number;
  setSeconds: React.Dispatch<React.SetStateAction<number>>;
  isAlert: boolean;
  setIsAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

// 使用接口且初始为 null，但在 Provider 中保证不为 null
export const TimerContext = createContext<TimerContextType | null>(null);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [seconds, setSeconds] = useState(1800);
  const [isAlert, setIsAlert] = useState(false);

  return (
    <TimerContext.Provider value={{ seconds, setSeconds, isAlert, setIsAlert }}>
      {children}
    </TimerContext.Provider>
  );
};