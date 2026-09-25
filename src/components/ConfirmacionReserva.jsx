import { Link } from "react-router-dom";
import { formatLongDate } from "../utils/date";
import { calendarExport } from "../utils/calendarExport";

export default function ConfirmacionReserva({ solicitud }) {
  const { googleUrl, ics } = calendarExport(solicitud);
  return (
    <div className="py-2">
      <div className="w-14 h-14 rounded-full bg-brand-soft text-primary flex items-center justify-center mb-5"><span className="material-symbols-outlined text-[30px]" aria-hidden="true">pending_actions</span></div>
      <p className="text-label-lg font-semibold text-status-pendiente mb-2">Pendiente de confirmación</p>
      <h1 className="font-headline-lg text-headline-lg text-primary">Solicitud guardada en esta demostración</h1>
      <p className="text-body-md text-on-surface-variant mt-3 leading-relaxed">La solicitud quedó guardada solo en este navegador. Para coordinar una atención real, escribe a @ismary.mt. Espera una confirmación directa de Ismary antes de asistir.</p>
      <dl className="grid sm:grid-cols-2 gap-4 p-5 my-6 bg-[#fffaf3] border border-border-subtle rounded-xl text-body-sm">
        <div className="sm:col-span-2"><dt className="text-on-surface-variant">Atención</dt><dd className="mt-1 font-semibold">{solicitud.tipo}</dd></div>
        <div><dt className="text-on-surface-variant">Fecha solicitada</dt><dd className="mt-1 font-semibold">{formatLongDate(solicitud.fecha)} de {solicitud.fecha.slice(0, 4)}</dd></div>
        <div><dt className="text-on-surface-variant">Horario · Chile continental</dt><dd className="mt-1 font-semibold">{solicitud.hora}–{solicitud.horaFin}</dd></div>
        <div><dt className="text-on-surface-variant">Modalidad</dt><dd className="mt-1 font-semibold">{solicitud.modalidad}</dd></div>
      </dl>
      <p className="text-body-sm text-on-surface-variant mb-3">Puedes guardar un recordatorio provisional. Añadirlo a tu calendario no confirma la cita.</p>
      <div className="flex flex-wrap gap-3">
        <a href={googleUrl} target="_blank" rel="noreferrer" className="public-button-secondary">Google Calendar ↗</a>
        <a href={`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`} download="solicitud-ismary.ics" className="public-button-secondary">Apple / Outlook (.ics)</a>
      </div>
      <div className="border-t border-border-subtle mt-6 pt-5 flex flex-wrap gap-4 justify-between text-body-sm">
        <a href="https://www.instagram.com/ismary.mt/" target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">¿Necesitas coordinar? @ismary.mt ↗</a>
        <Link to="/" className="text-primary hover:underline">Volver al inicio</Link>
      </div>
    </div>
  );
}
