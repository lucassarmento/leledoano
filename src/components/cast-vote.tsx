"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Candidate = {
  id: string;
  name: string;
  avatarUrl: string | null;
  voteCount: number;
};

type CastVoteProps = {
  candidates: Candidate[];
  currentUserId: string;
  onVote: (candidateId: string) => void;
  onVoteWithComment: (candidateId: string) => void;
};

export function CastVote({
  candidates,
  currentUserId,
  onVote,
  onVoteWithComment,
}: CastVoteProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedCandidate = candidates.find((c) => c.id === selectedId);

  const handleQuickVote = () => {
    if (selectedId) {
      onVote(selectedId);
      // Keep selection so user can vote multiple times easily
    }
  };

  const handleVoteWithComment = () => {
    if (selectedId) {
      onVoteWithComment(selectedId);
      // Keep selection so user can vote multiple times easily
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <span>🗳️</span>
          Votar
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Escolha o lele e vote
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Participant Selector */}
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um participante..." />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((candidate) => (
              <SelectItem key={candidate.id} value={candidate.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={candidate.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(candidate.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{candidate.name}</span>
                  {candidate.id === currentUserId && (
                    <span className="text-muted-foreground text-xs">(voce)</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selected Preview */}
        {selectedCandidate && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedCandidate.avatarUrl || undefined} />
              <AvatarFallback>{getInitials(selectedCandidate.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedCandidate.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedCandidate.voteCount} votos atuais
              </p>
            </div>
          </div>
        )}

        {/* Vote Buttons */}
        <div className="flex flex-col gap-2 mt-auto">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            disabled={!selectedId}
            onClick={handleQuickVote}
          >
            +1 Voto Rapido
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            disabled={!selectedId}
            onClick={handleVoteWithComment}
          >
            💬 Votar com Justificativa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
