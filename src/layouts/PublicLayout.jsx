import { Link } from "react-router-dom";
import "./PublicLayout.css";

export default function PublicLayout({ children }) {
  return (
    <div className="public-site overflow-x-hidden">
      <header className="public-header">
        <Link to="/" className="public-brand" aria-label="Ismary, volver al inicio">
          <img src="logo/icono-color.svg" alt="" className="public-brand-icon" />
          <img src="logo/nombre-color.svg" alt="Ismary Ugalde Rojas" className="public-brand-name" />
        </Link>
        <nav className="public-nav" aria-label="Navegación principal">
          <Link to="/" state={{ scrollToServices: true }} className="public-nav-services">Servicios</Link>
          <Link to="/reserva" className="public-nav-book">Solicitar atención <span aria-hidden="true">↗</span></Link>
          <Link to="/login" className="public-nav-login">Acceso profesional</Link>
        </nav>
      </header>
      <main className="public-main">{children}</main>
      <footer className="public-footer">
        <p className="public-footer-heading">Salud sexual · ginecológica · reproductiva</p>
        <div className="public-footer-bottom">
          <p>Ismary Ugalde Rojas, Matrona <span aria-hidden="true">·</span> Registro SIS N.º 802617</p>
          <a href="https://www.instagram.com/ismary.mt/" target="_blank" rel="noreferrer">Instagram @ismary.mt ↗</a>
        </div>
      </footer>
    </div>
  );
}
