import Alert from "@mui/material/Alert";

interface ErrorStateProps {
  title?: string;
  message?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "The request could not be completed. Please try again.",
}: ErrorStateProps) {
  return (
    <Alert severity="error" sx={{ borderRadius: 2 }}>
      <strong>{title}</strong>
      <br />
      {message}
    </Alert>
  );
}
