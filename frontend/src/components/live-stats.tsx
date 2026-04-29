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
    <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
      <div>
        <p className="text-3xl font-bold text-white/90">
          {stats.models}+
        </p>
        <p className="text-xs text-white/40 mt-1">AI Models</p>
      </div>
      <div>
        <p className="text-3xl font-bold text-white/90">
          {stats.creations.toLocaleString()}+
        </p>
        <p className="text-xs text-white/40 mt-1">Creations</p>
      </div>
      <div>
        <p className="text-3xl font-bold text-white/90">
          Free
        </p>
        <p className="text-xs text-white/40 mt-1">To Start</p>
      </div>
    </div>
  );
}
