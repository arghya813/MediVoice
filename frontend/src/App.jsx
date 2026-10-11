import { useCallback, useEffect, useState } from "react";
import { fetchScans, isRestrictedError, scanMedicine } from "./api/client.js";
import ScanCard from "./components/ScanCard.jsx";
import Loader from "./components/Loader.jsx";
import ResultCard from "./components/ResultCard.jsx";
import HistoryList from "./components/HistoryList.jsx";

export default function App() {
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

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

  const handleAnalyze = async (file) => {
    setAnalyzing(true);
    setError(null);
    try {
      const scan = await scanMedicine(file);
      setResult(scan);
      setHistory((prev) => [scan, ...prev.filter((item) => item.id !== scan.id)].slice(0, 50));
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/30 to-slate-50 text-slate-900">
      <header className="border-b-2 border-teal-700 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-2xl" aria-hidden="true">
              💊
            </span>
            <div>
              <h1 className="text-2xl font-extrabold">MediVoice</h1>
              <p className="text-sm text-slate-600">Your medicine, explained simply.</p>
            </div>
          </div>
          <span className="rounded-full bg-teal-100 px-4 py-1.5 text-sm font-bold text-teal-800">
            Powered by Gemini
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <ScanCard onAnalyze={handleAnalyze} analyzing={analyzing} />

          {analyzing && <Loader />}

          {error && (
            <div
              role="alert"
              className={`rounded-2xl border-2 p-5 ${
                error.restricted
                  ? "border-amber-400 bg-amber-50"
                  : "border-red-300 bg-red-50"
              }`}
            >
              <p
                className={`text-lg font-extrabold ${
                  error.restricted ? "text-amber-900" : "text-red-800"
                }`}
              >
                {error.restricted ? "🔒 Access restricted" : "Something went wrong"}
              </p>
              <p
                className={`mt-1 text-base ${
                  error.restricted ? "text-amber-800" : "text-red-700"
                }`}
              >
                {error.message}
              </p>
              {!error.restricted && (
                <p className="mt-1 text-sm text-red-600">
                  Please try again, ideally with better lighting and the label in focus.
                </p>
              )}
            </div>
          )}

          {result && !analyzing && <ResultCard result={result} />}
        </div>

        <div className="space-y-6">
          <HistoryList items={history} activeId={result?.id} onSelect={setResult} />
          {result && (
            <section className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <h2 className="text-lg font-extrabold text-slate-900">Current health concern</h2>
              <p className="mt-1 text-sm text-slate-600">
                This helps you quickly see why this medicine was scanned
              </p>
              <div className="mt-3 space-y-2">
                <p className="text-base font-bold text-slate-900">{result.medication_name}</p>
                {result.drug_name && (
                  <p className="text-sm text-slate-600">{result.drug_name}</p>
                )}
                {result.purpose ? (
                  <p className="text-sm leading-snug text-slate-800">{result.purpose}</p>
                ) : (
                  <p className="text-sm text-slate-500">
                    We didn&apos;t see a specific reason on the label. If you know the concern
                    (fever, pain, cough, etc.), keep it in mind while reading dosage and warnings.
                  </p>
                )}
                {result.low_confidence && (
                  <span className="mt-1 inline-block rounded-full border-2 border-amber-400 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    ⚠️ Hard to read
                  </span>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-sm text-slate-500">
        MediVoice explains the information printed on your medicine label. It is not
        medical advice — always follow your doctor or pharmacist.
      </footer>
    </div>
  );
}