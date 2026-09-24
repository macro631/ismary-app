import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useClinica } from "../data/store";

const NAV_ITEMS = [
  { to: "/calendario", label: "Calendario" },
  { to: "/fichas", label: "Fichas Clínicas" },
  { to: "/configuracion", label: "Configuración" },
];

export default function AppShell({ children }) {
  const { logout } = useClinica();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(122,46,80,0.06)]">
        <div className="h-[var(--app-header-h)] w-full px-[var(--app-header-px)] md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-2 md:gap-gutter">
          <div className="flex items-center gap-1 shrink-0 min-w-0 h-full py-2">
            <div className="w-[var(--app-icon-shell)] h-[var(--app-icon-shell)] rounded-full bg-brand-soft border border-border-subtle flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              <img src="logo/icono-color.svg" alt="Logo Ismary Ugalde" className="w-[var(--app-icon-img)] h-[var(--app-icon-img)] object-contain" />
            </div>
            <img
              src="logo/nombre-color.svg"
              alt="Ismary Ugalde Rojas"
              className="h-[var(--app-wordmark-h)] w-auto object-contain min-w-0 shrink"
              style={{ mixBlendMode: "multiply" }}
            />
          </div>

          <nav className="hidden xl:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm tracking-wide font-medium transition-colors pb-1 border-b-2 ${
                    isActive
                      ? "text-primary font-semibold border-primary"
                      : "text-text-primary/70 hover:text-primary border-transparent"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <div className="hidden xl:flex items-center gap-1.5 text-sm bg-surface-container-low text-text-primary/80 px-3 py-1.5 rounded-full border border-border-subtle/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Autoguardado Activo</span>
            </div>
            <button
              type="button"
              aria-label="Notificaciones"
              className="hidden xl:inline-flex relative p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/calendario")}
              className="hidden xl:flex items-center gap-2 bg-primary hover:bg-primary-strong text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Nueva Cita / Atención
            </button>
            <button
              type="button"
              title="Cerrar sesión"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="hidden xl:flex w-8 h-8 rounded-full bg-brand-soft border border-border-subtle text-primary items-center justify-center font-semibold text-xs shadow-sm hover:bg-primary hover:text-white transition-colors"
            >
              IU
            </button>
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="xl:hidden p-2 rounded-full text-primary hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[26px]">{mobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="xl:hidden border-t border-surface-container bg-surface-container-lowest px-margin py-space-sm flex flex-col">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `py-space-sm text-body-lg font-medium border-b border-surface-container last:border-b-0 ${
                    isActive ? "text-primary font-semibold" : "text-on-surface"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="py-space-sm text-body-lg font-medium text-status-cancelada text-left flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Cerrar sesión
            </button>
          </nav>
        )}
      </header>
      <main className="w-full pt-[var(--app-header-h)] min-h-screen">{children}</main>
    </div>
  );
}
