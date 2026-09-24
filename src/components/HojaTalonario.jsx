// Tarjeta "hoja de talonario" para pantallas públicas: superficie blanca con
// la flor en acuarela asomando por la esquina inferior izquierda, igual que
// en la receta impresa. La flor va detrás de la hoja (solo se ve la parte que
// sobresale), así nunca tapa campos ni botones (design-system.md §6).
export default function HojaTalonario({ children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <img
        src="ornamentos/flor-esquina-izq.png"
        alt=""
        aria-hidden="true"
        className="absolute -bottom-10 -left-5 w-28 md:-bottom-16 md:-left-20 md:w-44 pointer-events-none select-none"
      />
      <div className="relative bg-surface-container-lowest rounded-xl shadow-[0_8px_30px_-12px_rgba(122,46,80,0.25)] border border-border-subtle/60">
        {children}
      </div>
    </div>
  );
}
