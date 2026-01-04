"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type Candidate = {
  id: string;
  name: string;
  avatarUrl: string | null;
  voteCount: number;
};

type LeaderboardProps = {
  candidates: Candidate[];
  currentUserId: string;
  onVote: (candidateId: string) => void;
  onVoteWithComment: (candidateId: string) => void;
};

export function Leaderboard({
  candidates,
  currentUserId,
  onVote,
  onVoteWithComment,
}: LeaderboardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <span>📊</span>
          Ranking Completo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {candidates.length} participantes
        </p>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {candidates.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Nenhum participante ainda
            </div>
          ) : (
            <div className="divide-y">
              {candidates.map((candidate, index) => (
                <div
                  key={candidate.id}
                  className={`flex items-center justify-between gap-4 p-4 hover:bg-muted/50 transition-colors ${
                    index === 0 ? "bg-amber-50/50" : ""
                  }`}
                >
                  <Link
                    href={`/participant/${candidate.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    {/* Rank */}
                    <div className="w-8 text-center font-bold text-lg shrink-0">
                      {getMedalEmoji(index) || `${index + 1}`}
                    </div>

                    {/* Avatar */}
                    <Avatar className={`shrink-0 ${index === 0 ? "ring-2 ring-amber-400" : ""}`}>
                      <AvatarImage src={candidate.avatarUrl || undefined} alt={candidate.name} />
                      <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                    </Avatar>

                    {/* Name and votes */}
                    <div className="min-w-0">
                      <div className="font-medium truncate hover:underline">
                        {candidate.name}
                        {candidate.id === currentUserId && (
                          <span className="text-muted-foreground text-sm ml-1">(voce)</span>
                        )}
                      </div>
                      <Badge
                        variant={index === 0 ? "default" : "secondary"}
                        className={index === 0 ? "bg-amber-500 hover:bg-amber-600" : ""}
                      >
                        {candidate.voteCount} votos
                      </Badge>
                    </div>
                  </Link>

                  {/* Vote Buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="active:scale-95 transition-transform h-8 w-8 p-0"
                      onClick={() => onVoteWithComment(candidate.id)}
                      title="Votar com justificativa"
                    >
                      💬
                    </Button>
                    <Button
                      size="sm"
                      variant={index === 0 ? "default" : "outline"}
                      className="active:scale-95 transition-transform"
                      onClick={() => onVote(candidate.id)}
                    >
                      +1
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
