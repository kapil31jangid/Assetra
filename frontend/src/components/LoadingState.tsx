import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({
  label = "Loading workspace",
}: LoadingStateProps) {
  return (
    <Box
      sx={{
        alignItems: "center",
        display: "flex",
        gap: 1.5,
        justifyContent: "center",
        minHeight: 240,
      }}
    >
      <CircularProgress size={22} />
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
    </Box>
  );
}
