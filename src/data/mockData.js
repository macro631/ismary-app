// Datos de prueba para el prototipo. Los nombres y fechas replican los que ya
// aparecen en las capturas de la maqueta de Stitch (semana del 14-20 oct 2026)
// para que el prototipo se sienta continuo con el diseño original.

// Campos de información clínica permanente (plan.md §12.2): a diferencia de
// las notas de una consulta puntual, estos viven en el perfil de la
// paciente y no cambian en cada atención.
function infoPermanente(overrides = {}) {
  return {
    alergias: "",
    medicamentosHabituales: "",
    antecedentesMedicos: "",
    antecedentesQuirurgicos: "",
    antecedentesObstetricos: "",
    antecedentesFamiliares: "",
    ...overrides,
  };
}

export const initialPatients = [
  {
    id: "p-daniela-r",
    nombre: "Daniela Rojas Peña",
    rut: "16.234.567-2",
    edad: 29,
    fechaNacimiento: "1997-03-12",
    prevision: "Fonasa",
    telefono: "+56 9 8123 4567",
    email: "daniela.rojas@example.com",
    comuna: "Coquimbo",
    gestante: false,
    alertas: [],
    resumen: "Control posparto",
    ...infoPermanente({
      medicamentosHabituales: "Ácido fólico 1 mg/día",
      antecedentesObstetricos: "G1P1A0 · Parto vaginal 01-08-2026",
    }),
    consultas: [
      {
        id: "cc-daniela-1",
        fecha: "2026-10-14",
        hora: "08:30",
        tipo: "Control Posparto",
        modalidad: "Box Clínico",
        citaId: "c-1",
        etiquetas: ["Posparto"],
        motivo: "Control de puerperio a las 10 semanas post parto.",
        anamnesis: "Lactancia exclusiva en curso, sin dolor mamario. Ánimo estable.",
        evaluacion: "Involución uterina adecuada. Herida perineal sin signos de infección.",
        diagnostico: "Z39.2 — Control de rutina posparto",
        indicaciones: "Continuar lactancia a libre demanda. Mantener ácido fólico.",
        senalesAlarma: "Fiebre, sangrado abundante, dolor pélvico intenso o loquios con mal olor.",
        seguimiento: "Control ginecológico en 6 meses o antes si presenta síntomas.",
        observaciones: "",
        vitales: { pa: "110/70", fc: "76", peso: "61.2", au: "", lcf: "" },
        estado: "finalizada",
        creadaAt: "08:20",
        finalizadaAt: "08:55",
      },
    ],
  },
  {
    id: "p-paulina-sil",
    nombre: "Paulina Silva Contreras",
    rut: "17.845.221-5",
    edad: 31,
    fechaNacimiento: "1995-07-02",
    prevision: "Isapre",
    telefono: "+56 9 7654 3210",
    email: "paulina.silva@example.com",
    comuna: "La Serena",
    gestante: false,
    alertas: [],
    resumen: "Revisión de exámenes",
    ...infoPermanente(),
    consultas: [],
  },
  {
    id: "p-mariana-g",
    nombre: "Mariana González Ibáñez",
    rut: "15.998.432-K",
    edad: 34,
    fechaNacimiento: "1992-01-20",
    prevision: "Fonasa",
    telefono: "+56 9 6543 2109",
    email: "mariana.gonzalez@example.com",
    comuna: "La Serena",
    gestante: true,
    fur: "2026-05-10",
    alertas: ["Rh Negativo"],
    resumen: "Ingreso control prenatal",
    ...infoPermanente({ antecedentesObstetricos: "G2P1A0" }),
    consultas: [],
  },
  {
    id: "p-francisca",
    nombre: "Francisca Torres Muñoz",
    rut: "18.112.987-5",
    edad: 27,
    fechaNacimiento: "1999-09-15",
    prevision: "Isapre",
    telefono: "+56 9 5432 1098",
    email: "francisca.torres@example.com",
    comuna: "Coquimbo",
    gestante: false,
    alertas: [],
    resumen: "Evaluación anticoncepción",
    ...infoPermanente(),
    consultas: [],
  },
  {
    id: "p-valentina-castro",
    nombre: "Valentina Castro",
    rut: "19.334.221-3",
    edad: 26,
    fechaNacimiento: "2000-04-08",
    prevision: "Fonasa",
    telefono: "+56 9 4321 0987",
    email: "valentina.castro@example.com",
    comuna: "La Serena",
    gestante: true,
    fur: "2026-04-02",
    alertas: ["Alergia a Penicilina"],
    resumen: "Control prenatal",
    ...infoPermanente({ alergias: "Penicilina (rash cutáneo)", antecedentesObstetricos: "G1P0A0" }),
    consultas: [],
  },
  {
    id: "p-javiera-valdes",
    nombre: "Javiera Valdés Reyes",
    rut: "16.778.554-9",
    edad: 30,
    fechaNacimiento: "1996-06-30",
    prevision: "Isapre",
    telefono: "+56 9 3210 9876",
    email: "javiera.valdes@example.com",
    comuna: "La Serena",
    gestante: true,
    fur: "2026-06-01",
    alertas: [],
    resumen: "Taller de apego",
    ...infoPermanente(),
    consultas: [],
  },
  {
    id: "p-andrea-ri",
    nombre: "Andrea Riquelme Soto",
    rut: "17.223.998-6",
    edad: 24,
    fechaNacimiento: "2002-02-11",
    prevision: "Fonasa",
    telefono: "+56 9 2109 8765",
    email: "andrea.riquelme@example.com",
    comuna: "Coquimbo",
    gestante: false,
    alertas: [],
    resumen: "Orientación anticonceptiva",
    ...infoPermanente(),
    consultas: [],
  },
  {
    id: "p-beatriz-fig",
    nombre: "Beatriz Figueroa Lagos",
    rut: "15.667.334-K",
    edad: 33,
    fechaNacimiento: "1993-11-05",
    prevision: "Isapre",
    telefono: "+56 9 1098 7654",
    email: "beatriz.figueroa@example.com",
    comuna: "La Serena",
    gestante: true,
    fur: "2026-07-14",
    alertas: [],
    resumen: "Preparación para el parto",
    ...infoPermanente({ antecedentesObstetricos: "G3P2A0 · 2 partos vaginales previos" }),
    consultas: [],
  },
  {
    id: "p-camila-soto",
    nombre: "Camila Soto Bravo",
    rut: "18.556.773-7",
    edad: 28,
    fechaNacimiento: "1998-08-22",
    prevision: "Fonasa",
    telefono: "+56 9 9812 3456",
    email: "camila.soto@example.com",
    comuna: "La Serena",
    gestante: false,
    alertas: [],
    resumen: "Asesoría de lactancia",
    ...infoPermanente(),
    consultas: [],
  },
  {
    id: "p-sofia-henriquez",
    nombre: "Sofía Henríquez Paredes",
    rut: "17.990.112-9",
    edad: 25,
    fechaNacimiento: "2001-12-18",
    prevision: "Isapre",
    telefono: "+56 9 8765 4321",
    email: "sofia.henriquez@example.com",
    comuna: "Coquimbo",
    gestante: false,
    alertas: [],
    resumen: "Toma PAP",
    ...infoPermanente(),
    consultas: [],
  },
  {
    id: "p-constanza-vial",
    nombre: "Constanza Vial R.",
    rut: "19.001.223-9",
    edad: 22,
    fechaNacimiento: "2004-03-03",
    prevision: "Fonasa",
    telefono: "+56 9 7712 3344",
    email: "constanza.vial@example.com",
    comuna: "La Serena",
    gestante: true,
    fur: "2026-08-20",
    alertas: [],
    resumen: "Control prenatal inicial (8 sem)",
    ...infoPermanente({ antecedentesObstetricos: "G1P0A0" }),
    consultas: [],
  },
  {
    id: "p-isidora-carrasco",
    nombre: "Isidora Carrasco L.",
    rut: "16.887.665-3",
    edad: 29,
    fechaNacimiento: "1997-05-27",
    prevision: "Isapre",
    telefono: "+56 9 6623 1122",
    email: "isidora.carrasco@example.com",
    comuna: "La Serena",
    gestante: false,
    alertas: [],
    resumen: "Asesoría destete respetuoso",
    ...infoPermanente(),
    consultas: [],
  },
  {
    id: "p-macarena-pavez",
    nombre: "Macarena Pavez N.",
    rut: "15.334.887-1",
    edad: 36,
    fechaNacimiento: "1990-10-09",
    prevision: "Fonasa",
    telefono: "+56 9 5511 8899",
    email: "macarena.pavez@example.com",
    comuna: "Coquimbo",
    gestante: false,
    alertas: [],
    resumen: "Control ginecológico anual",
    ...infoPermanente(),
    consultas: [],
  },
  {
    id: "p-catalina-munoz",
    nombre: "Catalina Ignacia Muñoz Vera",
    rut: "18.423.891-8",
    edad: 29,
    fechaNacimiento: "1997-01-15",
    prevision: "Fonasa B",
    telefono: "+56 9 8412 0921",
    email: "catamunoz@example.com",
    comuna: "La Serena",
    gestante: true,
    fur: "2026-02-25",
    alertas: [],
    resumen: "Control prenatal 32+4 sem",
    ...infoPermanente({ antecedentesObstetricos: "G1P0A0" }),
    consultas: [
      {
        id: "cc-catalina-1",
        fecha: "2026-10-15",
        hora: "16:00",
        tipo: "Control Prenatal",
        modalidad: "Box Clínico",
        citaId: null,
        etiquetas: ["Prenatal", "Requiere seguimiento"],
        motivo: "Control prenatal 32+4 semanas.",
        anamnesis: "Refiere edema leve de tobillos al final del día. Movimientos fetales presentes y activos.",
        evaluacion: "PA en rango normal alto. Altura uterina acorde a edad gestacional.",
        diagnostico: "O36.5 — Sospecha de RCIU / control de tercer trimestre",
        indicaciones: "Reposo relativo, control de PA en casa 2 veces al día.",
        senalesAlarma: "Cefalea intensa, fosfenos, dolor epigástrico, disminución de movimientos fetales.",
        seguimiento: "Revisión de exámenes solicitados en próxima consulta.",
        observaciones: "Se solicitan exámenes de tercer trimestre (ver documentos asociados).",
        vitales: { pa: "128/82", fc: "82", peso: "68.4", au: "31", lcf: "148" },
        estado: "finalizada",
        creadaAt: "15:45",
        finalizadaAt: "16:20",
      },
    ],
  },
];

export const initialAppointments = [
  { id: "c-1", pacienteId: "p-daniela-r", fecha: "2026-10-14", horaInicio: "08:30", horaFin: "09:15", tipo: "Control Posparto", modalidad: "Box Clínico", estado: "atendida" },
  { id: "c-2", pacienteId: "p-mariana-g", fecha: "2026-10-14", horaInicio: "11:30", horaFin: "12:30", tipo: "Ingreso Control Prenatal", modalidad: "Box Clínico", estado: "confirmada" },
  { id: "c-3", pacienteId: "p-paulina-sil", fecha: "2026-10-15", horaInicio: "10:00", horaFin: "10:45", tipo: "Revisión de Exámenes", modalidad: "Teleconsulta", estado: "confirmada" },
  { id: "c-4", pacienteId: "p-francisca", fecha: "2026-10-15", horaInicio: "15:00", horaFin: "15:45", tipo: "Evaluación Anticoncepción", modalidad: "Box Clínico", estado: "reprogramada" },
  { id: "c-5", pacienteId: "p-valentina-castro", fecha: "2026-10-16", horaInicio: "09:00", horaFin: "10:00", tipo: "Control Prenatal", modalidad: "Box Clínico", estado: "confirmada", ubicacion: "Box Centro Médico 204" },
  { id: "c-6", pacienteId: "p-camila-soto", fecha: "2026-10-16", horaInicio: "10:30", horaFin: "12:00", tipo: "Asesoría Lactancia", modalidad: "Domicilio", estado: "pendiente", ubicacion: "Domicilio (Providencia)" },
  { id: "c-7", pacienteId: "p-sofia-henriquez", fecha: "2026-10-16", horaInicio: "15:00", horaFin: "15:45", tipo: "Toma PAP + Control Ginecológico", modalidad: "Box Clínico", estado: "confirmada", ubicacion: "Box 204" },
  { id: "c-8", pacienteId: "p-javiera-valdes", fecha: "2026-10-17", horaInicio: "09:30", horaFin: "10:30", tipo: "Taller de Apego", modalidad: "Box Clínico", estado: "confirmada" },
  { id: "c-9", pacienteId: "p-catalina-munoz", fecha: "2026-10-17", horaInicio: "16:00", horaFin: "17:30", tipo: "Monitoreo Fetal", modalidad: "Domicilio", estado: "confirmada" },
  { id: "c-10", pacienteId: "p-andrea-ri", fecha: "2026-10-18", horaInicio: "11:00", horaFin: "11:45", tipo: "Orientación Anticonceptiva", modalidad: "Teleconsulta", estado: "confirmada" },
  { id: "c-11", pacienteId: "p-beatriz-fig", fecha: "2026-10-19", horaInicio: "09:00", horaFin: "10:00", tipo: "Preparación para el Parto", modalidad: "Box Clínico", estado: "confirmada" },
];

// Solicitudes web pendientes de confirmación (panel lateral del calendario)
export const initialWebRequests = [
  { id: "w-1", pacienteId: "p-constanza-vial", tipo: "Control Prenatal Inicial (8 sem)", fecha: "2026-10-17", hora: "11:30", modalidad: "Box Centro Médico" },
  { id: "w-2", pacienteId: "p-isidora-carrasco", tipo: "Asesoría Destete Respetuoso", fecha: "2026-10-18", hora: "16:00", modalidad: "Teleconsulta" },
  { id: "w-3", pacienteId: "p-macarena-pavez", tipo: "Control Ginecológico Anual", fecha: "2026-10-19", hora: "11:00", modalidad: "Box Centro Médico" },
];

export const examenesCatalogo = [
  { grupo: "Laboratorio General y Tamizaje Perinatal", items: ["Hemograma + Plaquetas", "Perfil Bioquímico / Hepático", "Sedimento de Orina + Urocultivo", "Test ITS (VIH, VDRL, HBsAg)", "PTGO (Sobrecarga de Glucosa)", "Coombs Indirecto", "PAP / Citología Cervicovaginal en Base Líquida"] },
  { grupo: "Pruebas Específicas, Hormonales y Cultivos", items: ["Cultivo Vaginorectal SGB", "Perfil Tiroideo (TSH + T4L)", "β-hCG Cuantitativa"] },
  { grupo: "Ultrasonido & Diagnóstico por Imágenes", items: ["Ecografía Doppler Feto-Placentaria", "Ecografía Obstétrica III Trimestre (Estimación PFE)", "Ecografía Morfológica Detallada", "Ecografía Ginecológica Transvaginal", "Mamografía Bilateral con Proyecciones Axilares", "Ecotomografía Mamaria Bilateral"] },
];

export const initialDocuments = [
  {
    id: "d-1",
    pacienteId: "p-catalina-munoz",
    tipo: "solicitud-examenes",
    consultaId: "cc-catalina-1",
    folio: "ORD-2026-0842",
    fecha: "2026-10-15",
    estado: "borrador",
    items: [
      "Hemograma + Plaquetas",
      "Perfil Bioquímico / Hepático",
      "Sedimento de Orina + Urocultivo",
      "Test ITS (VIH, VDRL, HBsAg)",
      "Cultivo Vaginorectal SGB",
      "Ecografía Doppler Feto-Placentaria",
      "Ecografía Obstétrica III Trimestre (Estimación PFE)",
    ],
    otros: "Ferritina sérica + Cinética de Hierro",
    diagnostico: "O36.5 / Z34.8",
    justificacion:
      "Control Prenatal 32+4 sem - Sospecha de RCIU / Monitoreo Doppler feto-placentario y tamizaje de rutina de tercer trimestre.",
    observaciones: "Ayuno de 8 hrs. Traer informes y trazados previos.",
  },
];

// Sube este número cada vez que cambie la forma de los datos de prueba
// (ej. se corrigieron los RUT). Si no coincide con lo guardado, se descarta
// el localStorage viejo para que el navegador no arrastre datos obsoletos.
const SEED_VERSION = "5";

function ensureFreshSeed() {
  try {
    const stored = window.localStorage.getItem("ismary_seed_version");
    if (stored !== SEED_VERSION) {
      ["ismary_patients", "ismary_appointments", "ismary_web_requests", "ismary_documents"].forEach((k) =>
        window.localStorage.removeItem(k)
      );
      window.localStorage.setItem("ismary_seed_version", SEED_VERSION);
    }
  } catch {
    // localStorage no disponible (modo privado, etc.)
  }
}

ensureFreshSeed();

export function loadPatients() {
  return readOrSeed("ismary_patients", initialPatients);
}
export function loadAppointments() {
  return readOrSeed("ismary_appointments", initialAppointments);
}
export function loadWebRequests() {
  return readOrSeed("ismary_web_requests", initialWebRequests);
}
export function loadDocuments() {
  return readOrSeed("ismary_documents", initialDocuments);
}

function readOrSeed(key, seed) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  } catch {
    return seed;
  }
}
