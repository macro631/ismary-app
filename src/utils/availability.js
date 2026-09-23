import { addDays, weekStart } from "./date";
import { HOY } from "./today";

const STORAGE_KEY = "ismary_availability_weeks";

// Por defecto se publican la semana actual y la siguiente, para que el
// portal de reserva no aparezca vacío la primera vez que se abre el
// prototipo; las semanas más lejanas quedan sin publicar hasta que Ismary
// las active desde Configuración.
function defaultPublishedWeeks() {
  const map = {};
  for (let i = 0; i < 2; i++) {
    map[weekStart(addDays(HOY, i * 7))] = true;
  }
  return map;
}

export function loadPublishedWeeks() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultPublishedWeeks();
  } catch {
    return defaultPublishedWeeks();
  }
}

export function savePublishedWeeks(map) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage no disponible (modo privado, etc.)
  }
}

export function isWeekPublished(map, iso) {
  return Boolean(map[weekStart(iso)]);
}
