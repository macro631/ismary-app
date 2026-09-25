import { MODALIDADES, SERVICIOS } from "../data/servicios.js";
import { parseISODate, toISODate, weekStart } from "./date.js";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function minutesOfDay(hora) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora || "")) return NaN;
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function addMinutes(hora, duration) {
  const end = minutesOfDay(hora) + duration;
  if (!Number.isFinite(end) || end >= 1440 || end < 0) return "";
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}

export function validDate(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso || "") && toISODate(parseISODate(iso)) === iso;
}

export function durationOf(record) {
  const explicit = minutesOfDay(record.horaFin) - minutesOfDay(record.horaInicio || record.hora);
  if (explicit > 0) return explicit;
  if (Number(record.duracionMin) > 0) return Number(record.duracionMin);
  return SERVICIOS.find((s) => s.key === record.servicioKey || s.nombre === record.tipo)?.duracionMin || 60;
}

export function hasConflict({ fecha, hora, duracionMin, appointments = [], webRequests = [], ignoreAppointmentId, ignoreRequestId }) {
  const start = minutesOfDay(hora);
  const end = start + duracionMin;
  return [...appointments.filter((a) => a.id !== ignoreAppointmentId && a.estado !== "cancelada"),
    ...webRequests.filter((r) => r.id !== ignoreRequestId && r.estado !== "cancelada")].some((record) => {
    const occupiedStart = minutesOfDay(record.horaInicio || record.hora);
    return record.fecha === fecha && start < occupiedStart + durationOf(record) && end > occupiedStart;
  });
}

export function getAvailableSlots({ fecha, servicio, modalidad, config, appointments = [], webRequests = [], publishedWeeks, publicRequest = true }) {
  if (!validDate(fecha) || !servicio || !modalidad || !config) return [];
  const day = parseISODate(fecha).getDay();
  if (!servicio.modalidades.includes(modalidad.key) || !config.modalidadesActivas.includes(modalidad.valor)
    || !config.diasActivos.includes(DIAS[day]) || !modalidad.dias.includes(day)
    || (publicRequest && !publishedWeeks?.[weekStart(fecha)])) return [];
  return modalidad.horas.filter((hora) => {
    const start = minutesOfDay(hora);
    return start >= minutesOfDay(config.horaInicio) && start + servicio.duracionMin <= minutesOfDay(config.horaFin)
      && !hasConflict({ fecha, hora, duracionMin: servicio.duracionMin, appointments, webRequests });
  });
}

export function validateBooking(booking, state, { publicRequest = true, today } = {}) {
  const servicio = SERVICIOS.find((s) => s.key === booking.servicioKey);
  const modalidad = MODALIDADES[booking.modalidadKey];
  if (!validDate(booking.fecha) || !Number.isFinite(minutesOfDay(booking.hora))) return "Selecciona una fecha y una hora válidas.";
  if (today && (booking.fecha < today || (publicRequest && booking.fecha === today))) return "Selecciona una fecha disponible para esta atención.";
  if (!getAvailableSlots({ ...state, fecha: booking.fecha, servicio, modalidad, publicRequest }).includes(booking.hora)) {
    return "Ese horario ya no está disponible. Elige otro para continuar.";
  }
  return null;
}

// Una confirmación conserva la duración y descuenta su propia solicitud del cruce.
export function confirmRequest(state, requestId) {
  const request = state.webRequests.find((r) => r.id === requestId);
  if (!request) return { error: "Esta solicitud ya fue procesada. Actualiza la agenda." };
  const duracionMin = durationOf(request);
  const horaFin = addMinutes(request.hora, duracionMin);
  if (!horaFin || hasConflict({ ...state, fecha: request.fecha, hora: request.hora, duracionMin, ignoreRequestId: requestId })) {
    return { error: "La solicitud coincide con otra atención o solicitud pendiente. Revisa la agenda antes de confirmarla." };
  }
  return {
    webRequests: state.webRequests.filter((r) => r.id !== requestId),
    appointments: [...state.appointments, {
      ...request, id: `c-${requestId}`, horaInicio: request.hora, horaFin, duracionMin,
      modalidad: request.modalidad === "Box Centro Médico" ? "Box Clínico" : request.modalidad,
      estado: "confirmada", ubicacion: request.ubicacion || request.modalidad,
    }],
  };
}
