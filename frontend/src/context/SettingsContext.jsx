import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  applySettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "../lib/settings.js";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => loadSettings());

  useEffect(() => {
    applySettings(settings);
    saveSettings(settings);
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      updateSetting: (key, next) =>
        setSettings((prev) => ({ ...prev, [key]: next })),
      resetSettings: () => setSettings({ ...DEFAULT_SETTINGS }),
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
