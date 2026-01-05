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

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(280 70% 50%)",
  "hsl(200 70% 50%)",
  "hsl(340 70% 50%)",
];

export function LeaderboardRaceChart({ data, candidates }: LeaderboardRaceProps) {
  const chartConfig = candidates.reduce((acc, name, index) => {
    acc[name] = {
      label: name,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  // Get latest values for each candidate to show current standings
  const latestData = data[data.length - 1] || {};
  const standings = candidates
    .map((name) => ({
      name,
      value: (latestData[name] as number) || 0,
    }))
    .sort((a, b) => b.value - a.value);

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
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
              }}
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
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                    });
                  }}
                  formatter={(value, name) => (
                    <div className="flex items-center gap-2">
                      <span>{name}</span>
                      <span className="font-bold">{value} pts</span>
                    </div>
                  )}
                />
              }
            />
            {candidates.map((name, index) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
