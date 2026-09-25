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
          <p className="public-eyebrow"><span className="public-eyebrow-line" /> ATENCIÓN DE MATRONA · LA SERENA</p>
          <h1 id="bienvenida-title">Tu salud merece <em>un espacio seguro.</em></h1>
          <p className="public-intro">Acompañamiento cercano y profesional en salud sexual, ginecológica y reproductiva. Con Ismary Ugalde Rojas, cada consulta comienza escuchándote.</p>
          <div className="public-hero-actions">
            <Link to="/reserva" className="public-button">Explorar horarios <span aria-hidden="true">↗</span></Link>
            <button type="button" className="public-button-secondary" onClick={() => document.getElementById("servicios")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}>Conocer las atenciones</button>
          </div>
          <p className="public-hero-location"><span className="material-symbols-outlined" aria-hidden="true">location_on</span> La Serena y Coquimbo <span aria-hidden="true">·</span> También por videollamada</p>
        </div>
        <div className="public-hero-visual" aria-hidden="true">
          <div className="public-hero-frame">
            <span className="public-hero-frame-label">Cuidado en cada etapa</span>
            <img className="public-mother" src="ornamentos/figura-materna.svg" alt="" />
            <img className="public-sprig" src="ornamentos/ramita.svg" alt="" />
          </div>
          <div className="public-hero-note"><span className="public-note-mark">✦</span><span>Tu historia merece<br />ser escuchada</span></div>
        </div>
      </section>
      <div className="public-trust-strip" aria-label="Formas de atención"><span>Atención personalizada</span><span>Presencial y a domicilio</span><span>Teleconsulta disponible</span></div>
      <section id="servicios" className="public-section public-services" aria-labelledby="servicios-title">
        <div className="public-section-heading"><div><p className="public-eyebrow">ATENCIONES</p><h2 id="servicios-title">Cuidado que se adapta a ti</h2></div><p>Elige el motivo de tu consulta. En cada atención encontrarás un espacio para resolver dudas y tomar decisiones informadas.</p></div>
        <div className="public-services-grid">
          {SERVICIOS.map((servicio, index) => <ServiceCard key={servicio.key} servicio={servicio} index={index + 1}><Link to={`/reserva?servicio=${servicio.key}`} className="service-link" aria-label={`Solicitar ${servicio.nombre}`}>Ver horarios <span aria-hidden="true">↗</span></Link></ServiceCard>)}
        </div>
      </section>
      <section className="public-section public-modalities" aria-labelledby="modalidades-title">
        <div className="public-modalities-heading"><p className="public-eyebrow">A TU MANERA</p><h2 id="modalidades-title">Encuentra la forma de atención que te acomoda</h2></div>
        <div className="public-modalities-grid">{Object.values(MODALIDADES).map((m, index) => <div className="public-modality" key={m.key}><span className="public-modality-number">0{index + 1}</span><span className="material-symbols-outlined" aria-hidden="true">{m.icono}</span><h3>{m.label}</h3><p>{m.desc}</p></div>)}</div>
        <p className="public-modalities-note">Las modalidades y los horarios disponibles dependen de cada servicio.</p>
      </section>
      <section className="public-section public-faq" aria-labelledby="dudas-title">
        <div className="public-faq-intro"><p className="public-eyebrow">ANTES DE AGENDAR</p><h2 id="dudas-title">Tus dudas también tienen un espacio.</h2><p>Si prefieres conversar antes de elegir una atención, puedes escribir directamente a Ismary.</p><a href="https://www.instagram.com/ismary.mt/" target="_blank" rel="noreferrer" className="public-text-link">Escribir por Instagram @ismary.mt ↗</a></div>
        <div className="public-faq-list">
          <details><summary>¿Cómo solicito una hora?</summary><p>En esta demostración puedes probar el recorrido: ingresa tu RUT y datos de contacto, elige servicio, modalidad y horario. La solicitud se guarda solo en este navegador; para una atención real, escribe a @ismary.mt.</p></details>
          <details><summary>¿Necesito crear una cuenta?</summary><p>No necesitas crear una cuenta para solicitar atención. El RUT permite asociar la solicitud a tu ficha si ya eres paciente.</p></details>
          <details><summary>¿Qué pasa después de enviar la solicitud?</summary><p>La verás como pendiente en la agenda de demostración de este navegador. No se envía a Ismary automáticamente. Espera su confirmación directa antes de asistir.</p></details>
          <details><summary>¿Y si no encuentro un horario?</summary><p>Puedes escribir a <a href="https://www.instagram.com/ismary.mt/" target="_blank" rel="noreferrer">@ismary.mt</a> para consultar otras opciones de atención.</p></details>
        </div>
      </section>
    </div>
  );
}
