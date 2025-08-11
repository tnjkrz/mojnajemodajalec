import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StarRating from "../components/StarRating";
import { api } from "../api";


export default function ReviewNew() {
  const nav = useNavigate();

  // ---------- landlord ----------
  const [qL, setQL] = useState("");
  const [landlordResults, setLandlordResults] = useState([]);
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [addLandlordOpen, setAddLandlordOpen] = useState(false);
  const [newLandlord, setNewLandlord] = useState({ first_name: "", last_name: "" });
  const [showLDrop, setShowLDrop] = useState(false);
  const landFirstRef = useRef(null);
  const lWrapRef = useRef(null);

  // ---------- property ----------
  const [qP, setQP] = useState("");
  const [propertyResults, setPropertyResults] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({
    city: "", postal_code: "", street: "", house_number: ""
  });
  const [showPDrop, setShowPDrop] = useState(false);
  const propCityRef = useRef(null);
  const pWrapRef = useRef(null);

  // ---------- ratings ----------
  const [scores, setScores] = useState({
    communication_score: 0, repairs_score: 0, moving_score: 0,
    health_safety_score: 0, privacy_score: 0,
  });
  const [comment, setComment] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // overall
  const overall = useMemo(() => {
    const v = Object.values(scores);
    if (!v.every(x => x > 0)) return 0;
    return Math.round((v.reduce((a,b)=>a+b,0)/5)*10)/10;
  }, [scores]);

  // ---------- live search: landlord (debounced, no panel closing) ----------
  useEffect(() => {
    const q = qL.trim();
    setSelectedLandlord(null); // typing cancels selection, but don't close panel
    if (q.length < 2) { setLandlordResults([]); setShowLDrop(false); return; }
    setShowLDrop(true);
    const t = setTimeout(async () => {
      try {
        const data = await api.get(`/api/search?q=${encodeURIComponent(q)}`);
        setLandlordResults(data.landlords || []);
      } catch { setLandlordResults([]); }
    }, 220);
    return () => clearTimeout(t);
  }, [qL]);

  // ---------- live search: property (debounced, no panel closing) ----------
  useEffect(() => {
    const q = qP.trim();
    setSelectedProperty(null);
    if (q.length < 2) { setPropertyResults([]); setShowPDrop(false); return; }
    setShowPDrop(true);
    const t = setTimeout(async () => {
      try {
        const data = await api.get(`/api/search?q=${encodeURIComponent(q)}`);
        setPropertyResults(data.properties || []);
      } catch { setPropertyResults([]); }
    }, 220);
    return () => clearTimeout(t);
  }, [qP]);

  // click-outside: close dropdowns
  useEffect(() => {
    function onDocClick(e) {
      if (lWrapRef.current && !lWrapRef.current.contains(e.target)) setShowLDrop(false);
      if (pWrapRef.current && !pWrapRef.current.contains(e.target)) setShowPDrop(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // selecting existing landlord/property → prefill + open panel + close dropdown
  useEffect(() => {
    if (selectedLandlord) {
      setAddLandlordOpen(true);
      setNewLandlord({
        first_name: selectedLandlord.first_name || "",
        last_name: selectedLandlord.last_name || "",
      });
      setShowLDrop(false);
    }
  }, [selectedLandlord]);

  useEffect(() => {
    if (selectedProperty) {
      setAddPropertyOpen(true);
      setNewProperty({
        city: selectedProperty.city || "",
        postal_code: selectedProperty.postal_code || "",
        street: selectedProperty.street || "",
        house_number: selectedProperty.house_number || "",
      });
      setShowPDrop(false);
    }
  }, [selectedProperty]);

  // user chose "add new" → open blank panel, clear search, hide dropdown, focus first field
  function openAddLandlordFromQuery() {
    setAddLandlordOpen(true);
    setSelectedLandlord(null);
    setNewLandlord({ first_name: "", last_name: "" });
    setQL("");
    setShowLDrop(false);
    setTimeout(() => landFirstRef.current?.focus(), 0);
  }

  function openAddPropertyFromQuery() {
    setAddPropertyOpen(true);
    setSelectedProperty(null);
    setNewProperty({ city: "", postal_code: "", street: "", house_number: "" });
    setQP("");
    setShowPDrop(false);
    setTimeout(() => propCityRef.current?.focus(), 0);
  }

  // validation
  const landlordOk = !!selectedLandlord || (newLandlord.first_name && newLandlord.last_name);
  const propertyOk = !!selectedProperty || (
    newProperty.city && newProperty.street && newProperty.house_number && newProperty.postal_code
  );
  const ratingsOk = Object.values(scores).every(v => v >= 1 && v <= 5) && agree;
  const ready = landlordOk && propertyOk && ratingsOk && !submitting;

  // submit
  async function handleSubmit() {
    if (!ready) return;
    setSubmitting(true);
    try {
      let landlord_id = selectedLandlord?.landlord_id;
      if (!landlord_id) {
        const l = await api.post("/api/landlords", newLandlord);
        landlord_id = l.landlord_id;
      }
      let property_id = selectedProperty?.property_id;
      if (!property_id) {
        const p = await api.post("/api/properties", { ...newProperty, landlord_id });
        property_id = p.property_id;
      }
      await api.post("/api/reviews", { property_id, comment, ...scores });
      alert("Ocena je bila uspešno dodana.");
      nav(`/properties/${property_id}`);
    } catch (err) {
      alert(`Napaka pri oddaji ocene: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      {/* HERO */}
      <section className="hero hero--form">
        <div className="container hero__grid">
          <div className="hero__left">
            <h1 className="hero__title title__mid">
              Dodaj oceno <span className="accent">najemodajalca</span> in nepremičnine
            </h1>
            <p className="hero__subtitle">
              Oceni izkušnjo z najemodajalcem po kategorijah. Tvoj prispevek je anonimen.
            </p>
          </div>
          <div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <img
                className="hero__image"
                src="https://i.pinimg.com/736x/b0/4e/57/b04e57c19dfdd2a18ecf5ec7d98039b9.jpg"
                alt="Soba z modrim pohištvom"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <div className="container container--narrow">
        {/* 1) Landlord */}
        <div className="card--section">
          <h3 style={{ marginTop: 0 }}>1) Najemodajalec</h3>

          <label className="field">
            <div className="label">Poišči najemodajalca</div>
            <div ref={lWrapRef} style={{ position: "relative" }}>
              <input
                className="input"
                placeholder="Ime ali priimek…"
                value={qL}
                onFocus={() => setShowLDrop(true)}
                onChange={(e) => { setQL(e.target.value); setShowLDrop(true); }}
              />
              {showLDrop && qL.trim().length >= 2 && (
                <div className="dropdown">
                  {landlordResults.length > 0 ? (
                    landlordResults.map((l) => (
                      <div
                        key={l.landlord_id}
                        className="dropdown-item"
                        onMouseDown={() => {
                          setSelectedLandlord(l);
                          setQL(`${l.first_name} ${l.last_name}`);
                        }}
                      >
                        {l.first_name} {l.last_name}
                      </div>
                    ))
                  ) : (
                    <div
                      className="dropdown-item dropdown-item--add"
                      onMouseDown={openAddLandlordFromQuery}
                    >
                      Ni zadetkov - Dodaj najemmodajalca!
                    </div>
                  )}
                </div>
              )}
            </div>
          </label>

          {addLandlordOpen && (
            <div className="panel" style={{ marginTop: 10 }}>
              <div className="row-2">
                <label className="field">
                  <div className="label">Ime</div>
                  <input
                    ref={landFirstRef}
                    className="input"
                    placeholder="Ime"
                    value={newLandlord.first_name}
                    onChange={(e)=>setNewLandlord({ ...newLandlord, first_name: e.target.value })}
                  />
                </label>
                <label className="field">
                  <div className="label">Priimek</div>
                  <input
                    className="input"
                    placeholder="Priimek"
                    value={newLandlord.last_name}
                    onChange={(e)=>setNewLandlord({ ...newLandlord, last_name: e.target.value })}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 2) Property */}
        <div className="card--section">
          <h3 style={{ marginTop: 0 }}>2) Nepremičnina</h3>

          <label className="field">
            <div className="label">Poišči nepremičnino</div>
            <div ref={pWrapRef} style={{ position: "relative" }}>
              <input
                className="input"
                placeholder="Naslov ali mesto…"
                value={qP}
                onFocus={() => setShowPDrop(true)}
                onChange={(e) => { setQP(e.target.value); setShowPDrop(true); }}
              />
              {showPDrop && qP.trim().length >= 2 && (
                <div className="dropdown">
                  {propertyResults.length > 0 ? (
                    propertyResults.map((p) => (
                      <div
                        key={p.property_id}
                        className="dropdown-item"
                        onMouseDown={() => {
                          setSelectedProperty(p);
                          setQP(`${p.street} ${p.house_number}, ${p.city}`);
                        }}
                      >
                        {p.street} {p.house_number}, {p.city}
                      </div>
                    ))
                  ) : (
                    <div
                      className="dropdown-item dropdown-item--add"
                      onMouseDown={openAddPropertyFromQuery}
                    >
                      Ni zadetkov - Dodaj nepremičnino!
                    </div>
                  )}
                </div>
              )}
            </div>
          </label>

          {addPropertyOpen && (
            <div className="panel" style={{ marginTop: 10 }}>
              <div className="row-2">
                <label className="field">
                  <div className="label">Mesto</div>
                  <input
                    ref={propCityRef}
                    className="input"
                    placeholder="Mesto"
                    value={newProperty.city}
                    onChange={(e)=>setNewProperty({ ...newProperty, city: e.target.value })}
                  />
                </label>
                <label className="field">
                  <div className="label">Poštna številka</div>
                  <input
                    className="input"
                    placeholder="Poštna številka"
                    value={newProperty.postal_code}
                    onChange={(e)=>setNewProperty({ ...newProperty, postal_code: e.target.value })}
                  />
                </label>
              </div>
              <div className="row-2">
                <label className="field">
                  <div className="label">Ulica</div>
                  <input
                    className="input"
                    placeholder="Ulica"
                    value={newProperty.street}
                    onChange={(e)=>setNewProperty({ ...newProperty, street: e.target.value })}
                  />
                </label>
                <label className="field">
                  <div className="label">Hišna številka</div>
                  <input
                    className="input"
                    placeholder="Hišna številka"
                    value={newProperty.house_number}
                    onChange={(e)=>setNewProperty({ ...newProperty, house_number: e.target.value })}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 3) Ratings */}
        <div className="card--section">
          <div className="ratings-head">
            <h3 style={{ margin: 0 }}>3) Ocene po kategorijah</h3>
            <div className="overall-pill">{overall || "—"} / 5</div>
          </div>

          <div className="ratings-grid">
            {[
              ["Komunikacija","communication_score"],
              ["Vzdrževanje in popravila","repairs_score"],
              ["Vselitev / izselitev","moving_score"],
              ["Zdravje in varnost","health_safety_score"],
              ["Zasebnost","privacy_score"],
            ].map(([label,key])=>(
              <div className="field" key={key}>
                <div className="label">{label}</div>
                <StarRating value={scores[key]} onChange={(n)=>setScores({ ...scores, [key]: n })}/>
              </div>
            ))}
          </div>

          <label className="field" style={{ marginTop: 10 }}>
            <div className="label">Opíšite svojo izkušnjo (neobvezno)</div>
            <textarea
              className="input"
              rows={6}
              placeholder="Opiši svoje izkušnje: komunikacija, odzivnost, popravila, vračilo varščine, zasebnost … (brez osebnih podatkov)."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>
        </div>

        <label className="field" style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
          <input type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
          <span> Strinjam se s <Link to="/pravila" style={{ textDecoration: "underline" }}>pravili objave</Link> in potrjujem, da je ocena poštena in resnična.</span>
        </label>

        <div className="actions">
          <button
            className="btn btn--solid"
            type="button"
            onClick={handleSubmit}
            disabled={!ready}
            title={ready ? "" : "Izberi/dodaj najemodajalca in nepremičnino, ocenite 5 kategorij, potrdi pravila"}
          >
            {submitting ? "Pošiljam…" : "Objavi oceno"}
          </button>
          <Link to="/" className="btn">Prekliči</Link>
        </div>
      </div>
    </main>
  );
}
