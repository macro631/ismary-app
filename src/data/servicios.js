export const MODALIDADES = {
  tele: { key: "tele", label: "Teleconsulta", valor: "Teleconsulta", icono: "videocam", desc: "Videollamada para prestaciones compatibles; puede requerirse una evaluación presencial.", dias: [1, 2, 3, 4, 5, 6], horas: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
  domicilio: { key: "domicilio", label: "A domicilio", valor: "Domicilio", icono: "home", desc: "Visita programada en La Serena o Coquimbo, según cobertura y traslado.", dias: [2, 4, 6], horas: ["09:00", "11:30", "14:00", "16:30"] },
  presencial: { key: "presencial", label: "Presencial", valor: "Box Clínico", icono: "apartment", desc: "Box de un tercero, solo cuando haya disponibilidad confirmada.", dias: [1, 3, 5], horas: ["09:00", "10:30", "12:00", "15:00", "16:30"] },
};

// Las duraciones variables reservan su máximo, para proteger la atención siguiente.
export const SERVICIOS = [
  { key: "diada", nombre: "Control Posparto de la Díada y Lactancia", duracion: "90 min", duracionMin: 90, arancel: "$55.000 – $65.000", icono: "family_restroom", descripcion: "Revisión de la recuperación posparto, el estado general del recién nacido y una toma de lactancia.", modalidades: ["domicilio", "presencial"] },
  { key: "lactancia", nombre: "Asesoría de Lactancia", duracion: "75–90 min", duracionMin: 90, arancel: "$45.000 – $55.000", icono: "child_care", descripcion: "Revisión de acople, postura, dolor y alimentación; orientación práctica según tu situación.", modalidades: ["domicilio", "tele"] },
  { key: "prenatal", nombre: "Control Prenatal de Bajo Riesgo", duracion: "60 min", duracionMin: 60, arancel: "$40.000 – $50.000", icono: "pregnant_woman", descripcion: "Control del embarazo de bajo riesgo con revisión de antecedentes, evaluación y orientación sobre próximos pasos.", modalidades: ["presencial", "domicilio"] },
  { key: "sexual", nombre: "Consulta Online de Salud Sexual y Reproductiva", duracion: "30–40 min", duracionMin: 40, arancel: "$18.000 – $25.000", icono: "health_and_safety", descripcion: "Orientación por videollamada sobre anticoncepción, prevención de ITS y otras consultas de salud sexual.", modalidades: ["tele"] },
];
