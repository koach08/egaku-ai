"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, LinkIcon, ImageIcon } from "lucide-react";

const AD_FORMATS = [
  { id: "product_hero", name: "Product Hero", desc: "Clean product shot with dramatic lighting", prompt: "professional product photography of [PRODUCT], dramatic studio lighting, premium feel, commercial quality, 8K" },
  { id: "lifestyle", name: "Lifestyle", desc: "Product in real-life setting", prompt: "lifestyle photography of [PRODUCT] being used in a modern setting, natural lighting, authentic, editorial quality" },
  { id: "social_square", name: "Social (Square)", desc: "Instagram-ready square format", prompt: "[PRODUCT] centered on clean background, vibrant colors, social media ready, commercial photography, square format" },
  { id: "banner", name: "Banner Ad", desc: "Wide format for web banners", prompt: "[PRODUCT] with clean space for text overlay, professional advertising layout, wide banner format, commercial quality" },
  { id: "ugc_style", name: "UGC Style", desc: "User-generated content look", prompt: "person holding [PRODUCT], casual selfie style, authentic UGC aesthetic, natural lighting, iPhone quality, genuine expression" },
  { id: "unboxing", name: "Unboxing", desc: "Product unboxing moment", prompt: "hands opening a package revealing [PRODUCT], unboxing moment, excitement, close-up, natural lighting, authentic" },
];

export default function UrlToAdPage() {
  const { session } = useAuth();
  const [url, setUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["product_hero", "lifestyle"]);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleFormat = (id: string) => {
    setSelectedFormats((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  const handleFetchProduct = useCallback(async () => {
    if (!url.trim()) return;
    // For now, just extract domain name as product hint
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      setProductName(domain.split(".")[0]);
      setProductDesc(`Product from ${domain}`);
    } catch {
      setProductName(url);
    }
  }, [url]);

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !productName.trim() || selectedFormats.length === 0) return;
    setLoading(true); setError(""); setResults({});
    try {
      for (const formatId of selectedFormats) {
        const format = AD_FORMATS.find((f) => f.id === formatId);
        if (!format) continue;
        const prompt = format.prompt.replace(/\[PRODUCT\]/g, `${productName}${productDesc ? ` (${productDesc})` : ""}`);
        const dims = formatId === "banner" ? { width: 1024, height: 512 } :
                     formatId === "social_square" ? { width: 1024, height: 1024 } :
                     { width: 1024, height: 1024 };

        const res = await api.generateImage(session.access_token, {
          prompt, model: "fal_flux_dev", ...dims, steps: 25, cfg: 7.0, seed: -1, nsfw: false,
        });
        if (res.result_url) {
          setResults((prev) => ({ ...prev, [formatId]: resolveResultUrl(res.result_url) || res.result_url }));
        } else if (res.job_id) {
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const status = await api.getJobStatus(session.access_token, res.job_id);
            if (status.status === "completed" && status.result_url) {
              setResults((prev) => ({ ...prev, [formatId]: resolveResultUrl(status.result_url) || status.result_url }));
              break;
            }
            if (status.status === "failed") break;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [session, productName, productDesc, selectedFormats]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">URL to Ad</h1>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Paste a product URL or describe your product. Get ad-ready images in multiple formats.</p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to create ads</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2">
              <Input placeholder="Paste product URL (Amazon, Shopify, Instagram...)" value={url}
                onChange={(e) => setUrl(e.target.value)} className="flex-1" />
              <Button variant="outline" onClick={handleFetchProduct} className="rounded-full">
                <LinkIcon className="size-4 mr-1" />Fetch
              </Button>
            </div>
            <div className="text-xs text-white/30">or describe manually:</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} />
              <Input placeholder="Brief description" value={productDesc} onChange={(e) => setProductDesc(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-3">Ad Formats ({selectedFormats.length} selected, {selectedFormats.length * 3} credits)</label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {AD_FORMATS.map((f) => (
                  <button key={f.id} onClick={() => toggleFormat(f.id)}
                    className={`text-left rounded-xl p-3 transition-all ${selectedFormats.includes(f.id) ? "ring-1 ring-white bg-white/10" : "border border-white/[0.06] hover:border-white/20"}`}>
                    <h3 className="text-xs font-semibold">{f.name}</h3>
                    <p className="text-[10px] text-white/40">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={loading || !productName.trim() || selectedFormats.length === 0}
              className="w-full bg-white text-black hover:bg-white/90 rounded-full">
              {loading ? <><Loader2Icon className="size-4 mr-2 animate-spin" />Generating ads...</> :
                <><ImageIcon className="size-4 mr-2" />Generate Ads ({selectedFormats.length * 3} credits)</>}
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {Object.keys(results).length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {selectedFormats.map((id) => {
                  const format = AD_FORMATS.find((f) => f.id === id);
                  return (
                    <div key={id} className="rounded-xl overflow-hidden border border-white/[0.06]">
                      {results[id] ? (
                        <>
                          <img src={results[id]} alt={format?.name} className="w-full" />
                          <div className="p-2 flex items-center justify-between">
                            <span className="text-xs text-white/50">{format?.name}</span>
                            <a href={results[id]} download={`ad-${id}.png`} target="_blank" rel="noopener noreferrer">
                              <DownloadIcon className="size-3 text-white/30 hover:text-white/70" />
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="aspect-square flex items-center justify-center bg-white/[0.02]">
                          <Loader2Icon className="size-5 animate-spin text-white/20" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
