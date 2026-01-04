"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type VoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  onConfirm: () => void;
  loading?: boolean;
};

export function VoteDialog({
  open,
  onOpenChange,
  candidate,
  onConfirm,
  loading,
}: VoteDialogProps) {
  if (!candidate) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar voto</DialogTitle>
          <DialogDescription>
            Voce esta prestes a votar em alguem para Lele do Ano!
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20">
              <AvatarImage src={candidate.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <p className="text-lg font-semibold">{candidate.name}</p>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Votando..." : "Confirmar voto 🗳️"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
