// Detección de posibles perfiles duplicados (ver plan.md §10.1): compara
// teléfono exacto, correo exacto, o nombre completo + fecha de nacimiento.
// Nunca se debe usar la dirección como identificador (distintas personas
// pueden compartir domicilio).
export function findPossibleDuplicate(patients, candidate, excludeId) {
  const phone = candidate.telefono?.replace(/\D/g, "");
  const email = candidate.email?.trim().toLowerCase();
  const nombre = candidate.nombre?.trim().toLowerCase();

  return (
    patients.find((p) => {
      if (p.id === excludeId) return false;
      const phoneMatch = phone && p.telefono?.replace(/\D/g, "") === phone;
      const emailMatch = email && p.email?.trim().toLowerCase() === email;
      const nameDobMatch =
        nombre &&
        candidate.fechaNacimiento &&
        p.nombre?.trim().toLowerCase() === nombre &&
        p.fechaNacimiento === candidate.fechaNacimiento;
      return phoneMatch || emailMatch || nameDobMatch;
    }) || null
  );
}
