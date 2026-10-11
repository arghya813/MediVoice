import { useEffect, useRef, useState } from "react";

const MAX_IMAGES = 5;

export default function ScanCard({ onAnalyze, analyzing }) {
  const [images, setImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      images.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [images]);

  const addFiles = (selected) => {
    if (!selected) return;
    const next = [];
    for (const file of selected) {
      if (file && file.type.startsWith("image/") && images.length + next.length < MAX_IMAGES) {
        next.push({ file, url: URL.createObjectURL(file) });
      }
    }
    if (next.length > 0) {
      setImages((prev) => [...prev, ...next]);
    }
  };

  const removeImage = (url) => {
    URL.revokeObjectURL(url);
    setImages((prev) => prev.filter((item) => item.url !== url));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    addFiles(event.dataTransfer.files);
  };

  const clear = () => {
    images.forEach((item) => URL.revokeObjectURL(item.url));
    setImages([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = () => {
    if (images.length === 0 || analyzing) return;
    onAnalyze(images.map((item) => item.file));
  };

  return (
    <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-extrabold text-slate-900">Take a photo of your medicine</h2>
      <p className="mt-1 text-sm text-slate-600">
        Point your camera at the bottle or prescription label — one good photo is enough.
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mt-4 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-4 border-dashed px-6 py-8 text-center transition-colors ${
          dragOver
            ? "border-teal-600 bg-teal-50"
            : "border-slate-400 bg-slate-50 hover:border-teal-600 hover:bg-teal-50/50"
        }`}
      >
        {images.length === 0 ? (
          <>
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-teal-700 text-3xl">
              💊
            </div>
            <p className="text-lg font-bold text-slate-800">
              Tap here to choose a photo, or drop it on this box
            </p>
            <p className="mt-1 text-sm text-slate-600">JPEG, PNG, or WebP · up to 10 MB each</p>
          </>
        ) : (
          <>
            <p className="text-base font-bold text-slate-800">
              {images.length === 1 ? "1 photo selected" : `${images.length} photos selected`}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              {images.map((item) => (
                <div key={item.url} className="relative">
                  <img
                    src={item.url}
                    alt="Preview of a medicine label you selected"
                    className="h-24 w-24 rounded-lg object-cover shadow"
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeImage(item.url);
                    }}
                    aria-label="Remove this photo"
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <p className="w-full text-sm text-slate-500">
                  Tap here to add another side of the bottle — optional, but it helps us read everything.
                </p>
              )}
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="min-h-[44px] rounded-xl bg-slate-800 px-3 text-sm font-bold text-white transition hover:bg-slate-900"
        >
          📁 {images.length === 0 ? "Choose photo" : "Add photo"}
        </button>
        <button
          type="button"
          onClick={() => setShowWebcam(true)}
          className="min-h-[44px] rounded-xl bg-teal-700 px-3 text-sm font-bold text-white transition hover:bg-teal-800"
        >
          📷 Use webcam
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={images.length === 0 || analyzing}
          className="min-h-[44px] rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {analyzing ? "Reading…" : "Read my label"}
        </button>
      </div>

      {images.length > 0 && !analyzing && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={clear}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 underline decoration-slate-400 underline-offset-4 hover:text-slate-800"
          >
            Clear all photos
          </button>
        </div>
      )}

      {showWebcam && <WebcamCapture onCapture={addFiles} onClose={() => setShowWebcam(false)} />}
    </section>
  );
}

function WebcamCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            "We could not open your camera. Check that it is connected and not blocked, then try again or choose a photo instead."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture([new File([blob], "webcam-shot.jpg", { type: "image/jpeg" })]);
        }
        onClose();
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Point at the label</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-700 hover:bg-slate-300"
          >
            ✕
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        ) : (
          <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={capture}
            disabled={!streamRef.current}
            className="min-h-[44px] flex-1 rounded-xl bg-teal-700 text-base font-bold text-white transition hover:bg-teal-800 disabled:bg-slate-300"
          >
            📸 Take photo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] flex-1 rounded-xl border-2 border-slate-300 text-base font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}