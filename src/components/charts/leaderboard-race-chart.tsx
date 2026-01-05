"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

type LeaderboardRaceProps = {
  data: Record<string, string | number>[];
  candidates: string[];
};

// Explicit colors that will always show - no CSS variables
const COLORS = [
  "#e11d48", // rose-600
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#ea580c", // orange-600
  "#9333ea", // purple-600
  "#0891b2", // cyan-600
  "#ca8a04", // yellow-600
  "#dc2626", // red-600
];

export function LeaderboardRaceChart({ data, candidates }: LeaderboardRaceProps) {
  const chartConfig = candidates.reduce((acc, name, index) => {
    acc[name] = {
      label: name,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  // Format timestamp for display
  const formatTimestamp = (value: number | string) => {
    const timestamp = typeof value === 'string' ? parseInt(value, 10) : value;
    if (!timestamp || isNaN(timestamp)) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const formatTooltipDate = (value: number | string) => {
    const timestamp = typeof value === 'string' ? parseInt(value, 10) : value;
    if (!timestamp || isNaN(timestamp)) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <span>🏁</span>
          Corrida do Leaderboard
        </CardTitle>
        <CardDescription>
          Evolucao cumulativa dos votos - Top {candidates.length} candidatos
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4 overflow-hidden">
        <ChartContainer config={chartConfig} className="h-full w-full overflow-hidden">
          <LineChart data={data} margin={{ top: 10, left: 40, right: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatTimestamp}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 'auto']}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={formatTooltipDate}
                  indicator="dot"
                />
              }
            />
            {candidates.map((name, index) => (
              <Line
                key={name}
                type="stepAfter"
                dataKey={name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: COLORS[index % COLORS.length] }}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
