"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "@/lib/date";

type VoteItem = {
  id: string;
  createdAt: string;
  voter: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  candidate: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

type VoteFeedProps = {
  votes: VoteItem[];
};

export function VoteFeed({ votes }: VoteFeedProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📢 Ultimos votos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {votes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum voto ainda. Seja o primeiro!
            </p>
          ) : (
            <div className="space-y-3">
              {votes.map((vote) => (
                <div
                  key={vote.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={vote.voter.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(vote.voter.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{vote.voter.name}</span>
                    <span className="text-muted-foreground"> votou em </span>
                    <span className="font-medium">{vote.candidate.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(vote.createdAt))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
