import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface SummaryChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  dataKey?: string;
  color?: string;
}

export function SummaryChart({ data, title, dataKey = "value", color = "#1976d2" }: SummaryChartProps) {
  
  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center", bgcolor: "background.default", borderRadius: 1 }}>
        <Typography color="text.secondary">No data available for the selected period.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 400, width: "100%", pt: 2 }}>
      {title && <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>{title}</Typography>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
            contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
          />
          <Legend />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
