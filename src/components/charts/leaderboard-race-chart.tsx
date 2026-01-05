"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, ReferenceDot } from "recharts";
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
  avatars: (string | null)[];
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

// Custom avatar component for the chart
function AvatarDot({ cx, cy, avatarUrl, name, color }: { cx: number; cy: number; avatarUrl: string | null; name: string; color: string }) {
  const size = 32;
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <g>
      {/* Border circle */}
      <circle
        cx={cx}
        cy={cy}
        r={size / 2 + 2}
        fill={color}
      />
      {avatarUrl ? (
        <>
          <defs>
            <clipPath id={`avatar-clip-${name.replace(/\s/g, '-')}`}>
              <circle cx={cx} cy={cy} r={size / 2} />
            </clipPath>
          </defs>
          <image
            x={cx - size / 2}
            y={cy - size / 2}
            width={size}
            height={size}
            href={avatarUrl}
            clipPath={`url(#avatar-clip-${name.replace(/\s/g, '-')})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </>
      ) : (
        <>
          <circle cx={cx} cy={cy} r={size / 2} fill="#374151" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={12}
            fontWeight="bold"
          >
            {initials}
          </text>
        </>
      )}
    </g>
  );
}

export function LeaderboardRaceChart({ data, candidates, avatars }: LeaderboardRaceProps) {
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

  // Get the last data point to position avatars
  const lastDataPoint = data[data.length - 1];

  // Get top 3 candidates by their final values
  const top3 = lastDataPoint
    ? candidates
        .map((name, index) => ({
          name,
          value: (lastDataPoint[name] as number) || 0,
          avatar: avatars[index],
          color: COLORS[index % COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
    : [];

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
          <LineChart data={data} margin={{ top: 20, left: 40, right: 50, bottom: 10 }}>
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
            {/* Render avatars for top 3 at the end of their lines */}
            {lastDataPoint && top3.map((candidate) => (
              <ReferenceDot
                key={`avatar-${candidate.name}`}
                x={lastDataPoint.timestamp as number}
                y={candidate.value}
                r={0}
                shape={(props: any) => (
                  <AvatarDot
                    cx={props.cx}
                    cy={props.cy}
                    avatarUrl={candidate.avatar}
                    name={candidate.name}
                    color={candidate.color}
                  />
                )}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
