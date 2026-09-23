export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7E6EB]">
      <header className="w-full py-5 md:py-6 px-margin md:px-margin-desktop flex items-center gap-1 shrink-0">
        <div className="w-[var(--public-icon-shell)] h-[var(--public-icon-shell)] rounded-full bg-white border border-[#e2d3db] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          <img src="logo/icono-color.svg" alt="Logo Ismary Ugalde" className="w-[var(--public-icon-img)] h-[var(--public-icon-img)] object-contain" />
        </div>
        <img src="logo/nombre-color.svg" alt="Ismary Ugalde Rojas" className="h-[var(--public-wordmark-h)] w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
      </header>
      <main className="w-full flex-1 flex flex-col items-center justify-center px-margin py-space-lg">{children}</main>
      <footer className="shrink-0 text-center pb-space-lg text-body-sm text-on-surface-variant">
        Salud ♡ Maternidad ♡ Bienestar — Ismary Ugalde Rojas · Matrona Obstétrica y Ginecológica (Registro SIS Nº 802617 · Chile)
      </footer>
    </div>
  );
}
