const BASE = process.env.REACT_APP_API || "http://localhost:8210";

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  let data; try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data?.error || `GET ${path} ${res.status}`);
  return data;
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data; try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data?.error || `POST ${path} ${res.status}`);
  return data;
}

export const api = { get, post, BASE };
