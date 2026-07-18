import { Navigate, Outlet, useLocation } from "react-router-dom";

import { LoadingState } from "../components/LoadingState";
import { ROUTES } from "../constants/routes";
import { useSessionQuery } from "../services/queries";
import type { Role } from "../types";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const session = useSessionQuery();

  if (session.isLoading) {
    return <LoadingState />;
  }

  if (session.isError || !session.data?.data.user) {
    return <Navigate replace state={{ from: location }} to={ROUTES.login} />;
  }

  if (allowedRoles && !allowedRoles.includes(session.data.data.user.role)) {
    return <Navigate replace to={ROUTES.dashboard} />;
  }

  return <Outlet />;
}
