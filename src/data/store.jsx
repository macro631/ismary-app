import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  loadPatients,
  loadAppointments,
  loadWebRequests,
  loadDocuments,
} from "./mockData";
import { HOY, nowHHMM } from "../utils/today";
import { loadConfig } from "../utils/configuracion";
import { loadPublishedWeeks } from "../utils/availability";
import { prepareBooking } from "../utils/booking";
import { confirmRequest, hasConflict, durationOf, validDate, minutesOfDay } from "../utils/scheduling";

const ClinicaContext = createContext(null);

function persist(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage no disponible (modo privado, etc.) — el prototipo sigue
    // funcionando en memoria durante la sesión.
  }
}

export function ClinicaProvider({ children }) {
  const [patients, setPatients] = useState(loadPatients);
  const [appointments, setAppointments] = useState(loadAppointments);
  const [webRequests, setWebRequests] = useState(loadWebRequests);
  const [documents, setDocuments] = useState(loadDocuments);
  const [config, setConfig] = useState(loadConfig);
  const [semanasPublicadas, setSemanasPublicadas] = useState(loadPublishedWeeks);
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("ismary_session") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => persist("ismary_patients", patients), [patients]);
  useEffect(() => persist("ismary_appointments", appointments), [appointments]);
  useEffect(() => persist("ismary_web_requests", webRequests), [webRequests]);
  useEffect(() => persist("ismary_documents", documents), [documents]);
  useEffect(() => persist("ismary_session", session), [session]);
  useEffect(() => persist("ismary_config", config), [config]);
  useEffect(() => persist("ismary_availability_weeks", semanasPublicadas), [semanasPublicadas]);

  const currentRef = useRef(null);
  useLayoutEffect(() => {
    currentRef.current = { patients, appointments, webRequests, config, publishedWeeks: semanasPublicadas };
  }, [patients, appointments, webRequests, config, semanasPublicadas]);

  useEffect(() => {
    function sync(event) {
      if (event.storageArea !== window.localStorage || !event.newValue) return;
      const setters = { ismary_patients: setPatients, ismary_appointments: setAppointments,
        ismary_web_requests: setWebRequests, ismary_config: setConfig, ismary_availability_weeks: setSemanasPublicadas };
      try { setters[event.key]?.(JSON.parse(event.newValue)); } catch { /* conservar el último estado válido */ }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // Serializa las reservas de las pestañas de este navegador. La coordinación
  // entre dispositivos requiere el servidor del sistema productivo.
  function schedulingTransaction(change) {
    const run = () => {
      const state = { ...currentRef.current };
      const keys = { patients: "ismary_patients", appointments: "ismary_appointments", webRequests: "ismary_web_requests",
        config: "ismary_config", publishedWeeks: "ismary_availability_weeks" };
      try {
        for (const [name, key] of Object.entries(keys)) {
          const raw = window.localStorage.getItem(key);
          if (raw) state[name] = JSON.parse(raw);
        }
      } catch { return { error: "No pudimos leer la agenda guardada. Intenta nuevamente antes de reservar." }; }
      const result = change(state);
      if (result.error) return result;
      const setters = { patients: setPatients, appointments: setAppointments, webRequests: setWebRequests };
      const previous = {};
      try {
        for (const name of Object.keys(setters)) {
          if (!result[name]) continue;
          previous[keys[name]] = window.localStorage.getItem(keys[name]);
          window.localStorage.setItem(keys[name], JSON.stringify(result[name]));
        }
      } catch {
        for (const [key, value] of Object.entries(previous)) {
          try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); } catch { /* el navegador no permite guardar */ }
        }
        return { error: "No pudimos guardar la reserva en este navegador. Revisa el espacio disponible e intenta nuevamente." };
      }
      for (const [name, setter] of Object.entries(setters)) {
        const next = result[name] || state[name];
        currentRef.current[name] = next;
        setter(next);
      }
      return result;
    };
    return window.navigator.locks?.request
      ? window.navigator.locks.request("ismary-scheduling", run)
      : Promise.resolve(run());
  }

  const actions = useMemo(
    () => ({
      login(rut) {
        setSession({ rut, loggedInAt: new Date().toISOString() });
      },
      logout() {
        setSession(null);
      },
      confirmWebRequest(requestId) {
        return schedulingTransaction((state) => confirmRequest(state, requestId));
      },
      bookAppointment(payload) {
        return schedulingTransaction((state) => prepareBooking(state, payload, { id: crypto.randomUUID(), today: HOY }));
      },
      updateAppointment(appointmentId, patch) {
        return schedulingTransaction((state) => {
          const old = state.appointments.find((a) => a.id === appointmentId);
          if (!old) return { error: "Esta cita ya no está en la agenda." };
          const next = { ...old, ...patch };
          if (next.estado !== "cancelada") {
            if (!validDate(next.fecha) || next.fecha < HOY || !Number.isFinite(minutesOfDay(next.horaInicio))
              || !(minutesOfDay(next.horaFin) > minutesOfDay(next.horaInicio))) return { error: "Revisa la fecha y el horario de la cita." };
            if (hasConflict({ ...state, fecha: next.fecha, hora: next.horaInicio, duracionMin: durationOf(next), ignoreAppointmentId: appointmentId })) {
              return { error: "Ese horario coincide con otra cita o solicitud pendiente." };
            }
          }
          return { appointments: state.appointments.map((a) => a.id === appointmentId ? next : a) };
        });
      },
      updatePatient(patientId, patch) {
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? { ...p, ...patch, guardadoAt: nowHHMM() } : p))
        );
      },
      addAppointment(appointment) {
        setAppointments((prev) => [...prev, { id: `c-${Date.now()}`, ...appointment }]);
      },
      addAntecedente(patientId, antecedente) {
        setPatients((prev) =>
          prev.map((p) =>
            p.id === patientId ? { ...p, antecedentes: [...(p.antecedentes || []), antecedente] } : p
          )
        );
      },
      removeAntecedente(patientId, antecedenteId) {
        setPatients((prev) =>
          prev.map((p) =>
            p.id === patientId
              ? { ...p, antecedentes: (p.antecedentes || []).filter((a) => a.id !== antecedenteId) }
              : p
          )
        );
      },
      // La ficha clínica es un tablero de consultas, no un formulario único:
      // cada atención agrega un registro nuevo en vez de sobrescribir el
      // anterior (plan.md §12.3). `addConsulta`/`updateConsulta` operan
      // sobre un borrador; `finalizarConsulta` lo bloquea y lo deja como
      // tarjeta fija del historial.
      addConsulta(patientId, consulta) {
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? { ...p, consultas: [...(p.consultas || []), consulta] } : p))
        );
      },
      updateConsulta(patientId, consultaId, patch) {
        setPatients((prev) =>
          prev.map((p) =>
            p.id === patientId
              ? { ...p, consultas: (p.consultas || []).map((c) => (c.id === consultaId ? { ...c, ...patch } : c)) }
              : p
          )
        );
      },
      finalizarConsulta(patientId, consultaId) {
        setPatients((prev) =>
          prev.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  consultas: (p.consultas || []).map((c) =>
                    c.id === consultaId ? { ...c, estado: "finalizada", finalizadaAt: nowHHMM() } : c
                  ),
                }
              : p
          )
        );
      },
      // Solo aplica a un borrador (uno en curso, nunca finalizado): se
      // elimina por completo en vez de marcarse como "cancelada", porque un
      // borrador abierto por error no tiene valor como registro clínico.
      deleteConsulta(patientId, consultaId) {
        setPatients((prev) =>
          prev.map((p) =>
            p.id === patientId
              ? { ...p, consultas: (p.consultas || []).filter((c) => c.id !== consultaId) }
              : p
          )
        );
      },
      deletePatient(patientId) {
        setPatients((prev) => prev.filter((p) => p.id !== patientId));
        setAppointments((prev) => prev.filter((a) => a.pacienteId !== patientId));
        setWebRequests((prev) => prev.filter((r) => r.pacienteId !== patientId));
        setDocuments((prev) => prev.filter((d) => d.pacienteId !== patientId));
      },
      upsertDocument(doc) {
        // Solo para borradores: mientras un documento no se ha emitido ni
        // entregado, editarlo y volver a guardar reemplaza el mismo id sin
        // problema (todavía no es un registro oficial).
        setDocuments((prev) => {
          const exists = prev.some((d) => d.id === doc.id);
          if (exists) return prev.map((d) => (d.id === doc.id ? doc : d));
          return [...prev, doc];
        });
      },
      emitirDocumento(doc) {
        // Un documento ya emitido/entregado nunca se sobrescribe: si `doc`
        // trae `reemplazaAId`, la versión anterior queda marcada como
        // "reemplazado" (conservando su historial) y la nueva se agrega
        // como un registro aparte con su propio folio.
        setDocuments((prev) => {
          if (doc.reemplazaAId) {
            const marcado = prev.map((d) =>
              d.id === doc.reemplazaAId ? { ...d, estado: "reemplazado", reemplazadoPorId: doc.id } : d
            );
            return [...marcado, doc];
          }
          const exists = prev.some((d) => d.id === doc.id);
          if (exists) return prev.map((d) => (d.id === doc.id ? doc : d));
          return [...prev, doc];
        });
      },
      anularDocumento(docId, motivo) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docId ? { ...d, estado: "anulado", motivoAnulacion: motivo, anuladoAt: nowHHMM() } : d
          )
        );
      },
      addPatient(patient) {
        setPatients((prev) => [...prev, patient]);
        return patient;
      },
      addWebRequest(request) {
        setWebRequests((prev) => [...prev, { id: `w-${Date.now()}`, ...request }]);
      },
      findPatientByRut(rut) {
        const normalized = rut.replace(/[.\-\s]/g, "").toLowerCase();
        return patients.find((p) => p.rut.replace(/[.\-\s]/g, "").toLowerCase() === normalized);
      },
    }),
    [patients]
  );

  const value = useMemo(
    () => ({ patients, appointments, webRequests, documents, session, config, setConfig, semanasPublicadas, setSemanasPublicadas, ...actions }),
    [patients, appointments, webRequests, documents, session, config, semanasPublicadas, actions]
  );

  return <ClinicaContext.Provider value={value}>{children}</ClinicaContext.Provider>;
}

export function useClinica() {
  const ctx = useContext(ClinicaContext);
  if (!ctx) throw new Error("useClinica debe usarse dentro de <ClinicaProvider>");
  return ctx;
}
