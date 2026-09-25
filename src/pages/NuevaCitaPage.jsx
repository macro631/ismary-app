import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClinica } from "../data/store";
import { MODALIDADES, SERVICIOS } from "../data/servicios";
import { getAvailableSlots } from "../utils/scheduling";
import { HOY } from "../utils/today";

const emptyPatient = { nombre: "", rut: "", fechaNacimiento: "", telefono: "", email: "", direccion: "" };
const inputClass = "w-full min-h-11 px-3 bg-surface-container-low rounded-lg text-body-md border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary";

export default function NuevaCitaPage() {
  const { patients, appointments, webRequests, config, bookAppointment } = useClinica();
  const navigate = useNavigate();
  const savingRef = useRef(false);
  const [mode, setMode] = useState("existente");
  const [query, setQuery] = useState("");
  const [patientId, setPatientId] = useState("");
  const [newPatient, setNewPatient] = useState(emptyPatient);
  const [servicioKey, setServicioKey] = useState("");
  const [modalidadKey, setModalidadKey] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const service = SERVICIOS.find((s) => s.key === servicioKey);
  const modalidad = MODALIDADES[modalidadKey];
  const filteredPatients = useMemo(() => patients.filter((p) => `${p.nombre} ${p.rut}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 25), [patients, query]);
  const modalidadKeys = service?.modalidades.filter((key) => config.modalidadesActivas.includes(MODALIDADES[key].valor)) || [];
  const slots = getAvailableSlots({ fecha, servicio: service, modalidad, config, appointments, webRequests, publicRequest: false });

  function setNewField(key, value) { setNewPatient((prev) => ({ ...prev, [key]: value })); }
  async function create(e) {
    e.preventDefault();
    if (savingRef.current || !slots.includes(hora)) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await bookAppointment({
        booking: { servicioKey, modalidadKey, fecha, hora }, patientId: mode === "existente" ? patientId : null,
        newPatient: mode === "nueva" ? newPatient : null, publicRequest: false,
      });
      if (result.error) { setError(result.error); return; }
      navigate(`/calendario?fecha=${fecha}&vista=dia`, { state: { appointmentCreated: true } });
    } catch { setError("No pudimos guardar la cita. Intenta nuevamente."); }
    finally { savingRef.current = false; setSaving(false); }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-margin py-space-lg">
      <Link to="/calendario" className="text-primary text-body-sm hover:underline">← Volver al calendario</Link>
      <div className="mt-5 mb-6"><p className="text-label-md font-semibold text-primary uppercase tracking-widest">Agenda profesional</p><h1 className="font-headline-lg text-headline-lg text-primary mt-1">Nueva cita</h1><p className="text-body-md text-on-surface-variant mt-2">Selecciona una paciente y un horario disponible. La cita quedará confirmada en la agenda.</p></div>
      <form onSubmit={create} className="flex flex-col gap-5">
        <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
          <h2 className="font-headline-sm text-headline-sm text-primary mb-4">1. Paciente</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <label className="inline-flex items-center gap-2 text-body-sm"><input type="radio" name="patient-mode" checked={mode === "existente"} onChange={() => { setMode("existente"); setError(""); }} className="accent-primary" />Ficha existente</label>
            <label className="inline-flex items-center gap-2 text-body-sm"><input type="radio" name="patient-mode" checked={mode === "nueva"} onChange={() => { setMode("nueva"); setError(""); }} className="accent-primary" />Paciente nueva</label>
          </div>
          {mode === "existente" ? <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-body-sm font-medium">Buscar por nombre o RUT<input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} mt-1`} placeholder="Buscar paciente" /></label>
            <label className="text-body-sm font-medium">Paciente<select required value={patientId} onChange={(e) => setPatientId(e.target.value)} className={`${inputClass} mt-1`}><option value="">Seleccionar paciente</option>{filteredPatients.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {p.rut}</option>)}</select></label>
          </div> : <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-body-sm font-medium">Nombre completo<input required value={newPatient.nombre} onChange={(e) => setNewField("nombre", e.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-body-sm font-medium">RUT<input required value={newPatient.rut} onChange={(e) => setNewField("rut", e.target.value)} placeholder="12.345.678-9" className={`${inputClass} mt-1`} /></label>
            <label className="text-body-sm font-medium">Fecha de nacimiento<input type="date" max={HOY} value={newPatient.fechaNacimiento} onChange={(e) => setNewField("fechaNacimiento", e.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-body-sm font-medium">Teléfono<input type="tel" value={newPatient.telefono} onChange={(e) => setNewField("telefono", e.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-body-sm font-medium">Correo electrónico<input type="email" value={newPatient.email} onChange={(e) => setNewField("email", e.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-body-sm font-medium">Comuna o dirección<input value={newPatient.direccion} onChange={(e) => setNewField("direccion", e.target.value)} className={`${inputClass} mt-1`} /></label>
          </div>}
        </section>
        <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
          <h2 className="font-headline-sm text-headline-sm text-primary mb-4">2. Atención</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-body-sm font-medium">Servicio<select required value={servicioKey} onChange={(e) => { setServicioKey(e.target.value); setModalidadKey(""); setHora(""); }} className={`${inputClass} mt-1`}><option value="">Seleccionar servicio</option>{SERVICIOS.map((s) => <option key={s.key} value={s.key}>{s.nombre}</option>)}</select></label>
            <label className="text-body-sm font-medium">Modalidad<select required value={modalidadKey} onChange={(e) => { setModalidadKey(e.target.value); setHora(""); }} className={`${inputClass} mt-1`}><option value="">Seleccionar modalidad</option>{modalidadKeys.map((key) => <option key={key} value={key}>{MODALIDADES[key].label}</option>)}</select></label>
          </div>
          {service && <p className="text-body-sm text-on-surface-variant mt-3">Duración reservada: {service.duracionMin} minutos · {service.arancel}</p>}
        </section>
        <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
          <h2 className="font-headline-sm text-headline-sm text-primary mb-4">3. Fecha y horario</h2>
          <label className="text-body-sm font-medium block max-w-xs">Fecha<input type="date" required min={HOY} value={fecha} onChange={(e) => { setFecha(e.target.value); setHora(""); }} className={`${inputClass} mt-1`} /></label>
          {fecha && service && modalidad && <div className="mt-5"><p className="text-body-sm font-medium mb-2">Horarios libres · Chile continental</p>{slots.length ? <div className="flex flex-wrap gap-2">{slots.map((time) => <button key={time} type="button" aria-pressed={hora === time} onClick={() => { setHora(time); setError(""); }} className={`px-4 py-2 rounded-lg border text-body-sm ${hora === time ? "bg-primary text-white border-primary" : "border-border-subtle hover:border-primary"}`}>{time}</button>)}</div> : <p role="status" className="text-body-sm text-status-pendiente">No hay horarios libres para este servicio en esa fecha. Prueba otro día.</p>}</div>}
        </section>
        {error && <p role="alert" className="text-body-sm text-status-cancelada bg-status-cancelada-bg rounded-lg p-3">{error}</p>}
        <button disabled={saving || !hora || !slots.includes(hora) || (mode === "existente" && !patientId)} type="submit" className="w-full min-h-12 rounded-lg bg-primary text-white font-semibold disabled:opacity-40 hover:bg-primary-strong">{saving ? "Guardando cita…" : "Confirmar cita"}</button>
      </form>
    </div>
  );
}
