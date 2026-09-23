// Utilidades de RUT chileno: normalización, formato, validación del dígito
// verificador y enmascarado para mostrar datos de una paciente ya registrada
// sin exponerlos completos (ver plan.md §9.1-§9.2).

export function normalizeRut(rut) {
  return (rut || "").replace(/[^0-9kK]/g, "").toUpperCase();
}

export function formatRut(rut) {
  const clean = normalizeRut(rut);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${dv}`;
}

export function computeCheckDigit(body) {
  let sum = 0;
  let mult = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const rem = 11 - (sum % 11);
  if (rem === 11) return "0";
  if (rem === 10) return "K";
  return String(rem);
}

export function isValidRut(rut) {
  const clean = normalizeRut(rut);
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  return dv === computeCheckDigit(body);
}

export function sameRut(a, b) {
  return normalizeRut(a) === normalizeRut(b);
}

// ---- Enmascarado para mostrar en pantalla (nunca el dato completo) ----

export function maskRut(rut) {
  const formatted = formatRut(rut);
  const [body, dv] = formatted.split("-");
  const groups = body.split(".");
  const masked = groups.map((g, i) => (i === groups.length - 1 ? g : "•".repeat(g.length)));
  return `${masked.join(".")}-${dv}`;
}

// Enmascarado liviano: oculta solo el tramo central, deja prefijo/sufijo
// legibles para que el dato se sienta "autocompletado", no censurado.
export function maskPhone(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  const country = digits.slice(0, digits.length - 9); // ej: 56
  const rest = digits.slice(-9); // 9 dígitos: móvil chileno
  const prefix = rest.slice(0, 1);
  const middle = rest.slice(1, 5);
  const last = rest.slice(5);
  return `+${country} ${prefix} ${"•".repeat(middle.length)} ${last}`;
}

export function maskEmail(email) {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const visibleStart = user.slice(0, 2);
  const visibleEnd = user.length > 4 ? user.slice(-1) : "";
  const hidden = "•".repeat(Math.max(user.length - visibleStart.length - visibleEnd.length, 2));
  return `${visibleStart}${hidden}${visibleEnd}@${domain}`;
}

export function maskAddress(comuna) {
  return comuna ? `Dirección guardada · ${comuna}` : "Sin dirección registrada";
}

export function maskName(nombre) {
  if (!nombre) return "Paciente registrada";
  const initials = nombre
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join(".");
  return `${initials}.`;
}

// Un valor enmascarado nunca es un dato real que la paciente pudo haber
// tipeado (siempre contiene el punto medio "•"), así que sirve para saber
// si un campo "autocompletado" fue editado de verdad o se dejó tal cual.
export function isMaskedValue(value) {
  return !value || value.includes("•");
}
