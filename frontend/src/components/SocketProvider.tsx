"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSocket } from "../hooks/useSocket";

type SocketActions = ReturnType<typeof useSocket>;

const SocketContext = createContext<SocketActions | null>(null);

export function useSocketActions(): SocketActions {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketActions must be used within SocketProvider');
  return ctx;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const actions = useSocket();
  return (
    <SocketContext.Provider value={actions}>
      {children}
    </SocketContext.Provider>
  );
}
