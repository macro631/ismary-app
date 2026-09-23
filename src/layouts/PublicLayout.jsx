export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7E6EB]">
      <header className="w-full py-5 md:py-6 px-margin md:px-margin-desktop flex items-center gap-1 shrink-0">
        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white border border-[#e2d3db] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          <img src="logo/icono-color.svg" alt="Logo Ismary Ugalde" className="w-11 h-11 md:w-16 md:h-16 object-contain" />
        </div>
        <img src="logo/nombre-color.svg" alt="Ismary Ugalde Rojas" className="h-[40px] md:h-[72px] w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
      </header>
      <main className="w-full flex-1 flex flex-col items-center justify-center px-margin py-space-lg">{children}</main>
      <footer className="shrink-0 text-center pb-space-lg text-body-sm text-on-surface-variant">
        Salud ♡ Maternidad ♡ Bienestar — Ismary Ugalde Rojas · Matrona Obstétrica y Ginecológica (Registro SIS Nº 802617 · Chile)
      </footer>
    </div>
  );
}
