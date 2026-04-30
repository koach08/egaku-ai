"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, MicIcon } from "lucide-react";

const VOICES = [
  { id: "alloy", name: "Alloy", desc: "Neutral, versatile" },
  { id: "echo", name: "Echo", desc: "Warm, male" },
  { id: "fable", name: "Fable", desc: "Expressive, storytelling" },
  { id: "onyx", name: "Onyx", desc: "Deep, authoritative" },
  { id: "nova", name: "Nova", desc: "Friendly, female" },
  { id: "shimmer", name: "Shimmer", desc: "Soft, gentle" },
];

export default function VoiceoverPage() {
  const { session } = useAuth();
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !text.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const audioBlob = await api.synthesizeSpeech(session.access_token, { text, voice_id: voice });
      const audioUrl = URL.createObjectURL(audioBlob);
      setResult(audioUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [session, text, voice]);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const credits = Math.max(5, Math.ceil(wordCount / 50) * 5);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">AI Voiceover</h1>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Type your script, choose a voice, get professional voiceover audio. For videos, ads, podcasts.</p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to generate voiceovers</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Textarea placeholder="Type or paste your script here..."
              value={text} onChange={(e) => setText(e.target.value)} rows={6} />
            <p className="text-xs text-white/30">{wordCount} words, ~{Math.ceil(wordCount / 150)} min</p>
            <div>
              <label className="block text-xs text-white/40 mb-3">Voice</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VOICES.map((v) => (
                  <button key={v.id} onClick={() => setVoice(v.id)}
                    className={`text-left rounded-xl p-3 transition-all ${voice === v.id ? "ring-1 ring-white bg-white/10" : "border border-white/[0.06] hover:border-white/20"}`}>
                    <h3 className="text-xs font-semibold">{v.name}</h3>
                    <p className="text-[10px] text-white/40">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={loading || !text.trim()}
              className="w-full bg-white text-black hover:bg-white/90 rounded-full">
              {loading ? <><Loader2Icon className="size-4 mr-2 animate-spin" />Generating...</> :
                <><MicIcon className="size-4 mr-2" />Generate Voiceover (~{credits} credits)</>}
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {result && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium">Result</h2>
                <audio src={result} controls className="w-full" />
                <a href={result} download="voiceover.mp3" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-full"><DownloadIcon className="size-4 mr-2" />Download</Button>
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
