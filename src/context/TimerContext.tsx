import React, { createContext, useState, ReactNode } from "react";

// 定义强类型接口
interface TimerContextType {
  seconds: number;
  setSeconds: React.Dispatch<React.SetStateAction<number>>;
  isAlert: boolean;
  setIsAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [seconds, setSeconds] = useState(1800);
  const [isAlert, setIsAlert] = useState(false);

  return (
    <TimerContext.Provider value={{ seconds, setSeconds, isAlert, setIsAlert }}>
      {children}
    </TimerContext.Provider>
  );
};