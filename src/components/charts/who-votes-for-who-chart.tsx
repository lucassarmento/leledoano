"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type WhoVotesForWhoProps = {
  data: { voter: string; candidate: string; count: number }[];
};

export function WhoVotesForWhoChart({ data }: WhoVotesForWhoProps) {
  // Get unique voters and candidates
  const voters = [...new Set(data.map((d) => d.voter))];
  const candidates = [...new Set(data.map((d) => d.candidate))];

  // Create matrix
  const matrix: Record<string, Record<string, number>> = {};
  voters.forEach((voter) => {
    matrix[voter] = {};
    candidates.forEach((candidate) => {
      matrix[voter][candidate] = 0;
    });
  });

  data.forEach((d) => {
    matrix[d.voter][d.candidate] = d.count;
  });

  // Find max for color scaling
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.33) return "bg-amber-200";
    if (intensity < 0.66) return "bg-amber-400";
    return "bg-amber-600 text-white";
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <span>🎯</span>
          Quem Vota em Quem
        </CardTitle>
        <CardDescription>Matriz de rivalidades - quem ta perseguindo quem</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4 overflow-hidden flex flex-col">
        <ScrollArea className="w-full flex-1">
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: `80px repeat(${candidates.length}, 1fr)`,
            }}
          >
            {/* Header row */}
            <div className="h-8" /> {/* Empty corner */}
            {candidates.map((candidate) => (
              <div
                key={candidate}
                className="h-8 flex items-center justify-center text-xs font-medium truncate px-1"
                title={candidate}
              >
                {candidate.split(" ")[0]}
              </div>
            ))}

            {/* Data rows */}
            {voters.map((voter) => (
              <React.Fragment key={voter}>
                <div className="h-10 flex items-center text-xs font-medium truncate pr-2" title={voter}>
                  {voter.split(" ")[0]}
                </div>
                {candidates.map((candidate) => {
                  const count = matrix[voter][candidate];
                  return (
                    <div
                      key={`${voter}-${candidate}`}
                      className={`h-10 flex items-center justify-center text-xs font-bold border border-background ${getColor(
                        count
                      )}`}
                      title={`${voter} votou ${count}x em ${candidate}`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground shrink-0">
          <span>Intensidade:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-muted rounded" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-amber-200 rounded" />
            <span>Baixo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-amber-400 rounded" />
            <span>Medio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-amber-600 rounded" />
            <span>Alto</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
