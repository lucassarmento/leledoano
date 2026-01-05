"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaderboard } from "@/components/leaderboard";
import { VoteFeed } from "@/components/vote-feed";
import { WinnerHighlight } from "@/components/winner-highlight";
import { ChartsDashboard } from "@/components/charts-dashboard";
import { CastVote } from "@/components/cast-vote";
import { createClient } from "@/lib/supabase/client";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VoteCommentDialog } from "@/components/vote-comment-dialog";

type Candidate = {
  id: string;
  name: string;
  avatarUrl: string | null;
  voteCount: number;
};

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
  const [rageCounter, setRageCounter] = useState(0);
  const [lastVoteTime, setLastVoteTime] = useState(0);
  const [penaltyTriggered, setPenaltyTriggered] = useState(false);
  const [rageModalOpen, setRageModalOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Add a vote (used for both regular votes and penalty votes)
  const addVote = (candidateId: string, isPenalty = false, comment?: string) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    // Optimistic update
    setCandidates((prev) =>
      prev
        .map((c) =>
          c.id === candidateId
            ? { ...c, voteCount: c.voteCount + 1 }
            : c
        )
        .sort((a, b) => b.voteCount - a.voteCount)
    );

    // Optimistic feed update
    const tempVote: VoteItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      comment: comment || null,
      voter: {
        id: currentUser.id,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
      },
      candidate: {
        id: candidate.id,
        name: candidate.name,
        avatarUrl: candidate.avatarUrl,
      },
    };
    setVotes((prev) => [tempVote, ...prev]);

    // Fire and forget
    fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId, comment: comment || undefined }),
    }).catch(() => {
      console.error("Vote failed");
    });

    if (isPenalty) {
      setRageModalOpen(true);
    }
  };

  // Open comment dialog for a candidate
  const openCommentDialog = (candidateId: string) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      setCommentDialogOpen(true);
    }
  };

  // Handle vote with comment
  const handleVoteWithComment = (candidateId: string, comment: string) => {
    addVote(candidateId, false, comment);
  };

  // Instant vote with rage click detection
  const handleVote = (candidateId: string) => {
    const now = Date.now();
    const timeSinceLastVote = now - lastVoteTime;

    // Reset counter if more than 2 seconds since last vote
    if (timeSinceLastVote > 2000) {
      setRageCounter(1);
      setPenaltyTriggered(false);
    } else {
      setRageCounter((prev) => prev + 1);
    }

    setLastVoteTime(now);

    // Add the vote
    addVote(candidateId);

    // Check for rage click penalty (5+ clicks within 2 seconds)
    if (rageCounter >= 4 && !penaltyTriggered && timeSinceLastVote <= 2000) {
      setPenaltyTriggered(true);
      // Add penalty vote to the rage clicker
      setTimeout(() => {
        addVote(currentUser.id, true);
      }, 300);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h1 className="text-lg font-semibold">Lele do Ano 2026</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser.avatarUrl || undefined} alt={currentUser.name} />
                  <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.isAdmin ? "Administrador" : "Participante"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {currentUser.isAdmin && (
                <DropdownMenuItem onClick={() => router.push("/admin")}>
                  Painel Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content - Bento Grid */}
      <main className="w-full px-6 py-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {/* Winner Highlight - Full width banner */}
          <div className="col-span-full">
            <WinnerHighlight winner={candidates[0] || null} />
          </div>

          {/* Cast Vote Widget */}
          <div className="md:col-span-1 lg:col-span-1 xl:col-span-2 h-[400px]">
            <CastVote
              candidates={candidates}
              currentUserId={currentUser.id}
              onVote={handleVote}
              onVoteWithComment={openCommentDialog}
            />
          </div>

          {/* Leaderboard */}
          <div className="md:col-span-1 lg:col-span-2 xl:col-span-2 h-[400px]">
            <Leaderboard
              candidates={candidates}
              currentUserId={currentUser.id}
              onVote={handleVote}
              onVoteWithComment={openCommentDialog}
            />
          </div>

          {/* Vote Feed */}
          <div className="md:col-span-2 lg:col-span-1 xl:col-span-2 h-[400px]">
            <VoteFeed votes={votes} />
          </div>

          {/* Charts Section - Bento tiles */}
          <ChartsDashboard />
        </div>
      </main>

      {/* Rage Click Penalty Modal */}
      <Dialog open={rageModalOpen} onOpenChange={setRageModalOpen}>
        <DialogContent
          className="sm:max-w-md text-center"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-center">
              <span className="text-6xl block mb-4">🐴</span>
              <span className="text-2xl">CALMA LA ANIMAL!</span>
            </DialogTitle>
            <DialogDescription className="text-center text-lg pt-4">
              Ta votando que nem um <strong className="text-foreground">ANIMAL</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="text-4xl mb-4">⬇️</div>
            <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-4">
              <p className="text-xl font-bold text-destructive">
                Tomou um voto pra voce!
              </p>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => setRageModalOpen(false)}
            className="w-full"
          >
            Entendi, vou me acalmar 😔
          </Button>
        </DialogContent>
      </Dialog>

      {/* Vote with Comment Dialog */}
      <VoteCommentDialog
        open={commentDialogOpen}
        onOpenChange={setCommentDialogOpen}
        candidate={selectedCandidate}
        onVote={handleVoteWithComment}
      />
    </div>
  );
}
