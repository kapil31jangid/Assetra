import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

import { ROUTES } from "../constants/routes";
import { AuthLayout } from "../layouts/AuthLayout";
import { CustomerPortalLayout } from "../layouts/CustomerPortalLayout";
import { OperationsLayout } from "../layouts/OperationsLayout";
import { CatalogPage } from "../pages/CatalogPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { OrdersPage } from "../pages/OrdersPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { SignupPage } from "../pages/SignupPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route
          element={<Navigate replace to={ROUTES.dashboard} />}
          path={ROUTES.root}
        />
        <Route element={<AuthLayout />}>
          <Route element={<LoginPage />} path={ROUTES.login} />
          <Route element={<SignupPage />} path={ROUTES.signup} />
          <Route
            element={<ForgotPasswordPage />}
            path={ROUTES.forgotPassword}
          />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin", "vendor"]} />}>
          <Route element={<OperationsLayout />}>
            <Route element={<DashboardPage />} path={ROUTES.dashboard} />
            <Route element={<OrdersPage />} path={ROUTES.orders} />
            <Route
              element={
                <PlaceholderPage
                  description="Quotation management placeholder for the operations workspace."
                  title="Quotations"
                />
              }
              path={ROUTES.quotations}
            />
            <Route
              element={
                <PlaceholderPage
                  description="Invoice review and payment tracking placeholder."
                  title="Invoices"
                />
              }
              path={ROUTES.operationsInvoices}
            />
            <Route
              element={
                <PlaceholderPage
                  description="Product inventory and repair state placeholder."
                  title="Products"
                />
              }
              path={ROUTES.products}
            />
            <Route
              element={
                <PlaceholderPage
                  description="Pricelists, rules, and rental rates placeholder."
                  title="Pricing"
                />
              }
              path={ROUTES.pricing}
            />
            <Route
              element={
                <PlaceholderPage
                  description="Pickup and return calendar placeholder."
                  title="Schedule"
                />
              }
              path={ROUTES.schedule}
            />
            <Route
              element={
                <PlaceholderPage
                  description="Operational reports placeholder."
                  title="Reports"
                />
              }
              path={ROUTES.reports}
            />
            <Route
              element={
                <PlaceholderPage
                  description="Workspace configuration placeholder."
                  title="Settings"
                />
              }
              path={ROUTES.settings}
            />
          </Route>
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["admin", "vendor", "customer"]} />
          }
        >
          <Route element={<CustomerPortalLayout />}>
            <Route element={<CatalogPage />} path={ROUTES.catalog} />
            <Route
              element={
                <PlaceholderPage
                  description="Cart route placeholder for Phase 5 checkout work."
                  title="Cart"
                />
              }
              path={ROUTES.cart}
            />
            <Route
              element={
                <PlaceholderPage
                  description="Checkout route placeholder for rental booking."
                  title="Checkout"
                />
              }
              path={ROUTES.checkout}
            />
            <Route
              element={
                <PlaceholderPage
                  description="Customer rental history placeholder."
                  title="My Orders"
                />
              }
              path={ROUTES.customerOrders}
            />
            <Route
              element={
                <PlaceholderPage
                  description="Customer invoice access placeholder."
                  title="My Invoices"
                />
              }
              path={ROUTES.customerInvoices}
            />
            <Route
              element={
                <PlaceholderPage
                  description="Saved products placeholder."
                  title="Wishlist"
                />
              }
              path={ROUTES.wishlist}
            />
            <Route
              element={
                <PlaceholderPage
                  description="Customer profile placeholder."
                  title="Profile"
                />
              }
              path={ROUTES.profile}
            />
          </Route>
        </Route>

        <Route element={<NotFoundPage />} path={ROUTES.notFound} />
      </Routes>
    </Router>
  );
}
