import { useState } from "react";

import { clearScans, isRestrictedError } from "../api/client.js";
import { useSettings } from "../context/SettingsContext.jsx";

function OptionGroup({ label, hint, value, options, onChange }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{label}</h3>
        {hint && <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
      <div
        role="radiogroup"
        aria-label={label}
        className="mt-2 inline-flex flex-wrap gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={`min-h-[40px] rounded-lg px-4 text-sm font-bold transition ${
                active
                  ? "bg-teal-700 text-white shadow"
                  : "text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{label}</h3>
        {hint && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 flex-none rounded-full border-2 transition ${
          checked
            ? "border-teal-700 bg-teal-600"
            : "border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            checked ? "left-6" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage({ onHistoryCleared }) {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleClearHistory = async () => {
    const confirmed = window.confirm(
      "Delete ALL saved scans? This cannot be undone.",
    );
    if (!confirmed) return;
    setClearing(true);
    setMessage(null);
    try {
      await clearScans();
      onHistoryCleared?.();
      setMessage({ type: "ok", text: "All saved scans were deleted." });
    } catch (err) {
      setMessage({
        type: "error",
        text: isRestrictedError(err)
          ? "Access restricted. Invalid demo passcode."
          : err.message,
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Settings</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          These preferences are saved on this device and applied to every scan.
        </p>

        <div className="mt-6 space-y-6">
          <OptionGroup
            label="Default language"
            hint="Applies to results and the voice"
            value={settings.defaultLanguage}
            onChange={(value) => updateSetting("defaultLanguage", value)}
            options={[
              { value: "en", label: "English" },
              { value: "hi", label: "हिंदी (Hindi)" },
            ]}
          />

          <ToggleRow
            label="Read out loud automatically"
            hint="Speak the summary as soon as a scan finishes"
            checked={settings.autoRead}
            onChange={(value) => updateSetting("autoRead", value)}
          />

          <OptionGroup
            label="Text size"
            hint="Make everything bigger for easier reading"
            value={settings.textSize}
            onChange={(value) => updateSetting("textSize", value)}
            options={[
              { value: "normal", label: "Normal" },
              { value: "large", label: "Large" },
              { value: "xlarge", label: "Extra large" },
            ]}
          />

          <OptionGroup
            label="Theme"
            value={settings.theme}
            onChange={(value) => updateSetting("theme", value)}
            options={[
              { value: "light", label: "☀️ Light" },
              { value: "dark", label: "🌙 Dark" },
            ]}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t-2 border-slate-100 pt-5 dark:border-slate-700">
          <button
            type="button"
            onClick={resetSettings}
            className="min-h-[44px] rounded-xl border-2 border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Reset to defaults
          </button>
          <span className="self-center text-xs text-slate-500 dark:text-slate-400">
            Defaults: English, no auto-read, normal text, light theme
          </span>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-red-200 bg-white p-5 shadow-sm dark:border-red-900/60 dark:bg-slate-800">
        <h2 className="text-xl font-extrabold text-red-700 dark:text-red-400">Saved history</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Every medicine you scan is saved automatically and shown in the History tab.
          You can delete them all here.
        </p>
        <button
          type="button"
          onClick={handleClearHistory}
          disabled={clearing}
          className="mt-4 min-h-[44px] rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
        >
          {clearing ? "Deleting…" : "🗑️ Clear all saved scans"}
        </button>

        {message && (
          <p
            role="status"
            className={`mt-3 rounded-lg border-2 p-3 text-sm font-bold ${
              message.type === "ok"
                ? "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200"
                : "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        MediVoice is not medical advice. Always follow your doctor or pharmacist.
      </p>
    </section>
  );
}
