import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { PropsWithChildren } from "react";

import { assetraTheme } from "./theme";

export function AssetraThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={assetraTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
