import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClinica } from "../data/store";
import StatusBadge from "../components/StatusBadge";
import {
  getWeekDates,
  dayLabel,
  dayNumber,
  formatRangeLabel,
  formatLongDate,
  weekNumber,
  addDays,
  getMonthGrid,
} from "../utils/date";
import { HOY } from "../utils/today";

const REFERENCE_TODAY = HOY;

const MODALIDADES = [
  { key: "Box Clínico", dot: "bg-primary-container" },
  { key: "Domicilio", dot: "bg-tertiary-fixed-dim" },
  { key: "Teleconsulta", dot: "bg-secondary" },
];

function minutesOfDay(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function hhmmFromMinutes(total) {
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function CalendarioPage() {
  const { appointments, webRequests, patients, confirmWebRequest, updateAppointment } = useClinica();
  const navigate = useNavigate();
  const [view, setView] = useState("semana"); // dia | semana | mes
  const [anchorDate, setAnchorDate] = useState(REFERENCE_TODAY);
  const [modalidadFiltro, setModalidadFiltro] = useState(null);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  // En móvil, el modo "semana" no muestra las 6 columnas lado a lado (no
  // caben legibles) sino un selector horizontal de días + las citas del día
  // elegido, como en el modo "Día".
  const [diaMovil, setDiaMovil] = useState(REFERENCE_TODAY);

  const patientById = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p])), [patients]);

  const filteredAppointments = useMemo(
    () => (modalidadFiltro ? appointments.filter((a) => a.modalidad === modalidadFiltro) : appointments),
    [appointments, modalidadFiltro]
  );

  // Las citas canceladas se siguen mostrando en la grilla (con su badge e
  // historial), pero no deben inflar contadores ni indicadores de carga de
  // trabajo real.
  const appointmentsActivas = useMemo(() => appointments.filter((a) => a.estado !== "cancelada"), [appointments]);

  const modalidadCounts = useMemo(() => {
    const counts = {};
    for (const a of appointmentsActivas) counts[a.modalidad] = (counts[a.modalidad] || 0) + 1;
    return counts;
  }, [appointmentsActivas]);

  const weekDates = getWeekDates(anchorDate);
  const appointmentsByDay = useMemo(() => {
    const map = Object.fromEntries(weekDates.map((d) => [d, []]));
    for (const a of filteredAppointments) {
      if (map[a.fecha]) map[a.fecha].push(a);
    }
    for (const d of weekDates) map[d].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    return map;
  }, [filteredAppointments, weekDates]);

  useEffect(() => {
    if (!weekDates.includes(diaMovil)) {
      setDiaMovil(weekDates.includes(REFERENCE_TODAY) ? REFERENCE_TODAY : weekDates[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorDate]);

  const todaysAppointments = useMemo(
    () => appointmentsActivas.filter((a) => a.fecha === REFERENCE_TODAY).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    [appointmentsActivas]
  );

  const todaysCountByModalidad = useMemo(() => {
    const counts = { "Box Clínico": 0, Domicilio: 0, Teleconsulta: 0 };
    for (const a of todaysAppointments) counts[a.modalidad] = (counts[a.modalidad] || 0) + 1;
    return counts;
  }, [todaysAppointments]);

  function goToFicha(pacienteId) {
    navigate(`/fichas/${pacienteId}`);
  }

  return (
    <div className="flex flex-col w-full">
      <div className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-md bg-surface-container-low flex flex-col xl:flex-row xl:items-center xl:justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-md">
          <div className="inline-flex p-1 bg-surface-container rounded-lg shadow-sm">
            {["dia", "semana", "mes"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-space-md py-1.5 font-label-lg text-label-lg rounded-md transition-colors capitalize ${
                  view === v ? "bg-surface-container-lowest text-primary shadow-sm font-semibold" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {v === "dia" ? "Día" : v}
              </button>
            ))}
          </div>

          {view !== "mes" && (
            <div className="flex items-center gap-space-xs">
              <button
                onClick={() => setAnchorDate((d) => addDays(d, view === "dia" ? -1 : -7))}
                className="p-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={() => setAnchorDate(REFERENCE_TODAY)}
                className="px-space-md py-1.5 rounded-lg bg-surface-container-lowest font-label-lg text-label-lg hover:bg-surface-container shadow-sm"
              >
                Hoy
              </button>
              <button
                onClick={() => setAnchorDate((d) => addDays(d, view === "dia" ? 1 : 7))}
                className="p-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <div className="ml-space-xs flex items-baseline gap-space-xs">
                <span className="font-headline-sm text-headline-sm text-primary">
                  {view === "dia" ? formatLongDate(anchorDate) : formatRangeLabel(weekDates)}
                </span>
                <span className="font-code-clinical text-code-clinical text-secondary">Semana {weekNumber(anchorDate)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between xl:justify-end gap-space-md">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setModalidadFiltro(null)}
              className={`px-space-sm py-1 rounded-full font-label-md text-label-md whitespace-nowrap ${
                !modalidadFiltro ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:bg-secondary-container"
              }`}
            >
              Todas ({appointmentsActivas.length})
            </button>
            {MODALIDADES.map((m) => (
              <button
                key={m.key}
                onClick={() => setModalidadFiltro(m.key)}
                className={`px-space-sm py-1 rounded-full font-label-md text-label-md whitespace-nowrap flex items-center gap-1 ${
                  modalidadFiltro === m.key ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:bg-secondary-container"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                {m.key} ({modalidadCounts[m.key] || 0})
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate("/configuracion")}
            className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-lowest text-primary font-label-lg text-label-lg shadow-sm hover:bg-secondary-container transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span className="hidden sm:inline">Disponibilidad</span>
          </button>
        </div>
      </div>

      <div className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-lg">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-desktop">
          <div className="xl:col-span-8 2xl:col-span-9 flex flex-col gap-gutter-desktop">
            {view === "mes" ? (
              <MesView anchorDate={anchorDate} appointments={appointmentsActivas} onSelectDay={(iso) => { setAnchorDate(iso); setView("dia"); }} />
            ) : view === "dia" ? (
              <DiaColumn
                fecha={anchorDate}
                citas={appointmentsByDay[anchorDate] || (appointments.filter((a) => a.fecha === anchorDate))}
                patientById={patientById}
                onSelectCita={setCitaSeleccionada}
                expanded
              />
            ) : (
              <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_-4px_rgba(122,46,80,0.06)] overflow-hidden">
                {/* Selector horizontal de días — solo móvil: elegir un día muestra solo sus citas debajo. */}
                <div className="xl:hidden flex items-center justify-center gap-1.5 overflow-x-auto p-space-sm border-b border-surface-container">
                  {weekDates.map((iso) => {
                    const seleccionado = iso === diaMovil;
                    const tieneCitas = (appointmentsByDay[iso] || []).length > 0;
                    return (
                      <button
                        key={iso}
                        onClick={() => setDiaMovil(iso)}
                        className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl shrink-0 min-w-[50px] transition-colors ${
                          seleccionado ? "bg-primary text-on-primary shadow-sm" : "text-on-surface hover:bg-surface-container-low"
                        }`}
                      >
                        <span className={`text-[12px] uppercase font-label-md ${seleccionado ? "text-on-primary/80" : "text-secondary"}`}>
                          {dayLabel(iso)}
                        </span>
                        <span className="font-headline-sm text-headline-sm">{dayNumber(iso)}</span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tieneCitas ? (seleccionado ? "bg-white" : "bg-primary") : "bg-transparent"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="xl:hidden">
                  <DiaColumn
                    fecha={diaMovil}
                    citas={appointmentsByDay[diaMovil] || []}
                    patientById={patientById}
                    onSelectCita={setCitaSeleccionada}
                    expanded
                  />
                </div>

                {/* Grilla de columnas lado a lado — solo escritorio/tablet. */}
                <div className="hidden xl:grid xl:grid-cols-6 bg-surface-container-low text-center py-3 px-2">
                  {weekDates.map((iso) => (
                    <div key={iso} className="flex flex-col items-center">
                      <span className="font-label-md text-label-md text-secondary">{dayLabel(iso)}</span>
                      {iso === REFERENCE_TODAY ? (
                        <>
                          <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm text-headline-sm shadow-sm">
                            {dayNumber(iso)}
                          </span>
                          <span className="text-[12px] font-code-clinical text-primary uppercase font-bold tracking-wider mt-0.5">Hoy</span>
                        </>
                      ) : (
                        <span className="font-headline-sm text-headline-sm text-primary">{dayNumber(iso)}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="hidden xl:grid xl:grid-cols-6 divide-x divide-surface-container gap-px bg-surface-container">
                  {weekDates.map((iso) => (
                    <DiaColumn
                      key={iso}
                      fecha={iso}
                      citas={appointmentsByDay[iso]}
                      patientById={patientById}
                      onSelectCita={setCitaSeleccionada}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="xl:col-span-4 2xl:col-span-3 flex flex-col gap-gutter-desktop">
            <div className="bg-primary rounded-xl p-space-md text-on-primary shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wide opacity-80">Hoy en Agenda</span>
                <span className="text-[12px] bg-white/15 px-2 py-0.5 rounded-full">{todaysAppointments.length} Atenciones</span>
              </div>
              <p className="font-headline-md text-headline-md mt-1">{formatLongDate(REFERENCE_TODAY)}</p>
              <div className="grid grid-cols-3 gap-2 mt-space-md">
                {Object.entries(todaysCountByModalidad).map(([k, v]) => (
                  <div key={k} className="bg-white/10 rounded-lg py-2 text-center">
                    <div className="font-headline-lg text-headline-lg">{v}</div>
                    <div className="text-[12px] uppercase opacity-80">{k === "Box Clínico" ? "Box" : k === "Domicilio" ? "Domicilio" : "Online"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
              <div className="flex items-center justify-between mb-space-sm">
                <div className="flex items-center gap-1.5 font-title-sm text-title-sm text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-primary">notifications_active</span>
                  Solicitudes Web Pendientes
                </div>
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center">
                  {webRequests.length}
                </span>
              </div>
              <div className="flex flex-col gap-space-sm">
                {webRequests.length === 0 && (
                  <p className="text-body-sm text-on-surface-variant">No hay solicitudes pendientes.</p>
                )}
                {webRequests.map((req) => {
                  const p = patientById[req.pacienteId];
                  return (
                    <div key={req.id} className="border border-surface-container rounded-lg p-space-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-title-sm text-title-sm text-on-surface">{p?.nombre}</span>
                        <span className="text-label-md font-label-md bg-status-pendiente-bg text-status-pendiente px-2 py-0.5 rounded-full">
                          {req.fecha.slice(8, 10)}/{req.fecha.slice(5, 7)} · {req.hora}
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">{req.tipo}</p>
                      <div className="flex items-center justify-between mt-space-sm">
                        <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">
                            {req.modalidad === "Teleconsulta" ? "videocam" : "location_on"}
                          </span>
                          {req.modalidad}
                        </span>
                        <button
                          onClick={() => confirmWebRequest(req.id)}
                          className="bg-primary-container text-on-primary text-label-lg font-label-lg px-3 py-1 rounded-lg hover:bg-primary-strong transition-colors"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-title-sm text-title-sm text-on-surface">Próximas Citas (Hoy)</span>
                <span className="text-body-sm text-on-surface-variant">En curso</span>
              </div>
              <div className="flex flex-col gap-space-sm">
                {todaysAppointments.map((a) => {
                  const p = patientById[a.pacienteId];
                  const initials = p?.nombre.split(" ").slice(0, 2).map((n) => n[0]).join("");
                  return (
                    <button
                      key={a.id}
                      onClick={() => goToFicha(a.pacienteId)}
                      className="flex items-center justify-between gap-2 text-left hover:bg-surface-container-low rounded-lg p-1.5 -m-1.5 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-brand-soft text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-title-sm text-title-sm text-on-surface truncate">{p?.nombre}</p>
                          <p className="text-body-sm text-on-surface-variant truncate">{a.tipo}</p>
                        </div>
                      </div>
                      <span className="text-label-lg font-label-lg text-secondary shrink-0">{a.horaInicio}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {citaSeleccionada && (
        <CitaDetalleModal
          cita={citaSeleccionada}
          paciente={patientById[citaSeleccionada.pacienteId]}
          onClose={() => setCitaSeleccionada(null)}
          onVerFicha={(pacienteId) => {
            setCitaSeleccionada(null);
            goToFicha(pacienteId);
          }}
          onUpdateAppointment={updateAppointment}
        />
      )}
    </div>
  );
}

function CitaDetalleModal({ cita, paciente, onClose, onVerFicha, onUpdateAppointment }) {
  const [modo, setModo] = useState("detalle"); // detalle | reprogramar | cancelar
  const [nuevaFecha, setNuevaFecha] = useState(cita.fecha);
  const [nuevaHora, setNuevaHora] = useState(cita.horaInicio);

  const duracionMin = minutesOfDay(cita.horaFin) - minutesOfDay(cita.horaInicio);

  function confirmarReprogramacion() {
    const inicio = minutesOfDay(nuevaHora);
    onUpdateAppointment(cita.id, {
      fecha: nuevaFecha,
      horaInicio: nuevaHora,
      horaFin: hhmmFromMinutes(inicio + Math.max(duracionMin, 0)),
      estado: "reprogramada",
    });
    onClose();
  }

  function confirmarCancelacion() {
    onUpdateAppointment(cita.id, { estado: "cancelada" });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface-container-lowest rounded-xl shadow-xl max-w-sm w-full p-space-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {modo === "detalle" && (
          <>
            <div className="flex items-center justify-between gap-2 mb-space-sm">
              <h2 className="font-headline-sm text-headline-sm text-primary truncate">{paciente?.nombre}</h2>
              <StatusBadge estado={cita.estado} className="shrink-0" />
            </div>
            <p className="text-body-md text-on-surface">{cita.tipo}</p>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {cita.fecha} · {cita.horaInicio}–{cita.horaFin} · {cita.modalidad}
            </p>
            {cita.ubicacion && <p className="text-body-sm text-on-surface-variant">{cita.ubicacion}</p>}
            <div className="flex flex-col gap-space-sm mt-space-md">
              <button
                onClick={() => onVerFicha(cita.pacienteId)}
                className="w-full h-11 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold"
              >
                Ver Ficha Clínica
              </button>
              <button
                onClick={() => setModo("reprogramar")}
                className="w-full h-11 rounded-lg border border-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low"
              >
                Reprogramar
              </button>
              <button
                onClick={() => setModo("cancelar")}
                className="w-full h-11 rounded-lg border border-status-cancelada text-status-cancelada font-label-lg text-label-lg hover:bg-status-cancelada-bg"
              >
                Cancelar Cita
              </button>
              <button onClick={onClose} className="w-full text-body-sm text-on-surface-variant hover:text-on-surface">
                Cerrar
              </button>
            </div>
          </>
        )}

        {modo === "reprogramar" && (
          <>
            <h2 className="font-headline-sm text-headline-sm text-primary mb-space-sm">Reprogramar cita</h2>
            <p className="text-body-sm text-on-surface-variant mb-space-sm">{paciente?.nombre} · {cita.tipo}</p>
            <div className="space-y-space-sm">
              <div className="space-y-1">
                <label className="font-label-lg text-label-lg text-on-surface font-medium">Nueva fecha</label>
                <input
                  type="date"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-lg text-label-lg text-on-surface font-medium">Nueva hora de inicio</label>
                <input
                  type="time"
                  value={nuevaHora}
                  onChange={(e) => setNuevaHora(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-space-sm mt-space-md">
              <button
                onClick={() => setModo("detalle")}
                className="flex-1 h-11 rounded-lg border border-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low"
              >
                Volver
              </button>
              <button
                onClick={confirmarReprogramacion}
                className="flex-1 h-11 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold"
              >
                Confirmar
              </button>
            </div>
          </>
        )}

        {modo === "cancelar" && (
          <>
            <h2 className="font-headline-sm text-headline-sm text-primary mb-space-sm">¿Cancelar esta cita?</h2>
            <p className="text-body-md text-on-surface-variant">
              {paciente?.nombre} · {cita.fecha} · {cita.horaInicio}. Esta acción marcará la cita como cancelada.
            </p>
            <div className="flex gap-space-sm mt-space-md">
              <button
                onClick={() => setModo("detalle")}
                className="flex-1 h-11 rounded-lg border border-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low"
              >
                Volver
              </button>
              <button
                onClick={confirmarCancelacion}
                className="flex-1 h-11 rounded-lg bg-status-cancelada text-white font-title-sm text-title-sm font-semibold"
              >
                Sí, cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DiaColumn({ citas, patientById, onSelectCita, expanded = false }) {
  // Nota: cuando expanded=false, este componente solo se usa dentro de la
  // grilla de escritorio (envuelta en "hidden xl:grid"); en móvil siempre se
  // usa expanded=true, tanto en el modo "Día" como en el selector horizontal
  // del modo "Semana".
  const vacio = citas.length === 0;
  return (
    <div className={expanded ? "bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm" : "bg-surface-container-lowest p-space-sm flex flex-col gap-space-sm min-h-[200px]"}>
      {vacio && <p className="text-body-sm text-on-surface-variant text-center py-space-lg">Sin citas</p>}
      {citas.map((cita) => {
        const p = patientById[cita.pacienteId];
        return (
          <button
            key={cita.id}
            onClick={() => onSelectCita(cita)}
            className={`text-left rounded-lg border p-space-sm hover:shadow-md transition-all ${
              cita.estado === "cancelada"
                ? "border-surface-container bg-surface-container-low opacity-60"
                : "border-surface-container bg-surface hover:border-primary-fixed"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-code-clinical font-code-clinical text-secondary">
                {cita.horaInicio}–{cita.horaFin}
              </span>
              <StatusBadge estado={cita.estado} />
            </div>
            <p className="font-title-sm text-title-sm text-on-surface mt-1 truncate">{p?.nombre}</p>
            <p className="text-body-sm text-on-surface-variant truncate">{cita.tipo}</p>
            {cita.ubicacion && (
              <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">
                  {cita.modalidad === "Teleconsulta" ? "videocam" : cita.modalidad === "Domicilio" ? "home" : "apartment"}
                </span>
                {cita.ubicacion}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MesView({ anchorDate, appointments, onSelectDay }) {
  const { cells, label } = getMonthGrid(anchorDate);
  const countByDay = useMemo(() => {
    const map = {};
    for (const a of appointments) map[a.fecha] = (map[a.fecha] || 0) + 1;
    return map;
  }, [appointments]);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
      <p className="font-headline-sm text-headline-sm text-primary mb-space-sm">{label}</p>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((d) => (
          <span key={d} className="text-label-md font-label-md text-secondary py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ iso, inMonth }) => (
          <button
            key={iso}
            onClick={() => onSelectDay(iso)}
            className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              inMonth ? "bg-surface hover:bg-secondary-container" : "bg-surface-container-low text-on-surface-variant/50"
            } ${iso === REFERENCE_TODAY ? "ring-2 ring-primary" : ""}`}
          >
            <span className="text-body-sm">{Number(iso.slice(8, 10))}</span>
            {countByDay[iso] && <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />}
          </button>
        ))}
      </div>
    </div>
  );
}
