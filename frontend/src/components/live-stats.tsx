"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

export function LiveStats() {
  const [stats, setStats] = useState({ users: 60, creations: 300, models: 30 });

  useEffect(() => {
    fetch(`${API_BASE}/stats`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-center">
      <div>
        <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {stats.models}+
        </p>
        <p className="text-sm text-muted-foreground">AI Models</p>
      </div>
      <div>
        <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {stats.users.toLocaleString()}+
        </p>
        <p className="text-sm text-muted-foreground">Creators</p>
      </div>
      <div>
        <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {stats.creations.toLocaleString()}+
        </p>
        <p className="text-sm text-muted-foreground">Creations</p>
      </div>
      <div>
        <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Free
        </p>
        <p className="text-sm text-muted-foreground">To Start</p>
      </div>
    </div>
  );
}
