export const SETTINGS_STORAGE_KEY = "medivoice.settings";

export const TEXT_SIZE_PX = {
  normal: "16px",
  large: "18px",
  xlarge: "21px",
};

export const DEFAULT_SETTINGS = {
  defaultLanguage: "en", // "en" | "hi"
  autoRead: false,
  textSize: "normal", // "normal" | "large" | "xlarge"
  theme: "light", // "light" | "dark"
};

export function loadSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage failures (e.g. private mode)
  }
}

export function applySettings(settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.fontSize = TEXT_SIZE_PX[settings.textSize] || TEXT_SIZE_PX.normal;
  root.style.colorScheme = settings.theme;
  root.classList.toggle("dark", settings.theme === "dark");
}
