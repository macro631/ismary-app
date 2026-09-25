import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG } from "../src/utils/configuracion.js";
import { MODALIDADES, SERVICIOS } from "../src/data/servicios.js";
import { getAvailableSlots, confirmRequest, hasConflict } from "../src/utils/scheduling.js";
import { prepareBooking } from "../src/utils/booking.js";
import { calendarExport, santiagoToUTC } from "../src/utils/calendarExport.js";

const week = { "2026-10-19": true };
const base = () => ({ patients: [], appointments: [], webRequests: [], config: DEFAULT_CONFIG, publishedWeeks: week });
const booking = { servicioKey: "prenatal", modalidadKey: "presencial", fecha: "2026-10-19", hora: "10:30" };

// Se reserva el intervalo completo del servicio, incluso cuando cambia la modalidad.
test("una cita o solicitud pendiente impide horarios que se superponen", () => {
  const state = base();
  state.appointments = [{ id: "c-1", fecha: booking.fecha, horaInicio: "09:00", horaFin: "10:00", estado: "confirmada" }];
  state.webRequests = [{ id: "w-1", fecha: booking.fecha, hora: "11:00", duracionMin: 60, estado: "pendiente" }];
  const slots = getAvailableSlots({ ...state, fecha: booking.fecha, servicio: SERVICIOS[2], modalidad: MODALIDADES.presencial });
  assert.equal(slots.includes("09:00"), false);
  assert.equal(slots.includes("10:30"), false);
  assert.equal(slots.includes("12:00"), true);
  assert.equal(hasConflict({ ...state, fecha: booking.fecha, hora: "10:30", duracionMin: 60 }), true);
});

test("no crea paciente ni solicitud cuando otro turno tomó el horario", () => {
  const state = base();
  state.webRequests = [{ id: "w-other", fecha: booking.fecha, hora: "11:00", duracionMin: 60, estado: "pendiente" }];
  const result = prepareBooking(state, { booking, newPatient: { nombre: "Paciente de prueba", rut: "12.345.678-5" } }, { id: "test", today: "2026-10-16" });
  assert.match(result.error, /no está disponible/);
  assert.equal(state.patients.length, 0);
  assert.equal(state.webRequests.length, 1);
});

test("al confirmar una solicitud mantiene la duración y libera su propia ocupación", () => {
  const state = base();
  const requested = prepareBooking(state, { booking, newPatient: { nombre: "Paciente de prueba", rut: "12.345.678-5" } }, { id: "test", today: "2026-10-16" });
  assert.equal(requested.error, undefined);
  assert.equal(requested.record.horaFin, "11:30");
  const confirmed = confirmRequest({ ...state, ...requested }, requested.record.id);
  assert.equal(confirmed.error, undefined);
  assert.equal(confirmed.webRequests.length, 0);
  assert.equal(confirmed.appointments[0].horaFin, "11:30");
  const overlapping = confirmRequest({ ...state, webRequests: requested.webRequests, appointments: [{ id: "c-older", fecha: booking.fecha, horaInicio: "11:00", horaFin: "12:00", estado: "confirmada" }] }, requested.record.id);
  assert.match(overlapping.error, /coincide/);
});

test("respeta la disponibilidad publicada y configurada", () => {
  const state = base();
  const monday = getAvailableSlots({ ...state, fecha: booking.fecha, servicio: SERVICIOS[2], modalidad: MODALIDADES.presencial });
  assert.ok(monday.length > 0);
  assert.deepEqual(getAvailableSlots({ ...state, publishedWeeks: {}, fecha: booking.fecha, servicio: SERVICIOS[2], modalidad: MODALIDADES.presencial }), []);
  assert.deepEqual(getAvailableSlots({ ...state, config: { ...DEFAULT_CONFIG, modalidadesActivas: [] }, fecha: booking.fecha, servicio: SERVICIOS[2], modalidad: MODALIDADES.presencial }), []);
});

test("el recordatorio provisional usa la hora chilena en verano e invierno", () => {
  assert.equal(santiagoToUTC("2026-10-19", "09:00").toISOString(), "2026-10-19T12:00:00.000Z");
  assert.equal(santiagoToUTC("2026-06-19", "09:00").toISOString(), "2026-06-19T13:00:00.000Z");
  const { ics, googleUrl } = calendarExport({ id: "w-test", fecha: "2026-10-19", hora: "09:00", duracionMin: 60 }, new Date("2026-10-16T12:00:00Z"));
  assert.match(ics, /STATUS:TENTATIVE/);
  assert.match(ics, /DTSTART:20261019T120000Z/);
  assert.match(googleUrl, /calendar\.google\.com/);
});
