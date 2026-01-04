"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast, Toaster } from "sonner";

type AllowedPhone = {
  id: string;
  phone: string;
  name: string;
  is_admin: boolean;
};

type PastWinner = {
  id: string;
  year: number;
  totalVotes: number;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

type AdminPanelProps = {
  allowedPhones: AllowedPhone[];
  pastWinners: PastWinner[];
};

export function AdminPanel({ allowedPhones, pastWinners }: AdminPanelProps) {
  const [phones, setPhones] = useState(allowedPhones);
  const [winners] = useState(pastWinners);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const router = useRouter();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length > 0 && !digits.startsWith("55")) {
      return `+55${digits}`;
    }
    return `+${digits}`;
  };

  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const formattedPhone = formatPhone(newPhone);

      const response = await fetch("/api/admin/phones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone, name: newName }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao adicionar telefone");
        return;
      }

      setPhones((prev) => [data, ...prev]);
      setNewPhone("");
      setNewName("");
      toast.success(`${newName} adicionado!`);
    } catch {
      toast.error("Erro ao adicionar telefone");
    } finally {
      setAdding(false);
    }
  };

  const handleResetYear = async () => {
    setResetting(true);

    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: new Date().getFullYear() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao resetar");
        return;
      }

      toast.success("Ano resetado com sucesso!");
      setResetDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Erro ao resetar");
    } finally {
      setResetting(false);
    }
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
          <h1 className="text-xl font-bold">Painel Admin</h1>
          <Button variant="outline" onClick={() => router.push("/")}>
            Voltar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Allowed Phones */}
          <Card>
            <CardHeader>
              <CardTitle>Telefones Autorizados</CardTitle>
              <CardDescription>
                Adicione os telefones dos participantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddPhone} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Joao da Silva"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="21999999999"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={adding} className="w-full">
                  {adding ? "Adicionando..." : "Adicionar"}
                </Button>
              </form>

              <div className="space-y-2 pt-4">
                <h4 className="text-sm font-medium">Lista de autorizados:</h4>
                {phones.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum telefone autorizado
                  </p>
                ) : (
                  phones.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.phone}</p>
                      </div>
                      {p.is_admin && <Badge>Admin</Badge>}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Past Winners */}
          <Card>
            <CardHeader>
              <CardTitle>Leles do Ano</CardTitle>
              <CardDescription>Historico de vencedores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {winners.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum vencedor ainda
                </p>
              ) : (
                winners.map((winner) => (
                  <div
                    key={winner.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={winner.user.avatarUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(winner.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{winner.user.name}</p>
                        <Badge variant="secondary">
                          {winner.totalVotes} votos
                        </Badge>
                      </div>
                    </div>
                    <span className="text-2xl font-bold">{winner.year}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Acoes irreversiveis. Tenha cuidado!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setResetDialogOpen(true)}
            >
              Encerrar Ano e Resetar Votos
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar o ano?</DialogTitle>
            <DialogDescription>
              Isso vai arquivar o vencedor atual e apagar todos os votos de{" "}
              {new Date().getFullYear()}. Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              disabled={resetting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetYear}
              disabled={resetting}
            >
              {resetting ? "Resetando..." : "Confirmar Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
