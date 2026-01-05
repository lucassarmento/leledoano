"use client";

import { useEffect, useState } from "react";
import {
  VoteDistributionChart,
  VotesOverTimeChart,
  TopVotersChart,
  WhoVotesForWhoChart,
  DailyActivityChart,
  HotStreakChart,
  LeaderboardRaceChart,
} from "@/components/charts";
import { Card, CardContent } from "@/components/ui/card";

type StatsData = {
  voteDistribution: { name: string; votes: number }[];
  votesOverTime: Record<string, string | number>[];
  topVoters: { name: string; votes: number }[];
  whoVotesForWho: { voter: string; candidate: string; count: number }[];
  dailyActivity: { day: string; votes: number }[];
  hotStreak: { name: string; votes: number }[];
  top5Candidates: string[];
  leaderboardRace: Record<string, string | number>[];
  leaderboardRaceCandidates: string[];
};

export function ChartsDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError("Erro ao carregar estatisticas");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="col-span-full">
        <Card className="h-[200px]">
          <CardContent className="py-12 text-center h-full flex flex-col items-center justify-center">
            <div className="text-4xl animate-spin mb-4">📊</div>
            <p className="text-muted-foreground">Carregando estatisticas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="col-span-full">
        <Card className="h-[200px]">
          <CardContent className="py-12 text-center h-full flex flex-col items-center justify-center">
            <div className="text-4xl mb-4">😢</div>
            <p className="text-muted-foreground">{error || "Erro ao carregar"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Row 1: Vote Distribution + Hot Streak + Top Voters */}
      <div className="md:col-span-1 lg:col-span-2 xl:col-span-2 h-[350px]">
        <VoteDistributionChart data={stats.voteDistribution} />
      </div>

      <div className="md:col-span-1 lg:col-span-2 xl:col-span-2 h-[350px]">
        <HotStreakChart data={stats.hotStreak} />
      </div>

      <div className="md:col-span-1 lg:col-span-2 xl:col-span-2 h-[350px]">
        <TopVotersChart data={stats.topVoters} />
      </div>

      {/* Row 2: Leaderboard Race - Full width */}
      <div className="col-span-full h-[400px] overflow-hidden">
        <LeaderboardRaceChart
          data={stats.leaderboardRace}
          candidates={stats.leaderboardRaceCandidates}
        />
      </div>

      {/* Row 3: Votes Over Time + Daily Activity */}
      <div className="col-span-full lg:col-span-2 xl:col-span-4 h-[350px] overflow-hidden">
        <VotesOverTimeChart data={stats.votesOverTime} candidates={stats.top5Candidates} />
      </div>

      <div className="md:col-span-1 lg:col-span-2 xl:col-span-2 h-[350px]">
        <DailyActivityChart data={stats.dailyActivity} />
      </div>

      {/* Row 4: Who Votes For Who - Full width */}
      <div className="col-span-full h-[400px]">
        <WhoVotesForWhoChart data={stats.whoVotesForWho} />
      </div>
    </>
  );
}
