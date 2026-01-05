"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type TopVotersProps = {
  data: { name: string; votes: number }[];
};

const chartConfig = {
  votes: {
    label: "Votos dados",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function TopVotersChart({ data }: TopVotersProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <span>🐴</span>
          Quem Mais Vota
        </CardTitle>
        <CardDescription>Os animais que mais clicam</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4 overflow-hidden">
        <ChartContainer config={chartConfig} className="h-full w-full overflow-hidden">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
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
                  formatter={(value) => (
                    <span className="font-bold">{value} votos dados</span>
                  )}
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
