const API_BASE = "https://api.jetdomains.online/v0";
const API_KEY = import.meta.env.VITE_API_KEY;

function withAuth(params: Record<string, any> = {}) {
  return { ...params, key: API_KEY, timestamp: Date.now() };
}

export async function apiGet(endpoint: string, params: Record<string, any> = {}) {
  const query = new URLSearchParams(withAuth(params) as any).toString();
  const res = await fetch(`${API_BASE}/${endpoint}?${query}`);
  return res.json();
}

export async function apiPost(endpoint: string, body: Record<string, any> = {}) {
  const query = new URLSearchParams(withAuth() as any).toString();
  const res = await fetch(`${API_BASE}/${endpoint}?${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}