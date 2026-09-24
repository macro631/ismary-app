const DIA_LABELS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MES_LABELS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

// Devuelve las fechas Lunes-Sábado de la semana que contiene `iso`.
export function getWeekDates(iso) {
  const date = parseISODate(iso);
  const dow = date.getDay(); // 0 = domingo
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISODate(d);
  });
}

// Lunes de la semana que contiene `iso` (misma convención que getWeekDates).
export function weekStart(iso) {
  return getWeekDates(iso)[0];
}

export function dayLabel(iso) {
  return DIA_LABELS[parseISODate(iso).getDay()];
}

export function dayNumber(iso) {
  return parseISODate(iso).getDate();
}

export function formatRangeLabel(weekDates) {
  const start = parseISODate(weekDates[0]);
  const end = parseISODate(weekDates[weekDates.length - 1]);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const mes = MES_LABELS[end.getMonth()];
  const anio = end.getFullYear();
  return `${startDay} – ${endDay} de ${mes}, ${anio}`;
}

export function formatLongDate(iso) {
  const d = parseISODate(iso);
  const dowNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return `${dowNames[d.getDay()]} ${d.getDate()} de ${MES_LABELS[d.getMonth()]}`;
}

export function weekNumber(iso) {
  const date = parseISODate(iso);
  const firstJan = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - firstJan) / 86400000);
  return Math.ceil((days + firstJan.getDay() + 1) / 7);
}

export function getMonthGrid(iso) {
  const ref = parseISODate(iso);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1; // semana empieza lunes
  const start = new Date(firstOfMonth);
  start.setDate(1 - startOffset);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { iso: toISODate(d), inMonth: d.getMonth() === month };
  });
  return { cells, label: `${MES_LABELS[month].charAt(0).toUpperCase() + MES_LABELS[month].slice(1)} ${year}` };
}
