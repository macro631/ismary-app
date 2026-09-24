const STATUS_STYLES = {
  confirmada: { label: "Confirmada", icon: "check", text: "text-status-confirmada", bg: "bg-status-confirmada-bg" },
  atendida: { label: "Atendida", icon: "task_alt", text: "text-status-confirmada", bg: "bg-status-confirmada-bg" },
  pendiente: { label: "Por confirmar", icon: "schedule", text: "text-status-pendiente", bg: "bg-status-pendiente-bg" },
  reprogramada: { label: "Reprogramada", icon: "sync", text: "text-status-reprogramada", bg: "bg-status-reprogramada-bg" },
  cancelada: { label: "Cancelada", icon: "cancel", text: "text-status-cancelada", bg: "bg-status-cancelada-bg" },
  no_asistio: { label: "No asistió", icon: "cancel", text: "text-status-cancelada", bg: "bg-status-cancelada-bg" },
  borrador: { label: "Borrador", icon: "edit_note", text: "text-status-pendiente", bg: "bg-status-pendiente-bg" },
  emitido: { label: "Emitido", icon: "check", text: "text-status-confirmada", bg: "bg-status-confirmada-bg" },
  "entregado-fisico": { label: "Entregado físico", icon: "local_shipping", text: "text-status-confirmada", bg: "bg-status-confirmada-bg" },
  reemplazado: { label: "Reemplazado", icon: "history", text: "text-on-surface-variant", bg: "bg-surface-container" },
  anulado: { label: "Anulado", icon: "block", text: "text-status-cancelada", bg: "bg-status-cancelada-bg" },
};

// compact: sin ícono, para columnas angostas (grilla semanal). El texto
// sigue indicando el estado, así el color nunca es la única señal.
export default function StatusBadge({ estado, compact = false, className = "" }) {
  const s = STATUS_STYLES[estado] || STATUS_STYLES.pendiente;
  return (
    <span
      className={`inline-flex items-center gap-1 ${compact ? "px-1.5" : "px-space-sm"} py-0.5 rounded-full font-label-md text-label-md whitespace-nowrap ${s.text} ${s.bg} ${className}`}
    >
      {!compact && <span aria-hidden="true" className="material-symbols-outlined text-[14px]">{s.icon}</span>}
      {s.label}
    </span>
  );
}
