import { useState } from "react";
import { useClinica } from "../data/store";
import { HOY, nowHHMM } from "../utils/today";
import { formatLongDate } from "../utils/date";
import { useDebouncedAutosave } from "../hooks/useDebouncedAutosave";
import DocumentosEmision from "./DocumentosEmision";

// Clasificación de la consulta (plan.md §13.4): permite ordenar y reconocer
// consultas sin necesidad de formularios distintos por prestación.
export const ETIQUETAS_CONSULTA = [
  "Prenatal",
  "Posparto",
  "Lactancia",
  "Anticoncepción",
  "Salud sexual y reproductiva",
  "Teleconsulta",
  "Domicilio",
  "Requiere seguimiento",
];

const CAMPOS_VACIOS = {
  motivo: "",
  anamnesis: "",
  evaluacion: "",
  diagnostico: "",
  indicaciones: "",
  senalesAlarma: "",
  seguimiento: "",
  observaciones: "",
  vitales: { pa: "", fc: "", peso: "", au: "", lcf: "" },
};

// Indicador de color por tipo de documento asociado a la consulta
// (plan.md §13.2: azul=exámenes, dorado=antecedentes, rosado=receta,
// morado=derivación — derivación aún no existe como tipo de documento).
function DocTypeDot({ tipo }) {
  const estilos = {
    "solicitud-examenes": { label: "Exámenes", clases: "bg-blue-50 text-blue-700 border-blue-200" },
    receta: { label: "Receta", clases: "bg-pink-50 text-pink-700 border-pink-200" },
  };
  const s = estilos[tipo];
  if (!s) return null;
  return (
    <span className={`text-label-md font-label-md px-2 py-0.5 rounded-full border ${s.clases}`}>{s.label}</span>
  );
}

function DetalleCampo({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="font-label-md text-label-md text-secondary uppercase">{label}</p>
      <p className="text-body-sm text-on-surface whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function ConsultaCard({ consulta, documentosVinculados }) {
  const [abierta, setAbierta] = useState(false);
  const vitalesConDatos = Object.entries(consulta.vitales || {}).filter(([, v]) => v);

  return (
    <article className="border border-surface-container rounded-xl p-space-md bg-surface-container-lowest">
      <button onClick={() => setAbierta((v) => !v)} className="w-full text-left flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-title-sm text-title-sm text-on-surface">{consulta.tipo}</span>
            {consulta.etiquetas?.map((t) => (
              <span key={t} className="text-label-md font-label-md bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
          <p className="text-body-sm text-on-surface-variant">
            {formatLongDate(consulta.fecha)} · {consulta.hora} · {consulta.modalidad}
          </p>
          {consulta.motivo && <p className="text-body-sm text-on-surface mt-1 truncate">{consulta.motivo}</p>}
        </div>
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">
          {abierta ? "expand_less" : "expand_more"}
        </span>
      </button>

      {documentosVinculados.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {documentosVinculados.map((d) => (
            <DocTypeDot key={d.id} tipo={d.tipo} />
          ))}
        </div>
      )}

      {abierta && (
        <div className="mt-space-sm pt-space-sm border-t border-surface-container flex flex-col gap-space-sm">
          <DetalleCampo label="Anamnesis" value={consulta.anamnesis} />
          <DetalleCampo label="Evaluación y hallazgos" value={consulta.evaluacion} />
          <DetalleCampo label="Impresión clínica / Diagnóstico" value={consulta.diagnostico} />
          <DetalleCampo label="Indicaciones y educación" value={consulta.indicaciones} />
          <DetalleCampo label="Señales de alarma informadas" value={consulta.senalesAlarma} />
          <DetalleCampo label="Seguimiento acordado" value={consulta.seguimiento} />
          <DetalleCampo label="Observaciones" value={consulta.observaciones} />
          {vitalesConDatos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {vitalesConDatos.map(([k, v]) => (
                <div key={k} className="bg-surface-container-low rounded-lg py-1.5 text-center">
                  <div className="text-[10px] uppercase text-on-surface-variant">{k.toUpperCase()}</div>
                  <div className="text-body-sm font-semibold text-on-surface">{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function CampoTexto({ label, value, onChange, rows = 2, placeholder }) {
  return (
    <div className="space-y-1">
      <label className="font-label-lg text-label-lg text-on-surface font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

// Formulario de la consulta activa. Se remonta (via `key`) cada vez que
// cambia el borrador vigente, para no arrastrar estado local de una
// consulta a otra.
function ConsultaForm({ paciente, borrador, onCerrar }) {
  const { updateConsulta, finalizarConsulta, deleteConsulta } = useClinica();
  const [campos, setCampos] = useState({
    tipo: borrador.tipo,
    modalidad: borrador.modalidad,
    etiquetas: borrador.etiquetas || [],
    motivo: borrador.motivo,
    anamnesis: borrador.anamnesis,
    evaluacion: borrador.evaluacion,
    diagnostico: borrador.diagnostico,
    indicaciones: borrador.indicaciones,
    senalesAlarma: borrador.senalesAlarma,
    seguimiento: borrador.seguimiento,
    observaciones: borrador.observaciones,
    vitales: borrador.vitales || CAMPOS_VACIOS.vitales,
  });
  const [showDocumentos, setShowDocumentos] = useState(false);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);

  const savedAt = useDebouncedAutosave(campos, (value) => {
    updateConsulta(paciente.id, borrador.id, value);
  });

  function campo(key, value) {
    setCampos((c) => ({ ...c, [key]: value }));
  }
  function vital(key, value) {
    setCampos((c) => ({ ...c, vitales: { ...c.vitales, [key]: value } }));
  }
  function toggleEtiqueta(tag) {
    setCampos((c) => ({
      ...c,
      etiquetas: c.etiquetas.includes(tag) ? c.etiquetas.filter((t) => t !== tag) : [...c.etiquetas, tag],
    }));
  }

  function guardarYCerrar() {
    updateConsulta(paciente.id, borrador.id, campos);
    onCerrar();
  }
  function finalizar() {
    updateConsulta(paciente.id, borrador.id, campos);
    finalizarConsulta(paciente.id, borrador.id);
    onCerrar();
  }
  function cancelarConsulta() {
    deleteConsulta(paciente.id, borrador.id);
    onCerrar();
  }

  return (
    <div className="border border-primary-fixed rounded-xl p-space-md bg-surface-container-lowest flex flex-col gap-space-md">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-headline-sm text-headline-sm text-primary">Consulta en curso</h3>
        <span className="text-body-sm bg-[#f5f3f2] text-[#3d3d3d]/80 px-3 py-1.5 rounded-full border border-[#e2d3db]/50 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {savedAt ? `Guardado automáticamente ${savedAt}` : "Autoguardado activo"}
        </span>
      </div>

      <div>
        <p className="font-label-lg text-label-lg text-on-surface font-medium mb-1">Clasificación de la consulta</p>
        <div className="flex flex-wrap gap-1.5">
          {ETIQUETAS_CONSULTA.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleEtiqueta(tag)}
              className={`px-space-sm py-1 rounded-full font-label-md text-label-md ${
                campos.etiquetas.includes(tag)
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-secondary-container"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <CampoTexto label="Motivo de consulta" value={campos.motivo} onChange={(v) => campo("motivo", v)} />
      <CampoTexto
        label="Anamnesis o antecedentes relevantes para la atención"
        value={campos.anamnesis}
        onChange={(v) => campo("anamnesis", v)}
        rows={3}
      />

      <div>
        <h4 className="font-title-sm text-title-sm text-on-surface mb-space-sm">Signos Vitales y Examen Físico</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-space-sm">
          {[
            ["pa", "PA (mmHg)", "110/70"],
            ["fc", "FC (lpm)", "78"],
            ["peso", "Peso (kg)", "62.4"],
            ["au", "AU (cm)", "30"],
            ["lcf", "LCF (lpm)", "142"],
          ].map(([key, label, placeholder]) => (
            <div key={key} className="space-y-1">
              <label className="font-label-lg text-label-lg text-on-surface font-medium">{label}</label>
              <input
                value={campos.vitales[key] || ""}
                onChange={(e) => vital(key, e.target.value)}
                placeholder={placeholder}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>

      <CampoTexto label="Evaluación y hallazgos" value={campos.evaluacion} onChange={(v) => campo("evaluacion", v)} rows={3} />
      <div className="space-y-1">
        <label className="font-label-lg text-label-lg text-on-surface font-medium">Impresión clínica o diagnóstico (CIE-10 sugerido)</label>
        <input
          value={campos.diagnostico}
          onChange={(e) => campo("diagnostico", e.target.value)}
          placeholder="Ej: Z34.8 — Control de otro embarazo normal"
          className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <CampoTexto label="Indicaciones y educación entregada" value={campos.indicaciones} onChange={(v) => campo("indicaciones", v)} rows={3} />

      <details className="rounded-lg border border-surface-container bg-surface-container-low p-space-sm">
        <summary className="cursor-pointer font-title-sm text-title-sm text-on-surface">Señales de alarma y seguimiento</summary>
        <div className="mt-space-sm flex flex-col gap-space-sm">
          <CampoTexto label="Señales de alarma informadas" value={campos.senalesAlarma} onChange={(v) => campo("senalesAlarma", v)} />
          <CampoTexto label="Seguimiento acordado" value={campos.seguimiento} onChange={(v) => campo("seguimiento", v)} />
        </div>
      </details>

      <CampoTexto label="Observaciones" value={campos.observaciones} onChange={(v) => campo("observaciones", v)} />

      <div className="flex items-center gap-space-sm pt-space-sm border-t border-surface-container flex-wrap">
        <button
          type="button"
          onClick={() => setShowDocumentos(true)}
          className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">prescriptions</span>
          Emitir Receta / Solicitud
        </button>
        <button
          type="button"
          onClick={() => setConfirmandoCancelar(true)}
          className="flex items-center gap-1.5 px-space-md py-2 rounded-lg text-status-cancelada font-label-lg text-label-lg hover:bg-status-cancelada-bg transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          Cancelar Consulta
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={guardarYCerrar}
          className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high"
        >
          Guardar y Cerrar
        </button>
        <button
          type="button"
          onClick={finalizar}
          className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-[#682442] flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Finalizar Consulta
        </button>
      </div>

      {showDocumentos && (
        <div
          className="fixed inset-0 z-[70] bg-black/50 flex items-start sm:items-center justify-center sm:p-6"
          onClick={() => setShowDocumentos(false)}
        >
          <div
            className="bg-surface w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-xl shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-surface-container-lowest/95 backdrop-blur px-space-md py-space-sm border-b border-surface-container">
              <h2 className="font-headline-sm text-headline-sm text-primary">Emitir Receta / Solicitud de Exámenes</h2>
              <button
                type="button"
                onClick={() => setShowDocumentos(false)}
                aria-label="Cerrar"
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <div className="p-space-md">
              <DocumentosEmision paciente={paciente} consultaId={borrador.id} />
            </div>
          </div>
        </div>
      )}

      {confirmandoCancelar && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setConfirmandoCancelar(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl shadow-xl max-w-sm w-full p-space-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-headline-sm text-headline-sm text-primary mb-space-sm">¿Cancelar esta consulta?</h2>
            <p className="text-body-md text-on-surface-variant">
              Se eliminará este borrador junto con todo lo escrito en él. Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-space-sm mt-space-md">
              <button
                onClick={cancelarConsulta}
                className="w-full h-11 rounded-lg bg-status-cancelada text-white font-title-sm text-title-sm font-semibold"
              >
                Sí, cancelar y eliminar
              </button>
              <button
                onClick={() => setConfirmandoCancelar(false)}
                className="w-full text-body-sm text-on-surface-variant hover:text-on-surface"
              >
                Volver a la consulta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConsultaClinica({ paciente, documents }) {
  const { addConsulta, deletePatient } = useClinica();
  const [formAbierto, setFormAbierto] = useState(false);
  const [confirmandoDuplicado, setConfirmandoDuplicado] = useState(false);

  const consultas = paciente.consultas || [];
  const borrador = consultas.find((c) => c.estado === "borrador") || null;
  const finalizadas = consultas
    .filter((c) => c.estado === "finalizada")
    .sort((a, b) => (a.fecha + a.hora < b.fecha + b.hora ? 1 : -1));

  function documentosDe(consultaId) {
    return documents.filter((d) => d.consultaId === consultaId && d.estado !== "reemplazado" && d.estado !== "anulado");
  }

  function crearBorrador() {
    const nuevo = {
      id: `cc-${paciente.id}-${Date.now()}`,
      fecha: HOY,
      hora: nowHHMM(),
      tipo: "Consulta",
      modalidad: "Box Clínico",
      citaId: null,
      etiquetas: [],
      ...CAMPOS_VACIOS,
      estado: "borrador",
      creadaAt: nowHHMM(),
      finalizadaAt: null,
    };
    addConsulta(paciente.id, nuevo);
    setFormAbierto(true);
  }

  function iniciarConsulta() {
    if (borrador) {
      setFormAbierto(true);
      return;
    }
    if (paciente.posibleDuplicado) {
      setConfirmandoDuplicado(true);
      return;
    }
    crearBorrador();
  }

  return (
    <section className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-headline-sm text-headline-sm text-primary">Línea de Tiempo Clínica</h2>
        {!formAbierto && (
          <button
            onClick={iniciarConsulta}
            className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">{borrador ? "edit_note" : "add"}</span>
            {borrador ? "Continuar Consulta en Borrador" : "Nueva Consulta"}
          </button>
        )}
      </div>

      {formAbierto && borrador && (
        <ConsultaForm
          key={borrador.id}
          paciente={paciente}
          borrador={borrador}
          onCerrar={() => setFormAbierto(false)}
        />
      )}

      {finalizadas.length === 0 && !borrador && (
        <p className="text-body-sm text-on-surface-variant">
          Sin consultas registradas todavía. Usa "Nueva Consulta" para comenzar el historial clínico de esta paciente.
        </p>
      )}

      <div className="flex flex-col gap-space-sm">
        {finalizadas.map((c) => (
          <ConsultaCard key={c.id} consulta={c} documentosVinculados={documentosDe(c.id)} />
        ))}
      </div>

      {confirmandoDuplicado && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setConfirmandoDuplicado(false)}>
          <div
            className="bg-surface-container-lowest rounded-xl shadow-xl max-w-sm w-full p-space-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-headline-sm text-headline-sm text-primary mb-space-sm">Posible perfil duplicado</h2>
            <p className="text-body-md text-on-surface-variant">
              Este perfil quedó marcado como posible coincidencia con otro registro al momento de la reserva. Verifica antes de
              continuar con el registro clínico.
            </p>
            <div className="flex flex-col gap-space-sm mt-space-md">
              <button
                onClick={() => {
                  setConfirmandoDuplicado(false);
                  crearBorrador();
                }}
                className="w-full h-11 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold"
              >
                Continuar de todas formas
              </button>
              <button
                onClick={() => deletePatient(paciente.id)}
                className="w-full h-11 rounded-lg border border-status-cancelada text-status-cancelada font-label-lg text-label-lg hover:bg-status-cancelada-bg"
              >
                Eliminar perfil duplicado
              </button>
              <button
                onClick={() => setConfirmandoDuplicado(false)}
                className="w-full text-body-sm text-on-surface-variant hover:text-on-surface"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
