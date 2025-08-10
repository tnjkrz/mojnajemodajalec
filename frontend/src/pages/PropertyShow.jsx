import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";

// READ-ONLY stars that match the yellow style from your add-review form
function ReadOnlyStars({ value = 0, size = 16 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.round(v); // same rounding you used elsewhere
  return (
    <span className="ro-stars" style={{ fontSize: size }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`ro-star ${i < full ? "filled" : ""}`} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

function avgReview(r) {
  const vals = [
    r.communication_score,
    r.repairs_score,
    r.moving_score,
    r.health_safety_score,
    r.privacy_score,
  ].map(Number);
  const sum = vals.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
  return Math.round((sum / 5) * 10) / 10;
}

export default function PropertyShow() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ok = true;
    setLoading(true);
    api
      .get(`/api/properties/${id}`)
      .then((d) => ok && (setData(d), setErr("")))
      .catch((e) => ok && setErr(e.message || "Napaka"))
      .finally(() => ok && setLoading(false));
    return () => {
      ok = false;
    };
  }, [id]);

  const overall = useMemo(() => {
    if (!data?.reviews?.length) return 0;
    const list = data.reviews.map(avgReview);
    const sum = list.reduce((a, b) => a + b, 0);
    return Math.round((sum / list.length) * 10) / 10;
  }, [data]);

  const catAverages = useMemo(() => {
    const cats = [
      ["communication_score", "Komunikacija"],
      ["repairs_score", "Vzdrževanje in popravila"],
      ["moving_score", "Vselitev / izselitev"],
      ["health_safety_score", "Zdravje in varnost"],
      ["privacy_score", "Zasebnost"],
    ];
    if (!data?.reviews?.length) return [];
    return cats.map(([key, label]) => {
      const arr = data.reviews.map((r) => Number(r[key]) || 0);
      const sum = arr.reduce((a, b) => a + b, 0);
      return { key, label, value: Math.round((sum / arr.length) * 10) / 10 };
    });
  }, [data]);

  if (loading) return <div className="container" style={{ padding: 24 }}>Nalagam…</div>;
  if (err) return <div className="container" style={{ padding: 24, color: "crimson" }}>{err}</div>;
  if (!data) return null;

  const { property, landlord, reviews } = data;
  const address = `${property.street} ${property.house_number} • ${property.postal_code || ""} ${property.city}`.trim();

  return (
    <main>
      {/* HEADER */}
      <div className="container" style={{ paddingTop: 20, paddingBottom: 8 }}>
        <h1 style={{ margin: "0 0 8px" }}>{address}</h1>
        <div className="small">
          Najemodajalec: <strong>{landlord?.first_name} {landlord?.last_name}</strong>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn btn--ghost">🚩 Prijavi nepremičnino</button>
          <button className="btn btn--ghost">🚩 Prijavi najemodajalca</button>
          <Link className="btn btn--solid" to="/reviews/new">Dodaj oceno</Link>
        </div>
      </div>

      {/* SUMMARY CARD */}
      <section className="container">
        <div className="card card--pad-lg">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div className="small" style={{ color: "var(--muted)" }}>
                Skupna ocena (iz vseh kategorij)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                <div style={{ fontSize: 42, fontWeight: 800 }}>{overall || "—"}</div>
                <ReadOnlyStars value={overall} size={18} />
              </div>
              <div className="small" style={{ color: "var(--muted)", marginTop: 4 }}>
                {reviews?.length || 0} ocen uporabnikov
              </div>
            </div>

            <div style={{ alignSelf: "center" }}>
              {catAverages.map((c) => (
                <div key={c.key} className="bar-row">
                  <div className="bar-label">{c.label}</div>
                  <div className="bar">
                    <div className="bar-fill" style={{ width: `${(c.value / 5) * 100}%` }} />
                  </div>
                  <div className="bar-value">{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS LIST */}
      <section className="container" style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 12px" }}>Ocene uporabnikov</h3>

        {!reviews?.length && (
          <div className="card" style={{ padding: 16 }}>
            Ni še ocen. Bodite prvi! <Link to="/reviews/new">Dodaj oceno</Link>
          </div>
        )}

        {reviews?.map((r) => (
          <article key={r.review_id} className="card review-card">
            <header className="review-head">
              <div className="avatar">🙂</div>
              <div className="who">
                <div className="name">anonymous</div>
                <div className="date small">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                </div>
              </div>
              <div className="overall">
                <div className="small" style={{ color: "var(--muted)" }}>Skupna ocena</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong>{avgReview(r)}</strong>
                  <ReadOnlyStars value={avgReview(r)} size={14} />
                </div>
              </div>
              <button className="btn btn--ghost sm">🚩</button>
            </header>

            {r.comment && <p className="review-text">{r.comment}</p>}

            <div className="grid-2">
              <div className="kv">
                <span>Komunikacija</span>
                <ReadOnlyStars value={r.communication_score} size={14} />
              </div>
              <div className="kv">
                <span>Vzdrževanje in popravila</span>
                <ReadOnlyStars value={r.repairs_score} size={14} />
              </div>
              <div className="kv">
                <span>Vselitev / izselitev</span>
                <ReadOnlyStars value={r.moving_score} size={14} />
              </div>
              <div className="kv">
                <span>Zdravje in varnost</span>
                <ReadOnlyStars value={r.health_safety_score} size={14} />
              </div>
              <div className="kv">
                <span>Zasebnost</span>
                <ReadOnlyStars value={r.privacy_score} size={14} />
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
