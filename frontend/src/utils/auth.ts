import { ROUTES } from "../constants/routes";
import type { Role } from "../types";

export const getRoleHomeRoute = (role: Role) =>
  role === "customer" ? ROUTES.catalog : ROUTES.dashboard;
