import { useState } from "react";
import { useClinica } from "../data/store";
import configuracionTalonarios from "../data/configuracion_talonarios.json";
import TalonarioA5 from "./TalonarioA5";
import StatusBadge from "./StatusBadge";
import { HOY } from "../utils/today";

// Emisión de recetas y solicitudes de exámenes, embebida dentro de la Ficha
// Clínica: nunca se navega fuera de la ficha de la paciente para emitir un
// documento, se abre/cierra en la misma pantalla.
export default function DocumentosEmision({ paciente, consultaId = null }) {
  const [tab, setTab] = useState("examenes"); // receta | examenes
  const { documents, upsertDocument, emitirDocumento, anularDocumento } = useClinica();
  const acciones = { upsertDocument, emitirDocumento, anularDocumento, consultaId };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md">
      <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1 self-start max-w-full overflow-x-auto">
        {[
          { key: "examenes", label: "Solicitud de Exámenes", icon: "lab_research" },
          { key: "receta", label: "Receta", icon: "prescriptions" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-space-md py-1.5 rounded-md font-label-lg text-label-lg whitespace-nowrap transition-colors ${
              tab === t.key ? "bg-surface-container-lowest text-primary shadow-sm font-semibold" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "examenes" ? (
        <SolicitudExamenes paciente={paciente} documents={documents} {...acciones} />
      ) : (
        <RecetaDigital paciente={paciente} documents={documents} {...acciones} />
      )}
    </div>
  );
}

// Un documento se considera "vigente" mientras no haya sido reemplazado por
// una versión corregida ni anulado; esos dos estados solo quedan en el
// historial. Entre varios vigentes (no debería pasar, pero por si acaso)
// se toma el más reciente por fecha.
function useDocumentoVigente(documents, pacienteId, tipo) {
  const historial = documents
    .filter((d) => d.pacienteId === pacienteId && d.tipo === tipo)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const vigente = historial.find((d) => d.estado !== "reemplazado" && d.estado !== "anulado") || null;
  const anteriores = historial.filter((d) => d !== vigente);
  return { vigente, anteriores };
}

// Cuenta regresiva de caracteres para campos que se imprimen tal cual, en
// una sola línea, dentro del talonario A5: evita que el botón de imprimir
// se bloquee después de escribir (el límite refleja lo que realmente cabe
// en el ancho impreso a la tipografía del talonario).
function ContadorCaracteres({ value, max }) {
  const restantes = max - value.length;
  return (
    <p className={`text-body-sm ${restantes < 10 ? "text-status-cancelada" : "text-on-surface-variant"}`}>
      {restantes} caracteres disponibles para que quepa en una línea del talonario impreso.
    </p>
  );
}

function nuevoFolio(prefix) {
  return `${prefix}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

// Encapsula todo el ciclo de vida borrador → emitido/entregado-fisico →
// (corregir → reemplazado) | anulado, compartido por Solicitud de Exámenes
// y Receta Digital: solo cambian los campos propios de cada documento, que
// el llamador pasa a `guardar`.
function useDocumentoVersionado({ documents, paciente, tipo, idPrefix, folioPrefix, consultaId, upsertDocument, emitirDocumento, anularDocumento }) {
  const { vigente, anteriores } = useDocumentoVigente(documents, paciente.id, tipo);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");

  const finalizado = Boolean(vigente && vigente.estado !== "borrador");
  const bloqueado = finalizado && !corrigiendo;

  function guardar(nuevoEstado, campos) {
    if (nuevoEstado === "borrador") {
      upsertDocument({
        id: vigente?.id || `d-${paciente.id}-${idPrefix}`,
        pacienteId: paciente.id,
        tipo,
        consultaId: consultaId ?? vigente?.consultaId ?? null,
        folio: vigente?.folio || nuevoFolio(folioPrefix),
        fecha: HOY,
        estado: "borrador",
        ...campos,
      });
      return;
    }
    const esCorreccion = corrigiendo && finalizado;
    emitirDocumento({
      id: esCorreccion ? `d-${paciente.id}-${idPrefix}-${Date.now()}` : vigente?.id || `d-${paciente.id}-${idPrefix}`,
      pacienteId: paciente.id,
      tipo,
      consultaId: consultaId ?? vigente?.consultaId ?? null,
      folio: esCorreccion ? nuevoFolio(folioPrefix) : vigente?.folio || nuevoFolio(folioPrefix),
      fecha: HOY,
      estado: nuevoEstado,
      ...campos,
      ...(esCorreccion ? { reemplazaAId: vigente.id } : {}),
    });
    setCorrigiendo(false);
  }

  function confirmarAnulacion() {
    anularDocumento(vigente.id, motivoAnulacion);
    setAnulando(false);
    setMotivoAnulacion("");
  }

  return {
    vigente,
    anteriores,
    corrigiendo,
    setCorrigiendo,
    anulando,
    setAnulando,
    motivoAnulacion,
    setMotivoAnulacion,
    bloqueado,
    guardar,
    confirmarAnulacion,
  };
}

function HistorialVersiones({ anteriores }) {
  const [abierto, setAbierto] = useState(false);
  if (anteriores.length === 0) return null;
  return (
    <div className="border-t border-surface-container pt-space-sm">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="text-body-sm text-on-surface-variant hover:text-primary flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[16px]">history</span>
        Ver versiones anteriores ({anteriores.length})
        <span className="material-symbols-outlined text-[16px]">{abierto ? "expand_less" : "expand_more"}</span>
      </button>
      {abierto && (
        <div className="mt-space-sm flex flex-col gap-1.5">
          {anteriores.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 text-body-sm">
              <span className="text-on-surface-variant">Folio {d.folio} · {d.fecha}</span>
              <StatusBadge estado={d.estado} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BarraDocumentoVigente({ vigente, corrigiendo, onCorregir, anulando, onToggleAnular, motivo, onMotivoChange, onConfirmarAnulacion }) {
  return (
    <div className="border border-surface-container rounded-lg p-space-sm flex flex-col gap-space-sm bg-surface-container-low">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge estado={vigente.estado} />
          <span className="text-body-sm text-on-surface-variant">Folio {vigente.folio}</span>
        </div>
        {!corrigiendo && (
          <div className="flex items-center gap-2">
            <button onClick={onCorregir} className="text-label-lg font-label-lg text-primary hover:underline">
              Corregir esta versión
            </button>
            <button onClick={onToggleAnular} className="text-label-lg font-label-lg text-status-cancelada hover:underline">
              Anular
            </button>
          </div>
        )}
      </div>
      {anulando && (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={motivo}
            onChange={(e) => onMotivoChange(e.target.value)}
            rows={2}
            placeholder="Motivo de la anulación (ej: error de digitación, solicitado por la paciente)..."
            className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={onConfirmarAnulacion}
              disabled={!motivo.trim()}
              className="px-space-md py-1.5 rounded-lg bg-status-cancelada text-white font-label-lg text-label-lg disabled:opacity-40"
            >
              Confirmar anulación
            </button>
            <button onClick={onToggleAnular} className="text-label-lg font-label-lg text-on-surface-variant hover:underline">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SolicitudExamenes({ paciente, documents, consultaId, upsertDocument, emitirDocumento, anularDocumento }) {
  const {
    vigente,
    anteriores,
    corrigiendo,
    setCorrigiendo,
    anulando,
    setAnulando,
    motivoAnulacion,
    setMotivoAnulacion,
    bloqueado,
    guardar,
    confirmarAnulacion,
  } = useDocumentoVersionado({
    documents,
    paciente,
    tipo: "solicitud-examenes",
    idPrefix: "examenes",
    folioPrefix: "ORD-2026",
    consultaId,
    upsertDocument,
    emitirDocumento,
    anularDocumento,
  });

  const [items, setItems] = useState(vigente?.items || []);
  const [otros, setOtros] = useState(vigente?.otros || "");
  const [diagnostico, setDiagnostico] = useState(vigente?.diagnostico || "");
  const [justificacion, setJustificacion] = useState(vigente?.justificacion || "");
  const [observaciones, setObservaciones] = useState(vigente?.observaciones || "");
  const [domicilioPaciente, setDomicilioPaciente] = useState(vigente?.domicilioPaciente || paciente.domicilio || "");
  const catalogo = configuracionTalonarios.examCatalog;
  const opcionesCatalogo = new Set(catalogo.flatMap((grupo) => grupo.exams));
  const opcionesAnteriores = items.filter((item) => !opcionesCatalogo.has(item));

  function toggleItem(item) {
    if (bloqueado) return;
    setItems((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  }

  function handleGuardar(nuevoEstado) {
    guardar(nuevoEstado, { items, otros, diagnostico, justificacion, observaciones, domicilioPaciente });
  }

  const folio = vigente?.folio || "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter-desktop">
      <div className="flex flex-col gap-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <h2 className="font-headline-sm text-headline-sm text-primary">Exámenes solicitados</h2>
        </div>

        {vigente && (
          <BarraDocumentoVigente
            vigente={vigente}
            corrigiendo={corrigiendo}
            onCorregir={() => setCorrigiendo(true)}
            anulando={anulando}
            onToggleAnular={() => setAnulando((v) => !v)}
            motivo={motivoAnulacion}
            onMotivoChange={setMotivoAnulacion}
            onConfirmarAnulacion={confirmarAnulacion}
          />
        )}

        <div className="border border-surface-container rounded-lg p-space-sm max-h-[340px] overflow-y-auto flex flex-col gap-space-sm">
          {opcionesAnteriores.length > 0 && (
            <div>
              <p className="font-title-sm text-title-sm text-on-surface mb-space-xs">Seleccionados en una versión anterior</p>
              {opcionesAnteriores.map((item) => (
                <label key={item} className="flex items-center gap-2 text-body-sm p-1.5">
                  <input type="checkbox" disabled={bloqueado} checked onChange={() => toggleItem(item)} className="accent-primary w-4 h-4" />
                  {item}
                </label>
              ))}
            </div>
          )}

          {catalogo.map((grupo) => (
            <div key={grupo.category}>
              <p className="font-title-sm text-title-sm text-on-surface mb-space-xs">{grupo.category}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {grupo.exams.map((item) => (
                  <label key={item} className={`flex items-center gap-2 text-body-sm p-1.5 rounded-lg hover:bg-surface-container-low ${bloqueado ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                    <input type="checkbox" disabled={bloqueado} checked={items.includes(item)} onChange={() => toggleItem(item)} className="accent-primary w-4 h-4" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <label className="font-label-lg text-label-lg text-on-surface font-medium">Otros exámenes (uno por línea)</label>
          <textarea disabled={bloqueado} value={otros} onChange={(e) => setOtros(e.target.value)} rows={2} className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60" />
        </div>
        <div className="space-y-1">
          <label className="font-label-lg text-label-lg text-on-surface font-medium">Domicilio de la paciente</label>
          <input disabled={bloqueado} maxLength={62} value={domicilioPaciente} onChange={(e) => setDomicilioPaciente(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60" />
          <ContadorCaracteres value={domicilioPaciente} max={62} />
        </div>
        <div className="space-y-1">
          <label className="font-label-lg text-label-lg text-on-surface font-medium">Diagnóstico de sospecha (CIE-10)</label>
          <input disabled={bloqueado} value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60" />
        </div>
        <div className="space-y-1">
          <label className="font-label-lg text-label-lg text-on-surface font-medium">Justificación clínica</label>
          <textarea disabled={bloqueado} value={justificacion} onChange={(e) => setJustificacion(e.target.value)} rows={2} className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60" />
        </div>
        <div className="space-y-1">
          <label className="font-label-lg text-label-lg text-on-surface font-medium">Observaciones para el talonario A5</label>
          <textarea disabled={bloqueado} maxLength={80} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60" />
          <ContadorCaracteres value={observaciones} max={80} />
        </div>
        <p className="text-body-sm text-on-surface-variant">El diagnóstico y la justificación quedan registrados en la ficha. En el talonario aparecen los exámenes y las observaciones.</p>

        {!bloqueado && (
          <>
            {corrigiendo && (
              <p className="text-body-sm text-status-reprogramada">
                Estás corrigiendo el folio {vigente.folio}. Al emitir, esa versión quedará marcada como reemplazada (se conserva en el historial).
              </p>
            )}
            <div className="flex flex-wrap items-center gap-space-sm pt-space-sm">
              <button onClick={() => handleGuardar("borrador")} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high">
                Guardar Borrador
              </button>
              <button onClick={() => handleGuardar("emitido")} className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-strong flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">draw</span>
                Firmar y Emitir Solicitud
              </button>
              <button onClick={() => handleGuardar("entregado-fisico")} className="px-space-md py-2 rounded-lg border border-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                Registrar Entrega Física
              </button>
            </div>
          </>
        )}

        <HistorialVersiones anteriores={anteriores} />
      </div>

      <TalonarioA5
        tipo="exams"
        paciente={paciente}
        fechaDocumento={vigente?.fecha || HOY}
        folio={folio}
        domicilio={domicilioPaciente}
        examenes={items}
        otros={otros}
        observaciones={observaciones}
      />
    </div>
  );
}

function RecetaDigital({ paciente, documents, consultaId, upsertDocument, emitirDocumento, anularDocumento }) {
  const {
    vigente,
    anteriores,
    corrigiendo,
    setCorrigiendo,
    anulando,
    setAnulando,
    motivoAnulacion,
    setMotivoAnulacion,
    bloqueado,
    guardar,
    confirmarAnulacion,
  } = useDocumentoVersionado({
    documents,
    paciente,
    tipo: "receta",
    idPrefix: "receta",
    folioPrefix: "RX-2026",
    consultaId,
    upsertDocument,
    emitirDocumento,
    anularDocumento,
  });

  const [medicamentos, setMedicamentos] = useState(vigente?.medicamentos || [{ dci: "", dosis: "", posologia: "", dias: "" }]);
  const [diagnostico, setDiagnostico] = useState(vigente?.diagnostico || "");
  const [observaciones, setObservaciones] = useState(vigente?.observaciones || "");
  const [domicilioPaciente, setDomicilioPaciente] = useState(vigente?.domicilioPaciente || paciente.domicilio || "");

  function updateMed(i, key, value) {
    if (bloqueado) return;
    setMedicamentos((prev) => prev.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)));
  }
  function addMed() {
    setMedicamentos((prev) => [...prev, { dci: "", dosis: "", posologia: "", dias: "" }]);
  }
  function removeMed(i) {
    setMedicamentos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleGuardar(nuevoEstado) {
    guardar(nuevoEstado, { medicamentos, diagnostico, observaciones, domicilioPaciente });
  }

  const folio = vigente?.folio || "";
  const prescripcion = medicamentos
    .filter((medicamento) => medicamento.dci.trim())
    .map((medicamento) => [medicamento.dci, medicamento.dosis, medicamento.posologia, medicamento.dias && `${medicamento.dias} días`].filter(Boolean).join(" · "))
    .join("\n");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter-desktop">
      <div className="flex flex-col gap-space-md">
        <h2 className="font-headline-sm text-headline-sm text-primary">Indicación de Medicamentos</h2>

        {vigente && (
          <BarraDocumentoVigente
            vigente={vigente}
            corrigiendo={corrigiendo}
            onCorregir={() => setCorrigiendo(true)}
            anulando={anulando}
            onToggleAnular={() => setAnulando((v) => !v)}
            motivo={motivoAnulacion}
            onMotivoChange={setMotivoAnulacion}
            onConfirmarAnulacion={confirmarAnulacion}
          />
        )}

        {medicamentos.map((m, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end border-b border-surface-container pb-space-sm">
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <label className="text-label-md font-label-md text-on-surface-variant">DCI / Medicamento</label>
              <input disabled={bloqueado} value={m.dci} onChange={(e) => updateMed(i, "dci", e.target.value)} placeholder="Ácido fólico" className="w-full h-9 px-2 bg-surface-container-low rounded-lg text-body-sm disabled:opacity-60" />
            </div>
            <div className="space-y-1">
              <label className="text-label-md font-label-md text-on-surface-variant">Dosis</label>
              <input disabled={bloqueado} value={m.dosis} onChange={(e) => updateMed(i, "dosis", e.target.value)} placeholder="1 mg" className="w-full h-9 px-2 bg-surface-container-low rounded-lg text-body-sm disabled:opacity-60" />
            </div>
            <div className="space-y-1">
              <label className="text-label-md font-label-md text-on-surface-variant">Posología</label>
              <input disabled={bloqueado} value={m.posologia} onChange={(e) => updateMed(i, "posologia", e.target.value)} placeholder="1 vez al día" className="w-full h-9 px-2 bg-surface-container-low rounded-lg text-body-sm disabled:opacity-60" />
            </div>
            <div className="space-y-1">
              <label className="text-label-md font-label-md text-on-surface-variant">Días</label>
              <input disabled={bloqueado} value={m.dias} onChange={(e) => updateMed(i, "dias", e.target.value)} placeholder="30" className="w-full h-9 px-2 bg-surface-container-low rounded-lg text-body-sm disabled:opacity-60" />
            </div>
            {!bloqueado && (
              <button onClick={() => removeMed(i)} className="text-status-cancelada text-body-sm hover:underline">Quitar</button>
            )}
          </div>
        ))}
        {!bloqueado && (
          <button onClick={addMed} className="self-start text-primary font-label-lg text-label-lg hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Agregar medicamento
          </button>
        )}

        <div className="space-y-1">
          <label className="font-label-lg text-label-lg text-on-surface font-medium">Diagnóstico (CIE-10)</label>
          <input disabled={bloqueado} maxLength={65} value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60" />
          <ContadorCaracteres value={diagnostico} max={65} />
        </div>
        <div className="space-y-1">
          <label className="font-label-lg text-label-lg text-on-surface font-medium">Domicilio de la paciente</label>
          <input disabled={bloqueado} maxLength={44} value={domicilioPaciente} onChange={(e) => setDomicilioPaciente(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60" />
          <ContadorCaracteres value={domicilioPaciente} max={44} />
        </div>
        <div className="space-y-1">
          <label className="font-label-lg text-label-lg text-on-surface font-medium">Indicaciones para el talonario A5</label>
          <textarea disabled={bloqueado} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60" />
        </div>

        {!bloqueado && (
          <>
            {corrigiendo && (
              <p className="text-body-sm text-status-reprogramada">
                Estás corrigiendo el folio {vigente.folio}. Al emitir, esa versión quedará marcada como reemplazada (se conserva en el historial).
              </p>
            )}
            <div className="flex flex-wrap items-center gap-space-sm pt-space-sm">
              <button onClick={() => handleGuardar("borrador")} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high">
                Guardar Borrador
              </button>
              <button onClick={() => handleGuardar("emitido")} className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-strong flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">draw</span>
                Firmar y Emitir Receta
              </button>
              <button onClick={() => handleGuardar("entregado-fisico")} className="px-space-md py-2 rounded-lg border border-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                Registrar Entrega Física
              </button>
            </div>
          </>
        )}

        <HistorialVersiones anteriores={anteriores} />
      </div>

      <TalonarioA5
        tipo="recipe"
        paciente={paciente}
        fechaDocumento={vigente?.fecha || HOY}
        folio={folio}
        domicilio={domicilioPaciente}
        diagnostico={diagnostico}
        prescripcion={prescripcion}
        indicaciones={observaciones}
      />
    </div>
  );
}
