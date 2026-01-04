"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  loading?: boolean;
};

export function Leaderboard({
  candidates,
  currentUserId,
  onVote,
  loading,
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Ranking Lele do Ano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {candidates.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum participante ainda
          </p>
        ) : (
          candidates.map((candidate, index) => (
            <div
              key={candidate.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold w-8 text-center">
                  {getMedalEmoji(index) || `${index + 1}`}
                </span>
                <Avatar>
                  <AvatarImage src={candidate.avatarUrl || undefined} />
                  <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {candidate.name}
                    {candidate.id === currentUserId && (
                      <span className="text-muted-foreground text-sm ml-1">
                        (voce)
                      </span>
                    )}
                  </p>
                  <Badge variant="secondary">{candidate.voteCount} votos</Badge>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onVote(candidate.id)}
                disabled={loading}
              >
                Votar
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
