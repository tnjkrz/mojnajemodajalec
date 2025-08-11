import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="small">
          <div className="logo-dot" /> MojNajemodajalec © 2025
        </div>
        <div className="footer__links">
          <Link to="/pravila">Pravila</Link>
          <Link to="/pravila">Zasebnost</Link>
        </div>
      </div>
    </footer>
  );
}
