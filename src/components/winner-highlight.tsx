"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Candidate = {
  id: string;
  name: string;
  avatarUrl: string | null;
  voteCount: number;
};

type WinnerHighlightProps = {
  winner: Candidate | null;
};

export function WinnerHighlight({ winner }: WinnerHighlightProps) {
  if (!winner || winner.voteCount === 0) {
    return (
      <Card className="h-full">
        <CardContent className="py-12 text-center h-full flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">🤔</div>
          <h2 className="text-xl font-bold mb-2">Nenhum Lele ainda!</h2>
          <p className="text-muted-foreground">
            Vote em alguem para eleger o primeiro Lele do Ano
          </p>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="h-full relative overflow-hidden">
      {/* Background gradient decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-yellow-500/20 to-orange-500/20"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-400/30 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-2xl"></div>

      <CardContent className="relative py-6">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          {/* Trophy */}
          <div className="text-5xl md:text-6xl shrink-0">🏆</div>

          {/* Winner Avatar */}
          <div className="relative shrink-0">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 animate-pulse opacity-75"></div>
            <Avatar className="relative h-16 w-16 md:h-20 md:w-20 border-4 border-background shadow-xl">
              <AvatarImage src={winner.avatarUrl || undefined} alt={winner.name} />
              <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800">
                {getInitials(winner.name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-1 -right-1 text-xl">👑</div>
          </div>

          {/* Winner Info */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <h2 className="text-xl md:text-2xl font-bold truncate">
              {winner.name}
            </h2>
            <p className="text-amber-600 font-semibold text-sm">
              Lele do Ano 2026
            </p>
          </div>

          {/* Vote Count Badge */}
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg px-4 py-1.5 shadow-lg shrink-0">
            🗳️ {winner.voteCount} votos
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
