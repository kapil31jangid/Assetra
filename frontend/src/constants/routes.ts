export const ROUTES = {
  root: "/",
  login: "/login",
  dashboard: "/operations/dashboard",
  orders: "/operations/orders",
  catalog: "/portal/catalog",
  notFound: "*",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
