"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { InpaintCanvas } from "@/components/inpaint-canvas";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, Trash2Icon } from "lucide-react";

export default function RemoveObjectPage() {
  const { session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setMaskDataUrl(null);
      setError("");
    }
  }, []);

  const handleMaskReady = useCallback((dataUrl: string) => {
    setMaskDataUrl(dataUrl);
  }, []);

  const handleRemove = useCallback(async () => {
    if (!session?.access_token || !file || !maskDataUrl) return;
    setLoading(true);
    setError("");

    try {
      // Convert file to base64
      const reader = new FileReader();
      const imageB64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const res = await api.removeObject(session.access_token, {
        image: imageB64,
        mask: maskDataUrl,
      });

      if (res.result_url) {
        setResult(resolveResultUrl(res.result_url) || res.result_url);
      } else {
        setError("Object removal failed. Try painting a larger area.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [session, file, maskDataUrl]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">Object Removal</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Upload an image, paint over the object you want to remove, and AI will erase it cleanly.
        </p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to use Object Removal</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-white/10 file:text-white/70 hover:file:bg-white/20"
              />
            </div>

            {/* Canvas */}
            {file && (
              <div>
                <p className="text-xs text-white/40 mb-2">Paint red over the object to remove.</p>
                <InpaintCanvas imageFile={file} onMaskReady={handleMaskReady} />
              </div>
            )}

            {/* Generate button */}
            {maskDataUrl && (
              <Button
                onClick={handleRemove}
                disabled={loading}
                className="w-full bg-white text-black hover:bg-white/90 rounded-full"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="size-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2Icon className="size-4 mr-2" />
                    Remove Object (2 credits)
                  </>
                )}
              </Button>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium">Result</h2>
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <img src={result} alt="Object removed" className="w-full" />
                </div>
                <a href={result} download="object-removed.png" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-full">
                    <DownloadIcon className="size-4 mr-2" />
                    Download
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
