import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loadPatients,
  loadAppointments,
  loadWebRequests,
  loadDocuments,
} from "./mockData";
import { nowHHMM } from "../utils/today";

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

  const actions = useMemo(
    () => ({
      login(rut) {
        setSession({ rut, loggedInAt: new Date().toISOString() });
      },
      logout() {
        setSession(null);
      },
      confirmWebRequest(requestId) {
        // Ojo: no anidar setState aquí. Cada updater debe ser una función pura
        // de su propio "prev" — React (Strict Mode) invoca los updaters dos
        // veces para detectar impurezas, así que un setState anidado como
        // efecto secundario se dispara doble y duplica datos.
        const req = webRequests.find((r) => r.id === requestId);
        if (!req) return;
        setWebRequests((prev) => prev.filter((r) => r.id !== requestId));
        setAppointments((prev) => [
          ...prev,
          {
            id: `c-${requestId}`,
            pacienteId: req.pacienteId,
            fecha: req.fecha,
            horaInicio: req.hora,
            horaFin: req.hora,
            tipo: req.tipo,
            modalidad: req.modalidad,
            estado: "confirmada",
            ubicacion: req.modalidad,
          },
        ]);
      },
      updateAppointment(appointmentId, patch) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, ...patch } : a))
        );
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
    [patients, webRequests]
  );

  const value = useMemo(
    () => ({ patients, appointments, webRequests, documents, session, ...actions }),
    [patients, appointments, webRequests, documents, session, actions]
  );

  return <ClinicaContext.Provider value={value}>{children}</ClinicaContext.Provider>;
}

export function useClinica() {
  const ctx = useContext(ClinicaContext);
  if (!ctx) throw new Error("useClinica debe usarse dentro de <ClinicaProvider>");
  return ctx;
}
