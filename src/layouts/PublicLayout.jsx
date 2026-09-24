export default function PublicLayout({ children }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-brand-soft overflow-x-hidden">
      <header className="relative w-full py-5 md:py-6 px-margin md:px-margin-desktop flex items-center gap-1 shrink-0">
        <div className="w-[var(--public-icon-shell)] h-[var(--public-icon-shell)] rounded-full bg-white border border-border-subtle flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          <img src="logo/icono-color.svg" alt="Logo Ismary Ugalde" className="w-[var(--public-icon-img)] h-[var(--public-icon-img)] object-contain" />
        </div>
        <img src="logo/nombre-color.svg" alt="Ismary Ugalde Rojas" className="h-[var(--public-wordmark-h)] w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
      </header>
      <main className="relative w-full flex-1 flex flex-col items-center justify-start md:justify-center px-margin pt-space-xl pb-space-lg">{children}</main>
      <footer className="relative shrink-0 text-center px-margin pt-space-md pb-space-lg text-on-surface-variant">
        <p className="font-headline-md text-[18px] italic font-normal text-primary">Salud ♡ Maternidad ♡ Bienestar</p>
        <p className="text-body-sm mt-1">
          Ismary Ugalde Rojas, Matrona · <span className="whitespace-nowrap">Registro SIS N.º 802617</span>
        </p>
      </footer>
    </div>
  );
}
