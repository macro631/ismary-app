import { SERVICIOS, MODALIDADES } from "../data/servicios.js";
import { addMinutes, validateBooking, validDate } from "./scheduling.js";
import { formatRut, isValidRut, sameRut } from "./rut.js";

export function prepareBooking(state, { booking, patientId, newPatient, patientPatch = {}, publicRequest = true }, { id, today }) {
  const error = validateBooking(booking, state, { publicRequest, today });
  if (error) return { error };
  let patient = state.patients.find((p) => p.id === patientId);
  let patients = state.patients;
  if (!patient && newPatient) {
    if (!newPatient.nombre?.trim() || !isValidRut(newPatient.rut)) return { error: "Revisa el nombre y el RUT de la paciente." };
    if (patients.some((p) => sameRut(p.rut, newPatient.rut))) return { error: "Ese RUT ya está registrado. Vuelve al paso de paciente para seleccionar su ficha." };
    if (newPatient.fechaNacimiento && (!validDate(newPatient.fechaNacimiento) || newPatient.fechaNacimiento > today)) return { error: "Revisa la fecha de nacimiento." };
    let edad = null;
    if (newPatient.fechaNacimiento) {
      edad = Number(today.slice(0, 4)) - Number(newPatient.fechaNacimiento.slice(0, 4)) - (today.slice(5) < newPatient.fechaNacimiento.slice(5) ? 1 : 0);
    }
    patient = {
      id: `p-${id}`, nombre: newPatient.nombre.trim(), rut: formatRut(newPatient.rut), edad,
      fechaNacimiento: newPatient.fechaNacimiento || "", prevision: "Por definir", telefono: newPatient.telefono || "",
      email: newPatient.email || "", comuna: newPatient.direccion || "", domicilio: newPatient.direccion || "",
      gestante: false, alertas: [], consultas: [], antecedentes: [],
      resumen: publicRequest ? "Paciente nueva (reserva web)" : "Paciente registrada en agenda",
      estadoPerfil: publicRequest ? "provisional" : "confirmado",
      posibleDuplicado: Boolean(newPatient.posibleDuplicado),
    };
    patients = [...patients, patient];
  } else if (patient && Object.keys(patientPatch).length) {
    patient = { ...patient, ...patientPatch, id: patient.id, rut: patient.rut };
    patients = patients.map((p) => p.id === patient.id ? patient : p);
  }
  if (!patient) return { error: "Selecciona una paciente para continuar." };
  const servicio = SERVICIOS.find((s) => s.key === booking.servicioKey);
  const modalidad = MODALIDADES[booking.modalidadKey];
  const record = {
    id: `${publicRequest ? "w" : "c"}-${id}`, pacienteId: patient.id,
    servicioKey: servicio.key, tipo: servicio.nombre, modalidad: modalidad.valor,
    fecha: booking.fecha, hora: booking.hora, horaInicio: booking.hora,
    horaFin: addMinutes(booking.hora, servicio.duracionMin), duracionMin: servicio.duracionMin,
    estado: publicRequest ? "pendiente" : "confirmada",
    ubicacion: modalidad.key === "presencial" ? state.config.direccion : modalidad.label,
  };
  return { patients, record, ...(publicRequest
    ? { webRequests: [...state.webRequests, record] }
    : { appointments: [...state.appointments, record] }) };
}
