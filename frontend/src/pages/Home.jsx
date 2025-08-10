export default function Home() {
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
              fokus je na izkušnji.
            </p>

            <form className="search" onSubmit={(e) => e.preventDefault()}>
              <input
                className="input"
                placeholder="Išči najemodajalca ali naslov…"
              />
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

      {/* Skupnostna pravila */}
      <section className="section rules">
        <div className="container rules__grid">
          <div>
            <h3>Skupnostna pravila in varnost</h3>
            <p>
              Brez žalitev in osebnih podatkov. Neprimerne vsebine lahko
              prijavite — pregledali jih bomo.
            </p>
            <div className="list">
              <div>• Ocene temeljijo na osebnih izkušnjah uporabnikov.</div>
              <div>• Vsaka ocena vsebuje kategorije in končno oceno.</div>
              <div>• Brez slik nepremičnin; poudarek je na izkušnji najema.</div>
            </div>
          </div>
          <div className="rules__actions">
            <button className="btn btn--ghost">Pravila skupnosti</button>
            <button className="btn btn--red">Prijavi kršitev</button>
          </div>
        </div>
      </section>

    </main>
  );
}
