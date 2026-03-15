import loadable from "@loadable/component";
import { Route } from "react-router-dom";

// Componentes cargados dinámicamente
const ListScopes = loadable(() => import("../pages/Scopes/List.tsx"), {
  fallback: <div>Cargando lista de scopes...</div>,
});

const ListCategories = loadable(() => import("../pages/Categories/List.tsx"), {
  fallback: <div>Cargando lista de categorías...</div>,
});

const ListRoles = loadable(() => import("../pages/Roles/List.tsx"), {
  fallback: <div>Cargando lista de roles...</div>,
});

const ListUsers = loadable(() => import("../pages/Users/List.tsx"), {
  fallback: <div>Cargando lista de usuarios...</div>,
});

export default (
  <>
    <Route path="/scopes/list" element={<ListScopes />} />
    <Route path="/categories/list" element={<ListCategories />} />
    <Route path="/roles/list" element={<ListRoles />} />
    <Route path="/users/list" element={<ListUsers />} />
  </>
);
