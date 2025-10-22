import React, { createContext, useContext } from "react";
import { logger } from "../utils/logger/Logger";

const LoggerContext = createContext(logger);
export const useLogger = () => useContext(LoggerContext);

export const LoggerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LoggerContext.Provider value={logger}>{children}</LoggerContext.Provider>
);
