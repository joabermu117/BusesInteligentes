import { CssBaseline } from "@mui/material";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { AUTH_TOKEN_STORAGE_KEY } from "./config/httpClient";
import LoginPage from "./permisos/pages/Auth/Login";
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
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          {PermisosRoutes}
          <Route
            path="/dashboard"
            element={<Navigate to="/roles/list" replace />}
          />
          <Route path="*" element={<Navigate to="/roles/list" replace />} />
        </Route>

        <Route path="/" element={<Navigate to="/roles/list" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
