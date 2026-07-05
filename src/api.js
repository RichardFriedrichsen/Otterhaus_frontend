const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Token ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const msg =
      data?.detail ||
      (data && typeof data === "object"
        ? Object.entries(data).map(([k, v]) => `${k}: ${[].concat(v).join(" ")}`).join(" · ")
        : `Request failed (${res.status})`);
    throw new Error(msg);
  }
  return data;
}

export const api = {
  register: (b) => request("/auth/register/", { method: "POST", body: b }),
  login: (b) => request("/auth/login/", { method: "POST", body: b }),
  me: () => request("/auth/me/"),
  requestPasswordReset: (email) => request("/auth/password-reset/", { method: "POST", body: { email } }),
  confirmPasswordReset: (b) => request("/auth/password-reset/confirm/", { method: "POST", body: b }),
  dashboard: () => request("/dashboard/"),
  weeklyOverview: () => request("/weekly-overview/"),
  sendOverviewEmail: () => request("/overview-email/", { method: "POST" }),
  houses: () => request("/houses/"),
  createHouse: (name) => request("/houses/", { method: "POST", body: { name } }),
  joinHouse: (code) => request("/houses/join/", { method: "POST", body: { code } }),
  scoreboard: (houseId) => request(`/houses/${houseId}/scoreboard/`),
  createRoom: (houseId, name) => request("/rooms/", { method: "POST", body: { house: houseId, name } }),
  deleteRoom: (id) => request(`/rooms/${id}/`, { method: "DELETE" }),
  createChore: (b) => request("/chores/", { method: "POST", body: b }),
  updateChore: (id, b) => request(`/chores/${id}/`, { method: "PATCH", body: b }),
  deleteChore: (id) => request(`/chores/${id}/`, { method: "DELETE" }),
  completeChore: (id) => request(`/chores/${id}/complete/`, { method: "POST" }),
};

export function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
export function currentUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}
export function isAuthed() { return !!getToken(); }
