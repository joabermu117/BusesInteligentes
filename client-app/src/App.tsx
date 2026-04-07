import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { AUTH_TOKEN_STORAGE_KEY } from "./config/httpClient";
import AppShell from "./permisos/common/layout/AppShell";
import LoginPage from "./permisos/pages/Auth/Login";
import RegisterPage from "./permisos/pages/Auth/Register";
import PermisosRoutes from "./permisos/routes/Permisos.routes";

const RequireAuth = () => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!token) {
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
            <Route
              path="/dashboard"
              element={<Navigate to="/users/list" replace />}
            />
            <Route path="*" element={<Navigate to="/users/list" replace />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
