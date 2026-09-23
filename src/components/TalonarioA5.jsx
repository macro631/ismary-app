import { useRef, useState } from "react";
import configuracion from "../data/configuracion_talonarios.json";
import "./TalonarioA5.css";

const formatoFecha = (valor = "") => valor.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3 / $2 / $1");
const milimetros = (valor) => `${valor}mm`;

function Dato({ area, valor, multilinea = false, pequeno = false }) {
  const [x, y, ancho, alto] = area;
  return (
    <span
      className={`talonario-data${multilinea ? " talonario-data--multiline" : ""}${pequeno ? " talonario-data--small" : ""}`}
      style={{ left: milimetros(x), top: milimetros(y), width: milimetros(ancho), height: milimetros(alto) }}
    >
      {valor || ""}
    </span>
  );
}

export default function TalonarioA5({ tipo, paciente, fechaDocumento, folio, domicilio, diagnostico, prescripcion, indicaciones, examenes = [], otros = "", observaciones = "" }) {
  const hojaRef = useRef(null);
  const [errorImpresion, setErrorImpresion] = useState("");
  const esReceta = tipo === "recipe";
  const campos = configuracion.layout[tipo];
  const documento = configuracion.documents[tipo];
  const otrosExamenes = otros.split(/\r?\n|;/).map((valor) => valor.trim()).filter(Boolean);
  const examenesImpresos = [...examenes, ...otrosExamenes];

  function imprimir() {
    const hoja = hojaRef.current;
    if (!hoja) return;
    const fondo = hoja.querySelector(".talonario-master");
    if (!fondo?.complete || !fondo.naturalWidth) {
      setErrorImpresion("El formato todavía se está cargando. Intenta de nuevo.");
      return;
    }
    const contenido = hoja.querySelectorAll(".talonario-data, .talonario-exam-list");
    if ([...contenido].some((elemento) => elemento.scrollHeight > elemento.clientHeight + 1 || elemento.scrollWidth > elemento.clientWidth + 1)) {
      setErrorImpresion("Hay contenido que no cabe en la hoja A5. Acórtalo antes de imprimir o guardar el PDF.");
      return;
    }
    setErrorImpresion("");
    window.print();
  }

  return (
    <section className="talonario-preview" aria-label={`Vista previa A5: ${documento.title}`}>
      <div className="talonario-preview-heading">
        <div>
          <h3>{esReceta ? "Receta" : "Solicitud de exámenes"}</h3>
          <p>Vista previa del formato definitivo A5</p>
        </div>
        <div className="talonario-preview-actions">
          <a href={`talonario/${documento.pdf}`} target="_blank" rel="noopener noreferrer">Formato en blanco</a>
          <button type="button" onClick={imprimir} className="talonario-print-button">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">print</span>
            Imprimir o guardar PDF
          </button>
        </div>
      </div>
      {errorImpresion && <p className="talonario-print-error" role="alert">{errorImpresion}</p>}
      <div className="talonario-scroll">
        <article
          ref={hojaRef}
          className="talonario-sheet"
          style={{ width: milimetros(configuracion.page.widthMm), height: milimetros(configuracion.page.heightMm), "--talonario-navy": configuracion.palette.navy, "--talonario-mauve": configuracion.palette.mauve }}
        >
          <img className="talonario-master" src={`talonario/${documento.backgroundPng}`} alt="" />
          <Dato area={campos.patient} valor={paciente.nombre} />
          <Dato area={campos.rut} valor={paciente.rut} />
          <Dato area={campos.age} valor={String(paciente.edad ?? "")} />
          <Dato area={campos.date} valor={formatoFecha(fechaDocumento)} />
          <Dato area={campos.patientAddress} valor={domicilio} />
          <Dato area={campos.folio} valor={folio} pequeno />
          {esReceta ? (
            <>
              <Dato area={configuracion.layout.recipe.diagnosis} valor={diagnostico} />
              <Dato area={configuracion.layout.recipe.prescription} valor={prescripcion} multilinea />
              <Dato area={configuracion.layout.recipe.indications} valor={indicaciones} multilinea />
            </>
          ) : (
            <>
              <Dato area={configuracion.layout.exams.birthDate} valor={formatoFecha(paciente.fechaNacimiento)} />
              <Dato area={configuracion.layout.exams.observations} valor={observaciones} />
              <div
                className="talonario-exam-list"
                style={{ left: milimetros(campos.examList[0]), top: milimetros(campos.examList[1]), width: milimetros(campos.examList[2]), height: milimetros(campos.examList[3]), gridTemplateColumns: `repeat(${configuracion.examList.columns}, minmax(0, 1fr))` }}
              >
                {examenesImpresos.map((examen, indice) => (
                  <span className="talonario-exam-item" key={`${examen}-${indice}`}>
                    {configuracion.examList.showCheckbox && <span className="talonario-exam-check" aria-hidden="true">✓</span>}
                    <span>{examen}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
