import { useEffect, useRef, useState } from "react";
import { nowHHMM } from "../utils/today";

// Autoguardado con debounce: llama a `onSave(value)` `delay` ms después del
// último cambio, y devuelve la hora del último guardado para mostrarla en
// pantalla. No dispara nada en el primer render (solo ante cambios reales).
export function useDebouncedAutosave(value, onSave, delay = 900) {
  const [savedAt, setSavedAt] = useState(null);
  const timer = useRef(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSave(value);
      setSavedAt(nowHHMM());
    }, delay);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return savedAt;
}
