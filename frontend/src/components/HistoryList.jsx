import { formatDate } from "../lib/labels.js";

export default function HistoryList({ items, activeId, onSelect, expanded = false }) {
  return (
    <aside className="rounded-2xl border-2 border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Saved Scans</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {expanded
          ? "Every medicine you scan is saved here automatically."
          : "Tap a past scan to read it again."}
      </p>

      {(!items || items.length === 0) && (
        <p className="mt-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
          No saved scans yet. Scan a medicine bottle and it will appear here.
        </p>
      )}

      <ul className="mt-4 space-y-2" aria-label="Saved scans">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                aria-pressed={isActive}
                className={`w-full rounded-xl border-2 px-4 py-3 text-left transition ${
                  isActive
                    ? "border-teal-700 bg-teal-50 dark:border-teal-500 dark:bg-teal-900/40"
                    : "border-slate-200 bg-slate-50 hover:border-teal-600 hover:bg-teal-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-500 dark:hover:bg-teal-900/20"
                }`}
              >
                <span className="block text-base font-bold text-slate-900 dark:text-slate-100">
                  {item.medication_name}
                </span>
                <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-300">
                  Scanned {formatDate(item.created_at)}
                </span>
                {item.low_confidence && (
                  <span className="mt-1.5 inline-block rounded-full border-2 border-amber-400 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                    ⚠️ Hard to read
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
