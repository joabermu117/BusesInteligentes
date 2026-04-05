import { CssBaseline } from "@mui/material";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { AUTH_TOKEN_STORAGE_KEY } from "./config/httpClient";
import { PermisosLayout } from "./layout/PermisosLayout";
import LoginPage from "./permisos/pages/Auth/Login";
import MicrosoftCallbackPage from "./permisos/pages/Auth/MicrosoftCallback";
import DashboardPage from "./permisos/pages/Dashboard";
import PermisosRoutes from "./permisos/routes/Permisos.routes";

const RequireAuth = () => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/auth/callback/microsoft"
          element={<MicrosoftCallbackPage />}
        />

        <Route element={<RequireAuth />}>
          <Route element={<PermisosLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            {PermisosRoutes}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
