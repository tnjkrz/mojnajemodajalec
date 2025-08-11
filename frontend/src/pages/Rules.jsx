export default function Rules() {
  return (
    <main className="section">
      <div className="container">
        <h1>Pravila skupnosti</h1>
        <p className="small" style={{ color: "var(--muted)" }}>
          Namen MojNajemodajalca je poštena, koristna in varna izmenjava informacij
          o izkušnjah z najemodajalci v Sloveniji.
        </p>

        <div className="card" style={{ padding: 18, marginTop: 12 }}>
          <h2 style={{ marginTop: 0 }}>1) Kaj je dovoljeno</h2>
          <ul className="list">
            <li>Delite resnične, osebne izkušnje najema.</li>
            <li>Ocenjujte po kategorijah (komunikacija, popravila, itd.).</li>
            <li>Ostanite spoštljivi in konkretni (dejstva, datumi, potek).</li>
          </ul>

          <h2>2) Kaj ni dovoljeno</h2>
          <ul className="list">
            <li>Objava osebnih podatkov (telefon, e-pošta, EMŠO, bančni podatki).</li>
            <li>Žalitve, sovražni govor, grožnje ali namerno širjenje neresnic.</li>
            <li>Oglaševanje, spam, ponavljajoče se ocene za isti primer.</li>
          </ul>

          <h2>3) Prijave neprimernih vsebin</h2>
          <ul className="list">
            <li> Če menite, da je vsebina netočna ali krši pravila, oddajte <strong>prijavo</strong> z razlago.
            Skrbniki bodo preverili in po potrebi ukrepali.
            </li>
          </ul>

          <h2>4) Moderiranje in posledice</h2>
          <ul className="list">
            <li>Vsebine, ki kršijo pravila, bodo odstranjene.</li>
            <li>Uporabniki, ki ponavljajo kršitve, bodo <strong>blokirani</strong> (prepoved objavljanja).</li>
            <li>Lažne prijave lahko vodijo do omejitve prijav za uporabnika.</li>
          </ul>

          <h2>5) Zasebnost in odgovornost</h2>
          <ul className="list">
            <li>Ocene so anonimne in vezane na sejo; osebni podatki se ne zbirajo namenoma.</li>
            <li>Za vsebino ocen odgovarjajo avtorji; skrbniki lahko izvajajo uredniške posege.</li>
          </ul>

        </div>
      </div>
    </main>
  );
}
