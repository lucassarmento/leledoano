"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "@/lib/date";

type VoteItem = {
  id: string;
  createdAt: string;
  comment: string | null;
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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <span>📢</span>
          Ultimos Votos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {votes.length} votos registrados
        </p>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {votes.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Nenhum voto ainda. Seja o primeiro!
            </div>
          ) : (
            <div className="divide-y">
              {votes.map((vote) => (
                <div
                  key={vote.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${vote.comment ? "border-l-2 border-amber-400" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Voter Avatar */}
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={vote.voter.avatarUrl || undefined} alt={vote.voter.name} />
                      <AvatarFallback className="text-xs">{getInitials(vote.voter.name)}</AvatarFallback>
                    </Avatar>

                    {/* Vote Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{vote.voter.name}</span>
                        <span className="text-muted-foreground"> votou em </span>
                        <span className="font-medium">{vote.candidate.name}</span>
                      </p>
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDistanceToNow(new Date(vote.createdAt))}
                    </span>
                  </div>

                  {/* Comment */}
                  {vote.comment && (
                    <div className="mt-2 ml-11 p-2 bg-muted/50 rounded-md">
                      <p className="text-sm italic text-muted-foreground">
                        "{vote.comment}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
