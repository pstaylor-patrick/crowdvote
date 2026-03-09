"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    lobby: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    finished: "bg-muted text-muted-foreground",
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sessions</h1>
        <Button asChild>
          <a href="/session/new">New Session</a>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No sessions yet</p>
            <Button asChild>
              <a href="/session/new">Create your first session</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((s) => (
            <a key={s.id} href={`/session/${s.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[s.status] || ""}`}
                  >
                    {s.status}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Code: {s.code}</span>
                    <span>Type: {s.type}</span>
                    <span>
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
