"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type HotStreakProps = {
  data: { name: string; votes: number }[];
};

const chartConfig = {
  votes: {
    label: "Votos",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function HotStreakChart({ data }: HotStreakProps) {
  const leader = data[0];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <span>🔥</span>
          Hot Streak - Ultimos 7 Dias
        </CardTitle>
        <CardDescription>
          {leader ? (
            <>
              Liderando agora: <strong>{leader.name}</strong> com {leader.votes} votos
            </>
          ) : (
            "Nenhum voto recente"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={100}
              tickFormatter={(value) => value.split(" ")[0]}
            />
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
