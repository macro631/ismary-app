import { Navigate, Route, Routes } from "react-router-dom";
import { ClinicaProvider, useClinica } from "./data/store";
import AppShell from "./layouts/AppShell";
import PublicLayout from "./layouts/PublicLayout";
import LoginPage from "./pages/LoginPage";
import CalendarioPage from "./pages/CalendarioPage";
import BibliotecaFichasPage from "./pages/BibliotecaFichasPage";
import FichaClinicaPage from "./pages/FichaClinicaPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import PortalReservaPage from "./pages/PortalReservaPage";

function RequireAuth({ children }) {
  const { session } = useClinica();
  if (!session) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/reserva"
        element={
          <PublicLayout>
            <PortalReservaPage />
          </PublicLayout>
        }
      />

      <Route path="/calendario" element={<RequireAuth><CalendarioPage /></RequireAuth>} />
      <Route path="/fichas" element={<RequireAuth><BibliotecaFichasPage /></RequireAuth>} />
      <Route path="/fichas/:pacienteId" element={<RequireAuth><FichaClinicaPage /></RequireAuth>} />
      <Route path="/configuracion" element={<RequireAuth><ConfiguracionPage /></RequireAuth>} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ClinicaProvider>
      <AppRoutes />
    </ClinicaProvider>
  );
}
