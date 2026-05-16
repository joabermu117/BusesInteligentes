import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import LoginPage from "./Auth/Login";
import PasswordRecoveryPage from "./Auth/PasswordRecovery";
import RegisterPage from "./Auth/Register";
import ResetPasswordPage from "./Auth/ResetPassword";
import TwoFactorPage from "./Auth/TwoFactor";
import AbordarBus from "./boletos/pages/AbordarBus";
import DescenderBus from "./boletos/pages/DescenderBus";
import DetalleViaje from "./boletos/pages/DetalleViaje";
import HistorialViajes from "./boletos/pages/HistorialViajes";
import IniciarTurno from "./boletos/pages/IniciarTurno";
import MisTurnos from "./boletos/pages/MisTurnos";
import BusDetail from "./buses/pages/BusDetail";
import BusesList from "./buses/pages/BusesList";
import CompaniesList from "./companies/pages/CompaniesList";
import ErrorBoundary from "./components/ErrorBoundary";
import {
  AUTH_TOKEN_STORAGE_KEY,
  isAuthTokenExpired,
  setAuthToken,
} from "./config/httpClient";
import PaymentMethodsList from "./payment-methods/pages/PaymentMethodsList";
import AppShell from "./permisos/common/layout/AppShell";
import PermisosRoutes from "./permisos/routes/Permisos.routes";
import RecargaEpayco from "./recarga/pages/RecargaEpayco";
import ReporteEdades from "./reportes/pages/ReporteEdades";
import ReporteIncidentes from "./reportes/pages/ReporteIncidentes";
import ReporteIngresos from "./reportes/pages/ReporteIngresos";
import MisTarjetas from "./tarjetas/pages/MisTarjetas";
import ParaderosCercanos from "./viajes/pages/ParaderosCercanos";
import RutaDetalle from "./viajes/pages/RutaDetalle";
import RutasList from "./viajes/pages/RutasList";
import IncidentsList from "./incidents/pages/IncidentsList";
import BusIncidentsDetail from "./incidents/pages/BusIncidentsDetail";
import StopsList from "./viajes/pages/StopsList";
import AdminRoutesList from "./viajes/pages/AdminRoutesList";
import SchedulesList from "./schedules/pages/SchedulesList";

const RequireAuth = () => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (!token || isAuthTokenExpired(token)) {
    setAuthToken(null);
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/2fa" element={<TwoFactorPage />} />
          <Route path="/password-recovery" element={<PasswordRecoveryPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              {PermisosRoutes}
              <Route path="/rutas" element={<RutasList />} />
              <Route path="/rutas/:id" element={<RutaDetalle />} />
              <Route path="/paraderos" element={<ParaderosCercanos />} />
              <Route path="/abordar" element={<AbordarBus />} />
              <Route path="/descender" element={<DescenderBus />} />
              <Route path="/tarjetas" element={<MisTarjetas />} />
              <Route path="/recargar" element={<RecargaEpayco />} />
              <Route path="/viajes/historial" element={<HistorialViajes />} />
              <Route path="/viajes/:id" element={<DetalleViaje />} />
              <Route path="/turnos" element={<MisTurnos />} />
              <Route path="/turnos/:id/iniciar" element={<IniciarTurno />} />
              <Route path="/buses" element={<BusesList />} />
              <Route path="/buses/:id" element={<BusDetail />} />
              <Route path="/empresas" element={<CompaniesList />} />
              <Route path="/payment-methods" element={<PaymentMethodsList />} />
              <Route path="/reportes/ingresos" element={<ReporteIngresos />} />
              <Route path="/reportes/edades" element={<ReporteEdades />} />
              <Route path="/reportes/incidentes" element={<ReporteIncidentes />} />
              <Route path="/incidentes" element={<IncidentsList />} />
              <Route path="/incidentes/bus/:busId" element={<BusIncidentsDetail />} />
              <Route path="/paraderos/admin" element={<StopsList />} />
              <Route path="/rutas/admin" element={<AdminRoutesList />} />
              <Route path="/programaciones" element={<SchedulesList />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
