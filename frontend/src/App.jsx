import { useCallback, useEffect, useState } from "react";
import { fetchScans, isRestrictedError, scanMedicine } from "./api/client.js";
import ScanCard from "./components/ScanCard.jsx";
import Loader from "./components/Loader.jsx";
import ResultCard from "./components/ResultCard.jsx";
import HistoryList from "./components/HistoryList.jsx";
import SettingsPage from "./components/SettingsPage.jsx";
import { useSettings } from "./context/SettingsContext.jsx";

const TABS = [
  { id: "scan", label: "Scan", icon: "📷" },
  { id: "history", label: "History", icon: "🗂️" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function App() {
  const { settings, updateSetting } = useSettings();
  const [view, setView] = useState("scan");
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [scanTick, setScanTick] = useState(0);

  const loadHistory = useCallback(async () => {
    try {
      const data = await fetchScans(50);
      setHistory(data.items);
      setResult((current) => current || (data.items.length > 0 ? data.items[0] : null));
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleAnalyze = async (files) => {
    setAnalyzing(true);
    setError(null);
    try {
      const scan = await scanMedicine(files);
      setResult(scan);
      setHistory((prev) => [scan, ...prev.filter((item) => item.id !== scan.id)].slice(0, 50));
      setScanTick((t) => t + 1);
      setView("scan");
    } catch (err) {
      setError(
        isRestrictedError(err)
          ? { restricted: true, message: "Access restricted. Invalid demo passcode." }
          : { restricted: false, message: err.message },
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleHistoryCleared = () => {
    setHistory([]);
    setResult(null);
  };

  const isDark = settings.theme === "dark";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/30 to-slate-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <header className="border-b-2 border-teal-700 bg-white dark:border-teal-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-2xl" aria-hidden="true">
              💊
            </span>
            <div>
              <h1 className="text-2xl font-extrabold">MediVoice</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Your medicine, explained simply.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateSetting("theme", isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-xl transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>

        <nav aria-label="Main sections" className="mx-auto max-w-6xl px-4">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const active = view === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-0.5 flex min-h-[46px] items-center gap-2 rounded-t-lg border-b-4 px-4 text-sm font-bold transition ${
                    active
                      ? "border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-300"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  {tab.label}
                  {tab.id === "history" && history.length > 0 && (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-extrabold text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                      {history.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {view === "scan" && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <ScanCard onAnalyze={handleAnalyze} analyzing={analyzing} />

              {analyzing && <Loader />}

              {error && (
                <div
                  role="alert"
                  className={`rounded-2xl border-2 p-5 ${
                    error.restricted
                      ? "border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30"
                      : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/30"
                  }`}
                >
                  <p
                    className={`text-lg font-extrabold ${
                      error.restricted
                        ? "text-amber-900 dark:text-amber-200"
                        : "text-red-800 dark:text-red-200"
                    }`}
                  >
                    {error.restricted ? "🔒 Access restricted" : "Something went wrong"}
                  </p>
                  <p
                    className={`mt-1 text-base ${
                      error.restricted
                        ? "text-amber-800 dark:text-amber-100"
                        : "text-red-700 dark:text-red-100"
                    }`}
                  >
                    {error.message}
                  </p>
                  {!error.restricted && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                      Please try again, ideally with better lighting and the label in focus.
                    </p>
                  )}
                </div>
              )}

              {result && !analyzing && (
                <ResultCard
                  result={result}
                  defaultLanguage={settings.defaultLanguage}
                  autoRead={settings.autoRead}
                  autoReadTick={scanTick}
                />
              )}
            </div>

            <div className="space-y-6">
              <HistoryList items={history} activeId={result?.id} onSelect={setResult} />
              {result && <HealthConcern result={result} />}
            </div>
          </div>
        )}

        {view === "history" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <HistoryList items={history} activeId={result?.id} onSelect={setResult} expanded />
            <div>
              {result ? (
                <ResultCard
                  result={result}
                  defaultLanguage={settings.defaultLanguage}
                  autoRead={false}
                  autoReadTick={0}
                />
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                    No scan selected
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Scan a medicine and it will be stored here automatically.
                  </p>
                  <button
                    type="button"
                    onClick={() => setView("scan")}
                    className="mt-4 min-h-[44px] rounded-xl bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800"
                  >
                    📷 Scan a medicine
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === "settings" && <SettingsPage onHistoryCleared={handleHistoryCleared} />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-sm text-slate-500 dark:text-slate-400">
        MediVoice explains the information printed on your medicine label. It is not
        medical advice — always follow your doctor or pharmacist.
      </footer>
    </div>
  );
}

function HealthConcern({ result }) {
  return (
    <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
        Current health concern
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        This helps you quickly see why this medicine was scanned
      </p>
      <div className="mt-3 space-y-2">
        <p className="text-base font-bold text-slate-900 dark:text-slate-100">
          {result.medication_name}
        </p>
        {result.drug_name && (
          <p className="text-sm text-slate-600 dark:text-slate-300">{result.drug_name}</p>
        )}
        {result.purpose ? (
          <p className="text-sm leading-snug text-slate-800 dark:text-slate-200">
            {result.purpose}
          </p>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We didn&apos;t see a specific reason on the label. If you know the concern (fever,
            pain, cough, etc.), keep it in mind while reading dosage and warnings.
          </p>
        )}
        {result.low_confidence && (
          <span className="mt-1 inline-block rounded-full border-2 border-amber-400 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
            ⚠️ Hard to read
          </span>
        )}
      </div>
    </section>
  );
}
