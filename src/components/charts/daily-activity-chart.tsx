"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type DailyActivityProps = {
  data: { day: string; votes: number }[];
};

const chartConfig = {
  votes: {
    label: "Votos",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function DailyActivityChart({ data }: DailyActivityProps) {
  const maxVotes = Math.max(...data.map((d) => d.votes));
  const busiestDay = data.find((d) => d.votes === maxVotes)?.day || "";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <span>📅</span>
          Atividade por Dia da Semana
        </CardTitle>
        <CardDescription>
          Dia mais movimentado: <strong>{busiestDay}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => <span className="font-bold">{value} votos</span>}
                />
              }
            />
            <Bar dataKey="votes" fill="var(--color-votes)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
