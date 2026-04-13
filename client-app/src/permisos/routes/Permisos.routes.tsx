import loadable from "@loadable/component";
import { Route } from "react-router-dom";
import Loader from "../common/loader";

// Componentes cargados dinámicamente
const ListScopes = loadable(() => import("../pages/Scopes/List.tsx"), {
  fallback: <Loader message="Cargando permisos del sistema..." />,
});

const ListRoles = loadable(() => import("../pages/Roles/List.tsx"), {
  fallback: <Loader message="Cargando perfiles de rol..." />,
});

const ListUsers = loadable(() => import("../pages/Users/List.tsx"), {
  fallback: <Loader message="Cargando usuarios del sistema..." />,
});

const UserProfile = loadable(() => import("../pages/Users/Profile.tsx"), {
  fallback: <Loader message="Cargando configuracion de perfil..." />,
});

const DashboardHome = loadable(() => import("../../Dashboard/Home.tsx"), {
  fallback: <Loader message="Cargando dashboard de operaciones..." />,
});

export default (
  <>
    <Route path="/dashboard" element={<DashboardHome />} />
    <Route path="/scopes/list" element={<ListScopes />} />
    <Route path="/roles/list" element={<ListRoles />} />
    <Route path="/users/list" element={<ListUsers />} />
    <Route path="/users/profile/:userId" element={<UserProfile />} />
  </>
);
