import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import LoginPage from "./Auth/Login";
import RegisterPage from "./Auth/Register";
import {
  AUTH_TOKEN_STORAGE_KEY,
  isAuthTokenExpired,
  setAuthToken,
} from "./config/httpClient";
import AppShell from "./permisos/common/layout/AppShell";
import PermisosRoutes from "./permisos/routes/Permisos.routes";

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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            {PermisosRoutes}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
