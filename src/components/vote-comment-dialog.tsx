"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Candidate = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type VoteCommentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onVote: (candidateId: string, comment: string) => void;
};

export function VoteCommentDialog({
  open,
  onOpenChange,
  candidate,
  onVote,
}: VoteCommentDialogProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = () => {
    if (!candidate || !comment.trim()) return;

    setIsSubmitting(true);
    onVote(candidate.id, comment.trim());

    // Reset and close
    setComment("");
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setComment("");
    onOpenChange(false);
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            Votar com Justificativa
          </DialogTitle>
          <DialogDescription>
            Explique por que essa pessoa merece esse voto
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Candidate being voted for */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4">
            <Avatar>
              <AvatarImage src={candidate.avatarUrl || undefined} alt={candidate.name} />
              <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Votando em:</p>
              <p className="font-semibold">{candidate.name}</p>
            </div>
          </div>

          {/* Comment textarea */}
          <Textarea
            placeholder="Ex: Esse voto é pela sua opinião sobre inflação no Brasil, a coisa mais burra que já ouvi..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {comment.length}/500 caracteres
          </p>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!comment.trim() || isSubmitting}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            Votar com Justificativa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
