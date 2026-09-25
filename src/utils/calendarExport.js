// RFC 5545: https://www.rfc-editor.org/rfc/rfc5545 (UTC y líneas de 75 octetos).
const ZONE = "America/Santiago";
const TITLE = "Atención con Ismary (por confirmar)";
const DESCRIPTION = "Horario solicitado, pendiente de confirmación por Ismary. Espera su confirmación antes de asistir.";

export function santiagoToUTC(fecha, hora) {
  const [y, m, d] = fecha.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  const wallTime = Date.UTC(y, m - 1, d, h, min);
  let instant = wallTime;
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map((p) => [p.type, p.value]));
    const rendered = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
    instant += wallTime - rendered;
  }
  return new Date(instant);
}

const stamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escapeText = (text) => text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
function fold(line) {
  let result = "", bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 75) { result += "\r\n "; bytes = 1; }
    result += char;
    bytes += size;
  }
  return result;
}

export function calendarExport(record, now = new Date()) {
  const start = santiagoToUTC(record.fecha, record.hora || record.horaInicio);
  const end = new Date(start.getTime() + record.duracionMin * 60000);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ismary//Agenda//ES", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${record.id}@ismary.mt`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeText(TITLE)}`, `DESCRIPTION:${escapeText(DESCRIPTION)}`, "STATUS:TENTATIVE", "END:VEVENT", "END:VCALENDAR"];
  const params = new URLSearchParams({ action: "TEMPLATE", text: TITLE, dates: `${stamp(start)}/${stamp(end)}`, details: DESCRIPTION, ctz: ZONE });
  return { ics: lines.map(fold).join("\r\n") + "\r\n", googleUrl: `https://calendar.google.com/calendar/render?${params}` };
}
