import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  api,
  type Category,
  type CreateCategoryRequest,
  type CreateProductRequest,
  type CreatePricelistRequest,
  type UpdatePricelistRequest,
  type QuotationTemplate,
  type CreateQuotationTemplateRequest,
  type UpdateQuotationTemplateRequest,
  type OrganizationSettings,
  type Pricelist,
  type Product,
  type ProductAttribute,
  type RentalOrder,
  type Session,
  type UpdateProductRequest,
  type UserProfile,
} from "./api";
import type {
  CreateRentalOrderRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ListQuery,
  ProductListQuery,
  RecordFulfillmentRequest,
  RentalOrderListQuery,
  SignupRequest,
  UpdateRentalOrderStatusRequest,
} from "./api-contract";

export const queryKeys = {
  session: ["session"] as const,
  dashboard: ["dashboard", "summary"] as const,
  categories: ["categories"] as const,
  products: (query?: ProductListQuery & { includeInactive?: boolean }) =>
    ["products", query ?? {}] as const,
  product: (productId: string) => ["products", productId] as const,
  orders: (query?: RentalOrderListQuery) => ["orders", query ?? {}] as const,
  order: (orderId: string) => ["orders", orderId] as const,
  invoices: ["invoices"] as const,
  pricelists: ["pricing", "pricelists"] as const,
  quotationTemplates: ["pricing", "quotation-templates"] as const,
};

// -------------------------------------------------------------------------
// Session
// -------------------------------------------------------------------------

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

// -------------------------------------------------------------------------
// Dashboard
// -------------------------------------------------------------------------

export const useDashboardSummaryQuery = () =>
  useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: api.getDashboardSummary,
  });

// -------------------------------------------------------------------------
// Categories
// -------------------------------------------------------------------------

export const useCategoriesQuery = () =>
  useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.getCategories,
  });

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateCategoryRequest) => api.createCategory(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: CreateCategoryRequest }) =>
      api.updateCategory(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
};

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

export const useAttributesQuery = () =>
  useQuery({ queryKey: ["attributes"], queryFn: api.getAttributes });

export const useCreateAttributeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: Omit<ProductAttribute, "id">) => api.createAttribute(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attributes"] }),
  });
};

export const useUpdateAttributeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: Omit<ProductAttribute, "id"> }) =>
      api.updateAttribute(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attributes"] }),
  });
};

export const useDeleteAttributeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteAttribute(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attributes"] }),
  });
};

// -------------------------------------------------------------------------
// Products
// -------------------------------------------------------------------------

export const useProductsQuery = (query?: ProductListQuery & { includeInactive?: boolean }) =>
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

const useInvalidateProducts = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };
};

export const useCreateProductMutation = () => {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (request: CreateProductRequest) => api.createProduct(request),
    onSuccess: invalidate,
  });
};

export const useUpdateProductMutation = () => {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ productId, request }: { productId: string; request: UpdateProductRequest }) =>
      api.updateProduct(productId, request),
    onSuccess: invalidate,
  });
};

export const useDeleteProductMutation = () => {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (productId: string) => api.deleteProduct(productId),
    onSuccess: invalidate,
  });
};

export const useUploadImageMutation = () =>
  useMutation({
    mutationFn: (file: File) => api.uploadImage(file),
  });

// -------------------------------------------------------------------------
// Orders
// -------------------------------------------------------------------------

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

// -------------------------------------------------------------------------
// Invoices / Pricing / Settings / Profile
// -------------------------------------------------------------------------

export const useInvoicesQuery = () =>
  useQuery({
    queryKey: queryKeys.invoices,
    queryFn: () => api.getInvoices({ pageSize: 100 }),
  });

export const usePricelistsQuery = () =>
  useQuery({
    queryKey: queryKeys.pricelists,
    queryFn: api.getPricelists,
  });

export const usePricelistQuery = (id?: string) =>
  useQuery({
    queryKey: ["pricing", "pricelists", id],
    queryFn: () => api.getPricelist(id!),
    enabled: !!id,
  });

export const useCreatePricelistMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreatePricelistRequest) => api.createPricelist(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pricelists }),
  });
};

export const useUpdatePricelistMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdatePricelistRequest }) =>
      api.updatePricelist(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pricelists }),
  });
};

export const useDeletePricelistMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePricelist(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pricelists }),
  });
export const useQuotationTemplatesQuery = () =>
  useQuery({
    queryKey: queryKeys.quotationTemplates,
    queryFn: api.getQuotationTemplates,
  });

export const useQuotationTemplateQuery = (id?: string) =>
  useQuery({
    queryKey: ["pricing", "quotation-templates", id],
    queryFn: () => api.getQuotationTemplate(id!),
    enabled: !!id,
  });

export const useCreateQuotationTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateQuotationTemplateRequest) => api.createQuotationTemplate(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quotationTemplates }),
  });
};

export const useUpdateQuotationTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateQuotationTemplateRequest }) =>
      api.updateQuotationTemplate(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quotationTemplates }),
  });
};

export const useDeleteQuotationTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteQuotationTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quotationTemplates }),
  });
};

export const useSettingsQuery = () =>
  useQuery({ queryKey: ["settings"], queryFn: api.getSettings });

export const useSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: OrganizationSettings) => api.updateSettings(settings),
    onSuccess: (settings) => queryClient.setQueryData(["settings"], settings),
  });
};

export const useProfileQuery = () =>
  useQuery({ queryKey: ["profile"], queryFn: api.getProfile });

export const useProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: Partial<UserProfile>) => api.updateProfile(profile),
    onSuccess: (profile) => queryClient.setQueryData(["profile"], profile),
  });
};

export const useUsersQuery = (query?: ListQuery) =>
  useQuery({ queryKey: ["users", query], queryFn: () => api.getUsers(query) });

export const useUserQuery = (id: string) =>
  useQuery({ queryKey: ["users", id], queryFn: () => api.getUser(id) });

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: Partial<UserProfile>) => api.createUser(user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, user }: { id: string; user: Partial<UserProfile> }) =>
      api.updateUser(id, user),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
    },
  });
};
