import { useEffect, useMemo, useState } from "react";
import { addDays, formatRangeLabel, getWeekDates, weekStart } from "../utils/date";
import { loadPublishedWeeks, savePublishedWeeks } from "../utils/availability";
import { HOY, nowHHMM } from "../utils/today";

const SEMANAS_A_MOSTRAR = 5;

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MODALIDADES = ["Box Clínico", "Domicilio", "Teleconsulta"];

const DEFAULT_CONFIG = {
  nombre: "Ismary Ugalde Rojas",
  registroSis: "802617",
  direccion: "Box Centro Médico, La Serena",
  diasActivos: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
  horaInicio: "08:30",
  horaFin: "19:30",
  modalidadesActivas: ["Box Clínico", "Domicilio", "Teleconsulta"],
  timeoutInactividad: "20",
  respaldoAutomatico: true,
};

function loadConfig() {
  try {
    const raw = window.localStorage.getItem("ismary_config");
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState(loadConfig);
  const [savedAt, setSavedAt] = useState(null);
  const [semanasPublicadas, setSemanasPublicadas] = useState(loadPublishedWeeks);

  const semanas = useMemo(() => {
    const inicioPrimeraSemana = weekStart(HOY);
    return Array.from({ length: SEMANAS_A_MOSTRAR }, (_, i) => {
      const lunes = addDays(inicioPrimeraSemana, i * 7);
      return { lunes, label: formatRangeLabel(getWeekDates(lunes)) };
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("ismary_config", JSON.stringify(config));
    } catch {
      // ignorar si localStorage no está disponible
    }
    const t = setTimeout(() => {
      setSavedAt(nowHHMM());
    }, 500);
    return () => clearTimeout(t);
  }, [config]);

  useEffect(() => {
    savePublishedWeeks(semanasPublicadas);
  }, [semanasPublicadas]);

  function toggleSemanaPublicada(lunes) {
    setSemanasPublicadas((prev) => ({ ...prev, [lunes]: !prev[lunes] }));
  }

  function copiarSemanaAnterior(lunes) {
    const anterior = addDays(lunes, -7);
    setSemanasPublicadas((prev) => ({ ...prev, [lunes]: Boolean(prev[anterior]) }));
  }

  function toggle(key, value) {
    setConfig((c) => ({
      ...c,
      [key]: c[key].includes(value) ? c[key].filter((v) => v !== value) : [...c[key], value],
    }));
  }

  return (
    <div className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-lg flex flex-col gap-space-lg max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Configuración del Sistema</h1>
          <p className="text-body-md text-on-surface-variant">Datos profesionales, disponibilidad y seguridad.</p>
        </div>
        {savedAt && (
          <span className="text-body-sm bg-[#f5f3f2] text-[#3d3d3d]/80 px-3 py-1.5 rounded-full border border-[#e2d3db]/50 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Guardado {savedAt}
          </span>
        )}
      </div>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
        <h2 className="font-headline-sm text-headline-sm text-primary">Datos legales y credenciales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
          <Campo label="Nombre profesional" value={config.nombre} onChange={(v) => setConfig((c) => ({ ...c, nombre: v }))} />
          <Campo label="Registro SIS" value={config.registroSis} onChange={(v) => setConfig((c) => ({ ...c, registroSis: v }))} />
          <div className="sm:col-span-2">
            <Campo label="Dirección de consulta / box habitual" value={config.direccion} onChange={(v) => setConfig((c) => ({ ...c, direccion: v }))} />
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
        <h2 className="font-headline-sm text-headline-sm text-primary">Horarios de disponibilidad</h2>
        <div>
          <p className="font-label-lg text-label-lg text-on-surface font-medium mb-1">Días activos</p>
          <div className="flex flex-wrap gap-1.5">
            {DIAS.map((d) => (
              <button
                key={d}
                onClick={() => toggle("diasActivos", d)}
                className={`px-space-sm py-1 rounded-full font-label-md text-label-md ${
                  config.diasActivos.includes(d) ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-secondary-container"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-space-sm max-w-sm">
          <Campo label="Hora inicio" type="time" value={config.horaInicio} onChange={(v) => setConfig((c) => ({ ...c, horaInicio: v }))} />
          <Campo label="Hora término" type="time" value={config.horaFin} onChange={(v) => setConfig((c) => ({ ...c, horaFin: v }))} />
        </div>
        <div>
          <p className="font-label-lg text-label-lg text-on-surface font-medium mb-1">Modalidades activas</p>
          <div className="flex flex-wrap gap-1.5">
            {MODALIDADES.map((m) => (
              <button
                key={m}
                onClick={() => toggle("modalidadesActivas", m)}
                className={`px-space-sm py-1 rounded-full font-label-md text-label-md ${
                  config.modalidadesActivas.includes(m) ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-secondary-container"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary">Publicación de disponibilidad (Portal de Reservas)</h2>
          <p className="text-body-sm text-on-surface-variant">
            Solo las semanas publicadas aquí aparecen como reservables en el portal público. Las pacientes no ven horas de semanas sin publicar.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          {semanas.map(({ lunes, label }) => (
            <div key={lunes} className="flex flex-wrap items-center justify-between gap-2 border border-surface-container rounded-lg px-space-sm py-1.5">
              <span className="text-body-md text-on-surface capitalize">{label}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copiarSemanaAnterior(lunes)}
                  className="text-label-md font-label-md text-on-surface-variant hover:text-primary hover:underline"
                >
                  Copiar semana anterior
                </button>
                <button
                  onClick={() => toggleSemanaPublicada(lunes)}
                  className={`px-space-sm py-1 rounded-full font-label-md text-label-md flex items-center gap-1 ${
                    semanasPublicadas[lunes]
                      ? "bg-status-confirmada-bg text-status-confirmada"
                      : "bg-surface-container text-on-surface-variant hover:bg-secondary-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {semanasPublicadas[lunes] ? "visibility" : "visibility_off"}
                  </span>
                  {semanasPublicadas[lunes] ? "Publicada" : "Sin publicar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
        <h2 className="font-headline-sm text-headline-sm text-primary">Firma y timbre profesional</h2>
        <div className="border-2 border-dashed border-surface-container rounded-lg p-space-lg text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[32px]">draw</span>
          <p className="text-body-sm mt-1">Arrastra una imagen de tu firma/timbre o haz clic para subirla (solo maqueta, no se guarda el archivo).</p>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
        <h2 className="font-headline-sm text-headline-sm text-primary">Parámetros de respaldo y seguridad</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm items-end">
          <div className="space-y-1">
            <label className="font-label-lg text-label-lg text-on-surface font-medium">Cierre de sesión por inactividad</label>
            <select
              value={config.timeoutInactividad}
              onChange={(e) => setConfig((c) => ({ ...c, timeoutInactividad: e.target.value }))}
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md"
            >
              {["10", "15", "20", "30"].map((m) => (
                <option key={m} value={m}>{m} minutos</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.respaldoAutomatico}
              onChange={(e) => setConfig((c) => ({ ...c, respaldoAutomatico: e.target.checked }))}
              className="w-4 h-4 accent-[#7a2e50]"
            />
            <span className="text-body-md text-on-surface">Respaldo automático diario activado</span>
          </label>
        </div>
      </section>
    </div>
  );
}

function Campo({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1">
      <label className="font-label-lg text-label-lg text-on-surface font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
