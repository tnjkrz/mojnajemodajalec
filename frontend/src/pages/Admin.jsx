import { useEffect, useState } from "react";
import { api } from "../api";

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("adminToken") || "");
  const [me, setMe] = useState({ is_admin: false });
  const [loading, setLoading] = useState(true);

  // login form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authErr, setAuthErr] = useState("");

  // reports
  const [reports, setReports] = useState([]);
  const [tableErr, setTableErr] = useState("");
  const [busy, setBusy] = useState(false);

  // ban area
  const [banId, setBanId] = useState("");
  const [bannedUsers, setBannedUsers] = useState([]);
  const [banErr, setBanErr] = useState("");

  // helper: admin fetch with Authorization header
  async function adminGet(path) {
    const res = await fetch(`${api.BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `GET ${path} ${res.status}`);
    return data;
  }
  async function adminPost(path, body) {
    const res = await fetch(`${api.BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      credentials: "include",
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `POST ${path} ${res.status}`);
    return data;
  }
  async function adminPut(path, body) {
    const res = await fetch(`${api.BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      credentials: "include",
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `PUT ${path} ${res.status}`);
    return data;
  }
  async function adminDel(path) {
    const res = await fetch(`${api.BASE}${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `DELETE ${path} ${res.status}`);
    return data;
  }

  async function loadMe() {
    setLoading(true);
    try {
      const m = await adminGet("/api/admin/auth/me");
      setMe(m);
    } catch {
      setMe({ is_admin: false });
    } finally {
      setLoading(false);
    }
  }

  async function loadReports() {
    setTableErr("");
    try {
      const d = await adminGet("/api/admin/reports");
      const arr = Array.isArray(d) ? d : d.reports || [];
      setReports(arr);
    } catch {
      setTableErr("Ne morem naložiti prijav.");
    }
  }

  async function loadBanned() {
    setBanErr("");
    try {
      const d = await adminGet("/api/admin/banned");
      setBannedUsers(d.users || []);
    } catch {
      setBanErr("Ne morem naložiti blokiranih uporabnikov.");
    }
  }

  useEffect(() => {
    if (token) loadMe();
    else { setMe({ is_admin: false }); setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (me?.is_admin) {
      loadReports();
      loadBanned();
    }
  }, [me]);

  async function login(e) {
    e.preventDefault();
    setAuthErr("");
    try {
      const res = await fetch(`${api.BASE}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      const t = data?.token;
      if (!t) throw new Error();
      localStorage.setItem("adminToken", t);
      setToken(t);
      setUsername(""); setPassword("");
    } catch {
      setAuthErr("Napačno uporabniško ime ali geslo.");
    }
  }

  async function logout() {
    await fetch(`${api.BASE}/api/admin/auth/logout`, { method: "POST", credentials: "include" });
    localStorage.removeItem("adminToken");
    setToken("");
    setReports([]);
    setBannedUsers([]);
    setMe({ is_admin: false });
  }

  async function setStatus(reportId, status) {
    setBusy(true);
    try {
      await adminPut(`/api/admin/reports/${reportId}`, { status });
      await loadReports();
    } catch {
      alert("Napaka pri posodobitvi statusa.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTarget(type, id) {
    if (!window.confirm(`Res želite izbrisati ${type} (ID: ${id})?`)) return;
    setBusy(true);
    try {
      await adminDel(`/api/admin/delete/${type}/${id}`);
      await loadReports(); // keep report row; target may show "(izbrisano)"
    } catch {
      alert("Brisanje ni uspelo.");
    } finally {
      setBusy(false);
    }
  }

  async function banById(e) {
    e.preventDefault();
    const id = Number(banId);
    if (!id) { setBanErr("Vnesi veljaven ID."); return; }
    try {
      await adminPost("/api/admin/ban", { user_id: id, banned: true });
      setBanId("");
      await loadBanned();
      await loadReports(); // refresh “(blokiran)” labels
    } catch {
      setBanErr("Blokiranje ni uspelo.");
    }
  }

  async function toggleBan(user_id, currentBanned) {
    try {
      await adminPost("/api/admin/ban", { user_id, banned: !currentBanned });
      await loadBanned();
      await loadReports();
    } catch {
      alert("Napaka pri spremembi blokade.");
    }
  }

  function viewHref(r) {
    switch (r.target_type) {
      case "property": return `/properties/${r.target_id}`;
      case "landlord": return `/landlords/${r.target_id}`; // add page if needed
      case "review":   return r.property_id ? `/properties/${r.property_id}` : null;
      default: return null;
    }
  }

  if (loading) return <div className="container" style={{ padding: 20 }}>Nalagam…</div>;

  if (!me?.is_admin) {
    return (
      <main className="container" style={{ maxWidth: 520, padding: 20 }}>
        <h1>Admin prijava</h1>
        <p className="small" style={{ color: "var(--muted)" }}>
          Vpiši admin uporabniško ime in geslo. (Ni povezano s piškotki uporabnikov.)
        </p>
        {authErr && <div style={{ color: "crimson", marginBottom: 8 }}>{authErr}</div>}

        <form onSubmit={login}>
          <label className="field">
            <div className="label">Uporabniško ime</div>
            <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} />
          </label>
          <label className="field">
            <div className="label">Geslo</div>
            <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </label>
          <div className="actions">
            <button className="btn btn--solid" type="submit">Prijava</button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: 20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h1>Prijave (Admin)</h1>
        <button className="btn" onClick={logout}>Odjava (admin)</button>
      </div>

      {/* Reports table */}
      <div className="card" style={{ padding: 12, marginTop: 12 }}>
        {tableErr && <div style={{ color: "crimson", marginBottom: 8 }}>{tableErr}</div>}

        {reports.length === 0 ? (
          <div>Ni prijav.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr className="small" style={{ color: "var(--muted)", textAlign:"left" }}>
                <th style={{ padding: "8px 6px" }}>#</th>
                <th>Poročevalec</th>
                <th>Tarča</th>
                <th>Podrobnosti</th>
                <th>Razlog</th>
                <th>Status</th>
                <th>Ustvarjeno</th>
                <th style={{ textAlign:"right" }}>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => {
                const label =
                  r.target_label ||
                  (r.street
                    ? `${r.street} ${r.house_number}${r.city ? ", " + r.city : ""}`
                    : r.first_name
                    ? `${r.first_name} ${r.last_name}`
                    : "(izbrisano)");

                const href = viewHref(r);

                return (
                  <tr key={r.report_id} style={{ borderTop:"1px solid var(--border)" }}>
                    <td style={{ padding: "8px 6px" }}>{r.report_id}</td>
                    <td style={{ padding: "8px 6px" }}>
                      {r.reporter_username || "Anonymous"}
                      {r.reporter_is_banned === 1 ? " (blokiran)" : ""}
                      {r.reporter_user_id ? (
                        <>
                          <br/>
                          <button
                            className="btn btn--ghost sm"
                            onClick={() => toggleBan(r.reporter_user_id, r.reporter_is_banned === 1)}
                          >
                            {r.reporter_is_banned === 1 ? "Odblokiraj" : "Blokiraj"}
                          </button>
                        </>
                      ) : null}
                    </td>
                    <td style={{ padding: "8px 6px" }}>
                      {r.target_type === "property" && "Nepremičnina"}
                      {r.target_type === "landlord" && "Najemodajalec"}
                      {r.target_type === "review" && "Ocena"}
                      {" "}(ID: {r.target_id})
                    </td>
                    <td style={{ padding: "8px 6px" }}>{label}</td>
                    <td style={{ padding: "8px 6px" }}>{r.reason}</td>
                    <td style={{ padding: "8px 6px" }}>{r.status}</td>
                    <td style={{ padding: "8px 6px" }}>
                      {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                    </td>
                    <td style={{ padding: "8px 6px", whiteSpace: "nowrap", textAlign:"right" }}>
                      {href ? (
                        <a className="btn btn--ghost sm" href={href} target="_blank" rel="noreferrer">Odpri</a>
                      ) : (
                        <button className="btn btn--ghost sm" disabled title="Ni povezave">Odpri</button>
                      )}
                      {" "}
                      <button
                        className="btn btn--ghost sm"
                        disabled={busy}
                        onClick={() => deleteTarget(r.target_type, r.target_id)}
                        title={`Izbriši ${r.target_type}`}
                      >
                        Izbriši
                      </button>
                      {" "}
                      <button
                        className="btn sm"
                        disabled={busy || r.status === "resolved"}
                        onClick={() => setStatus(r.report_id, "resolved")}
                      >
                        Označi rešeno
                      </button>
                      {" "}
                      <button
                        className="btn btn--ghost sm"
                        disabled={busy || r.status === "dismissed"}
                        onClick={() => setStatus(r.report_id, "dismissed")}
                      >
                        Zavrni
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Ban by ID + Banned list */}
      <div className="card" style={{ padding: 12, marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Blokiranje uporabnikov</h2>
        <p className="small" style={{ color: "var(--muted)" }}>
          Vpiši <strong>ID uporabnika</strong> in ga blokiraj (po potrebi ga lahko kasneje odblokiraš).
        </p>
        {banErr && <div style={{ color: "crimson", marginBottom: 8 }}>{banErr}</div>}

        <form onSubmit={banById} style={{ display:"flex", gap: 8, alignItems:"center" }}>
          <input
            className="input"
            placeholder="user_id"
            value={banId}
            onChange={(e)=>setBanId(e.target.value)}
            style={{ maxWidth: 160 }}
          />
          <button className="btn btn--solid" type="submit">Blokiraj</button>
        </form>

        <h3 style={{ marginTop: 18 }}>Blokirani uporabniki</h3>
        {bannedUsers.length === 0 ? (
          <div className="small" style={{ color: "var(--muted)" }}>Ni blokiranih uporabnikov.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}>
            <thead>
              <tr className="small" style={{ color: "var(--muted)", textAlign:"left" }}>
                <th style={{ padding: "8px 6px" }}>ID</th>
                <th>Uporabniško ime</th>
                <th>Vloga</th>
                <th>Status</th>
                <th style={{ textAlign:"right" }}>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {bannedUsers.map(u => (
                <tr key={u.user_id} style={{ borderTop:"1px solid var(--border)" }}>
                  <td style={{ padding: "8px 6px" }}>{u.user_id}</td>
                  <td style={{ padding: "8px 6px" }}>{u.username || "—"}</td>
                  <td style={{ padding: "8px 6px" }}>{u.role}</td>
                  <td style={{ padding: "8px 6px" }}>{u.is_banned ? "blokiran" : "—"}</td>
                  <td style={{ padding: "8px 6px", textAlign:"right" }}>
                    <button className="btn btn--ghost sm" onClick={()=>toggleBan(u.user_id, true)}>
                      Odblokiraj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
