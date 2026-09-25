export default function ServiceCard({ servicio, selected = false, index, children }) {
  return (
    <div className={`service-card ${selected ? "service-card-selected" : ""}`}>
      <div className="service-card-top"><span className="service-number" aria-hidden="true">{String(index || 1).padStart(2, "0")}</span><span className={`service-symbol service-symbol-${servicio.key}`} aria-hidden="true"><span className="material-symbols-outlined">{servicio.icono}</span></span></div>
      <h3>{servicio.nombre}</h3>
      <p className="service-description">{servicio.descripcion}</p>
      <div className="service-card-bottom"><div className="service-meta"><span>{servicio.duracion}</span><strong>{servicio.arancel}</strong></div>{children}</div>
    </div>
  );
}
