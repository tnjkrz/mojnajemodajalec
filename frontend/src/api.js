// src/api.js
const BASE = (process.env.REACT_APP_API || "http://localhost:8211").replace(/\/+$/, "");

function qs(params = {}) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length) s.set(k, v);
  });
  const str = s.toString();
  return str ? `?${str}` : "";
}

async function handle(res, method, path) {
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data?.error || `${method} ${path} ${res.status}`);
  return data;
}

async function get(path, params) {
  const url = `${BASE}${path}${qs(params)}`;
  const res = await fetch(url, { credentials: "include" });
  return handle(res, "GET", path);
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return handle(res, "POST", path);
}

async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return handle(res, "PUT", path);
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    credentials: "include",
  });
  let data; try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data?.error || `DELETE ${path} ${res.status}`);
  return data;
}

export const api = { BASE, get, post, put, del };
