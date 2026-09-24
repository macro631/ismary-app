import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClinica } from "../data/store";
import HojaTalonario from "../components/HojaTalonario";

export default function LoginPage() {
  const { login } = useClinica();
  const navigate = useNavigate();
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null); // null | "checking"

  function handleSubmit(e) {
    e.preventDefault();
    setStatus("checking");
    setTimeout(() => {
      login(rut || "15.420.918-K");
      navigate("/calendario");
    }, 500);
  }

  return (
    <main className="min-h-screen bg-brand-soft flex items-center justify-center p-margin relative overflow-hidden">

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center gap-1 mb-1">
          <div className="w-[var(--login-icon-shell)] h-[var(--login-icon-shell)] rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center p-4">
            <img src="logo/icono-color.svg" alt="Isotipo Ismary Ugalde" className="w-full h-full object-contain" />
          </div>
          <img
            src="logo/nombre-color.svg"
            alt="Ismary Ugalde Rojas"
            className="h-[var(--login-wordmark-h)] w-auto object-contain"
            style={{ mixBlendMode: "multiply" }}
          />
        </div>

        <HojaTalonario>
        <div className="p-space-lg">
          <h1 className="font-headline-md text-headline-md text-primary text-center mb-1">Bienvenida</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant text-center mb-space-lg">
            Ingresa a tu calendario y fichas clínicas
          </p>

          <form className="space-y-space-md" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="font-label-lg text-label-lg text-on-surface font-medium" htmlFor="rutProfesional">
                RUT
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-on-surface-variant material-symbols-outlined text-[20px] pointer-events-none">badge</span>
                <input
                  id="rutProfesional"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="15.420.918-K"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-lg text-label-lg text-on-surface font-medium" htmlFor="claveProfesional">
                  Contraseña
                </label>
                <a className="font-body-sm text-body-sm text-primary hover:underline" href="#">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-on-surface-variant material-symbols-outlined text-[20px] pointer-events-none">key</span>
                <input
                  id="claveProfesional"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-12 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  aria-label="Alternar visibilidad de contraseña"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 p-1 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "checking"}
              className="w-full h-12 rounded-lg bg-primary-container hover:bg-primary-strong active:scale-[0.99] text-on-primary font-title-sm text-title-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-75"
            >
              <span className={`material-symbols-outlined text-[20px] ${status === "checking" ? "animate-spin" : ""}`}>
                {status === "checking" ? "progress_activity" : "login"}
              </span>
              Ingresar
            </button>
          </form>
        </div>
        </HojaTalonario>

        <p className="relative mt-12 md:mt-20 text-center text-on-surface-variant font-body-sm text-body-sm">
          ¿Eres paciente?{" "}
          <button
            type="button"
            onClick={() => navigate("/reserva")}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Reserva tu hora
          </button>
        </p>
      </div>
    </main>
  );
}
