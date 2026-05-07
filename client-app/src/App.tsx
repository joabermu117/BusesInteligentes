import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import LoginPage from "./Auth/Login";
import PasswordRecoveryPage from "./Auth/PasswordRecovery";
import ResetPasswordPage from "./Auth/ResetPassword";
import RegisterPage from "./Auth/Register";
import TwoFactorPage from "./Auth/TwoFactor";
import {
  AUTH_TOKEN_STORAGE_KEY,
  isAuthTokenExpired,
  setAuthToken,
} from "./config/httpClient";
import AppShell from "./permisos/common/layout/AppShell";
import PermisosRoutes from "./permisos/routes/Permisos.routes";
import RutasList from "./viajes/pages/RutasList";
import RutaDetalle from "./viajes/pages/RutaDetalle";
import ParaderosCercanos from "./viajes/pages/ParaderosCercanos";
import AbordarBus from "./boletos/pages/AbordarBus";
import DescenderBus from "./boletos/pages/DescenderBus";
import HistorialViajes from "./boletos/pages/HistorialViajes";
import DetalleViaje from "./boletos/pages/DetalleViaje";
import MisTurnos from "./boletos/pages/MisTurnos";
import IniciarTurno from "./boletos/pages/IniciarTurno";
import ErrorBoundary from "./components/ErrorBoundary";

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
            <Route path="/viajes/historial" element={<HistorialViajes />} />
            <Route path="/viajes/:id" element={<DetalleViaje />} />
            <Route path="/turnos" element={<MisTurnos />} />
            <Route path="/turnos/:id/iniciar" element={<IniciarTurno />} />
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
