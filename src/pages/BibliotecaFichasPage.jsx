import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClinica } from "../data/store";

const FILTROS = [
  { key: "gestantes", label: "Gestantes activas" },
  { key: "alertas", label: "Con alertas" },
  { key: "controles", label: "Controles periódicos" },
];

export default function BibliotecaFichasPage() {
  const { patients } = useClinica();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      const matchesQuery =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.rut.toLowerCase().includes(q) ||
        p.telefono.replace(/\s/g, "").includes(q.replace(/\s/g, ""));
      const matchesFiltro =
        !filtro ||
        (filtro === "gestantes" && p.gestante) ||
        (filtro === "alertas" && p.alertas.length > 0) ||
        (filtro === "controles" && !p.gestante);
      return matchesQuery && matchesFiltro;
    });
  }, [patients, query, filtro]);

  return (
    <div className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Biblioteca de Fichas Clínicas</h1>
        <p className="text-body-md text-on-surface-variant">Directorio de pacientes registradas en el sistema.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-space-sm md:items-center">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-on-surface-variant">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por RUT, nombre o teléfono"
            className="w-full h-11 pl-10 pr-4 bg-surface-container-lowest rounded-lg shadow-sm border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFiltro(null)}
            className={`px-space-sm py-1 rounded-full font-label-md text-label-md ${!filtro ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-secondary-container"}`}
          >
            Todas
          </button>
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-space-sm py-1 rounded-full font-label-md text-label-md ${filtro === f.key ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-secondary-container"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {filtered.map((p) => {
          const initials = p.nombre.split(" ").slice(0, 2).map((n) => n[0]).join("");
          return (
            <div key={p.id} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-11 h-11 rounded-full bg-brand-soft text-primary flex items-center justify-center font-semibold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-title-md text-title-md text-on-surface truncate">{p.nombre}</p>
                  <p className="text-body-sm text-on-surface-variant">{p.rut} · {p.edad} años</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.gestante && (
                  <span className="text-label-md font-label-md bg-status-reprogramada-bg text-status-reprogramada px-2 py-0.5 rounded-full">
                    Gestante
                  </span>
                )}
                {p.alertas.map((a) => (
                  <span key={a} className="text-label-md font-label-md bg-status-cancelada-bg text-status-cancelada px-2 py-0.5 rounded-full">
                    {a}
                  </span>
                ))}
                <span className="text-label-md font-label-md bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">
                  {p.prevision}
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant">{p.resumen}</p>
              <button
                onClick={() => navigate(`/fichas/${p.id}`)}
                className="mt-1 self-start flex items-center gap-1 text-primary font-label-lg text-label-lg font-semibold hover:underline"
              >
                Abrir Ficha
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-body-md text-on-surface-variant col-span-full text-center py-space-xl">
            No se encontraron pacientes con ese criterio.
          </p>
        )}
      </div>
    </div>
  );
}
