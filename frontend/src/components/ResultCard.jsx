import { useCallback, useEffect, useRef, useState } from "react";
import { isRestrictedError, speak, translateScan } from "../api/client.js";
import { expiryInfo, formatDate, warningSeverity } from "../lib/labels.js";

function SectionTitle({ title, tone, hindi, busy, onToggle, onSpeak }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className={`text-sm font-extrabold uppercase tracking-wide ${tone}`}>{title}</h3>
      <div className="flex items-center gap-2">
        {onSpeak && (
          <button
            type="button"
            onClick={onSpeak}
            disabled={busy}
            aria-label="Read this section out loud"
            className="min-h-[34px] shrink-0 rounded-lg border-2 border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            {busy ? "…" : "🔊"}
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          aria-label={hindi ? "Show in English" : "Show in Hindi"}
          className={`min-h-[34px] shrink-0 rounded-lg border-2 px-3 text-sm font-bold transition ${
            hindi
              ? "border-teal-700 bg-teal-800 text-white hover:bg-teal-900"
              : "border-teal-700 bg-white text-teal-800 hover:bg-teal-50 dark:border-teal-500 dark:bg-slate-700 dark:text-teal-300 dark:hover:bg-slate-600"
          } disabled:cursor-wait disabled:opacity-60`}
        >
          {busy ? "…" : hindi ? "EN" : "हिंदी"}
        </button>
      </div>
    </div>
  );
}

function buildFullText(data, hindi) {
  const parts = [];
  const t = hindi
    ? { name: "दवा", generic: "दूसरा नाम", purpose: "यह किस लिए है", dosage: "कैसे लें", warnings: "सावधानियाँ" }
    : {
        name: "Medicine",
        generic: "Generic name",
        purpose: "Purpose",
        dosage: "Dosage instructions",
        warnings: "Warnings",
      };
  if (data.medication_name) parts.push(`${t.name}: ${data.medication_name}`);
  if (data.drug_name) parts.push(`${t.generic}: ${data.drug_name}`);
  if (data.purpose) parts.push(`${t.purpose}: ${data.purpose}`);
  if (data.intake_dosage && data.intake_dosage.length > 0) {
    parts.push(`${t.dosage}:`);
    data.intake_dosage.forEach((d, i) => parts.push(`${i + 1}. ${d}`));
  }
  if (data.critical_warnings && data.critical_warnings.length > 0) {
    parts.push(`${t.warnings}:`);
    data.critical_warnings.forEach((w) => parts.push(`- ${w}`));
  }
  return parts.join(". ");
}

export default function ResultCard({
  result,
  defaultLanguage = "en",
  autoRead = false,
  autoReadTick = 0,
}) {
  const [hindi, setHindi] = useState(defaultLanguage === "hi");
  const [hindiData, setHindiData] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [speakError, setSpeakError] = useState(null);

  const speakText = useCallback(async (text) => {
    if (!text) return;
    setSpeaking(true);
    setSpeakError(null);
    try {
      const blob = await speak(text);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setSpeaking(false);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setSpeaking(false);
      };
      await audio.play();
    } catch (e) {
      setSpeaking(false);
      setSpeakError(
        isRestrictedError(e) ? "Access restricted. Invalid demo passcode." : e.message,
      );
    }
  }, []);

  const loadHindi = useCallback(async (target) => {
    setTranslating(true);
    setTranslateError(null);
    try {
      const data = await translateScan(target);
      setHindiData(data);
      return data;
    } catch (err) {
      setTranslateError(err.message);
      return null;
    } finally {
      setTranslating(false);
    }
  }, []);

  // Reset per-scan state and auto-load the preferred language.
  useEffect(() => {
    setHindiData(null);
    setTranslateError(null);
    setSpeakError(null);
    const wantHindi = defaultLanguage === "hi";
    setHindi(wantHindi);
    if (wantHindi) {
      loadHindi(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.id, defaultLanguage]);

  // Auto read out loud once per new scan (waits for Hindi if it is the default).
  const lastTick = useRef(0);
  useEffect(() => {
    if (!autoRead || autoReadTick <= 0 || autoReadTick === lastTick.current) return;
    const useHindi = defaultLanguage === "hi";
    if (useHindi && !hindiData) return;
    lastTick.current = autoReadTick;
    const activeData = useHindi && hindiData ? hindiData : result;
    speakText(buildFullText(activeData, useHindi));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoReadTick, hindiData, defaultLanguage]);

  const toggleHindi = async () => {
    if (hindi) {
      setHindi(false);
      return;
    }
    if (hindiData) {
      setHindi(true);
      return;
    }
    await loadHindi(result);
    setHindi(true);
  };

  const data = hindi && hindiData ? hindiData : result;
  const expiry = expiryInfo(result.expiry_date);
  const dosage = Array.isArray(data.intake_dosage) ? data.intake_dosage : [];
  const warnings = Array.isArray(data.critical_warnings) ? data.critical_warnings : [];

  const speakAll = () => speakText(buildFullText(data, hindi));
  const speakPurpose = () => speakText(data.purpose || "");
  const speakDosage = () => speakText((dosage || []).join(". "));
  const speakWarnings = () => speakText((warnings || []).join(". "));

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <header className="border-b-2 border-teal-700 bg-teal-800 px-5 py-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
              {hindi ? "दवा" : "Medication"}
            </p>
            <h2 className="text-2xl font-extrabold leading-tight">{data.medication_name}</h2>
            {data.drug_name && (
              <p className="mt-0.5 text-sm text-teal-100">
                {hindi ? "दूसरा नाम:" : "Also called:"} <span className="font-semibold">{data.drug_name}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-lg border-2 px-3 py-1.5 text-sm font-bold ${expiry.classes}`} title={expiry.label}>
              {expiry.display}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={speakAll}
                disabled={speaking}
                className="min-h-[40px] rounded-lg border-2 border-white px-3 text-sm font-bold text-white transition hover:bg-white hover:text-teal-800 disabled:cursor-wait disabled:opacity-60"
              >
                {speaking ? "Generating Voice..." : "🔊 Read Out Loud"}
              </button>
              <button
                type="button"
                onClick={toggleHindi}
                disabled={translating}
                className="min-h-[40px] rounded-lg border-2 border-white px-4 text-sm font-bold text-white transition hover:bg-white hover:text-teal-800 disabled:cursor-wait disabled:opacity-60"
              >
                {translating ? "अनुवाद हो रहा है…" : hindi ? "English" : "हिंदी में देखें"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {data.purpose && (
        <div className="border-b-2 border-slate-100 bg-teal-50/60 px-5 py-4 dark:border-slate-700 dark:bg-teal-900/30">
          <SectionTitle
            title={hindi ? "यह किस लिए है" : "What it's for"}
            tone="text-teal-700 dark:text-teal-300"
            hindi={hindi}
            busy={translating || speaking}
            onToggle={toggleHindi}
            onSpeak={speakPurpose}
          />
          <p className="mt-1 text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100">
            {data.purpose}
          </p>
        </div>
      )}

      {result.low_confidence && (
        <div className="border-b-2 border-amber-500 bg-amber-100 px-5 py-3 dark:border-amber-700 dark:bg-amber-900/40">
          <p className="text-base font-extrabold text-amber-900 dark:text-amber-200">
            ⚠️ Label was hard to read
          </p>
          <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-100">
            Some details below may be missing. Please double-check with your pharmacist.
          </p>
        </div>
      )}

      <div className="space-y-6 px-5 py-5">
        {dosage.length > 0 && (
          <div>
            <SectionTitle
              title={hindi ? "कैसे लें" : "How to take it"}
              tone="text-teal-700 dark:text-teal-300"
              hindi={hindi}
              busy={translating || speaking}
              onToggle={toggleHindi}
              onSpeak={speakDosage}
            />
            <ol className="mt-2 space-y-2">
              {dosage.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-teal-700 text-base font-extrabold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-base leading-snug text-slate-800 dark:text-slate-200">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            <SectionTitle
              title={hindi ? "सावधानियाँ" : "Things to watch out for"}
              tone="text-red-700 dark:text-red-400"
              hindi={hindi}
              busy={translating || speaking}
              onToggle={toggleHindi}
              onSpeak={speakWarnings}
            />
            <ul className="mt-2 space-y-2">
              {warnings.map((warning, index) => {
                const severity = warningSeverity(warning);
                const severe = severity === "severe";
                return (
                  <li
                    key={index}
                    className={`flex items-start gap-2 rounded-lg border-2 p-3 text-sm leading-snug ${
                      severe
                        ? "border-red-400 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200"
                        : "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm ${
                        severe ? "bg-red-600 text-white" : "bg-amber-500 text-white"
                      }`}
                    >
                      {severe ? "!" : "•"}
                    </span>
                    <span className="pt-0.5">{warning}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {translateError && (
          <p className="rounded-lg border-2 border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
            Translation failed: {translateError}
          </p>
        )}

        {speakError && (
          <p
            role="alert"
            className="rounded-lg border-2 border-amber-400 bg-amber-50 p-3 text-sm font-bold text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
          >
            🔒 {speakError}
          </p>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <span>
            {hindi ? "स्कैन किया गया" : "Scanned"} {formatDate(result.created_at)}
          </span>
          {result.image_count > 1 && (
            <span>{hindi ? `${result.image_count} तस्वीरें` : `${result.image_count} photos`}</span>
          )}
        </footer>
      </div>
    </section>
  );
}
