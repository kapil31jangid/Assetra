import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import ReactEChartsCore from "echarts-for-react/lib/core";

interface SummaryChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  dataKey?: string;
  color?: string;
  type?: "bar" | "line";
}

echarts.use([BarChart, CanvasRenderer, GridComponent, LegendComponent, LineChart, TooltipComponent]);

export function SummaryChart({ data, title, dataKey = "value", color = "#1976d2", type = "bar" }: SummaryChartProps) {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center", bgcolor: "background.default", borderRadius: 1 }}>
        <Typography color="text.secondary">No data available for the selected period.</Typography>
      </Box>
    );
  }

  const values = data.map((item) => (dataKey === "name" ? 0 : item.value));

  return (
    <Box sx={{ height: 340, width: "100%", pt: 2 }}>
      {title && <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>{title}</Typography>}
      <ReactEChartsCore
        echarts={echarts}
        option={{
          color: [color],
          tooltip: { trigger: "axis" },
          legend: { show: false },
          grid: { left: 48, right: 20, top: 18, bottom: 38 },
          xAxis: { type: "category", data: data.map((item) => item.name), axisLabel: { color: "#667085" } },
          yAxis: { type: "value", splitLine: { lineStyle: { color: "#edf0f5" } } },
          series: [{
            type,
            name: title ?? dataKey,
            data: values,
            smooth: type === "line",
            areaStyle: type === "line" ? { opacity: 0.12 } : undefined,
            itemStyle: { color },
            barMaxWidth: 42,
          }],
        }}
        style={{ height: 290, width: "100%" }}
      />
    </Box>
  );
}
