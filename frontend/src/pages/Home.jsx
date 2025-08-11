import { useEffect, useRef, useState } from "react";
import { useNavigate} from "react-router-dom";
import { api } from "../api";

export default function Home() {
  const nav = useNavigate();

  // search state
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // live search (debounced)
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setOpen(true);
    const t = setTimeout(async () => {
      try {
        const data = await api.get(`/api/search?q=${encodeURIComponent(term)}`);
        // map results to a simpler format
        const props = (data.properties || []).map(p => ({
          id: p.property_id,
          address: `${p.street} ${p.house_number}${p.city ? ", " + p.city : ""}`,
          landlord: [p.first_name, p.last_name].filter(Boolean).join(" "),
        }));
        setResults(props);
      } catch {
        setResults([]);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  // close dropdown on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__left">
            <h1 className="hero__title">
              Ocenjuj in preveri <br />
              <span className="accent">najemodajalce</span> po Sloveniji
            </h1>
            <p className="hero__subtitle">
              MojNajemodajalec pomaga najemnikom deliti izkušnje z
              najemodajalci in pregledovati ocene drugih. Brez slik nepremičnin,
              s poudarkom na izkušnji.
            </p>

            <form className="search" onSubmit={(e) => e.preventDefault()}>
              <div style={{ position: "relative", width: "100%" }} ref={boxRef}>
                <input
                  className="input"
                  placeholder="Išči najemodajalca ali naslov…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => q.trim().length >= 2 && setOpen(true)}
                />
                {open && (
                  <div className="dropdown">
                    {results.length > 0 ? (
                      results.map((r) => (
                        <div
                          key={r.id}
                          className="dropdown-item"
                          onMouseDown={() => nav(`/properties/${r.id}`)}
                          title="Poglej ocene"
                        >
                          <div>
                            <div className="add-hl">{r.landlord} - {r.address}</div>
                            
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        className="dropdown-item dropdown-item--add"
                        onMouseDown={() => nav("/reviews/new")}
                      >
                        <span className="add-text">
                          <span className="add-hl">Ni zadetkov - </span>
                          <span className="add-sub">Dodaj oceno!</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>

            <div className="chips">
              <span className="chip">⭐ Ocene po kategorijah</span>
              <span className="chip">🕵️ Anonimno oddajanje ocen</span>
              <span className="chip">🚩 Prijave neprimernih vsebin</span>
            </div>
          </div>

          <div>
            <img
              src="https://i.pinimg.com/originals/0f/db/b2/0fdbb29f3a15d43270c16f74cbde8a4b.jpg"
              alt="Living room with blue furniture"
              className="hero__image"
            />
          </div>
        </div>
      </section>

      {/* Kako deluje */}
      <section id="kako-deluje" className="section">
        <div className="container">
          <h2>Kako deluje</h2>
          <div className="features">
            <div className="feature">
              <div className="feature__icon">🔎</div>
              <div className="feature__title">Poišči najemodajalca</div>
              <p>Vpiši ime, naslov ali mesto in preglej obstoječe ocene.</p>
            </div>
            <div className="feature">
              <div className="feature__icon">📖</div>
              <div className="feature__title">Preberi izkušnje</div>
              <p>Ocene so razdeljene po kategorijah in brez slik nepremičnin.</p>
            </div>
            <div className="feature">
              <div className="feature__icon">✍️</div>
              <div className="feature__title">Oddaj svojo oceno</div>
              <p>Anonimno opiši izkušnjo in oceni posamezne kategorije.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
