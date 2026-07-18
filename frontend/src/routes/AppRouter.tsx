import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

import { ROUTES } from "../constants/routes";
import { AppShell } from "../layouts/AppShell";
import { CatalogPage } from "../pages/CatalogPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { OrdersPage } from "../pages/OrdersPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route
          element={<Navigate replace to={ROUTES.dashboard} />}
          path={ROUTES.root}
        />
        <Route element={<LoginPage />} path={ROUTES.login} />

        <Route element={<ProtectedRoute allowedRoles={["admin", "vendor"]} />}>
          <Route element={<AppShell />}>
            <Route element={<DashboardPage />} path={ROUTES.dashboard} />
            <Route element={<OrdersPage />} path={ROUTES.orders} />
          </Route>
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["admin", "vendor", "customer"]} />
          }
        >
          <Route element={<AppShell />}>
            <Route element={<CatalogPage />} path={ROUTES.catalog} />
          </Route>
        </Route>

        <Route element={<NotFoundPage />} path={ROUTES.notFound} />
      </Routes>
    </Router>
  );
}
