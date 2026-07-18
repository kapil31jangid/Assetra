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
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { CheckoutSuccessPage } from "../pages/CheckoutSuccessPage";
import { CustomerInvoicesPage } from "../pages/CustomerInvoicesPage";
import { CustomerOrdersPage } from "../pages/CustomerOrdersPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { OrdersPage } from "../pages/OrdersPage";
import { OperationsInvoicesPage } from "../pages/OperationsInvoicesPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { PricingPage } from "../pages/PricingPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { ProductsPage } from "../pages/ProductsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { QuotationsPage } from "../pages/QuotationsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { SchedulePage } from "../pages/SchedulePage";
import { SettingsPage } from "../pages/SettingsPage";
import { SignupPage } from "../pages/SignupPage";
import { WishlistPage } from "../pages/WishlistPage";
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
            <Route element={<QuotationsPage />} path={ROUTES.quotations} />
            <Route
              element={<OperationsInvoicesPage />}
              path={ROUTES.operationsInvoices}
            />
            <Route element={<ProductsPage />} path={ROUTES.products} />
            <Route element={<PricingPage />} path={ROUTES.pricing} />
            <Route element={<SchedulePage />} path={ROUTES.schedule} />
            <Route element={<ReportsPage />} path={ROUTES.reports} />
            <Route element={<SettingsPage />} path={ROUTES.settings} />
          </Route>
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["admin", "vendor", "customer"]} />
          }
        >
          <Route element={<CustomerPortalLayout />}>
            <Route element={<CatalogPage />} path={ROUTES.catalog} />
            <Route element={<ProductDetailPage />} path={ROUTES.productDetail} />
            <Route element={<CartPage />} path={ROUTES.cart} />
            <Route element={<CheckoutPage />} path={ROUTES.checkout} />
            <Route
              element={<CheckoutSuccessPage />}
              path={ROUTES.checkoutSuccess}
            />
            <Route element={<CustomerOrdersPage />} path={ROUTES.customerOrders} />
            <Route
              element={<CustomerInvoicesPage />}
              path={ROUTES.customerInvoices}
            />
            <Route element={<WishlistPage />} path={ROUTES.wishlist} />
            <Route element={<ProfilePage />} path={ROUTES.profile} />
          </Route>
        </Route>

        <Route element={<NotFoundPage />} path={ROUTES.notFound} />
      </Routes>
    </Router>
  );
}
