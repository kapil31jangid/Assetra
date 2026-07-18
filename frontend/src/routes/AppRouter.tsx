import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { Suspense, lazy } from "react";

import { LoadingState } from "../components/LoadingState";
import { ROUTES } from "../constants/routes";
import { AuthLayout } from "../layouts/AuthLayout";
import { CustomerPortalLayout } from "../layouts/CustomerPortalLayout";
import { OperationsLayout } from "../layouts/OperationsLayout";
import { ProtectedRoute } from "./ProtectedRoute";

const CatalogPage = lazy(() =>
  import("../pages/CatalogPage").then((module) => ({
    default: module.CatalogPage,
  })),
);
const CartPage = lazy(() =>
  import("../pages/CartPage").then((module) => ({ default: module.CartPage })),
);
const CheckoutPage = lazy(() =>
  import("../pages/CheckoutPage").then((module) => ({
    default: module.CheckoutPage,
  })),
);
const CheckoutSuccessPage = lazy(() =>
  import("../pages/CheckoutSuccessPage").then((module) => ({
    default: module.CheckoutSuccessPage,
  })),
);
const CustomerInvoicesPage = lazy(() =>
  import("../pages/CustomerInvoicesPage").then((module) => ({
    default: module.CustomerInvoicesPage,
  })),
);
const CustomerOrdersPage = lazy(() =>
  import("../pages/CustomerOrdersPage").then((module) => ({
    default: module.CustomerOrdersPage,
  })),
);
const DashboardPage = lazy(() =>
  import("../pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("../pages/ForgotPasswordPage").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const LoginPage = lazy(() =>
  import("../pages/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const NotFoundPage = lazy(() =>
  import("../pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);
const OrdersPage = lazy(() =>
  import("../pages/OrdersPage").then((module) => ({
    default: module.OrdersPage,
  })),
);
const OperationsInvoicesPage = lazy(() =>
  import("../pages/OperationsInvoicesPage").then((module) => ({
    default: module.OperationsInvoicesPage,
  })),
);
const PricingPage = lazy(() =>
  import("../pages/PricingPage").then((module) => ({
    default: module.PricingPage,
  })),
);
const ProductDetailPage = lazy(() =>
  import("../pages/ProductDetailPage").then((module) => ({
    default: module.ProductDetailPage,
  })),
);
const ProductsPage = lazy(() =>
  import("../pages/ProductsPage").then((module) => ({
    default: module.ProductsPage,
  })),
);
const ProfilePage = lazy(() =>
  import("../pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);
const QuotationsPage = lazy(() =>
  import("../pages/QuotationsPage").then((module) => ({
    default: module.QuotationsPage,
  })),
);
const ReportsPage = lazy(() =>
  import("../pages/ReportsPage").then((module) => ({
    default: module.ReportsPage,
  })),
);
const SchedulePage = lazy(() =>
  import("../pages/SchedulePage").then((module) => ({
    default: module.SchedulePage,
  })),
);
const SettingsPage = lazy(() =>
  import("../pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const SignupPage = lazy(() =>
  import("../pages/SignupPage").then((module) => ({
    default: module.SignupPage,
  })),
);
const WishlistPage = lazy(() =>
  import("../pages/WishlistPage").then((module) => ({
    default: module.WishlistPage,
  })),
);

export function AppRouter() {
  return (
    <Router>
      <Suspense fallback={<LoadingState label="Loading page" />}>
        <Routes>
          <Route
            element={<Navigate replace to={ROUTES.login} />}
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
              <Route
                element={<CustomerOrdersPage />}
                path={ROUTES.customerOrders}
              />
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
      </Suspense>
    </Router>
  );
}
