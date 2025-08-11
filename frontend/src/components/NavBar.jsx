// src/components/NavBar.jsx
import { NavLink, Link } from "react-router-dom";

export default function NavBar() {
  return (
    <header className="nav">
      <div className="nav__inner container">
        <div className="nav__brand">
          <div className="logo-dot" />
          <Link className="brand" to="/">MojNajemodajalec</Link>
        </div>
        <nav className="nav__links">
          <NavLink to="/" end>Domov</NavLink>
          <NavLink to="/about">O nas</NavLink>
          <NavLink to="/reviews/new" className="btn btn--ghost">Dodaj oceno</NavLink>
        </nav>
      </div>
    </header>
  );
}
