"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { CivitAIBrowser } from "@/components/civitai-browser";
import { toast } from "sonner";

type AdultModel = {
  id: string;
  name: string;
  credits: number;
  badge: string;
};

type VideoModel = {
  id: string;
  name: string;
  credits: number;
  badge: string;
  type: string;
};

type RegionRules = {
  region: string;
  mosaic_required: boolean;
  mosaic_default: boolean;
  nsfw_public_allowed: boolean;
  legal_warnings: string[];
};

type AdultPlan = {
  name: string;
  price: number;
  original_price?: number;
  credits: number;
  generations_per_month: number;
};

type SubStatus = {
  adult_plan: string;
  has_access: boolean;
  access_via: string;
  main_plan: string;
  age_verified: boolean;
};

export default function AdultPage() {
  const { user, session, loading: authLoading } = useAuth();

  // Age gate
  const [ageVerified, setAgeVerified] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(true);

  // Subscription
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [plans, setPlans] = useState<Record<string, AdultPlan>>({});
  const [showPlans, setShowPlans] = useState(false);

  // Models & region
  const [models, setModels] = useState<AdultModel[]>([]);
  const [videoModels, setVideoModels] = useState<VideoModel[]>([]);
  const [regionRules, setRegionRules] = useState<RegionRules | null>(null);

  // Mode
  const [mode, setMode] = useState<"image" | "video" | "civitai" | "img2img" | "controlnet" | "vid2vid">("image");

  // vid2vid
  const [inputVideo, setInputVideo] = useState<File | null>(null);
  const [inputVideoPreview, setInputVideoPreview] = useState<string | null>(null);
  const [v2vStylePreset, setV2vStylePreset] = useState("custom");

  // CivitAI custom models
  const [customModels, setCustomModels] = useState<
    { id: string; name: string; civitai_model_id: number; civitai_version_id: number; preview_url?: string; category: string; description: string; source: string }[]
  >([]);
  const [customSlotsUsed, setCustomSlotsUsed] = useState(0);
  const [customSlotsMax, setCustomSlotsMax] = useState(0);
  const [civitaiModelName, setCivitaiModelName] = useState("");

  // img2img / controlnet
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(null);
  const [denoise, setDenoise] = useState(0.7);
  const [controlType, setControlType] = useState("openpose");
  const [controlStrength, setControlStrength] = useState(1.0);

  // Generation params
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, extra fingers, missing fingers, extra limbs, disfigured, poorly drawn face, mutated, bad proportions, gross proportions, extra eyes, missing arms, missing legs, fused fingers, too many fingers, long neck, malformed limbs");
  const [model, setModel] = useState("novita_uber_realistic_porn");
  const [videoModel, setVideoModel] = useState("fal_kling_t2v");
  const [width, setWidth] = useState(768);
  const [height, setHeight] = useState(1024);
  const [steps, setSteps] = useState(25);
  const [cfg, setCfg] = useState(7);
  const [sampler, setSampler] = useState("euler_ancestral");
  const [seed, setSeed] = useState(-1);
  const [mosaicEnabled, setMosaicEnabled] = useState(true);
  // Video duration & resolution
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoResolution, setVideoResolution] = useState("720p");
  // Free model selection
  const [customModelName, setCustomModelName] = useState("");
  // LoRA support
  const [loraModel, setLoraModel] = useState("");
  const [loraStrength, setLoraStrength] = useState(0.8);

  // I2V prompt suggestions
  const [i2vSuggestions, setI2vSuggestions] = useState<{label: string; prompt: string; icon: string}[]>([]);
  const [i2vMode, setI2vMode] = useState<"animate" | "reimagine">("animate");
  const [suggestingPrompts, setSuggestingPrompts] = useState(false);

  // Batch (paid users only)
  const [batchSize, setBatchSize] = useState(1);
  const [resultUrls, setResultUrls] = useState<string[]>([]);

  // Job state
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"image" | "video">("image");
  const [error, setError] = useState<string | null>(null);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Legal warning dismissed
  const [legalDismissed, setLegalDismissed] = useState(false);

  // Showcase gallery
  const [showcase, setShowcase] = useState<{ id: string; prompt: string; model: string; image_url?: string; video_url?: string }[]>([]);
  // JP mosaic requirement (Article 175 Penal Code)
  const [mosaicRequired, setMosaicRequired] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (!session) return;

    api.getAdultSubscription(session.access_token)
      .then((data) => {
        setSubStatus(data);
        setAgeVerified(data.age_verified);
        if (data.age_verified) setShowAgeGate(false);
      })
      .catch(() => {});

    api.getAdultModels()
      .then((data) => {
        setModels(data.models || []);
        setVideoModels(data.video_models || []);
      })
      .catch(() => {});

    api.getAdultRegionRules(session.access_token)
      .then((data) => {
        setRegionRules(data);
        setMosaicEnabled(data.mosaic_default);
        if (data.mosaic_required) setMosaicRequired(true);
      })
      .catch(() => {});

    api.getAdultPlans()
      .then((data) => setPlans(data))
      .catch(() => {});

    api.getAdultShowcase(1, 20, session.access_token)
      .then((data) => {
        setShowcase(data.items || []);
        if (data.mosaic_required) setMosaicRequired(true);
      })
      .catch(() => {});

    api.getAvailableModels(session.access_token)
      .then((data) => {
        const civitai = (data.models || []).filter((m: Record<string, unknown>) => m.source === "civitai");
        setCustomModels(civitai);
        setCustomSlotsUsed(data.custom_slots_used || 0);
        setCustomSlotsMax(data.custom_slots_max || 0);
      })
      .catch(() => {});
  }, [session]);

  const refreshCustomModels = () => {
    if (!session) return;
    api.getAvailableModels(session.access_token)
      .then((data) => {
        const civitai = (data.models || []).filter((m: Record<string, unknown>) => m.source === "civitai");
        setCustomModels(civitai);
        setCustomSlotsUsed(data.custom_slots_used || 0);
        setCustomSlotsMax(data.custom_slots_max || 0);
      })
      .catch(() => {});
  };

  // Timer cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Load remix params from URL (?remix_mode=img2img&remix_image=...&prompt=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const remixMode = params.get("remix_mode");
    const remixImg = params.get("remix_image");
    const remixVideo = params.get("remix_video");
    const p = params.get("prompt");

    if (p) setPrompt(p);

    if (remixMode === "img2img" || remixMode === "i2v") {
      setMode(remixMode === "i2v" ? "video" : "img2img");
      if (remixImg) {
        setInputImagePreview(remixImg);
        fetch(remixImg)
          .then((r) => r.blob())
          .then((blob) => {
            const file = new File([blob], "remix-input.png", { type: blob.type || "image/png" });
            setInputImage(file);
          })
          .catch(() => {});
      }
    } else if (remixMode === "vid2vid") {
      setMode("vid2vid");
      if (remixVideo) {
        setInputVideoPreview(remixVideo);
      }
    }
  }, []);

  // Age verification handler
  const handleAgeVerify = async () => {
    if (!session) return;
    try {
      await api.verifyAge(session.access_token, true);
      setAgeVerified(true);
      setShowAgeGate(false);
      toast.success("Age verified");
    } catch {
      toast.error("Age verification failed");
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Generate handler
  const handleGenerate = async () => {
    // Allow empty prompt for video img2vid mode (image is primary input)
    const videoType = videoModels.find((m) => m.id === videoModel);
    const isVideoI2V = mode === "video" && videoType && videoType.type === "i2v" && inputImage;
    if (!prompt.trim() && !isVideoI2V) {
      toast.error("Please enter a prompt");
      return;
    }
    if (!session) return;

    setGenerating(true);
    setResultUrl(null);
    setResultUrls([]);
    setError(null);
    setElapsed(0);
    setResultType(mode === "video" || mode === "vid2vid" ? "video" : "image");
    if ((mode === "img2img" || mode === "controlnet") && !inputImage) {
      toast.error("Please upload an image first");
      setGenerating(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (mode === "vid2vid" && !inputVideo && !inputVideoPreview) {
      toast.error("Please upload a video first");
      setGenerating(false);
      return;
    }

    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

    try {
      let res;
      if (mode === "video") {
        const isI2V = videoModels.find((m) => m.id === videoModel)?.type === "i2v";
        const videoParams: Record<string, unknown> = {
          prompt,
          negative_prompt: negativePrompt,
          model: videoModel,
          seed,
          mosaic_enabled: mosaicEnabled,
          duration: videoDuration,
          resolution: videoResolution,
        };
        if (isI2V && inputImage) {
          const b64 = await fileToBase64(inputImage);
          videoParams.image_url = `data:image/png;base64,${b64}`;
          videoParams.mode = i2vMode;
        }
        res = await api.generateAdultVideo(session.access_token, videoParams);
      } else if (mode === "img2img" && inputImage) {
        const b64 = await fileToBase64(inputImage);
        res = await api.adultImg2Img(session.access_token, {
          prompt, negative_prompt: negativePrompt, image: b64,
          model, width, height, steps, cfg, denoise, sampler, seed,
        });
      } else if (mode === "controlnet" && inputImage) {
        const b64 = await fileToBase64(inputImage);
        res = await api.adultControlNet(session.access_token, {
          prompt, negative_prompt: negativePrompt, image: b64,
          control_type: controlType, control_strength: controlStrength,
          model, width, height, steps, cfg, sampler, seed,
        });
      } else if (mode === "vid2vid") {
        let videoData: string;
        if (inputVideo) {
          // Convert file to base64 data URL
          videoData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(inputVideo);
          });
        } else if (inputVideoPreview) {
          // URL from gallery remix
          videoData = inputVideoPreview;
        } else {
          toast.error("No video input");
          setGenerating(false);
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }
        res = await api.adultVid2Vid(session.access_token, {
          video: videoData,
          prompt,
          resolution: videoResolution,
          seed,
        });
      } else if (mode === "civitai" && civitaiModelName) {
        res = await api.generateAdultCivitai(session.access_token, {
          prompt,
          negative_prompt: negativePrompt,
          civitai_model_name: civitaiModelName,
          width,
          height,
          steps,
          cfg,
          sampler,
          seed,
        });
      } else {
        res = await api.generateAdult(session.access_token, {
          prompt,
          negative_prompt: negativePrompt,
          model,
          width,
          height,
          steps,
          cfg,
          sampler,
          seed,
          mosaic_enabled: mosaicEnabled,
          custom_model_name: customModelName || undefined,
          lora_model: loraModel || undefined,
          lora_strength: loraModel ? loraStrength : undefined,
          batch_size: batchSize,
        });
      }

      if (res.status === "completed" && res.result_url) {
        setResultUrl(resolveResultUrl(res.result_url) || res.result_url);
        const allUrls = (res.result_urls || []).map((u: string) => resolveResultUrl(u) || u);
        if (allUrls.length > 1) setResultUrls(allUrls);
        setLastJobId(res.job_id || null);
        toast.success(`Done! Credits: ${res.credits_used}`);
      } else {
        setError("Generation queued - check My Gallery for results");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      if (msg.includes("subscription") || msg.includes("Pro+")) {
        setShowPlans(true);
      }
      if (msg.includes("Insufficient credits") || msg.includes("credits")) {
        toast.error(
          "Out of credits! Upgrade for unlimited NSFW generation, all models, and priority queue.", {
          action: { label: "View Plans", onClick: () => setShowPlans(true) },
          duration: 12000,
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setGenerating(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Checkout handler
  const handleCheckout = async (plan: string) => {
    if (!session) return;
    try {
      const res = await api.createAdultCheckout(session.access_token, plan);
      if (res.checkout_url) window.location.href = res.checkout_url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    }
  };

  const handleCryptoCheckout = async (plan: string) => {
    if (!session) return;
    try {
      const res = await api.createAdultCryptoCheckout(session.access_token, plan);
      if (res.invoice_url) window.location.href = res.invoice_url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Crypto checkout failed";
      if (msg.includes("not configured")) {
        toast.error("Crypto payments coming soon!");
      } else {
        toast.error(msg);
      }
    }
  };

  if (authLoading) return null;

  // Not logged in — show teaser + sign in prompt
  if (!user) {
    return (
      <>
        <Header />
        <div className="container mx-auto max-w-4xl px-4 py-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent mb-2">
              Adult Expression
            </h1>
            <p className="text-muted-foreground">
              Uncensored AI image generation for mature creators. No filters, no limits.
            </p>
          </div>

          {/* Teaser grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Photorealistic", color: "from-pink-600/40 to-rose-800/40" },
              { label: "Anime / Hentai", color: "from-purple-600/40 to-fuchsia-800/40" },
              { label: "Fantasy Art", color: "from-red-600/40 to-orange-800/40" },
              { label: "Uncensored", color: "from-pink-700/40 to-red-900/40" },
            ].map((item) => (
              <div
                key={item.label}
                className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${item.color} flex items-end p-3`}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-[10px] text-white/40">Sign in to explore</p>
                </div>
              </div>
            ))}
          </div>

          <Card className="max-w-md mx-auto border-pink-500/20 text-center">
            <CardContent className="pt-6 space-y-3">
              <p className="text-lg font-medium">Sign in to get started</p>
              <p className="text-sm text-muted-foreground">
                Age verification required. From {"\u00A5"}980/month.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" render={<a href="/" />}>Back</Button>
                <Button className="bg-pink-600 hover:bg-pink-700" render={<a href="/login" />}>
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Age gate
  if (showAgeGate && !ageVerified) {
    return (
      <>
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <Card className="w-full max-w-lg border-pink-500/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-pink-400">Age Verification Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="text-6xl">18+</div>
              <p className="text-muted-foreground">
                This section contains adult content (NSFW). You must be at least 18 years old to access this area.
              </p>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-left">
                <p className="font-medium text-red-400 mb-1">By continuing, you confirm that:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>You are 18 years of age or older</li>
                  <li>Viewing adult content is legal in your jurisdiction</li>
                  <li>You will not generate or distribute child exploitation material</li>
                  <li>You understand regional laws may apply (e.g., censorship requirements)</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" render={<a href="/generate" />}>
                  Go Back
                </Button>
                <Button
                  onClick={handleAgeVerify}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  I am 18+ — Enter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // No access - show plans
  const hasAccess = subStatus?.has_access;

  return (
    <>
      {/* SVG Mosaic filter for JP region (Article 175 Penal Code) */}
      {mosaicRequired && (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id="mosaic">
            <feFlood x="4" y="4" height="2" width="2" />
            <feComposite width="10" height="10" />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius="5" />
          </filter>
        </svg>
      )}
      <Header />
      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Legal warnings banner */}
        {regionRules && regionRules.legal_warnings.length > 0 && !legalDismissed && (
          <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-amber-400 mb-1">
                  Legal Notice ({regionRules.region})
                </p>
                {regionRules.legal_warnings.map((w, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{w}</p>
                ))}
              </div>
              <button
                onClick={() => setLegalDismissed(true)}
                className="text-muted-foreground hover:text-foreground text-xs ml-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Region rules — collapsible, low-key */}
        {regionRules && (
          <details className="mb-4 rounded-lg border border-muted bg-card/30">
            <summary className="cursor-pointer p-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
              📋 Rules for your region ({regionRules.region}) — click to expand
            </summary>
            <div className="px-3 pb-3 text-xs text-muted-foreground space-y-2 border-t border-muted/50 pt-3">
              {regionRules.region === "JP" && (
                <>
                  <p><strong className="text-foreground">日本のユーザー向けルール:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>個人で楽しむ生成・保存は<strong>自己責任</strong>で自由（モザイクなし可）</li>
                    <li>ギャラリー公開時は<strong>自動でモザイク処理</strong>が適用されます（刑法175条準拠）</li>
                    <li>原本（モザイクなし）はあなただけがアクセス可能で、ダウンロードできます</li>
                    <li>第三者への配布・公開には必ずモザイク版が使用されます</li>
                  </ul>
                </>
              )}
              {regionRules.region === "KR" && (
                <>
                  <p><strong className="text-foreground">韓国のユーザー向けルール:</strong></p>
                  <p>韓国刑法243-244条により、わいせつ物の制作・所持・頒布が禁止されているため、NSFWコンテンツの生成は提供しておりません。</p>
                </>
              )}
              {regionRules.region !== "JP" && regionRules.region !== "KR" && (
                <>
                  <p><strong className="text-foreground">Rules for your region:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>NSFW content generation is permitted with age verification</li>
                    <li>Personal use and downloads are at your own discretion</li>
                    <li>Public gallery posts must be tagged R18/NSFW</li>
                    <li>Child exploitation content is always blocked, no exceptions</li>
                  </ul>
                </>
              )}
              <p className="pt-2">
                <a href="/content-policy" className="text-purple-400 hover:underline">Full content policy →</a>
              </p>
            </div>
          </details>
        )}

        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
            Adult Expression
          </h1>
          <Badge variant="secondary" className="text-pink-400 border-pink-500/30">18+</Badge>
          {subStatus && (
            <Badge variant="outline" className="text-xs">
              {subStatus.access_via === "main_plan"
                ? `Via ${subStatus.main_plan} plan`
                : subStatus.adult_plan !== "none"
                  ? subStatus.adult_plan.replace("adult_", "").replace(/^\w/, (c: string) => c.toUpperCase())
                  : "No plan"}
            </Badge>
          )}
        </div>

        {/* No access — showcase + plan selection */}
        {!hasAccess && (
          <div className="mb-8 space-y-8">
            {/* Showcase: what you can create */}
            <div>
              <h2 className="text-lg font-semibold mb-3">What you can create</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Photorealistic", color: "from-pink-600/40 to-rose-800/40", desc: "Lifelike portraits & figures" },
                  { label: "Anime / Hentai", color: "from-purple-600/40 to-fuchsia-800/40", desc: "Illustration style" },
                  { label: "Fantasy", color: "from-red-600/40 to-orange-800/40", desc: "Surreal & imaginative" },
                  { label: "Uncensored", color: "from-pink-700/40 to-red-900/40", desc: "Mosaic on/off control" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`relative aspect-[3/4] rounded-xl bg-gradient-to-br ${item.color} overflow-hidden group cursor-pointer`}
                  >
                    {/* Blurred placeholder - suggestive silhouette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-[10px] text-white/60">{item.desc}</p>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="text-[9px] bg-pink-500/30 text-pink-200 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                        Subscribers only
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Full uncensored generation available to subscribers. Mosaic can be toggled on/off per image.
              </p>
            </div>

            {/* Features list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-pink-500/10 bg-pink-500/5 p-4">
                <p className="font-medium text-sm mb-1">Uncensored Models</p>
                <p className="text-xs text-muted-foreground">NSFW-optimized AI models with no safety filters. Photorealistic to anime.</p>
              </div>
              <div className="rounded-lg border border-pink-500/10 bg-pink-500/5 p-4">
                <p className="font-medium text-sm mb-1">Mosaic Control</p>
                <p className="text-xs text-muted-foreground">Toggle censoring on/off. Regional legal warnings included. Your content, your choice.</p>
              </div>
              <div className="rounded-lg border border-pink-500/10 bg-pink-500/5 p-4">
                <p className="font-medium text-sm mb-1">Private & Secure</p>
                <p className="text-xs text-muted-foreground">Generations are private by default. No public gallery unless you opt in.</p>
              </div>
            </div>

            {/* Pro Plan CTA — credit card, includes NSFW */}
            <Card className="border-purple-500/40 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <CardContent className="pt-6 pb-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">RECOMMENDED</span>
                      <h3 className="text-lg font-bold">Pro Plan — Credit Card OK</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ¥980/mo (Visa/Mastercard) — <strong>full access to all generation modes</strong>, watermark-free, HD models, priority queue.
                    </p>
                    <p className="text-xs text-purple-400 mt-1">
                      Credit card payment. All features on this page are included.
                    </p>
                  </div>
                  <Button
                    className="shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
                    onClick={() => window.location.href = "/settings#billing"}
                  >
                    Upgrade to Pro (¥980/mo)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-muted flex-grow" />
              <span className="px-3 text-xs text-muted-foreground">or subscribe to Adult-only plan with crypto</span>
              <div className="border-t border-muted flex-grow" />
            </div>

            <Card className="border-pink-500/20">
              <CardHeader>
                <CardTitle className="text-lg">Adult-Only Plans (Crypto)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pay with BTC/ETH/USDT. For users who only need NSFW features.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  {Object.entries(plans).map(([key, plan]) => (
                    <Card key={key} className="border-muted hover:border-pink-500/40 transition-colors">
                      <CardContent className="pt-4 text-center space-y-2">
                        <p className="font-semibold text-lg">{plan.name}</p>
                        <div>
                          <span className="text-2xl font-bold">
                            {"\u00A5"}{plan.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">/mo</span>
                        </div>
                        {plan.original_price && plan.original_price !== plan.price && (
                          <p className="text-xs text-green-400 line-through">
                            {"\u00A5"}{plan.original_price.toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {plan.generations_per_month >= 999999
                            ? "Unlimited"
                            : `${plan.generations_per_month} generations/mo`}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleCryptoCheckout(key)}
                          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                        >
                          Pay with Crypto (BTC/ETH/USDT)
                        </Button>
                        <p className="text-[9px] text-muted-foreground mt-1.5 text-center leading-relaxed">
                          No crypto?{" "}
                          <a
                            href="https://global.transak.com/?cryptoCurrencyCode=USDT&network=tron&fiatCurrency=JPY"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:underline font-medium"
                          >
                            Buy USDT with credit card here
                          </a>
                          , then come back to pay.
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Already on Pro, Unlimited, or Studio? You already have access — reload the page.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generator UI */}
        {hasAccess && (
          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            {/* Left: result */}
            <div className="space-y-4">
              <Card className="border-pink-500/10">
                <CardContent className="pt-4">
                  <div
                    className="relative w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center"
                    style={{ minHeight: 400 }}
                  >
                    {generating ? (
                      <div className="text-center space-y-4 py-8">
                        <div className="relative h-16 w-16 mx-auto">
                          <div className="absolute inset-0 rounded-full border-4 border-pink-500/20" />
                          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 border-r-rose-500 animate-spin" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-pink-300">
                            🎨 Generating your content...
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {elapsed}s elapsed
                            {elapsed > 30 && " — Videos can take 1-3 minutes"}
                            {elapsed > 90 && " — Complex prompts take longer"}
                          </p>
                        </div>
                        <div className="max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 rounded-full bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]"
                            style={{ width: `${Math.min(15 + (elapsed / 60) * 80, 90)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Please don&apos;t close this tab.
                        </p>
                      </div>
                    ) : resultUrl ? (
                      <div className="relative">
                        {resultType === "video" ? (
                          <video
                            src={resultUrl}
                            controls
                            autoPlay
                            loop
                            className="max-w-full max-h-[600px] rounded"
                          />
                        ) : resultUrls.length > 1 ? (
                          <div className={`grid gap-2 ${resultUrls.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
                            {resultUrls.map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt={`Generated ${i + 1}`}
                                className="w-full aspect-square object-cover rounded cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all"
                                onClick={() => window.open(url, "_blank")}
                              />
                            ))}
                          </div>
                        ) : (
                          <img
                            src={resultUrl}
                            alt="Generated"
                            className="max-w-full max-h-[600px] object-contain rounded"
                          />
                        )}
                        <div className="absolute bottom-2 right-2 flex gap-2">
                          {lastJobId && session && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.publishToAdultShowcase(session.access_token, lastJobId);
                                  toast.success("Added to showcase!");
                                  api.getAdultShowcase().then((d) => setShowcase(d.items || []));
                                } catch { toast.error("Failed to publish"); }
                              }}
                              className="bg-pink-600/80 text-white text-xs px-3 py-1.5 rounded hover:bg-pink-600"
                            >
                              + Showcase
                            </button>
                          )}
                          <a
                            href={resultUrl}
                            download
                            className="bg-black/70 text-white text-xs px-3 py-1.5 rounded hover:bg-black/90"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="text-center p-6">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    ) : (
                      <div className="text-center p-6">
                        <p className="text-4xl mb-2">{"🎨"}</p>
                        <p className="text-muted-foreground text-sm">
                          Enter a prompt and generate
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: controls */}
            <div className="space-y-4">
              {/* Mode tabs */}
              <div className="flex rounded-lg border overflow-hidden text-[11px]">
                {(["image", "video", "img2img", "vid2vid", "controlnet", "civitai"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 font-medium transition-colors ${
                      mode === m
                        ? m === "civitai" ? "bg-purple-600 text-white" : m === "vid2vid" ? "bg-orange-600 text-white" : "bg-pink-600 text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "image" ? "Image" : m === "video" ? "Video" : m === "img2img" ? "Img2Img" : m === "vid2vid" ? "Vid2Vid" : m === "controlnet" ? "ControlNet" : "CivitAI"}
                  </button>
                ))}
              </div>

              {/* Prompt */}
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <Label htmlFor="adult-prompt">Prompt</Label>
                    <Textarea
                      id="adult-prompt"
                      placeholder="Describe what you want to generate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adult-neg">Negative Prompt</Label>
                    <Textarea
                      id="adult-neg"
                      placeholder="worst quality, low quality, blurry, deformed, ugly, bad anatomy..."
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Model */}
              <Card>
                <CardContent className="pt-4 space-y-3">
                  {mode === "image" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Image Model</Label>
                        <Select value={model} onValueChange={(v) => v && setModel(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {models.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                <span className="flex items-center gap-1.5">
                                  {m.name}
                                  <span className="text-[10px] text-muted-foreground">
                                    ({m.credits} cr)
                                  </span>
                                  {m.badge && (
                                    <span className="text-[10px] bg-pink-500/20 text-pink-400 px-1 rounded">
                                      {m.badge}
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Custom Model (any CivitAI safetensors via Novita.ai) */}
                      <div>
                        <Label className="text-xs">Custom CivitAI Model (safetensors name)</Label>
                        <Input
                          placeholder="e.g. epicphotogasm_xPlusPlus.safetensors"
                          value={customModelName}
                          onChange={(e) => setCustomModelName(e.target.value)}
                          className="mt-1 text-xs font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Override preset model with any CivitAI checkpoint. Leave empty to use the model above.
                        </p>
                        {session && (
                          <div className="mt-1.5">
                            <CivitAIBrowser
                              token={session.access_token}
                              userPlan={subStatus?.main_plan || "free"}
                              myModels={customModels}
                              slotsUsed={customSlotsUsed}
                              slotsMax={customSlotsMax}
                              onRefresh={refreshCustomModels}
                              onUseModel={(safetensorsName) => setCustomModelName(safetensorsName)}
                            />
                          </div>
                        )}
                      </div>
                      {/* LoRA */}
                      <div>
                        <Label className="text-xs">LoRA (safetensors name)</Label>
                        <Input
                          placeholder="e.g. add_detail_xl.safetensors"
                          value={loraModel}
                          onChange={(e) => setLoraModel(e.target.value)}
                          className="mt-1 text-xs"
                        />
                        {loraModel && (
                          <div className="mt-1">
                            <Label className="text-[10px]">LoRA Strength: {loraStrength}</Label>
                            <input
                              type="range"
                              min={0}
                              max={2}
                              step={0.05}
                              value={loraStrength}
                              onChange={(e) => setLoraStrength(parseFloat(e.target.value))}
                              className="w-full h-1.5 accent-pink-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {mode === "video" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Video Model</Label>
                        <Select value={videoModel} onValueChange={(v) => v && setVideoModel(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 py-1 text-[10px] font-semibold text-pink-400 uppercase">Text to Video</div>
                            {videoModels.filter((m) => m.type === "t2v").map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                <span className="flex items-center gap-1.5">
                                  {m.name}
                                  <span className="text-[10px] text-muted-foreground">({m.credits} cr)</span>
                                  {m.badge && (
                                    <span
                                      className={`text-[10px] px-1 rounded font-semibold ${
                                        m.badge === "FLAGSHIP"
                                          ? "bg-gradient-to-r from-amber-500 to-pink-500 text-white"
                                          : "bg-pink-500/20 text-pink-400"
                                      }`}
                                    >
                                      {m.badge}
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1 text-[10px] font-semibold text-pink-400 uppercase border-t mt-1 pt-2">Image to Video</div>
                            {videoModels.filter((m) => m.type === "i2v").map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                <span className="flex items-center gap-1.5">
                                  {m.name}
                                  <span className="text-[10px] text-muted-foreground">({m.credits} cr)</span>
                                  {m.badge && (
                                    <span
                                      className={`text-[10px] px-1 rounded font-semibold ${
                                        m.badge === "FLAGSHIP"
                                          ? "bg-gradient-to-r from-amber-500 to-pink-500 text-white"
                                          : "bg-pink-500/20 text-pink-400"
                                      }`}
                                    >
                                      {m.badge}
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* I2V: mode selector + image upload */}
                      {videoModels.find((m) => m.id === videoModel)?.type === "i2v" && (
                        <div>
                          {/* Mode Selector */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <button
                              type="button"
                              onClick={() => setI2vMode("animate")}
                              className={`p-2.5 rounded-lg border text-left transition-all ${
                                i2vMode === "animate"
                                  ? "border-pink-500 bg-pink-500/10"
                                  : "border-muted hover:border-pink-500/30"
                              }`}
                            >
                              <p className="text-xs font-semibold">🎬 Animate</p>
                              <p className="text-[10px] text-muted-foreground">Preserve image, add motion</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setI2vMode("reimagine")}
                              className={`p-2.5 rounded-lg border text-left transition-all ${
                                i2vMode === "reimagine"
                                  ? "border-purple-500 bg-purple-500/10"
                                  : "border-muted hover:border-purple-500/30"
                              }`}
                            >
                              <p className="text-xs font-semibold">✨ Reimagine</p>
                              <p className="text-[10px] text-muted-foreground">New scene from image</p>
                            </button>
                          </div>
                          <Label className="text-xs">Upload Image (for Image-to-Video)</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setInputImage(file);
                                setInputImagePreview(URL.createObjectURL(file));
                                // Auto-suggest i2v prompts
                                if (session) {
                                  setSuggestingPrompts(true);
                                  setI2vSuggestions([]);
                                  const reader = new FileReader();
                                  reader.onload = async () => {
                                    try {
                                      const b64 = (reader.result as string);
                                      const data = await api.suggestI2VPrompts(session.access_token, b64, true);
                                      setI2vSuggestions(data.suggestions || []);
                                    } catch { /* ignore */ }
                                    setSuggestingPrompts(false);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }}
                            className="mt-1"
                          />
                          {inputImagePreview && <img src={inputImagePreview} alt="Preview" className="mt-2 rounded max-h-24 object-contain" />}
                          {/* I2V Prompt Suggestions */}
                          {suggestingPrompts && (
                            <p className="text-xs text-pink-400 mt-2 animate-pulse">Analyzing image for motion suggestions...</p>
                          )}
                          {i2vSuggestions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-[10px] text-muted-foreground font-medium">Click to apply motion prompt:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {i2vSuggestions.map((s, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setPrompt(s.prompt)}
                                    className="text-[11px] px-2 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 transition-colors cursor-pointer"
                                    title={s.prompt}
                                  >
                                    {s.icon} {s.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Tip: Generate a high-quality NSFW image first, then animate it here for best results.
                          </p>
                        </div>
                      )}
                      {/* Duration & Resolution */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Duration: {videoDuration}s</Label>
                          <input
                            type="range"
                            min={3}
                            max={15}
                            step={1}
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                            className="w-full h-1.5 accent-pink-500 mt-1"
                          />
                          <div className="flex justify-between text-[9px] text-muted-foreground">
                            <span>3s</span><span>5s</span><span>10s</span><span>15s</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Resolution</Label>
                          <Select value={videoResolution} onValueChange={(v) => v && setVideoResolution(v)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="720p">720p (Fast)</SelectItem>
                              <SelectItem value="1080p">1080p (HD)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Longer videos cost more credits. Wan 2.6: 5/10/15s. Kling: 5/10s.
                      </p>
                    </div>
                  )}
                  {mode === "vid2vid" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Upload Video</Label>
                        <Input
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 25 * 1024 * 1024) {
                                toast.error("Video must be under 25MB");
                                return;
                              }
                              setInputVideo(file);
                              setInputVideoPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="mt-1 text-xs"
                        />
                        {inputVideoPreview && (
                          <video
                            src={inputVideoPreview}
                            className="mt-2 rounded-md max-h-48 w-full object-contain bg-black"
                            controls
                            muted
                          />
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          MP4/MOV, max 25MB, 2-10 seconds. Gallery videos also supported.
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs">Style Preset</Label>
                        <Select value={v2vStylePreset} onValueChange={(v) => {
                          if (!v) return;
                          setV2vStylePreset(v);
                          const presets: Record<string, string> = {
                            anime: "Transform into vibrant anime style, bold outlines, cel shading, saturated colors",
                            ghibli: "Restyle in Studio Ghibli hand-painted animation, soft colors, whimsical, Miyazaki aesthetic",
                            cyberpunk: "Restyle as cyberpunk, neon lights, futuristic cityscape, rain reflections, sci-fi",
                            oil: "Transform into a classical oil painting, thick impasto brushstrokes, rich colors, canvas texture",
                            noir: "Transform into black and white film noir, high contrast shadows, dramatic lighting",
                            ukiyoe: "Transform into Japanese ukiyo-e woodblock print style, flat colors, bold outlines",
                          };
                          if (presets[v]) setPrompt(presets[v]);
                        }}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom (write your own)</SelectItem>
                            <SelectItem value="anime">Anime</SelectItem>
                            <SelectItem value="ghibli">Studio Ghibli</SelectItem>
                            <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                            <SelectItem value="oil">Oil Painting</SelectItem>
                            <SelectItem value="noir">Film Noir</SelectItem>
                            <SelectItem value="ukiyoe">Ukiyo-e</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Resolution</Label>
                        <Select value={videoResolution} onValueChange={(v) => v && setVideoResolution(v)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="720p">720p (Fast)</SelectItem>
                            <SelectItem value="1080p">1080p (HD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Vid2Vid: 40 credits. Style-transfer your video with AI. NSFW supported.
                      </p>
                    </div>
                  )}
                  {mode === "civitai" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">CivitAI Model</Label>
                        <Input
                          placeholder="e.g. ponyDiffusionV6XL_v6.safetensors"
                          value={civitaiModelName}
                          onChange={(e) => setCivitaiModelName(e.target.value)}
                          className="mt-1 font-mono text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Type a safetensors filename, or browse CivitAI below to find models.
                        </p>
                      </div>
                      {session && (
                        <CivitAIBrowser
                          token={session.access_token}
                          userPlan={subStatus?.main_plan || "free"}
                          myModels={customModels}
                          slotsUsed={customSlotsUsed}
                          slotsMax={customSlotsMax}
                          onRefresh={refreshCustomModels}
                          onUseModel={(safetensorsName) => setCivitaiModelName(safetensorsName)}
                        />
                      )}
                    </div>
                  )}

                  {/* img2img / controlnet: image upload + settings */}
                  {(mode === "img2img" || mode === "controlnet") && (
                    <>
                      <div>
                        <Label className="text-xs">Upload Image</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setInputImage(file);
                              setInputImagePreview(URL.createObjectURL(file));
                            }
                          }}
                          className="mt-1"
                        />
                        {inputImagePreview && (
                          <img src={inputImagePreview} alt="Preview" className="mt-2 rounded max-h-24 object-contain" />
                        )}
                      </div>
                      {mode === "img2img" && (
                        <div>
                          <Label className="text-xs">Denoise Strength: {denoise}</Label>
                          <Input type="range" min={0} max={1} step={0.05} value={denoise} onChange={(e) => setDenoise(Number(e.target.value))} />
                          <p className="text-[10px] text-muted-foreground">0 = keep original, 1 = fully regenerate</p>
                        </div>
                      )}
                      {mode === "controlnet" && (
                        <>
                          <div>
                            <Label className="text-xs">Control Type</Label>
                            <Select value={controlType} onValueChange={(v) => v && setControlType(v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="openpose">OpenPose (Body)</SelectItem>
                                <SelectItem value="canny">Canny Edge</SelectItem>
                                <SelectItem value="depth">Depth</SelectItem>
                                <SelectItem value="scribble">Scribble</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Control Strength: {controlStrength}</Label>
                            <Input type="range" min={0} max={2} step={0.1} value={controlStrength} onChange={(e) => setControlStrength(Number(e.target.value))} />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Resolution (image + civitai + img2img + controlnet) */}
                  {(mode === "image" || mode === "civitai" || mode === "img2img" || mode === "controlnet") && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Width</Label>
                        <Select value={String(width)} onValueChange={(v) => setWidth(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[512, 640, 768, 832, 1024].map((v) => (
                              <SelectItem key={v} value={String(v)}>{v}px</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Height</Label>
                        <Select value={String(height)} onValueChange={(v) => setHeight(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[512, 640, 768, 832, 1024, 1280].map((v) => (
                              <SelectItem key={v} value={String(v)}>{v}px</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Sampler + Steps & CFG */}
                  {(mode === "image" || mode === "civitai" || mode === "img2img" || mode === "controlnet") && (
                    <>
                      <div>
                        <Label className="text-xs">Sampler</Label>
                        <Select value={sampler} onValueChange={(v) => v && setSampler(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["euler_ancestral", "euler", "dpm_2", "dpmpp_2m", "dpmpp_sde", "ddim", "uni_pc", "lcm"].map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Steps: {steps}</Label>
                          <Input
                            type="range"
                            min={1}
                            max={50}
                            value={steps}
                            onChange={(e) => setSteps(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">CFG: {cfg}</Label>
                          <Input
                            type="range"
                            min={1}
                            max={20}
                            step={0.5}
                            value={cfg}
                            onChange={(e) => setCfg(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Seed */}
                  <div>
                    <Label className="text-xs">Seed (-1 = random)</Label>
                    <Input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(Number(e.target.value))}
                    />
                  </div>

                  {/* Batch Size (paid users only, image modes) */}
                  {(mode === "image" || mode === "civitai") && (
                    <div>
                      <Label className="text-xs flex items-center gap-1.5">
                        Batch Size
                        {(!subStatus?.main_plan || subStatus.main_plan === "free") && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 rounded">Lite+</span>
                        )}
                      </Label>
                      {subStatus?.main_plan && subStatus.main_plan !== "free" ? (
                        <Select value={String(batchSize)} onValueChange={(v) => setBatchSize(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 image</SelectItem>
                            <SelectItem value="2">2 images</SelectItem>
                            <SelectItem value="4">4 images</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">Upgrade to Lite+ to generate multiple images at once</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mosaic Control */}
              <Card className="border-amber-500/20">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Mosaic / Censoring</Label>
                      <p className="text-xs text-muted-foreground">
                        {regionRules?.mosaic_required
                          ? "Required in your region for public content"
                          : "Optional in your region"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (regionRules?.mosaic_required && mosaicEnabled) {
                          toast.error(
                            "Mosaic is required in your region (JP) for public distribution. " +
                            "Disabling is at your own risk for private use only.",
                            { duration: 6000 }
                          );
                        }
                        setMosaicEnabled(!mosaicEnabled);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        mosaicEnabled ? "bg-amber-500" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          mosaicEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {!mosaicEnabled && regionRules?.mosaic_required && (
                    <div className="rounded bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-400">
                      Warning: Distributing uncensored explicit content is illegal in your region.
                      This is for private use only. You assume all legal responsibility.
                    </div>
                  )}

                  {!mosaicEnabled && !regionRules?.mosaic_required && (
                    <p className="text-xs text-muted-foreground">
                      Uncensored mode. Content will not be mosaicked.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button
                className="w-full h-12 text-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                onClick={handleGenerate}
                disabled={generating || (!prompt.trim() && mode !== "video") || (mode === "civitai" && !civitaiModelName) || (mode === "vid2vid" && !inputVideo && !inputVideoPreview)}
              >
                {generating
                  ? `Generating... ${elapsed}s`
                  : mode === "video" ? "Generate Video"
                  : mode === "vid2vid" ? "Transform Video (40 cr)"
                  : mode === "civitai" ? "Generate with CivitAI"
                  : mode === "img2img" ? "Transform Image"
                  : mode === "controlnet" ? "Generate with ControlNet"
                  : "Generate Image"}
              </Button>

              {/* Policy reminder */}
              <p className="text-[10px] text-muted-foreground text-center">
                Child exploitation (CSAM), real persons, and non-consensual content are strictly prohibited.
                Violations result in immediate account termination.
              </p>
            </div>
          </div>
        )}

        {/* Plan upgrade prompt (shown when no access or on demand) */}
        {hasAccess && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowPlans(!showPlans)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {showPlans ? "Hide plans" : "View / Change plan"}
            </button>
            {showPlans && (
              <div className="grid gap-4 md:grid-cols-4 mt-4 max-w-4xl mx-auto">
                {Object.entries(plans).map(([key, plan]) => {
                  const isCurrent = subStatus?.adult_plan === key;
                  return (
                    <Card
                      key={key}
                      className={`border-muted transition-colors ${
                        isCurrent ? "border-pink-500 bg-pink-500/5" : "hover:border-pink-500/40"
                      }`}
                    >
                      <CardContent className="pt-4 text-center space-y-2">
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-xl font-bold">
                          {"\u00A5"}{plan.price.toLocaleString()}
                          <span className="text-xs text-muted-foreground">/mo</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.generations_per_month >= 999999
                            ? "Unlimited"
                            : `${plan.generations_per_month}/mo`}
                        </p>
                        {isCurrent ? (
                          <Badge className="bg-pink-500/20 text-pink-400">Current</Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleCheckout(key)}
                            >
                              {subStatus?.adult_plan !== "none" ? "Change" : "Subscribe"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCryptoCheckout(key)}
                              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                            >
                              Pay with Crypto (BTC/ETH/USDT)
                            </Button>
                            <p className="text-[9px] text-muted-foreground mt-1 text-center">
                              No crypto?{" "}
                              <a
                                href="https://global.transak.com/?cryptoCurrencyCode=USDT&network=tron&fiatCurrency=JPY"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-500 hover:underline"
                              >
                                Buy USDT with credit card
                              </a>
                              {" "}then pay here.
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* NSFW Showcase Gallery */}
        {showcase.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              Showcase Gallery
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {hasAccess
                ? "Generated by our community. Click any image for full resolution."
                : "Subscribe to view uncensored and generate your own."}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {showcase.map((item) => (
                <div key={item.id} className="relative group rounded-lg overflow-hidden bg-muted aspect-[3/4]">
                  {item.video_url ? (
                    <video
                      src={item.video_url}
                      className={`w-full h-full object-cover ${!hasAccess ? "blur-xl" : ""}`}
                      style={mosaicRequired && hasAccess ? { filter: "url(#mosaic)" } : undefined}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className={`w-full h-full object-cover ${!hasAccess ? "blur-xl" : ""}`}
                      style={mosaicRequired && hasAccess ? { filter: "url(#mosaic)" } : undefined}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No preview
                    </div>
                  )}
                  {/* Overlay for non-subscribers */}
                  {!hasAccess && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-white/60 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <p className="text-[10px] text-white/60">Subscribe to view</p>
                      </div>
                    </div>
                  )}
                  {/* Hover info for subscribers */}
                  {hasAccess && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white/80 line-clamp-2">{item.prompt}</p>
                      <p className="text-[9px] text-white/50">{item.model}</p>
                    </div>
                  )}
                  {item.video_url && (
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] bg-pink-500/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                        Video
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
