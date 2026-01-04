"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaderboard } from "@/components/leaderboard";
import { VoteFeed } from "@/components/vote-feed";
import { VoteDialog } from "@/components/vote-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";

type Candidate = {
  id: string;
  name: string;
  avatarUrl: string | null;
  voteCount: number;
};

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

type Profile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

type HomePageProps = {
  leaderboard: Candidate[];
  feed: VoteItem[];
  currentUser: Profile;
};

export function HomePage({ leaderboard, feed, currentUser }: HomePageProps) {
  const [candidates, setCandidates] = useState(leaderboard);
  const [votes, setVotes] = useState(feed);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [voting, setVoting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleVoteClick = (candidateId: string) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      setDialogOpen(true);
    }
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;

    setVoting(true);

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selectedCandidate.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao votar");
        return;
      }

      // Update local state
      setCandidates((prev) =>
        prev
          .map((c) =>
            c.id === selectedCandidate.id
              ? { ...c, voteCount: c.voteCount + 1 }
              : c
          )
          .sort((a, b) => b.voteCount - a.voteCount)
      );

      // Add to feed
      const newVote: VoteItem = {
        id: data.vote.id,
        createdAt: new Date().toISOString(),
        voter: {
          id: currentUser.id,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
        },
        candidate: {
          id: selectedCandidate.id,
          name: selectedCandidate.name,
          avatarUrl: selectedCandidate.avatarUrl,
        },
      };

      setVotes((prev) => [newVote, ...prev]);

      toast.success(`Voce votou em ${selectedCandidate.name}! 🗳️`);
      setDialogOpen(false);
    } catch {
      toast.error("Erro ao votar. Tente novamente.");
    } finally {
      setVoting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold">🏆 Lele do Ano</h1>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatarUrl || undefined} />
                  <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{currentUser.name}</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={currentUser.avatarUrl || undefined} />
                    <AvatarFallback>
                      {getInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{currentUser.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentUser.isAdmin ? "Administrador" : "Participante"}
                    </p>
                  </div>
                </div>

                {currentUser.isAdmin && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/admin")}
                  >
                    Painel Admin
                  </Button>
                )}

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Leaderboard
            candidates={candidates}
            currentUserId={currentUser.id}
            onVote={handleVoteClick}
            loading={voting}
          />
          <VoteFeed votes={votes} />
        </div>
      </main>

      {/* Vote Dialog */}
      <VoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidate={selectedCandidate}
        onConfirm={handleConfirmVote}
        loading={voting}
      />
    </div>
  );
}
