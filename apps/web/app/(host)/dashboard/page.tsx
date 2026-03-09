"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, CircleNotch } from "@phosphor-icons/react";

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
        <h1 className="text-3xl font-bold">Sessions</h1>
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
        <div className="py-20 text-center space-y-4">
          <p className="text-muted-foreground">No sessions yet</p>
          <Button asChild>
            <a href="/session/new" className="inline-flex items-center gap-2">
              <Plus size={18} weight="bold" />
              Create your first session
            </a>
          </Button>
        </div>
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
                  <p className="text-sm text-muted-foreground">
                    {s.code} &middot; {s.type} &middot; {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
