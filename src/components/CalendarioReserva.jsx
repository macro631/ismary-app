import { useState } from "react";
import { dayNumber, formatLongDate, getMonthGrid } from "../utils/date";
import { HOY } from "../utils/today";

export default function CalendarioReserva({ fechas, fecha, onSelect }) {
  const months = [...new Set(fechas.map((iso) => `${iso.slice(0, 7)}-01`))].sort();
  const [monthIndex, setMonthIndex] = useState(0);
  const index = Math.min(monthIndex, Math.max(months.length - 1, 0));
  const { cells, label } = getMonthGrid(months[index] || HOY);
  const disponibles = new Set(fechas);
  return (
    <div className="booking-calendar">
      <div className="booking-calendar-header">
        <button type="button" aria-label="Mes anterior" disabled={index === 0} onClick={() => setMonthIndex(index - 1)}>←</button>
        <p aria-live="polite">{label}</p>
        <button type="button" aria-label="Mes siguiente" disabled={index >= months.length - 1} onClick={() => setMonthIndex(index + 1)}>→</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1" aria-hidden="true">{["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i} className="text-[12px] font-label-md text-secondary">{d}</span>)}</div>
      <div className="booking-calendar-days">
        {cells.map(({ iso, inMonth }) => <button type="button" key={iso} disabled={!inMonth || !disponibles.has(iso)} aria-label={formatLongDate(iso)} aria-pressed={iso === fecha} onClick={() => onSelect(iso)} className={`${!inMonth ? "invisible" : iso === fecha ? "booking-calendar-selected" : disponibles.has(iso) ? "booking-calendar-available" : "booking-calendar-disabled"}`}>{dayNumber(iso)}</button>)}
      </div>
      <p className="mt-3 text-body-sm text-on-surface-variant">Los días destacados tienen horarios disponibles.</p>
    </div>
  );
}
