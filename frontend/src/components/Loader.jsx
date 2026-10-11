import { useEffect, useState } from "react";

const STAGES = [
  "Reading your medication labels…",
  "Transcribing what the label says…",
  "Simplifying the instructions…",
  "Checking for warning flags…",
];

export default function Loader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % STAGES.length);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-teal-500 bg-teal-50 p-6"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-700" />
      <div>
        <p className="text-base font-extrabold text-teal-900">{STAGES[index]}</p>
        <p className="mt-0.5 text-sm text-teal-700">This usually takes just a few seconds.</p>
      </div>
    </div>
  );
}