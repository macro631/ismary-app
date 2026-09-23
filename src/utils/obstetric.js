import { parseISODate, toISODate } from "./date";
import { HOY } from "./today";

// Calculadora obstétrica simple: Edad Gestacional (a partir de FUM) y Fecha
// Probable de Parto por Regla de Naegele (FUM + 280 días).
export function calcularEdadGestacional(furIso, referenciaIso) {
  if (!furIso) return null;
  const fur = parseISODate(furIso);
  const ref = parseISODate(referenciaIso || HOY);
  const diffDias = Math.floor((ref - fur) / 86400000);
  if (diffDias < 0) return null;
  const semanas = Math.floor(diffDias / 7);
  const dias = diffDias % 7;
  return { semanas, dias, texto: `${semanas}+${dias} sem` };
}

export function calcularFPP(furIso) {
  if (!furIso) return null;
  const fur = parseISODate(furIso);
  const fpp = new Date(fur);
  fpp.setDate(fpp.getDate() + 280);
  return toISODate(fpp);
}
