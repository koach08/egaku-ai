"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, ShirtIcon } from "lucide-react";

export default function VirtualTryOnPage() {
  const { session } = useAuth();
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("a person wearing the garment");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePersonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setPersonFile(f); setPersonPreview(URL.createObjectURL(f)); setResult(null); }
  }, []);

  const handleGarmentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setGarmentFile(f); setGarmentPreview(URL.createObjectURL(f)); setResult(null); }
  }, []);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !personFile || !garmentFile) return;
    setLoading(true); setError("");
    try {
      const [personB64, garmentB64] = await Promise.all([
        fileToBase64(personFile), fileToBase64(garmentFile),
      ]);
      const res = await api.virtualTryOn(session.access_token, {
        human_image: personB64, garment_image: garmentB64, description,
      });
      if (res.result_url) setResult(resolveResultUrl(res.result_url) || res.result_url);
      else setError("Try-on failed. Try different images.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [session, personFile, garmentFile, description]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Virtual Try-On</h1>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Upload your photo and a clothing image. AI puts the outfit on you.</p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to use Virtual Try-On</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Photo</label>
                <input type="file" accept="image/*" onChange={handlePersonChange}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-white/10 file:text-white/70 hover:file:bg-white/20" />
                {personPreview && <img src={personPreview} alt="Person" className="mt-3 rounded-xl max-h-64 object-contain" />}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Clothing Image</label>
                <input type="file" accept="image/*" onChange={handleGarmentChange}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-white/10 file:text-white/70 hover:file:bg-white/20" />
                {garmentPreview && <img src={garmentPreview} alt="Garment" className="mt-3 rounded-xl max-h-64 object-contain" />}
              </div>
            </div>
            <Input placeholder="Description (e.g. a woman wearing a red dress)" value={description}
              onChange={(e) => setDescription(e.target.value)} />
            <Button onClick={handleGenerate} disabled={loading || !personFile || !garmentFile}
              className="w-full bg-white text-black hover:bg-white/90 rounded-full">
              {loading ? <><Loader2Icon className="size-4 mr-2 animate-spin" />Processing...</> :
                <><ShirtIcon className="size-4 mr-2" />Try On (5 credits)</>}
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {result && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium">Result</h2>
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <img src={result} alt="Try-on result" className="w-full" />
                </div>
                <a href={result} download="tryon-result.png" target="_blank" rel="noopener noreferrer">
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
