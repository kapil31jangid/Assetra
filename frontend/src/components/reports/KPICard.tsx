import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  filterParam?: string; // Query parameter for Orders page
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
}

export function KPICard({ label, value, icon, filterParam, color = "primary" }: KPICardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (filterParam) {
      navigate(`${ROUTES.orders}?filter=${filterParam}`);
    }
  };

  return (
    <Card 
      onClick={handleClick}
      sx={{ 
        cursor: filterParam ? "pointer" : "default",
        "&:hover": filterParam ? { boxShadow: 3, transform: "translateY(-2px)" } : {},
        transition: "all 0.2s"
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          {icon && (
            <Box 
              sx={{ 
                bgcolor: `${color}.50`, 
                color: `${color}.main`, 
                p: 1.5, 
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
