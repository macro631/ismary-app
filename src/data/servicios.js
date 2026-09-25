export const MODALIDADES = {
  tele: { key: "tele", label: "Teleconsulta", valor: "Teleconsulta", icono: "videocam", desc: "Por videollamada, desde donde estés.", dias: [1, 2, 3, 4, 5, 6], horas: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
  domicilio: { key: "domicilio", label: "A domicilio", valor: "Domicilio", icono: "home", desc: "Ismary te visita en La Serena o Coquimbo.", dias: [2, 4, 6], horas: ["09:00", "11:30", "14:00", "16:30"] },
  presencial: { key: "presencial", label: "Presencial", valor: "Box Clínico", icono: "apartment", desc: "En box clínico habilitado.", dias: [1, 3, 5], horas: ["09:00", "10:30", "12:00", "15:00", "16:30"] },
};

// Las duraciones variables reservan su máximo, para proteger la atención siguiente.
export const SERVICIOS = [
  { key: "diada", nombre: "Control Posparto de la Díada y Lactancia", duracion: "90 min", duracionMin: 90, arancel: "$55.000 – $65.000", icono: "family_restroom", descripcion: "Un espacio para acompañarte a ti y a tu bebé durante el posparto y la lactancia.", modalidades: ["domicilio", "presencial"] },
  { key: "lactancia", nombre: "Asesoría de Lactancia a Domicilio", duracion: "75–90 min", duracionMin: 90, arancel: "$45.000 – $55.000", icono: "child_care", descripcion: "Acompañamiento para conversar sobre tus dudas y necesidades durante la lactancia.", modalidades: ["domicilio", "tele"] },
  { key: "prenatal", nombre: "Control Prenatal de Bajo Riesgo", duracion: "60 min", duracionMin: 60, arancel: "$40.000 – $50.000", icono: "pregnant_woman", descripcion: "Seguimiento y orientación para acompañarte durante tu embarazo.", modalidades: ["presencial", "domicilio"] },
  { key: "sexual", nombre: "Consulta Online de Salud Sexual y Reproductiva", duracion: "30–40 min", duracionMin: 40, arancel: "$18.000 – $25.000", icono: "health_and_safety", descripcion: "Un espacio de conversación y orientación sobre tu salud sexual y reproductiva.", modalidades: ["tele"] },
];
