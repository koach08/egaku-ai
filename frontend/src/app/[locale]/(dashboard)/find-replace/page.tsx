"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InpaintCanvas } from "@/components/inpaint-canvas";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, ReplaceIcon } from "lucide-react";

export default function FindReplacePage() {
  const { session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); setMaskDataUrl(null); setError(""); }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !file || !maskDataUrl || !prompt.trim()) return;
    setLoading(true); setError("");
    try {
      const reader = new FileReader();
      const imageB64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const res = await api.findReplace(session.access_token, {
        image: imageB64, mask: maskDataUrl, prompt, seed: -1,
      });
      if (res.result_url) setResult(resolveResultUrl(res.result_url) || res.result_url);
      else setError("Replacement failed. Try a different prompt.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [session, file, maskDataUrl, prompt]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">Find & Replace</h1>
        <p className="text-sm text-muted-foreground mb-6">Paint over an object, describe what should replace it. AI swaps it out.</p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to use Find & Replace</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Upload Image</label>
              <input type="file" accept="image/*" onChange={handleFileChange}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-white/10 file:text-white/70 hover:file:bg-white/20" />
            </div>
            {file && (
              <div>
                <p className="text-xs text-white/40 mb-2">Paint red over the object you want to replace.</p>
                <InpaintCanvas imageFile={file} onMaskReady={setMaskDataUrl} />
              </div>
            )}
            {maskDataUrl && (
              <>
                <Input placeholder="What should replace it? (e.g. a golden retriever, a sports car, flowers)"
                  value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}
                  className="w-full bg-white text-black hover:bg-white/90 rounded-full">
                  {loading ? <><Loader2Icon className="size-4 mr-2 animate-spin" />Replacing...</> :
                    <><ReplaceIcon className="size-4 mr-2" />Replace Object (3 credits)</>}
                </Button>
              </>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {result && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium">Result</h2>
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <img src={result} alt="Replaced" className="w-full" />
                </div>
                <a href={result} download="find-replace.png" target="_blank" rel="noopener noreferrer">
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
