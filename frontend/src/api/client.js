const API_BASE = "https://medi-voice.onrender.com";

// Demo passcode is a shared secret, not true authentication. It is sent on
// every request so the backend can reject uninvited callers during the demo.
const DEMO_PASSCODE = "MEDIVOICE2026";
const PASSCODE_HEADER = "X-Demo-Passcode";

const RESTRICTED_MESSAGE = "Access restricted. Invalid demo passcode.";

function withPasscode(headers = {}) {
  return { [PASSCODE_HEADER]: DEMO_PASSCODE, ...headers };
}

export function isRestrictedError(err) {
  return Boolean(err && err.status === 401);
}

async function toError(res, fallback) {
  let detail = fallback;
  try {
    const data = await res.json();
    if (data && data.detail) {
      detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    }
  } catch {
    // keep fallback when the body isn't JSON
  }
  const err = new Error(res.status === 401 ? RESTRICTED_MESSAGE : detail);
  err.status = res.status;
  return err;
}

async function request(path, options = {}) {
  const { headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: withPasscode(headers),
  });

  if (res.status === 204) {
    return null;
  }

  if (!res.ok) {
    throw await toError(res, `Request failed (${res.status})`);
  }

  return res.json();
}

export function scanMedicine(files) {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  return request("/api/scan-medicine", {
    method: "POST",
    body: form,
  });
}

export function fetchScans(limit = 50) {
  return request(`/api/scans?limit=${limit}`);
}

export function translateScan(scan) {
  return request("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      medication_name: scan.medication_name,
      drug_name: scan.drug_name,
      purpose: scan.purpose,
      intake_dosage: scan.intake_dosage,
      critical_warnings: scan.critical_warnings,
      expiry_date: scan.expiry_date,
      low_confidence: scan.low_confidence,
    }),
  });
}

export async function speak(text) {
  const res = await fetch(`${API_BASE}/speak`, {
    method: "POST",
    headers: withPasscode({ "Content-Type": "application/json" }),
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw await toError(res, `Could not generate voice (${res.status})`);
  }

  return res.blob();
}

export function deleteScan(id) {
  return request(`/api/scans/${id}`, { method: "DELETE" });
}

export function clearScans() {
  return request("/api/scans", { method: "DELETE" });
}
