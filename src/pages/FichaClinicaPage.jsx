import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useClinica } from "../data/store";
import { calcularEdadGestacional, calcularFPP } from "../utils/obstetric";
import { HOY } from "../utils/today";
import { useDebouncedAutosave } from "../hooks/useDebouncedAutosave";
import ConsultaClinica from "../components/ConsultaClinica";
import StatusBadge from "../components/StatusBadge";

const TIPOS_ANTECEDENTE = ["Examen previo", "Interconsulta / Derivación", "Informe de otro profesional", "Otro"];

const CAMPOS_PERMANENTES = [
  ["alergias", "Alergias"],
  ["medicamentosHabituales", "Medicamentos habituales"],
  ["antecedentesObstetricos", "Antecedentes obstétricos"],
  ["antecedentesMedicos", "Antecedentes médicos"],
  ["antecedentesQuirurgicos", "Antecedentes quirúrgicos"],
  ["antecedentesFamiliares", "Antecedentes familiares relevantes"],
];

export default function FichaClinicaPage() {
  const { pacienteId } = useParams();
  const { patients, appointments, documents, updatePatient, addAntecedente, removeAntecedente } = useClinica();

  const patient = patients.find((p) => p.id === pacienteId);

  if (!patient) {
    return (
      <div className="p-space-xl text-center">
        <p className="text-body-md text-on-surface-variant">Paciente no encontrada.</p>
        <Link to="/fichas" className="text-primary font-label-lg hover:underline">Volver a Fichas Clínicas</Link>
      </div>
    );
  }

  const documentosPaciente = documents.filter((d) => d.pacienteId === pacienteId);
  const consultas = patient.consultas || [];
  const consultasFinalizadas = consultas.filter((c) => c.estado === "finalizada").sort((a, b) => (a.fecha + a.hora < b.fecha + b.hora ? 1 : -1));
  const ultimaConsulta = consultasFinalizadas[0] || null;
  const proximaCita = appointments
    .filter((a) => a.pacienteId === pacienteId && a.fecha >= HOY && a.estado !== "cancelada")
    .sort((a, b) => (a.fecha + a.horaInicio > b.fecha + b.horaInicio ? 1 : -1))[0] || null;
  const solicitudesPendientes = documentosPaciente.filter((d) => d.tipo === "solicitud-examenes" && d.estado === "emitido");

  const eg = patient.gestante ? calcularEdadGestacional(patient.fur, HOY) : null;
  const fpp = patient.gestante ? calcularFPP(patient.fur) : null;

  return (
    <div className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
      {/* Banner de paciente persistente */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="w-14 h-14 rounded-full bg-brand-soft text-primary flex items-center justify-center font-semibold text-lg shrink-0">
            {patient.nombre.split(" ").slice(0, 2).map((n) => n[0]).join("")}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline-md text-headline-md text-primary">{patient.nombre}</h1>
              {patient.gestante && (
                <span className="text-label-md font-label-md bg-status-reprogramada-bg text-status-reprogramada px-2 py-0.5 rounded-full uppercase">
                  Gestante
                </span>
              )}
            </div>
            <p className="text-body-sm text-on-surface-variant">
              RUT {patient.rut} · {patient.edad} años · {patient.prevision}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {patient.alertas.map((a) => (
            <span key={a} className="text-label-md font-label-md bg-status-cancelada-bg text-status-cancelada px-2 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              {a}
            </span>
          ))}
        </div>
      </div>

      <InformacionPrioritaria
        ultimaConsulta={ultimaConsulta}
        proximaCita={proximaCita}
        solicitudesPendientes={solicitudesPendientes}
        posibleDuplicado={patient.posibleDuplicado}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-desktop">
        <div className="xl:col-span-8 flex flex-col gap-gutter-desktop">
          {/* Calculadora obstétrica */}
          {patient.gestante && (
            <div className="bg-primary rounded-xl p-space-md text-on-primary shadow-md">
              <div className="flex items-center gap-1.5 font-label-md text-label-md uppercase tracking-wide opacity-80 mb-space-sm">
                <span className="material-symbols-outlined text-[16px]">calculate</span>
                Calculadora Obstétrica (Regla de Naegele)
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-lg py-2 text-center">
                  <div className="text-[12px] uppercase opacity-80">FUM</div>
                  <div className="font-title-md text-title-md">{patient.fur}</div>
                </div>
                <div className="bg-white/10 rounded-lg py-2 text-center">
                  <div className="text-[12px] uppercase opacity-80">Edad Gestacional</div>
                  <div className="font-title-md text-title-md">{eg?.texto || "—"}</div>
                </div>
                <div className="bg-white/10 rounded-lg py-2 text-center">
                  <div className="text-[12px] uppercase opacity-80">FPP</div>
                  <div className="font-title-md text-title-md">{fpp || "—"}</div>
                </div>
              </div>
            </div>
          )}

          <InfoPermanente patient={patient} onSave={(patch) => updatePatient(pacienteId, patch)} />

          <ConsultaClinica paciente={patient} documents={documentosPaciente} />
        </div>

        <div className="xl:col-span-4 flex flex-col gap-gutter-desktop">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
            <p className="font-title-sm text-title-sm text-on-surface mb-space-sm">Documentos de esta paciente</p>
            {documentosPaciente.length === 0 && (
              <p className="text-body-sm text-on-surface-variant">Sin recetas ni solicitudes emitidas todavía.</p>
            )}
            <div className="flex flex-col gap-space-sm">
              {documentosPaciente.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 border-l-2 border-primary-fixed pl-space-sm">
                  <div className="min-w-0">
                    <p className="text-body-sm text-on-surface truncate">
                      {d.tipo === "receta" ? "Receta" : "Solicitud de exámenes"} · {d.folio}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">{d.fecha}</p>
                  </div>
                  <StatusBadge estado={d.estado} className="shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <AntecedentesAdjuntos
            patient={patient}
            onAdd={(antecedente) => addAntecedente(pacienteId, antecedente)}
            onRemove={(id) => removeAntecedente(pacienteId, id)}
          />
        </div>
      </div>
    </div>
  );
}

// Panel de "información prioritaria" (plan.md §17): lo primero que Ismary
// debería poder leer antes de empezar a atender, sin tener que buscarlo.
function InformacionPrioritaria({ ultimaConsulta, proximaCita, solicitudesPendientes, posibleDuplicado }) {
  const items = [];
  items.push({
    icon: "history",
    texto: ultimaConsulta
      ? `Última consulta: ${ultimaConsulta.fecha} · ${ultimaConsulta.tipo}`
      : "Sin consultas previas registradas.",
  });
  items.push({
    icon: "event_upcoming",
    texto: proximaCita
      ? `Próxima cita: ${proximaCita.fecha} · ${proximaCita.horaInicio} · ${proximaCita.tipo}`
      : "Sin próxima cita agendada.",
  });
  if (solicitudesPendientes.length > 0) {
    items.push({
      icon: "lab_research",
      texto: `${solicitudesPendientes.length} solicitud(es) de exámenes emitidas pendientes de revisión.`,
    });
  }
  if (posibleDuplicado) {
    items.push({ icon: "warning", texto: "Este perfil quedó marcado como posible coincidencia con otro registro.", alerta: true });
  }

  const tieneAlerta = items.some((i) => i.alerta);

  return (
    <div className={`rounded-xl border p-space-md ${tieneAlerta ? "border-status-cancelada bg-status-cancelada-bg" : "border-brand-medium bg-[#FBEAF0]"}`}>
      <div className="flex items-center gap-1.5 font-label-md text-label-md uppercase tracking-wide text-primary mb-space-sm">
        <span className="material-symbols-outlined text-[16px]">priority_high</span>
        Información Prioritaria
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((i) => (
          <p key={i.texto} className={`text-body-sm flex items-center gap-1.5 ${i.alerta ? "text-status-cancelada font-semibold" : "text-on-surface"}`}>
            <span className="material-symbols-outlined text-[16px] shrink-0">{i.icon}</span>
            {i.texto}
          </p>
        ))}
      </div>
    </div>
  );
}

// Información clínica permanente (plan.md §12.2): vive en el perfil, no se
// pisa en cada consulta — a diferencia de la anamnesis puntual de un
// control, esto es lo que se arrastra siempre (alergias, medicamentos
// habituales, antecedentes). No necesita quedar como formulario abierto en
// cada visita a la ficha: se muestra colapsada (solo lo ya registrado) y se
// abre a pedido con "Editar", para dejarle el protagonismo de la pantalla a
// la Línea de Tiempo Clínica de abajo.
function InfoPermanente({ patient, onSave }) {
  const [editando, setEditando] = useState(false);
  const [campos, setCampos] = useState(() =>
    Object.fromEntries(CAMPOS_PERMANENTES.map(([key]) => [key, patient[key] || ""]))
  );
  const savedAt = useDebouncedAutosave(campos, onSave);
  const camposConDatos = CAMPOS_PERMANENTES.filter(([key]) => campos[key]);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-headline-sm text-headline-sm text-primary">Información Clínica Permanente</h2>
        {editando ? (
          <span className="text-body-sm bg-surface-container-low text-text-primary/80 px-3 py-1.5 rounded-full border border-border-subtle/50 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {savedAt ? `Guardado automáticamente ${savedAt}` : "Autoguardado activo"}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar
          </button>
        )}
      </div>

      {editando ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            {CAMPOS_PERMANENTES.map(([key, label]) => (
              <div key={key} className="space-y-1">
                <label className="font-label-lg text-label-lg text-on-surface font-medium">{label}</label>
                <input
                  value={campos[key]}
                  onChange={(e) => setCampos((c) => ({ ...c, [key]: e.target.value }))}
                  placeholder="Sin registrar"
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="self-end px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-strong transition-colors"
          >
            Listo
          </button>
        </>
      ) : camposConDatos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
          {camposConDatos.map(([key, label]) => (
            <div key={key}>
              <p className="font-label-md text-label-md text-secondary uppercase">{label}</p>
              <p className="text-body-sm text-on-surface whitespace-pre-wrap">{campos[key]}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-body-sm text-on-surface-variant">Sin antecedentes registrados todavía.</p>
      )}
    </div>
  );
}

function AntecedentesAdjuntos({ patient, onAdd, onRemove }) {
  const [tipo, setTipo] = useState(TIPOS_ANTECEDENTE[0]);
  const fileInputRef = useRef(null);
  const antecedentes = patient.antecedentes || [];

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onAdd({
      id: `ant-${Date.now()}`,
      nombre: file.name,
      tipo,
      fecha: HOY,
      tamanoKB: Math.max(1, Math.round(file.size / 1024)),
    });
    e.target.value = "";
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
      <p className="font-title-sm text-title-sm text-on-surface mb-space-sm">Antecedentes Adjuntos ({antecedentes.length})</p>
      {antecedentes.length === 0 && (
        <p className="text-body-sm text-on-surface-variant mb-space-sm">Sin exámenes previos ni interconsultas adjuntas.</p>
      )}
      <div className="flex flex-col gap-space-sm mb-space-sm">
        {antecedentes.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2 border-l-2 border-primary-fixed pl-space-sm">
            <div className="min-w-0">
              <p className="text-body-sm text-on-surface truncate">{a.nombre}</p>
              <p className="text-body-sm text-on-surface-variant">{a.tipo} · {a.fecha} · {a.tamanoKB} KB</p>
            </div>
            <button
              onClick={() => onRemove(a.id)}
              className="text-status-cancelada text-body-sm hover:underline shrink-0"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-space-sm">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {TIPOS_ANTECEDENTE.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 px-space-md py-2 rounded-lg border-2 border-dashed border-surface-container text-on-surface-variant hover:border-primary hover:text-primary font-label-lg text-label-lg"
        >
          <span className="material-symbols-outlined text-[18px]">attach_file</span>
          Adjuntar archivo (solo maqueta, no se sube realmente)
        </button>
        <input ref={fileInputRef} type="file" onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
}
