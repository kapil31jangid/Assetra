import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

import { queryClient } from "./queryClient";
import { AssetraThemeProvider } from "../theme/AssetraThemeProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AssetraThemeProvider>{children}</AssetraThemeProvider>
    </QueryClientProvider>
  );
}
