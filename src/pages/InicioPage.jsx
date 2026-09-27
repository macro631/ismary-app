import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SERVICIOS, MODALIDADES } from "../data/servicios";
import ServiceCard from "../components/ServiceCard";

export default function InicioPage() {
  const location = useLocation();
  useEffect(() => {
    if (location.state?.scrollToServices) document.getElementById("servicios")?.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.key, location.state]);
  return (
    <div className="public-home">
      <section className="public-hero" aria-labelledby="bienvenida-title">
        <div className="public-hero-content">
          <p className="public-eyebrow"><span className="public-eyebrow-line" /> MATRONA · LA SERENA / COQUIMBO</p>
          <h1 id="bienvenida-title">Hola, soy Ismary, <em>matrona.</em></h1>
          <p className="public-hero-slogan">Cercanía y confianza en cada atención.</p>
          <p className="public-intro">Acompaño consultas programadas de posparto, lactancia, embarazo de bajo riesgo y salud sexual y reproductiva. Mi compromiso es escucharte sin juicios, explicarte las opciones con claridad y respetar tus decisiones.</p>
          <div className="public-hero-actions">
            <button type="button" className="public-button" onClick={() => document.getElementById("servicios")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}>Ver atenciones <span aria-hidden="true">↗</span></button>
            <Link to="/reserva" className="public-button-secondary">Solicitar hora</Link>
          </div>
          <p className="public-hero-location"><span className="material-symbols-outlined" aria-hidden="true">location_on</span><span>Visitas a domicilio en La Serena y Coquimbo; teleconsulta y box según disponibilidad</span></p>
        </div>
        <div className="public-hero-visual" aria-hidden="true">
          <div className="public-hero-frame">
            <span className="public-hero-frame-label">Matronería independiente</span>
            <img className="public-mother" src="ornamentos/figura-materna.svg" alt="" />
            <img className="public-sprig" src="ornamentos/ramita.svg" alt="" />
          </div>
          <div className="public-hero-note"><span className="public-note-mark">✦</span><span>Registro SIS<br />N.º 802617</span></div>
        </div>
      </section>
      <div className="public-trust-strip" aria-label="Principios de atención"><span>Escucha sin juicios</span><span>Información clara</span><span>Decisiones respetadas</span></div>
      <section id="servicios" className="public-section public-services" aria-labelledby="servicios-title">
        <div className="public-section-heading"><div><p className="public-eyebrow">ATENCIONES</p><h2 id="servicios-title">Atenciones disponibles</h2></div><p>Elige la prestación que necesitas. Cada ficha muestra su duración y un rango de precio orientativo.</p></div>
        <div className="public-services-grid">
          {SERVICIOS.map((servicio, index) => <ServiceCard key={servicio.key} servicio={servicio} index={index + 1}><Link to={`/reserva?servicio=${servicio.key}`} className="service-link" aria-label={`Solicitar ${servicio.nombre}`}>Ver horarios <span aria-hidden="true">↗</span></Link></ServiceCard>)}
        </div>
        <p className="public-service-note">Duración y precios orientativos. Modalidad, cobertura y valor final se acuerdan antes de confirmar una atención.</p>
      </section>
      <section className="public-section public-modalities" aria-labelledby="modalidades-title">
        <div className="public-modalities-heading"><p className="public-eyebrow">MODALIDADES</p><h2 id="modalidades-title">En tu hogar, por videollamada o en box</h2></div>
        <div className="public-modalities-grid">{Object.values(MODALIDADES).map((m, index) => <div className="public-modality" key={m.key}><span className="public-modality-number">0{index + 1}</span><span className="material-symbols-outlined" aria-hidden="true">{m.icono}</span><h3>{m.label}</h3><p>{m.desc}</p></div>)}</div>
        <p className="public-modalities-note">El domicilio se limita a La Serena y Coquimbo; el box se ofrece solo con disponibilidad confirmada de un establecimiento.</p>
      </section>
      <section className="public-section public-faq" aria-labelledby="dudas-title">
        <div className="public-faq-intro"><p className="public-eyebrow">ANTES DE AGENDAR</p><h2 id="dudas-title">Lo que conviene saber antes de solicitar</h2><p>Para confirmar cobertura, modalidad o precio final, usa el canal de contacto.</p><a href="https://www.instagram.com/ismary.mt/" target="_blank" rel="noreferrer" className="public-text-link">Contactar por Instagram @ismary.mt ↗</a></div>
        <div className="public-faq-list">
          <details><summary>¿Dónde hay atención a domicilio?</summary><p>Se coordinan visitas en La Serena y Coquimbo. La dirección y el tiempo de traslado deben revisarse antes de confirmar.</p></details>
          <details><summary>¿Los precios publicados son definitivos?</summary><p>No. Son rangos orientativos; el precio final depende del servicio, modalidad y sector, y se informa antes de confirmar.</p></details>
          <details><summary>¿Esta página confirma una cita?</summary><p>No. Este prototipo guarda la solicitud solo en el navegador y no la envía a la profesional. Para coordinar una atención real, usa el enlace de Instagram.</p></details>
          <details><summary>¿Necesito crear una cuenta?</summary><p>No. El flujo de reserva usa el RUT para buscar una ficha existente y evitar duplicados; no pide una contraseña a la paciente.</p></details>
          <details><summary>¿Se atienden urgencias o partos a domicilio?</summary><p>No. Se ofrecen consultas programadas; no se atienden urgencias ni partos a domicilio. Ante una urgencia, acude a un servicio de urgencias.</p></details>
        </div>
      </section>
    </div>
  );
}
