// Petit client pour l'API Flask. Les cookies de session sont envoyés automatiquement (même origine).
export class ApiError extends Error {
  constructor(status, code) {
    super(code || `http_${status}`);
    this.status = status;
    this.code = code || `http_${status}`;
  }
}

export async function api(path, method = "GET", body) {
  let r;
  try {
    r = await fetch("/api" + path, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "network");
  }
  let data = null;
  try {
    data = await r.json();
  } catch {
    /* réponse sans JSON */
  }
  if (!r.ok) throw new ApiError(r.status, data && data.code);
  return data;
}
