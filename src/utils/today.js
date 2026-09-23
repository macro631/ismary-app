// Fecha de referencia única para todo el prototipo: agenda, fichas,
// documentos, disponibilidad y portal de reserva quedan anclados a esta
// fecha fija (coincide con la semana de datos de prueba) en vez de al reloj
// real del dispositivo, para que la demo se vea coherente de punta a punta
// sin importar cuándo se abra el link. Cambiar solo este valor "adelanta"
// el prototipo completo a otra fecha.
export const HOY = "2026-10-16";

const ZONA_HORARIA = "America/Santiago";

// Hora actual "HH:mm" anclada a la zona horaria de Chile continental, sin
// importar en qué huso horario esté el dispositivo del usuario (el sitio
// se ve desde cualquier parte, pero las horas de autoguardado deben
// coincidir con la hora real en Chile).
export function nowHHMM() {
  const partes = new Intl.DateTimeFormat("es-CL", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hora = partes.find((p) => p.type === "hour").value;
  const minuto = partes.find((p) => p.type === "minute").value;
  return `${hora}:${minuto}`;
}
