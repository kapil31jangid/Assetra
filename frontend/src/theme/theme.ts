import { createTheme } from "@mui/material/styles";

export const assetraTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#173a5e",
      dark: "#0d263f",
      light: "#315f8c",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#1f9d84",
      dark: "#147461",
      light: "#55bca9",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f4f6f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#172033",
      secondary: "#5d6678",
    },
    divider: "#dbe1ea",
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontSize: "2rem", fontWeight: 700, letterSpacing: 0 },
    h2: { fontSize: "1.5rem", fontWeight: 700, letterSpacing: 0 },
    h3: { fontSize: "1.25rem", fontWeight: 700, letterSpacing: 0 },
    h4: { fontSize: "1.125rem", fontWeight: 700, letterSpacing: 0 },
    h5: { fontSize: "1rem", fontWeight: 700, letterSpacing: 0 },
    h6: { fontSize: "0.875rem", fontWeight: 700, letterSpacing: 0 },
    button: { fontWeight: 700, letterSpacing: 0, textTransform: "none" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          border: "1px solid #dbe1ea",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 700,
        },
      },
    },
  },
});
