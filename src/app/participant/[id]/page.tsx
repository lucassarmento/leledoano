"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "@/lib/date";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type ParticipantData = {
  profile: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  stats: {
    votesReceived: number;
    votesGiven: number;
    votesThisWeek: number;
    rank: number;
    totalParticipants: number;
    commentsReceived: number;
  };
  topHaters: {
    id: string;
    name: string;
    avatarUrl: string | null;
    count: number;
  }[];
  topTargets: {
    id: string;
    name: string;
    avatarUrl: string | null;
    count: number;
  }[];
  recentActivity: {
    id: string;
    createdAt: string;
    comment: string | null;
    type: "given" | "received";
    voter: { id: string; name: string; avatarUrl: string | null };
    candidate: { id: string; name: string; avatarUrl: string | null };
  }[];
  mutualRivalries: {
    id: string;
    name: string;
    avatarUrl: string | null;
    votesGiven: number;
    votesReceived: number;
    total: number;
  }[];
  funStats: {
    mostActiveDay: string | null;
  };
};

export default function ParticipantPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ParticipantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Rage click state
  const [rageCounter, setRageCounter] = useState(0);
  const [lastVoteTime, setLastVoteTime] = useState(0);
  const [penaltyTriggered, setPenaltyTriggered] = useState(false);
  const [rageModalOpen, setRageModalOpen] = useState(false);
  const [voting, setVoting] = useState(false);

  const id = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }

        const response = await fetch(`/api/participant/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError("Erro ao carregar dados do participante");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id, supabase.auth]);

  // Add a vote with optional penalty flag
  const addVote = async (candidateId: string, isPenalty = false) => {
    if (!data) return;

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          votesReceived: prev.stats.votesReceived + 1,
        },
      };
    });

    // Fire and forget
    fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    }).catch(() => {
      console.error("Vote failed");
    });

    if (isPenalty) {
      setRageModalOpen(true);
    }
  };

  // Handle vote with rage click detection
  const handleVote = () => {
    if (!data || voting) return;

    setVoting(true);
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
    addVote(data.profile.id);

    // Check for rage click penalty (5+ clicks within 2 seconds)
    if (rageCounter >= 4 && !penaltyTriggered && timeSinceLastVote <= 2000 && currentUserId) {
      setPenaltyTriggered(true);
      // Add penalty vote to the rage clicker
      setTimeout(() => {
        addVote(currentUserId, true);
      }, 300);
    }

    setTimeout(() => setVoting(false), 100);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="w-full px-6 flex h-14 items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="w-full px-6 py-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-[200px] col-span-full" />
            <Skeleton className="h-[100px]" />
            <Skeleton className="h-[100px]" />
            <Skeleton className="h-[100px]" />
            <Skeleton className="h-[100px]" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">😢</div>
            <p className="text-muted-foreground mb-4">{error || "Participante nao encontrado"}</p>
            <Button onClick={() => router.push("/")}>Voltar ao Inicio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, stats, topHaters, topTargets, recentActivity, mutualRivalries, funStats } = data;
  const isLeader = stats.rank === 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="w-full px-6 flex h-14 items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            ← Voltar
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{profile.name}</span>
        </div>
      </header>

      <main className="w-full px-6 py-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {/* Profile Header */}
          <Card className={`col-span-full relative overflow-hidden ${isLeader ? "border-amber-400" : ""}`}>
            {isLeader && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-yellow-500/20 to-orange-500/20" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-400/30 to-transparent rounded-full blur-3xl" />
              </>
            )}
            <CardContent className="relative py-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  {isLeader && (
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 animate-pulse opacity-75" />
                  )}
                  <Avatar className={`relative h-24 w-24 border-4 ${isLeader ? "border-amber-400" : "border-background"}`}>
                    <AvatarImage src={profile.avatarUrl || undefined} alt={profile.name} />
                    <AvatarFallback className="text-2xl">{getInitials(profile.name)}</AvatarFallback>
                  </Avatar>
                  {isLeader && <div className="absolute -top-2 -right-2 text-3xl">👑</div>}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-1">{profile.name}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    {isLeader ? (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        🏆 Lele do Ano 2026
                      </Badge>
                    ) : (
                      <Badge variant="secondary">#{stats.rank} no ranking</Badge>
                    )}
                    <Badge variant="outline">{stats.votesReceived} votos recebidos</Badge>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold">{stats.rank}º</div>
                    <div className="text-xs text-muted-foreground">Posicao</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stats.votesReceived}</div>
                    <div className="text-xs text-muted-foreground">Votos</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-500">{stats.votesThisWeek}</div>
                    <div className="text-xs text-muted-foreground">Esta semana</div>
                  </div>
                </div>

                {/* Vote Button */}
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg active:scale-95 transition-transform"
                  onClick={handleVote}
                  disabled={voting}
                >
                  🗳️ +1 Voto
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <Card>
            <CardContent className="py-6 text-center">
              <div className="text-4xl mb-2">🗳️</div>
              <div className="text-3xl font-bold">{stats.votesReceived}</div>
              <div className="text-sm text-muted-foreground">Votos Recebidos</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6 text-center">
              <div className="text-4xl mb-2">🐴</div>
              <div className="text-3xl font-bold">{stats.votesGiven}</div>
              <div className="text-sm text-muted-foreground">Votos Dados</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6 text-center">
              <div className="text-4xl mb-2">💬</div>
              <div className="text-3xl font-bold">{stats.commentsReceived}</div>
              <div className="text-sm text-muted-foreground">Justificativas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6 text-center">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-xl font-bold">{funStats.mostActiveDay || "—"}</div>
              <div className="text-sm text-muted-foreground">Dia Mais Ativo</div>
            </CardContent>
          </Card>

          {/* Mutual Rivalries */}
          {mutualRivalries.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span>🤝</span>
                  Rivalidades Mutuas
                </CardTitle>
                <CardDescription>Pessoas que trocam votos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mutualRivalries.map((rival) => (
                    <Link
                      href={`/participant/${rival.id}`}
                      key={rival.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={rival.avatarUrl || undefined} />
                        <AvatarFallback>{getInitials(rival.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{rival.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Deu {rival.votesGiven} • Recebeu {rival.votesReceived}
                        </div>
                      </div>
                      <Badge variant="secondary">{rival.total} total</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Haters */}
          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span>😈</span>
                Quem Mais Vota Nele
              </CardTitle>
              <CardDescription>Os maiores "haters"</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                {topHaters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum voto recebido ainda
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topHaters.map((hater, index) => (
                      <Link
                        href={`/participant/${hater.id}`}
                        key={hater.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-6 text-center font-bold text-muted-foreground">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={hater.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(hater.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 font-medium truncate">{hater.name}</div>
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {hater.count} votos
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Top Targets */}
          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span>🎯</span>
                Em Quem Ele Mais Vota
              </CardTitle>
              <CardDescription>Os alvos favoritos</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                {topTargets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum voto dado ainda
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topTargets.map((target, index) => (
                      <Link
                        href={`/participant/${target.id}`}
                        key={target.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-6 text-center font-bold text-muted-foreground">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={target.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(target.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 font-medium truncate">{target.name}</div>
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {target.count} votos
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-full lg:col-span-4 xl:col-span-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span>📋</span>
                Atividade Recente
              </CardTitle>
              <CardDescription>Ultimos votos envolvendo {profile.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma atividade ainda
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className={`p-4 ${activity.comment ? "border-l-2 border-amber-400" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {activity.type === "received" ? "📥" : "📤"}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">
                              {activity.type === "received" ? (
                                <>
                                  <Link href={`/participant/${activity.voter.id}`} className="font-medium hover:underline">
                                    {activity.voter.name}
                                  </Link>
                                  <span className="text-muted-foreground"> votou em </span>
                                  <span className="font-medium">{profile.name}</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-medium">{profile.name}</span>
                                  <span className="text-muted-foreground"> votou em </span>
                                  <Link href={`/participant/${activity.candidate.id}`} className="font-medium hover:underline">
                                    {activity.candidate.name}
                                  </Link>
                                </>
                              )}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.createdAt))}
                          </span>
                        </div>
                        {activity.comment && (
                          <div className="mt-2 ml-10 p-2 bg-muted/50 rounded-md">
                            <p className="text-sm italic text-muted-foreground">
                              "{activity.comment}"
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
    </div>
  );
}
