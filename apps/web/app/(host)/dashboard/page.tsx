"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Hash,
  ListNumbers,
  Calendar,
  Plus,
  Megaphone,
  FolderOpen,
  CircleNotch,
} from "@phosphor-icons/react";

interface Session {
  id: string;
  title: string;
  code: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold inline-flex items-center gap-2">
          <Megaphone size={28} weight="fill" />
          Sessions
        </h1>
        <Button asChild>
          <a href="/session/new" className="inline-flex items-center gap-2">
            <Plus size={18} weight="bold" />
            New Session
          </a>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <CircleNotch size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center space-y-4">
            <FolderOpen size={48} className="mx-auto text-muted-foreground/50 animate-pulse" />
            <p className="text-muted-foreground">No sessions yet</p>
            <Button asChild>
              <a href="/session/new" className="inline-flex items-center gap-2">
                <Plus size={18} weight="bold" />
                Create your first session
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((s) => (
            <a key={s.id} href={`/session/${s.id}`}>
              <Card className="hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                  <StatusBadge status={s.status} />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Hash size={14} />
                      {s.code}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ListNumbers size={14} />
                      {s.type}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
