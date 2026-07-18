import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";
import type {
  CreateRentalOrderRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ProductListQuery,
  RecordFulfillmentRequest,
  RentalOrderListQuery,
  SignupRequest,
  UpdateRentalOrderStatusRequest,
} from "./api-contract";

export const queryKeys = {
  session: ["session"] as const,
  dashboard: ["dashboard", "summary"] as const,
  products: (query?: ProductListQuery) => ["products", query ?? {}] as const,
  product: (productId: string) => ["products", productId] as const,
  orders: (query?: RentalOrderListQuery) => ["orders", query ?? {}] as const,
  order: (orderId: string) => ["orders", orderId] as const,
};

export const useSessionQuery = () =>
  useQuery({
    queryKey: queryKeys.session,
    queryFn: api.getSession,
    retry: false,
  });

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: LoginRequest) => api.login(request),
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.session, session);
    },
  });
};

export const useSignupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SignupRequest) => api.signup(request),
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.session, session);
    },
  });
};

export const useForgotPasswordMutation = () =>
  useMutation({
    mutationFn: (request: ForgotPasswordRequest) => api.forgotPassword(request),
  });

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.session });
    },
  });
};

export const useDashboardSummaryQuery = () =>
  useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: api.getDashboardSummary,
  });

export const useProductsQuery = (query?: ProductListQuery) =>
  useQuery({
    queryKey: queryKeys.products(query),
    queryFn: () => api.getProducts(query),
  });

export const useProductQuery = (productId?: string) =>
  useQuery({
    enabled: Boolean(productId),
    queryKey: queryKeys.product(productId ?? ""),
    queryFn: () => api.getProduct(productId ?? ""),
  });

export const useOrdersQuery = (query?: RentalOrderListQuery) =>
  useQuery({
    queryKey: queryKeys.orders(query),
    queryFn: () => api.getOrders(query),
  });

export const useOrderQuery = (orderId?: string) =>
  useQuery({
    enabled: Boolean(orderId),
    queryKey: queryKeys.order(orderId ?? ""),
    queryFn: () => api.getOrder(orderId ?? ""),
  });

const useInvalidateOrders = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
};

export const useCreateOrderMutation = () => {
  const invalidateOrders = useInvalidateOrders();

  return useMutation({
    mutationFn: (request: CreateRentalOrderRequest) => api.createOrder(request),
    onSuccess: invalidateOrders,
  });
};

export const useUpdateOrderStatusMutation = () => {
  const invalidateOrders = useInvalidateOrders();

  return useMutation({
    mutationFn: ({
      orderId,
      request,
    }: {
      orderId: string;
      request: UpdateRentalOrderStatusRequest;
    }) => api.updateOrderStatus(orderId, request),
    onSuccess: invalidateOrders,
  });
};

export const useRecordFulfillmentMutation = () => {
  const invalidateOrders = useInvalidateOrders();

  return useMutation({
    mutationFn: ({
      orderId,
      request,
    }: {
      orderId: string;
      request: RecordFulfillmentRequest;
    }) => api.recordFulfillment(orderId, request),
    onSuccess: invalidateOrders,
  });
};
