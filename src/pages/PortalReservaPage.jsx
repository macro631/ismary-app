import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useClinica } from "../data/store";
import { addDays, dayNumber, getMonthGrid, parseISODate } from "../utils/date";
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
import { loadPublishedWeeks, isWeekPublished } from "../utils/availability";

// Cada modalidad define qué días de la semana está disponible (0=domingo,
// 6=sábado, como Date.getDay()) y qué horarios ofrece — así elegir la
// modalidad primero es lo que realmente determina días y horas después.
const MODALIDADES = {
  tele: {
    key: "tele",
    label: "Teleconsulta",
    valor: "Teleconsulta",
    icono: "videocam",
    desc: "Por videollamada, desde donde estés.",
    dias: [1, 2, 3, 4, 5, 6],
    horas: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
  },
  domicilio: {
    key: "domicilio",
    label: "A domicilio",
    valor: "Domicilio",
    icono: "home",
    desc: "Ismary te visita en La Serena o Coquimbo.",
    dias: [2, 4, 6],
    horas: ["09:00", "11:30", "14:00", "16:30"],
  },
  presencial: {
    key: "presencial",
    label: "Presencial",
    valor: "Box Clínico",
    icono: "apartment",
    desc: "En box clínico habilitado.",
    dias: [1, 3, 5],
    horas: ["09:00", "10:30", "12:00", "15:00", "16:30"],
  },
};

const SERVICIOS = [
  {
    key: "diada",
    nombre: "Control Posparto de la Díada y Lactancia",
    duracion: "90 min",
    arancel: "$55.000 – $65.000",
    icono: "family_restroom",
    modalidades: ["domicilio", "presencial"],
  },
  {
    key: "lactancia",
    nombre: "Asesoría de Lactancia a Domicilio",
    duracion: "75–90 min",
    arancel: "$45.000 – $55.000",
    icono: "child_care",
    modalidades: ["domicilio", "tele"],
  },
  {
    key: "prenatal",
    nombre: "Control Prenatal de Bajo Riesgo",
    duracion: "60 min",
    arancel: "$40.000 – $50.000",
    icono: "pregnant_woman",
    modalidades: ["presencial", "domicilio"],
  },
  {
    key: "sexual",
    nombre: "Consulta Online de Salud Sexual y Reproductiva",
    duracion: "30–40 min",
    arancel: "$18.000 – $25.000",
    icono: "health_and_safety",
    modalidades: ["tele"],
  },
];

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
  const { patients, addPatient, updatePatient, addWebRequest, findPatientByRut } = useClinica();

  const [step, setStep] = useState("rut");
  const [rutInput, setRutInput] = useState("");
  const [rutError, setRutError] = useState(null);
  const [existingPatient, setExistingPatient] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);

  const [servicio, setServicio] = useState(null);
  const [modalidad, setModalidad] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);
  const semanasPublicadas = useMemo(() => loadPublishedWeeks(), []);
  const diasDisponiblesVentana = useMemo(
    () => nextDays(9).filter((iso) => isWeekPublished(semanasPublicadas, iso)),
    [semanasPublicadas]
  );

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
      setStep("servicio");
    }
  }

  function elegirModalidad(m) {
    setModalidad(m);
    setFecha(null);
    setHora(null);
    setStep("horario");
  }

  function confirmarReserva() {
    let pacienteId;
    if (existingPatient) {
      pacienteId = existingPatient.id;
      const patch = {};
      if (!isMaskedValue(datosExistente.telefono)) patch.telefono = datosExistente.telefono;
      if (!isMaskedValue(datosExistente.email)) patch.email = datosExistente.email;
      if (!isMaskedValue(datosExistente.direccion)) patch.comuna = datosExistente.direccion;
      if (Object.keys(patch).length > 0) updatePatient(pacienteId, patch);
    } else {
      const nuevo = addPatient({
        id: `p-${Date.now()}`,
        nombre: datosNuevo.nombre,
        rut: formatRut(rutInput),
        edad: null,
        fechaNacimiento: datosNuevo.fechaNacimiento,
        prevision: "Por definir",
        telefono: datosNuevo.telefono,
        email: datosNuevo.email,
        comuna: datosNuevo.direccion || null,
        gestante: false,
        alertas: [],
        resumen: "Paciente nueva (reserva web)",
        estadoPerfil: "provisional",
        posibleDuplicado,
      });
      pacienteId = nuevo.id;
    }
    addWebRequest({
      pacienteId,
      tipo: servicio.nombre,
      fecha,
      hora,
      modalidad: modalidad.valor,
    });
    setStep("confirmacion");
  }

  return (
    <div className="w-full max-w-3xl">
      {step !== "confirmacion" && <StepIndicator pasoActual={pasoActual} />}

      <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary-container to-[#dfc587]" />

        <div className="p-space-lg">
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
              {SERVICIOS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => { setServicio(s); setModalidad(null); setStep("modalidad"); }}
                  className="text-left border border-surface-container rounded-xl p-space-md hover:border-primary hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-space-sm"
                >
                  <div>
                    <p className="font-title-md text-title-md text-on-surface">{s.nombre}</p>
                    <p className="text-body-sm text-on-surface-variant">{s.duracion}</p>
                  </div>
                  <span className="font-label-lg text-label-lg text-primary shrink-0">{s.arancel}</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              {servicio.modalidades.map((key) => {
                const m = MODALIDADES[key];
                return (
                  <button
                    key={key}
                    onClick={() => elegirModalidad(m)}
                    className="text-left border border-surface-container rounded-xl p-space-md hover:border-primary hover:shadow-md transition-all flex flex-col items-start gap-space-xs"
                  >
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
                  Ismary aún no ha publicado horarios disponibles para los próximos días. Vuelve a intentarlo pronto o escríbenos directamente para coordinar tu hora.
                </p>
              </div>
            ) : (
              <MiniCalendario
                ventana={diasDisponiblesVentana}
                diasHabilesModalidad={modalidad.dias}
                fecha={fecha}
                onSelect={(d) => {
                  setFecha(d);
                  setHora(null);
                }}
              />
            )}

            {fecha && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 my-space-md">
                {modalidad.horas.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHora(h)}
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
                  Tu hora quedará <strong>retenida por 10 minutos</strong> mientras completas los siguientes pasos.
                </p>
              </div>
            )}
            <label className="flex items-start gap-2.5 cursor-pointer select-none mb-space-md">
              <input
                type="checkbox"
                checked={aceptaConfirmacion}
                onChange={(e) => setAceptaConfirmacion(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-[#7a2e50]"
              />
              <span className="text-body-sm text-on-surface leading-tight">
                Acepto recibir la confirmación administrativa de esta reserva por correo, junto con la política de privacidad.
              </span>
            </label>
            <button
              disabled={!fecha || !hora || !aceptaConfirmacion}
              onClick={confirmarReserva}
              className="w-full h-11 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold disabled:opacity-40"
            >
              Confirmar Reserva
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
              onClick={() => setStep("servicio")}
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
                  setStep("servicio");
                }}
                className="flex-1 h-11 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold"
              >
                El RUT es correcto
              </button>
            </div>
          </>
        )}

        {step === "confirmacion" && (
          <div className="text-center py-space-lg">
            <span className="material-symbols-outlined text-[48px] text-status-confirmada">check_circle</span>
            <h1 className="font-headline-md text-headline-md text-primary mt-space-sm">¡Reserva enviada!</h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              {servicio.nombre} · {modalidad.label} · {fecha} · {hora}
            </p>
            <p className="text-body-sm text-on-surface-variant mt-space-sm max-w-md mx-auto">
              Tu hora queda <strong>pendiente de confirmación</strong>. Te enviaremos un correo apenas Ismary la confirme,
              junto con los datos para la transferencia y las instrucciones previas a tu cita.
            </p>
            <div className="flex items-center justify-center gap-space-sm mt-space-md">
              <button className="px-space-md py-2 rounded-lg border border-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low">
                Agregar a Google Calendar
              </button>
              <button className="px-space-md py-2 rounded-lg border border-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low">
                Agregar a Apple Calendar
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ pasoActual }) {
  return (
    <ol className="flex items-start justify-between gap-1 mb-space-lg relative z-10">
      {PASOS.map((p, i) => {
        const completado = i < pasoActual;
        const activo = i === pasoActual;
        return (
          <li key={p.key} className="flex-1 flex flex-col items-center gap-1">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center font-label-lg text-label-lg font-semibold transition-colors ${
                completado || activo ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {completado ? <span className="material-symbols-outlined text-[16px]">check</span> : i + 1}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wide text-center ${
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

// Calendario mensual real (no una fila de días desplazable): resalta el mes
// vigente y solo deja seleccionar los días dentro de la ventana de reservas
// que además caen en un día hábil para la modalidad elegida.
function MiniCalendario({ ventana, diasHabilesModalidad, fecha, onSelect }) {
  const { cells, label } = useMemo(() => getMonthGrid(HOY), []);
  const ventanaSet = useMemo(() => new Set(ventana), [ventana]);

  return (
    <div className="border border-surface-container rounded-xl p-space-md mb-space-md">
      <p className="font-title-sm text-title-sm text-primary text-center mb-space-sm capitalize">{label}</p>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <span key={i} className="text-[11px] font-label-md text-secondary">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ iso, inMonth }) => {
          const disponible = inMonth && ventanaSet.has(iso) && diasHabilesModalidad.includes(parseISODate(iso).getDay());
          const seleccionado = fecha === iso;
          return (
            <button
              key={iso}
              disabled={!disponible}
              onClick={() => onSelect(iso)}
              className={`aspect-square rounded-lg text-body-sm transition-colors ${
                !inMonth
                  ? "text-transparent"
                  : seleccionado
                  ? "bg-primary text-on-primary font-semibold"
                  : disponible
                  ? "bg-status-confirmada-bg text-on-surface hover:bg-primary hover:text-on-primary"
                  : "text-on-surface-variant/40"
              }`}
            >
              {dayNumber(iso)}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-space-md mt-space-sm text-body-sm text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-status-confirmada-bg border border-status-confirmada" /> Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Elegido
        </span>
      </div>
    </div>
  );
}

function InfoTile({ label, value, className = "" }) {
  return (
    <div className={`bg-surface-container-low rounded-lg p-space-sm ${className}`}>
      <p className="text-[11px] uppercase tracking-wide text-secondary font-label-md">{label}</p>
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
    <div className="space-y-1">
      <label className="font-label-lg text-label-lg text-on-surface font-medium">RUT</label>
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        placeholder="12.345.678-9"
        maxLength={12}
        inputMode="text"
        className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function Campo({ label, value, onChange, type = "text", placeholder, required = false, cursorAlFinalAlEnfocar = false }) {
  return (
    <div className="space-y-1">
      <label className="font-label-lg text-label-lg text-on-surface font-medium">{label}</label>
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
    </div>
  );
}
