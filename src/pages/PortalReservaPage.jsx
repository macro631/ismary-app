import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useClinica } from "../data/store";
import { addDays, formatLongDate } from "../utils/date";
import { HOY } from "../utils/today";
import {
  isValidRut,
  formatRut,
  normalizeRut,
  maskPhone,
  maskEmail,
  maskAddress,
  maskName,
  isMaskedValue,
} from "../utils/rut";
import { findPossibleDuplicate } from "../utils/duplicates";
import { MODALIDADES, SERVICIOS } from "../data/servicios";
import { getAvailableSlots } from "../utils/scheduling";
import ServiceCard from "../components/ServiceCard";
import CalendarioReserva from "../components/CalendarioReserva";
import ConfirmacionReserva from "../components/ConfirmacionReserva";

const PASOS = [
  { key: "rut", label: "RUT" },
  { key: "datos", label: "Datos" },
  { key: "servicio", label: "Servicio" },
  { key: "modalidad", label: "Modalidad" },
  { key: "horario", label: "Horario" },
];

function nextDays(n) {
  return Array.from({ length: n }, (_, i) => addDays(HOY, i + 1));
}

export default function PortalReservaPage() {
  const { patients, appointments, webRequests, config, semanasPublicadas, bookAppointment, findPatientByRut } = useClinica();
  const [searchParams] = useSearchParams();
  const portalRef = useRef(null);
  const sendingRef = useRef(false);
  const [sending, setSending] = useState(false);
  const [reservaError, setReservaError] = useState("");
  const [solicitud, setSolicitud] = useState(null);

  const [step, setStep] = useState("rut");
  const [rutInput, setRutInput] = useState("");
  const [rutError, setRutError] = useState(null);
  const [existingPatient, setExistingPatient] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);

  const [servicio, setServicio] = useState(() => SERVICIOS.find((s) => s.key === searchParams.get("servicio")) || null);
  const [modalidad, setModalidad] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);
  const disponibilidad = useMemo(() => ({ config, appointments, webRequests, publishedWeeks: semanasPublicadas }), [config, appointments, webRequests, semanasPublicadas]);
  const diasDisponiblesVentana = useMemo(() => nextDays(35).filter((iso) => getAvailableSlots({ ...disponibilidad, fecha: iso, servicio, modalidad }).length > 0), [disponibilidad, servicio, modalidad]);
  const horasDisponibles = getAvailableSlots({ ...disponibilidad, fecha, servicio, modalidad });
  const modalidadesDisponibles = servicio?.modalidades.filter((key) => config.modalidadesActivas.includes(MODALIDADES[key].valor)) || [];

  useEffect(() => {
    const title = portalRef.current?.querySelector("h1");
    if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  const [datosNuevo, setDatosNuevo] = useState({
    nombre: "",
    fechaNacimiento: "",
    email: "",
    telefono: "+56 9 ",
    direccion: "",
    motivo: "",
  });
  const [datosExistente, setDatosExistente] = useState({ telefono: "", email: "", direccion: "" });
  const [posibleDuplicado, setPosibleDuplicado] = useState(false);
  const [aceptaConfirmacion, setAceptaConfirmacion] = useState(false);

  const pasoActual = PASOS.findIndex(
    (p) => p.key === (step === "perfil" ? "rut" : step === "coincidencia" ? "datos" : step === "confirmacion" ? "horario" : step)
  );

  // Al entrar a "datos" para una paciente existente, sus campos parten
  // autocompletados con la versión levemente enmascarada (no la real).
  function irADatosExistente() {
    setDatosExistente({
      telefono: maskPhone(existingPatient.telefono),
      email: maskEmail(existingPatient.email),
      direccion: existingPatient.comuna ? maskAddress(existingPatient.comuna) : "",
    });
    setStep("datos");
  }

  function handleRutSubmit(e) {
    e.preventDefault();
    if (!isValidRut(rutInput)) {
      setRutError("Ese RUT no parece válido. Revisa el dígito verificador.");
      return;
    }
    setRutError(null);
    const found = findPatientByRut(rutInput);
    setExistingPatient(null);
    setPosibleDuplicado(false);
    setReservaError("");
    if (found) {
      setExistingPatient(found);
      setIsNewPatient(false);
      setStep("perfil");
    } else {
      setExistingPatient(null);
      setIsNewPatient(true);
      setStep("datos");
    }
  }

  function handleDatosNuevoSubmit(e) {
    e.preventDefault();
    const match = findPossibleDuplicate(patients, datosNuevo, null);
    if (match) {
      setStep("coincidencia");
    } else {
      setPosibleDuplicado(false);
      setStep(servicio ? "modalidad" : "servicio");
    }
  }

  function elegirModalidad(m) {
    setReservaError("");
    setModalidad(m);
    setFecha(null);
    setHora(null);
    setStep("horario");
  }

  async function confirmarReserva() {
    if (sendingRef.current || !aceptaConfirmacion || !horasDisponibles.includes(hora)) return;
    const patch = {};
    if (existingPatient) {
      if (!isMaskedValue(datosExistente.telefono)) patch.telefono = datosExistente.telefono;
      if (!isMaskedValue(datosExistente.email)) patch.email = datosExistente.email;
      if (datosExistente.direccion !== maskAddress(existingPatient.comuna) && !isMaskedValue(datosExistente.direccion)) {
        patch.comuna = datosExistente.direccion;
        patch.domicilio = datosExistente.direccion;
      }
      if (patch.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email)) { setReservaError("Revisa tu correo de contacto en el paso Datos."); return; }
      if (patch.telefono && patch.telefono.replace(/\D/g, "").length < 11) { setReservaError("Revisa tu teléfono de contacto en el paso Datos."); return; }
    }
    sendingRef.current = true;
    setSending(true);
    setReservaError("");
    try {
      const result = await bookAppointment({
        booking: { servicioKey: servicio.key, modalidadKey: modalidad.key, fecha, hora },
        patientId: existingPatient?.id,
        patientPatch: patch,
        newPatient: existingPatient ? null : { ...datosNuevo, rut: rutInput, posibleDuplicado },
        publicRequest: true,
      });
      if (result.error) { setReservaError(result.error); return; }
      setSolicitud(result.record);
      setStep("confirmacion");
    } catch { setReservaError("No pudimos enviar la solicitud. Intenta nuevamente."); }
    finally { sendingRef.current = false; setSending(false); }
  }

  return (
    <div className="public-reservation" ref={portalRef}>
      <aside className="booking-aside">
        <Link to="/" className="booking-back">← Volver a la presentación</Link>
        <p className="public-eyebrow">RESERVA EN LÍNEA</p>
        <p className="booking-aside-title">Un momento para cuidar de ti.</p>
        <p className="booking-aside-description">Elige la atención y el horario que mejor se ajustan a lo que necesitas. Puedes avanzar a tu ritmo.</p>
        <div className="booking-demo-note"><strong>Vista de demostración</strong><span>Las solicitudes se guardan solo en este navegador. Para coordinar una atención real, escribe a <a href="https://www.instagram.com/ismary.mt/" target="_blank" rel="noreferrer">@ismary.mt</a>.</span></div>
      </aside>
      <div className="booking-workspace">
        {step !== "confirmacion" && <>
          <StepIndicator pasoActual={pasoActual} />
          {servicio && <div className="reservation-summary"><strong>{servicio.nombre}</strong>{modalidad && <span>{modalidad.label}</span>}{fecha && <span>{formatLongDate(fecha)}{hora ? ` · ${hora}` : ""}</span>}</div>}
        </>}
        <div className="booking-card"><div className="booking-card-inner">
        {step === "rut" && (
          <>
            <h1 className="font-headline-md text-headline-md text-primary mb-1">Reserva tu hora</h1>
            <p className="text-body-sm text-on-surface-variant mb-space-md">
              Ingresa tu RUT para comenzar. Así podemos reconocerte si ya eres paciente de Ismary.
            </p>
            <form onSubmit={handleRutSubmit} className="space-y-space-sm">
              <RutInput
                value={rutInput}
                onChange={(v) => {
                  setRutInput(v);
                  setRutError(null);
                }}
              />
              {rutError && <p className="text-body-sm text-status-cancelada">{rutError}</p>}
              <button type="submit" className="w-full h-12 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold">
                Continuar
              </button>
            </form>
          </>
        )}

        {step === "perfil" && existingPatient && (
          <>
            <div className="flex items-center gap-space-sm mb-space-md">
              <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">person</span>
              </div>
              <div>
                <h1 className="font-headline-md text-headline-md text-primary">¡Bienvenida de nuevo, {maskName(existingPatient.nombre)}!</h1>
                <p className="text-body-sm text-on-surface-variant">Reconocimos tu perfil. Tus datos guardados se muestran a continuación.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mb-space-md">
              <InfoTile label="Teléfono" value={maskPhone(existingPatient.telefono)} />
              <InfoTile label="Correo" value={maskEmail(existingPatient.email)} />
              <InfoTile label="Dirección" value={maskAddress(existingPatient.comuna)} className="sm:col-span-2" />
            </div>
            <div className="flex flex-col sm:flex-row gap-space-sm">
              <button
                onClick={() => {
                  setExistingPatient(null);
                  setRutInput("");
                  setStep("rut");
                }}
                className="flex-1 h-11 rounded-lg border border-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low"
              >
                No es mi RUT
              </button>
              <button
                onClick={irADatosExistente}
                className="flex-1 h-11 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold"
              >
                Sí, soy yo — Continuar
              </button>
            </div>
          </>
        )}

        {step === "servicio" && (
          <>
            <button onClick={() => setStep("datos")} className="text-body-sm text-on-surface-variant hover:text-primary mb-space-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Cambiar datos
            </button>
            <h1 className="font-headline-md text-headline-md text-primary mb-space-sm">Selecciona el servicio</h1>
            <div className="flex flex-col gap-space-sm">
              {SERVICIOS.map((s, index) => (
                <button
                  key={s.key}
                  onClick={() => { setServicio(s); setModalidad(null); setFecha(null); setHora(null); setReservaError(""); setStep("modalidad"); }}
                  className="text-left rounded-[18px] hover:shadow-md transition-shadow"
                  aria-pressed={servicio?.key === s.key}
                >
                  <ServiceCard servicio={s} selected={servicio?.key === s.key} index={index + 1} />
                </button>
              ))}
            </div>
          </>
        )}

        {step === "modalidad" && servicio && (
          <>
            <button onClick={() => setStep("servicio")} className="text-body-sm text-on-surface-variant hover:text-primary mb-space-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Cambiar servicio
            </button>
            <h1 className="font-headline-md text-headline-md text-primary mb-1">¿Cómo prefieres tu atención?</h1>
            <p className="text-body-sm text-on-surface-variant mb-space-md">{servicio.nombre}</p>
            {modalidadesDisponibles.length === 0 && <p className="text-body-sm text-status-pendiente mb-4">No hay modalidades habilitadas para este servicio. Puedes elegir otra atención o escribir a @ismary.mt.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              {modalidadesDisponibles.map((key) => {
                const m = MODALIDADES[key];
                return (
                  <button
                    key={key}
                    onClick={() => elegirModalidad(m)}
                    className="text-left border border-surface-container rounded-xl p-space-md hover:border-primary hover:shadow-md transition-all flex flex-col items-start gap-space-xs"
                  >
                    <span className="material-symbols-outlined text-primary mb-2" aria-hidden="true">{m.icono}</span>
                    <p className="font-title-sm text-title-sm text-on-surface">{m.label}</p>
                    <p className="text-body-sm text-on-surface-variant">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === "horario" && modalidad && (
          <>
            <button
              onClick={() => setStep("modalidad")}
              className="text-body-sm text-on-surface-variant hover:text-primary mb-space-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Cambiar modalidad
            </button>
            <h1 className="font-headline-md text-headline-md text-primary mb-1">Elige fecha y horario</h1>
            <p className="text-body-sm text-on-surface-variant mb-space-md">
              {servicio.nombre} · {servicio.duracion} · {modalidad.label}
            </p>

            {diasDisponiblesVentana.length === 0 ? (
              <div className="flex items-start gap-2 bg-status-pendiente-bg text-status-pendiente rounded-lg p-space-md mb-space-md">
                <span className="material-symbols-outlined text-[20px] shrink-0">event_busy</span>
                <p className="text-body-sm">
                  No hay horarios disponibles para esta atención en las próximas semanas. Puedes cambiar de modalidad o escribir a @ismary.mt para coordinar.
                </p>
              </div>
            ) : (
              <CalendarioReserva
                fechas={diasDisponiblesVentana}
                fecha={fecha}
                onSelect={(d) => {
                  setFecha(d);
                  setHora(null);
                  setReservaError("");
                }}
              />
            )}

            {fecha && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 my-space-md">
                {horasDisponibles.map((h) => (
                  <button
                    key={h}
                    onClick={() => { setHora(h); setReservaError(""); }}
                    aria-pressed={hora === h}
                    className={`rounded-lg py-2 font-label-lg text-label-lg border transition-colors ${
                      hora === h ? "bg-primary text-on-primary border-primary" : "border-surface-container hover:border-primary"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
            {fecha && hora && (
              <div className="flex items-start gap-2 bg-status-pendiente-bg text-status-pendiente rounded-lg p-space-sm mb-space-md">
                <span className="material-symbols-outlined text-[18px] shrink-0">schedule</span>
                <p className="text-body-sm">
                  Comprobaremos la disponibilidad al enviar. Tu solicitud quedará pendiente de confirmación por Ismary.
                </p>
              </div>
            )}
            {fecha && horasDisponibles.length === 0 && <p role="status" className="text-body-sm text-status-pendiente mb-4">Ya no quedan horarios para ese día. Elige otra fecha.</p>}
            {hora && !horasDisponibles.includes(hora) && <p role="alert" className="text-body-sm text-status-pendiente mb-4">El horario elegido dejó de estar disponible. Selecciona otro.</p>}
            {reservaError && <p role="alert" className="text-body-sm text-status-cancelada mb-4">{reservaError}</p>}
            <p className="text-body-sm text-on-surface-variant mb-4">Horario de Chile continental. Reservamos {servicio.duracionMin} minutos para esta atención.</p>
            <label className="flex items-start gap-2.5 cursor-pointer select-none mb-space-md">
              <input
                type="checkbox"
                checked={aceptaConfirmacion}
                onChange={(e) => setAceptaConfirmacion(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-primary"
              />
              <span className="text-body-sm text-on-surface leading-tight">
                Acepto que Ismary use mis datos de contacto para coordinar esta solicitud de atención.
              </span>
            </label>
            <button
              disabled={sending || !fecha || !horasDisponibles.includes(hora) || !aceptaConfirmacion}
              onClick={confirmarReserva}
              className="w-full h-11 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold disabled:opacity-40"
            >
              {sending ? "Enviando solicitud…" : "Solicitar hora"}
            </button>
          </>
        )}

        {step === "datos" && existingPatient && (
          <>
            <button onClick={() => setStep("perfil")} className="text-body-sm text-on-surface-variant hover:text-primary mb-space-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Volver
            </button>
            <h1 className="font-headline-md text-headline-md text-primary mb-1">Confirma tus datos de contacto</h1>
            <p className="text-body-sm text-on-surface-variant mb-space-md">
              Ya completamos esto por ti. Tu nombre y RUT no se pueden modificar aquí — si algo más cambió, edítalo.
            </p>
            <div className="space-y-space-sm">
              <Campo
                label="Teléfono"
                value={datosExistente.telefono}
                onChange={(v) => setDatosExistente((d) => ({ ...d, telefono: v }))}
              />
              <Campo
                label="Correo"
                value={datosExistente.email}
                onChange={(v) => setDatosExistente((d) => ({ ...d, email: v }))}
              />
              <Campo
                label="Comuna (dirección, solo si tu atención es a domicilio)"
                value={datosExistente.direccion}
                onChange={(v) => setDatosExistente((d) => ({ ...d, direccion: v }))}
              />
            </div>
            <button
              onClick={() => setStep(servicio ? "modalidad" : "servicio")}
              className="w-full h-11 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold mt-space-md"
            >
              Continuar
            </button>
          </>
        )}

        {step === "datos" && isNewPatient && (
          <>
            <button onClick={() => setStep("rut")} className="text-body-sm text-on-surface-variant hover:text-primary mb-space-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Cambiar RUT
            </button>
            <h1 className="font-headline-md text-headline-md text-primary mb-space-md">Tus datos</h1>
            <p className="text-body-sm text-on-surface-variant mb-space-sm">RUT ingresado: {formatRut(rutInput)}</p>
            <form onSubmit={handleDatosNuevoSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              <Campo label="Nombre completo" value={datosNuevo.nombre} onChange={(v) => setDatosNuevo((d) => ({ ...d, nombre: v }))} required />
              <Campo label="Fecha de nacimiento" type="date" value={datosNuevo.fechaNacimiento} onChange={(v) => setDatosNuevo((d) => ({ ...d, fechaNacimiento: v }))} />
              <Campo label="Email" type="email" value={datosNuevo.email} onChange={(v) => setDatosNuevo((d) => ({ ...d, email: v }))} required />
              <Campo
                label="Teléfono / WhatsApp"
                value={datosNuevo.telefono}
                onChange={(v) => setDatosNuevo((d) => ({ ...d, telefono: v }))}
                required
                cursorAlFinalAlEnfocar
              />
              <div className="sm:col-span-2">
                <Campo label="Comuna (dirección, solo si tu atención es a domicilio)" value={datosNuevo.direccion} onChange={(v) => setDatosNuevo((d) => ({ ...d, direccion: v }))} />
              </div>
              <div className="sm:col-span-2">
                <Campo label="Motivo breve de consulta" value={datosNuevo.motivo} onChange={(v) => setDatosNuevo((d) => ({ ...d, motivo: v }))} />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={!datosNuevo.nombre || !datosNuevo.email || datosNuevo.telefono.replace(/\D/g, "").length < 11}
                  className="w-full h-11 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold disabled:opacity-40"
                >
                  Continuar
                </button>
              </div>
            </form>
          </>
        )}

        {step === "coincidencia" && (
          <>
            <h1 className="font-headline-md text-headline-md text-primary mb-space-sm">Posible coincidencia de perfil</h1>
            <p className="text-body-md text-on-surface leading-relaxed mb-space-md">
              Encontramos información que podría coincidir con un perfil existente. Verifica que el RUT ingresado sea correcto antes de continuar.
            </p>
            <div className="flex flex-col sm:flex-row gap-space-sm">
              <button
                onClick={() => {
                  setRutInput("");
                  setStep("rut");
                }}
                className="flex-1 h-11 rounded-lg border border-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low"
              >
                Corregir RUT
              </button>
              <button
                onClick={() => {
                  setPosibleDuplicado(true);
                  setStep(servicio ? "modalidad" : "servicio");
                }}
                className="flex-1 h-11 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold"
              >
                El RUT es correcto
              </button>
            </div>
          </>
        )}

        {step === "confirmacion" && solicitud && <ConfirmacionReserva solicitud={solicitud} />}

        </div></div>
      </div>
    </div>
  );
}

function StepIndicator({ pasoActual }) {
  return (
    <ol className="booking-steps">
      {PASOS.map((p, i) => {
        const completado = i < pasoActual;
        const activo = i === pasoActual;
        return (
          <li key={p.key} aria-current={activo ? "step" : undefined} className={`booking-step ${activo ? "booking-step-active" : ""} ${completado ? "booking-step-done" : ""}`}>
            <span
              className={`booking-step-number ${
                completado || activo ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {completado ? <span className="material-symbols-outlined text-[16px]">check</span> : i + 1}
            </span>
            <span
              className={`booking-step-label ${
                activo ? "text-primary font-semibold" : "text-on-surface-variant"
              }`}
            >
              {p.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function InfoTile({ label, value, className = "" }) {
  return (
    <div className={`bg-surface-container-low rounded-lg p-space-sm ${className}`}>
      <p className="text-[12px] uppercase tracking-wide text-secondary font-label-md">{label}</p>
      <p className="text-body-md text-on-surface">{value}</p>
    </div>
  );
}

// Input de RUT con formato en vivo: agrega los puntos y el guion mientras la
// paciente escribe, sin importar si ella misma los tipea o no (se ignoran y
// se recalculan), y conserva la posición del cursor para no interrumpir la
// escritura.
function RutInput({ value, onChange }) {
  const inputRef = useRef(null);
  const nextCaretRef = useRef(null);

  useLayoutEffect(() => {
    if (nextCaretRef.current != null && inputRef.current) {
      inputRef.current.setSelectionRange(nextCaretRef.current, nextCaretRef.current);
      nextCaretRef.current = null;
    }
  }, [value]);

  function handleChange(e) {
    const raw = e.target.value;
    const caret = e.target.selectionStart ?? raw.length;
    const digitsBeforeCaret = normalizeRut(raw.slice(0, caret)).length;
    const formatted = formatRut(raw);

    let pos = formatted.length;
    let count = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/[0-9kK]/.test(formatted[i])) {
        count++;
        if (count === digitsBeforeCaret) {
          pos = i + 1;
          break;
        }
      }
    }
    if (digitsBeforeCaret === 0) pos = 0;

    nextCaretRef.current = pos;
    onChange(formatted);
  }

  return (
    <label className="block space-y-1">
      <span className="block font-label-lg text-label-lg text-on-surface font-medium">RUT</span>
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        placeholder="12.345.678-9"
        maxLength={12}
        inputMode="text"
        className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}

function Campo({ label, value, onChange, type = "text", placeholder, required = false, cursorAlFinalAlEnfocar = false }) {
  return (
    <label className="block space-y-1">
      <span className="block font-label-lg text-label-lg text-on-surface font-medium">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={
          cursorAlFinalAlEnfocar
            ? (e) => {
                const len = e.target.value.length;
                e.target.setSelectionRange(len, len);
              }
            : undefined
        }
        className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
