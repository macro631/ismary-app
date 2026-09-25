export const DEFAULT_CONFIG = {
  nombre: "Ismary Ugalde Rojas", registroSis: "802617", direccion: "Box Centro Médico, La Serena",
  diasActivos: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
  horaInicio: "08:30", horaFin: "19:30",
  modalidadesActivas: ["Box Clínico", "Domicilio", "Teleconsulta"],
  timeoutInactividad: "20", respaldoAutomatico: true,
};

export function loadConfig() {
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(window.localStorage.getItem("ismary_config") || "{}") };
  } catch {
    return DEFAULT_CONFIG;
  }
}
