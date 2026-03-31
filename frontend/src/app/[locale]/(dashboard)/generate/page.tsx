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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { CivitAIBrowser } from "@/components/civitai-browser";
import { PromptAssistant } from "@/components/prompt-assistant";
import { trackEvent, CONVERSIONS } from "@/components/analytics";
import { toast } from "sonner";

const SAMPLERS = [
  "euler_ancestral", "euler", "dpm_2", "dpmpp_2m", "dpmpp_sde",
  "ddim", "uni_pc", "lcm",
];

const MODELS = [
  { id: "flux_schnell", name: "Flux Schnell", type: "Flux", credits: 1, minPlan: "free", badge: "Fast" },
  { id: "flux_dev", name: "Flux Dev", type: "Flux", credits: 3, minPlan: "free", badge: "Best" },
  { id: "fal_flux_schnell", name: "Flux Schnell (fal)", type: "Flux", credits: 1, minPlan: "free", badge: "Instant" },
  { id: "fal_flux_dev", name: "Flux Dev (fal)", type: "Flux", credits: 3, minPlan: "free", badge: "Instant" },
  { id: "sdxl", name: "Stable Diffusion XL", type: "SDXL", credits: 2, minPlan: "free" },
  { id: "sdxl_lightning", name: "SDXL Lightning", type: "SDXL", credits: 1, minPlan: "free" },
  { id: "fal_sdxl", name: "SDXL (fal)", type: "SDXL", credits: 2, minPlan: "free", badge: "Instant" },
  { id: "sd35_turbo", name: "SD 3.5 Turbo", type: "SD3", credits: 2, minPlan: "free" },
  { id: "sd35_large", name: "SD 3.5 Large", type: "SD3", credits: 3, minPlan: "lite" },
  { id: "realvisxl", name: "RealVisXL v3 Turbo", type: "Realistic", credits: 2, minPlan: "free" },
  { id: "realistic_vision", name: "Realistic Vision v5.1", type: "Realistic", credits: 2, minPlan: "free" },
  { id: "playground", name: "Playground v2.5", type: "Artistic", credits: 2, minPlan: "free" },
  { id: "fal_recraft", name: "Recraft V3", type: "Artistic", credits: 2, minPlan: "free", badge: "New" },
  { id: "fal_aura_flow", name: "AuraFlow v0.3", type: "Artistic", credits: 2, minPlan: "free", badge: "New" },
  { id: "proteus", name: "Proteus v0.3", type: "Anime", credits: 2, minPlan: "free" },
  { id: "fal_nano_banana_2", name: "Nano Banana 2 (Google)", type: "Premium", credits: 8, minPlan: "lite", badge: "★" },
  { id: "fal_grok_imagine", name: "Grok Imagine (xAI)", type: "Premium", credits: 8, minPlan: "lite", badge: "★" },
];

const STYLES = [
  { id: "ghibli", name: "Studio Ghibli" },
  { id: "anime", name: "Anime" },
  { id: "oil_painting", name: "Oil Painting" },
  { id: "watercolor", name: "Watercolor" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "pixel_art", name: "Pixel Art" },
  { id: "comic", name: "Comic Book" },
  { id: "ukiyoe", name: "Ukiyo-e" },
];

const CONTROL_TYPES = [
  { id: "canny", name: "Canny Edge" },
  { id: "depth", name: "Depth" },
  { id: "openpose", name: "OpenPose" },
  { id: "scribble", name: "Scribble" },
];

const VIDEO_MODELS_T2V = [
  { id: "fal_ltx_t2v", name: "LTX 2.3", credits: 5, minPlan: "free", badge: "Fast" },
  { id: "fal_wan_t2v", name: "Wan 2.1", credits: 10, minPlan: "free" },
  { id: "fal_kling_t2v", name: "Kling v2", credits: 15, minPlan: "basic", badge: "HD" },
  { id: "fal_minimax_t2v", name: "Minimax Hailuo", credits: 15, minPlan: "basic", badge: "HD" },
  { id: "fal_kling25_t2v", name: "Kling 2.5 Pro", credits: 25, minPlan: "basic", badge: "★ Cinema" },
  { id: "fal_grok_t2v", name: "Grok Video (xAI)", credits: 30, minPlan: "basic", badge: "★ Audio" },
  { id: "fal_veo3_t2v", name: "Veo 3 (Google)", credits: 40, minPlan: "pro", badge: "★ Audio" },
  { id: "fal_sora2_t2v", name: "Sora 2 (OpenAI)", credits: 50, minPlan: "pro", badge: "★ Best" },
];

const VIDEO_MODELS_I2V = [
  { id: "fal_ltx_i2v", name: "LTX 2 I2V", credits: 5, minPlan: "free", badge: "Fast" },
  { id: "fal_wan_i2v", name: "Wan 2.1 I2V", credits: 10, minPlan: "free" },
  { id: "fal_kling_i2v", name: "Kling v2 I2V", credits: 15, minPlan: "basic", badge: "HD" },
  { id: "fal_kling25_i2v", name: "Kling 2.5 Pro I2V", credits: 25, minPlan: "basic", badge: "★ Cinema" },
  { id: "fal_sora2_i2v", name: "Sora 2 I2V", credits: 50, minPlan: "pro", badge: "★ Best" },
];

const PLAN_RANK: Record<string, number> = {
  free: 0, lite: 1, basic: 2, pro: 3, unlimited: 4, studio: 5,
};

type JobState = {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  type: "image" | "video";
  resultUrl?: string;
  error?: string;
  progress: number;
  startedAt: number;
};

/** Convert File to base64 string (without data URI prefix) */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove "data:image/png;base64," prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function GeneratePage() {
  const { user, session, loading: authLoading } = useAuth();

  // Common params
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState("flux_schnell");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [steps, setSteps] = useState(25);
  const [cfg, setCfg] = useState(7);
  const [sampler, setSampler] = useState("euler_ancestral");
  const [seed, setSeed] = useState(-1);

  // img2img / style / inpaint / controlnet / upscale / remove-bg
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(null);
  const [denoise, setDenoise] = useState(0.7);

  // Mask for inpainting
  const [maskImage, setMaskImage] = useState<File | null>(null);

  // Video for vid2vid
  const [inputVideo, setInputVideo] = useState<File | null>(null);

  // Style transfer
  const [style, setStyle] = useState("ghibli");
  const [styleStrength, setStyleStrength] = useState(0.7);

  // ControlNet
  const [controlType, setControlType] = useState("canny");
  const [controlStrength, setControlStrength] = useState(1.0);

  // Video model
  const [videoModel, setVideoModel] = useState("fal_ltx_t2v");
  const [i2vModel, setI2vModel] = useState("fal_ltx_i2v");

  // I2V prompt suggestions
  const [i2vSuggestions, setI2vSuggestions] = useState<{label: string; prompt: string; icon: string}[]>([]);
  const [suggestingPrompts, setSuggestingPrompts] = useState(false);

  // Video params
  const [frameCount, setFrameCount] = useState(16);
  const [fps, setFps] = useState(8);

  // Upscale
  const [upscaleScale, setUpscaleScale] = useState(2);

  // NSFW
  const [nsfwMode, setNsfwMode] = useState(false);
  const [nsfwConsented, setNsfwConsented] = useState(false);
  const [showNsfwDialog, setShowNsfwDialog] = useState(false);
  const [resultBlurred, setResultBlurred] = useState(true);

  const [userPlan, setUserPlan] = useState("free");
  const [generating, setGenerating] = useState(false);
  const [job, setJob] = useState<JobState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // CivitAI custom models
  const [customModels, setCustomModels] = useState<
    { id: string; name: string; civitai_model_id: number; civitai_version_id: number; preview_url?: string; category: string; description: string; source: string }[]
  >([]);
  const [customSlotsUsed, setCustomSlotsUsed] = useState(0);
  const [customSlotsMax, setCustomSlotsMax] = useState(0);

  const fetchCustomModels = useCallback(async () => {
    if (!session) return;
    try {
      const data = await api.getAvailableModels(session.access_token);
      const civitai = (data.models || []).filter((m: Record<string, unknown>) => m.source === "civitai");
      setCustomModels(civitai);
      setCustomSlotsUsed(data.custom_slots_used || 0);
      setCustomSlotsMax(data.custom_slots_max || 0);
    } catch {
      // Non-fatal
    }
  }, [session]);

  // Fetch user plan + custom models
  useEffect(() => {
    if (!session) return;
    api.getSubscription(session.access_token)
      .then((data) => setUserPlan(data.plan || "free"))
      .catch(() => {});
    fetchCustomModels();
  }, [session, fetchCustomModels]);

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputImage(file);
      const url = URL.createObjectURL(file);
      setInputImagePreview(url);
      // Auto-suggest i2v motion prompts (works from any tab with image upload)
      if (session) {
        setSuggestingPrompts(true);
        setI2vSuggestions([]);
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const b64 = reader.result as string;
            const data = await api.suggestI2VPrompts(session.access_token, b64, false);
            setI2vSuggestions(data.suggestions || []);
          } catch { /* ignore */ }
          setSuggestingPrompts(false);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Poll for job status
  const pollStatus = useCallback(async (jobId: string) => {
    if (!session) return;
    try {
      const res = await api.getJobStatus(session.access_token, jobId);
      setJob((prev) => {
        if (!prev || prev.jobId !== jobId) return prev;
        return {
          ...prev,
          status: res.status,
          progress: res.progress ?? prev.progress,
          resultUrl: resolveResultUrl(res.result_url) ?? prev.resultUrl,
          error: res.error ?? prev.error,
        };
      });

      if (res.status === "completed" || res.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        pollRef.current = null;
        timerRef.current = null;
        setGenerating(false);

        if (res.status === "completed") {
          trackEvent(CONVERSIONS.FIRST_GENERATION, "generation", "async");
          toast.success("Generation complete!");
        } else {
          toast.error(res.error || "Generation failed");
        }
      }
    } catch {
      // Network error - keep polling
    }
  }, [session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Anonymous generation state
  const [anonResult, setAnonResult] = useState<string | null>(null);
  const [anonEnhancedPrompt, setAnonEnhancedPrompt] = useState<string | null>(null);
  const [anonRemaining, setAnonRemaining] = useState<number | null>(null);
  const [anonLimitReached, setAnonLimitReached] = useState(false);
  const [anonGenerating, setAnonGenerating] = useState(false);

  const handleAnonGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    setAnonGenerating(true);
    setAnonResult(null);
    setAnonEnhancedPrompt(null);
    setJob(null);
    try {
      const res = await api.generateAnonymous(prompt);
      setAnonResult(resolveResultUrl(res.result_url) ?? null);
      setAnonEnhancedPrompt(res.enhanced_prompt ?? null);
      setAnonRemaining(res.remaining ?? 0);
      if (res.remaining === 0) {
        setAnonLimitReached(true);
      }
      toast.success("Generation complete!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      if (msg.includes("FREE_LIMIT_REACHED")) {
        setAnonLimitReached(true);
        toast.error("Sign up to continue generating!");
      } else {
        toast.error(msg);
      }
    } finally {
      setAnonGenerating(false);
    }
  };

  if (authLoading) return null;

  // Anonymous user experience
  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Try EGAKU AI — No sign-up needed</h1>
            <p className="text-muted-foreground">
              Enter any idea and watch AI create stunning images. {anonRemaining !== null ? `${anonRemaining} free ${anonRemaining === 1 ? "generation" : "generations"} remaining.` : "2 free generations to start."}
            </p>
          </div>

          {/* Prompt input */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="anon-prompt">Describe your image</Label>
                <Textarea
                  id="anon-prompt"
                  placeholder="A cat sitting on a windowsill at sunset..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  disabled={anonLimitReached}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your prompt will be automatically enhanced by AI for the best result.
                </p>
              </div>
              <Button
                onClick={handleAnonGenerate}
                disabled={anonGenerating || anonLimitReached || !prompt.trim()}
                className="w-full"
              >
                {anonGenerating ? "Generating..." : anonLimitReached ? "Sign up to continue" : "Generate for Free"}
              </Button>
            </CardContent>
          </Card>

          {/* Result display */}
          {anonResult && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <img
                  src={anonResult}
                  alt="Generated image"
                  className="w-full rounded-lg"
                />
                {anonEnhancedPrompt && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">AI-enhanced prompt used:</p>
                    <p className="text-sm">{anonEnhancedPrompt}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sign-up CTA */}
          {(anonLimitReached || anonResult) && (
            <Card className="border-purple-500/50 bg-purple-500/5">
              <CardContent className="pt-6 text-center space-y-3">
                <h2 className="text-lg font-semibold">
                  {anonLimitReached ? "Want more? Sign up for free" : "Like what you see?"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Get 15 free credits, access to 15+ AI models, video generation, and more.
                </p>
                <Button render={<a href="/register" />} className="bg-purple-600 hover:bg-purple-700">
                  Create Free Account
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </>
    );
  }

  const startJob = (jobId: string, type: "image" | "video", creditsUsed: number) => {
    const newJob: JobState = {
      jobId,
      status: "queued",
      type,
      progress: 0,
      startedAt: Date.now(),
    };
    setJob(newJob);
    toast.success(`Queued! Credits used: ${creditsUsed}`);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    pollRef.current = setInterval(() => {
      pollStatus(jobId);
    }, 2000);
  };

  // ─── Handler functions ───

  const showError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : "Generation failed";
    // Show upgrade prompt for credit/plan errors
    if (msg.includes("Insufficient credits") || msg.includes("credits")) {
      toast.error("Out of credits! Upgrade your plan for more.", {
        action: { label: "Upgrade", onClick: () => window.location.href = "/settings" },
        duration: 8000,
      });
    } else if (msg.includes("requires") && msg.includes("plan")) {
      toast.error(msg, {
        action: { label: "Upgrade", onClick: () => window.location.href = "/settings" },
        duration: 8000,
      });
    }
    setJob({
      jobId: "error",
      status: "failed",
      type: "image",
      error: msg,
      progress: 0,
      startedAt: Date.now(),
    });
    setGenerating(false);
  };

  const handleTxt2Img = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    trackEvent(CONVERSIONS.START_GENERATE, "generation", "txt2img");
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const res = await api.generateImage(session!.access_token, {
        prompt, negative_prompt: negativePrompt, model, width, height, steps, cfg, sampler, seed, nsfw: nsfwMode,
      });
      // fal.ai returns completed immediately with result_url
      if (res.status === "completed" && res.result_url) {
        setJob({
          jobId: res.job_id,
          status: "completed",
          type: "image",
          resultUrl: resolveResultUrl(res.result_url),
          progress: 1,
          startedAt: Date.now(),
        });
        setGenerating(false);
        trackEvent(CONVERSIONS.FIRST_GENERATION, "generation", model, res.credits_used);
        toast.success(`Done! Credits used: ${res.credits_used}`);
      } else {
        startJob(res.job_id, "image", res.credits_used);
      }
    } catch (err: unknown) {
      showError(err);
    }
  };

  const handleImg2Img = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (!inputImage) { toast.error("Please upload an image"); return; }
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const b64 = await fileToBase64(inputImage);
      const res = await api.img2img(session!.access_token, {
        prompt, negative_prompt: negativePrompt, model, image: b64,
        width, height, steps, cfg, denoise, sampler, seed, nsfw: nsfwMode,
      });
      startJob(res.job_id, "image", res.credits_used);
    } catch (err: unknown) {
      showError(err);
    }
  };

  const handleStyleTransfer = async () => {
    if (!inputImage) { toast.error("Please upload an image"); return; }
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const b64 = await fileToBase64(inputImage);
      const res = await api.styleTransfer(session!.access_token, {
        image: b64, style, strength: styleStrength, seed,
      });
      startJob(res.job_id, "image", res.credits_used);
    } catch (err: unknown) {
      showError(err);
    }
  };

  const handleTxt2Vid = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    trackEvent(CONVERSIONS.START_GENERATE, "generation", "txt2vid");
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const res = await api.generateVideo(session!.access_token, {
        prompt, negative_prompt: negativePrompt, model: videoModel,
        width: 512, height: 512, steps, cfg, sampler, seed,
        frame_count: frameCount, fps, nsfw: nsfwMode,
      });
      startJob(res.job_id, "video", res.credits_used);
    } catch (err: unknown) {
      showError(err);
    }
  };

  const handleImg2Vid = async () => {
    if (!inputImage) { toast.error("Please upload an image"); return; }
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const b64 = await fileToBase64(inputImage);
      const res = await api.img2vid(session!.access_token, {
        prompt, model: i2vModel, image: b64, width: 512, height: 512,
        steps, cfg, denoise, sampler, seed,
        frame_count: frameCount, fps, nsfw: nsfwMode,
      });
      startJob(res.job_id, "video", res.credits_used);
    } catch (err: unknown) {
      showError(err);
    }
  };

  const handleVid2Vid = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (!inputVideo) { toast.error("Please upload a video"); return; }
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const b64 = await fileToBase64(inputVideo);
      const res = await api.vid2vid(session!.access_token, {
        prompt, negative_prompt: negativePrompt, model,
        video: b64, width: 512, height: 512, steps, cfg, denoise, sampler, seed, fps,
      });
      startJob(res.job_id, "video", res.credits_used);
    } catch (err: unknown) {
      showError(err);
    }
  };

  const handleUpscale = async () => {
    if (!inputImage) { toast.error("Please upload an image"); return; }
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const b64 = await fileToBase64(inputImage);
      const res = await api.upscale(session!.access_token, {
        image: b64, scale: upscaleScale,
      });
      startJob(res.job_id, "image", res.credits_used);
    } catch (err: unknown) {
      showError(err);
    }
  };

  const handleInpaint = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (!inputImage) { toast.error("Please upload an image"); return; }
    if (!maskImage) { toast.error("Please upload a mask"); return; }
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const imgB64 = await fileToBase64(inputImage);
      const maskB64 = await fileToBase64(maskImage);
      const res = await api.inpaint(session!.access_token, {
        prompt, negative_prompt: negativePrompt, model,
        image: imgB64, mask: maskB64,
        width, height, steps, cfg, denoise, sampler, seed,
      });
      startJob(res.job_id, "image", res.credits_used);
    } catch (err: unknown) {
      showError(err);
    }
  };

  const handleControlNet = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (!inputImage) { toast.error("Please upload a control image"); return; }
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const b64 = await fileToBase64(inputImage);
      const res = await api.controlnet(session!.access_token, {
        prompt, negative_prompt: negativePrompt, model,
        image: b64, control_type: controlType, control_strength: controlStrength,
        width, height, steps, cfg, sampler, seed,
      });
      startJob(res.job_id, "image", res.credits_used);
    } catch (err: unknown) {
      showError(err);
    }
  };

  const handleRemoveBg = async () => {
    if (!inputImage) { toast.error("Please upload an image"); return; }
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const b64 = await fileToBase64(inputImage);
      const res = await api.removeBg(session!.access_token, { image: b64 });
      startJob(res.job_id, "image", res.credits_used);
    } catch (err: unknown) {
      showError(err);
    }
  };

  // ─── Reusable sub-components ───

  const renderImageUpload = (label = "Upload Image") => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="file" accept="image/*" onChange={handleImageSelect} className="mt-1" />
      {inputImagePreview && (
        <img src={inputImagePreview} alt="Preview" className="mt-2 rounded max-h-32 object-contain" />
      )}
    </div>
  );

  const renderPromptInputs = () => (
    <>
      <div>
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          placeholder="A beautiful landscape with mountains and a lake, masterpiece, best quality..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="negative">Negative Prompt</Label>
        <Textarea
          id="negative"
          placeholder="worst quality, low quality, blurry..."
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={2}
        />
      </div>
    </>
  );

  const renderSettingsPanel = () => (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Model</Label>
        <Select value={model} onValueChange={(v) => v && setModel(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MODELS.map((m) => {
              const locked = PLAN_RANK[userPlan] < PLAN_RANK[m.minPlan];
              return (
                <SelectItem key={m.id} value={m.id} disabled={locked}>
                  <span className="flex items-center gap-1.5">
                    {m.name}
                    <span className="text-[10px] text-muted-foreground">({m.credits} cr)</span>
                    {m.badge && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded">{m.badge}</span>}
                    {locked && <span className="text-[10px] text-amber-500">{m.minPlan}+</span>}
                  </span>
                </SelectItem>
              );
            })}
            {customModels.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-[10px] font-semibold text-purple-400 uppercase tracking-wider border-t mt-1 pt-2">
                  Custom (CivitAI)
                </div>
                {customModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-1.5">
                      {m.name}
                      <span className="text-[10px] text-muted-foreground">(3 cr)</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded">LoRA</span>
                    </span>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>
      {/* CivitAI Browser */}
      {session && (
        <CivitAIBrowser
          token={session.access_token}
          userPlan={userPlan}
          myModels={customModels}
          slotsUsed={customSlotsUsed}
          slotsMax={customSlotsMax}
          onRefresh={fetchCustomModels}
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Width</Label>
          <Input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} min={256} max={2048} step={64} />
        </div>
        <div>
          <Label className="text-xs">Height</Label>
          <Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} min={256} max={2048} step={64} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Steps</Label>
        <Input type="number" value={steps} onChange={(e) => setSteps(Number(e.target.value))} min={1} max={100} />
      </div>
      <div>
        <Label className="text-xs">CFG Scale</Label>
        <Input type="number" value={cfg} onChange={(e) => setCfg(Number(e.target.value))} min={1} max={30} step={0.5} />
      </div>
      <div>
        <Label className="text-xs">Sampler</Label>
        <Select value={sampler} onValueChange={(v) => v && setSampler(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {SAMPLERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Seed (-1 = random)</Label>
        <Input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
      </div>
      {/* NSFW Toggle */}
      <div className="border-t pt-3 mt-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Creative Freedom (18+)</Label>
          <button
            onClick={() => {
              if (!nsfwMode && !nsfwConsented) {
                setShowNsfwDialog(true);
              } else {
                setNsfwMode(!nsfwMode);
              }
            }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              nsfwMode ? "bg-purple-600" : "bg-muted"
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              nsfwMode ? "translate-x-4.5" : "translate-x-0.5"
            }`} />
          </button>
        </div>
        {nsfwMode && (
          <p className="text-[10px] text-amber-500 mt-1">
            NSFW mode enabled — unrestricted content generation
          </p>
        )}
      </div>
    </div>
  );

  const handleNsfwAccept = async () => {
    // Call age verification API
    if (session) {
      try {
        await api.verifyAge(session.access_token, true);
      } catch {
        // Non-fatal - continue anyway
      }
    }
    setNsfwConsented(true);
    setNsfwMode(true);
    setShowNsfwDialog(false);
  };

  return (
    <>
      <Header />

      {/* NSFW Legal & Age Verification Dialog */}
      {showNsfwDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold">Creative Freedom Mode (18+)</h2>
            <div className="text-sm space-y-3 text-muted-foreground">
              <p>
                This mode enables unrestricted AI image generation, including nudity and adult content.
                By enabling this feature, you confirm:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>You are 18 years of age or older.</strong></li>
                <li>You understand that generated content is <strong>your responsibility</strong>.</li>
                <li>You will comply with the <strong>laws of your country/region</strong> regarding adult content.</li>
                <li>You will <strong>not</strong> generate content involving minors or non-consensual scenarios.</li>
              </ul>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs">
                <p className="font-semibold text-amber-500 mb-1">Legal Notice</p>
                <p>
                  Laws regarding AI-generated adult content vary by jurisdiction.
                  In some regions, certain types of content may be illegal.
                  It is your sole responsibility to ensure compliance with local laws.
                  EGAKU AI is not liable for content generated by users.
                </p>
              </div>
              <p className="text-xs">
                NSFW content will be displayed with a blur filter by default. All generated content is tagged for content safety.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowNsfwDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleNsfwAccept}
              >
                I am 18+ — Enable
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Generate</h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Main panel */}
          <div className="space-y-4">
            <Tabs defaultValue="txt2img">
              {/* All tabs in a single TabsList - h-auto overrides fixed height */}
              <div className="mb-4">
                <TabsList className="flex flex-wrap !h-auto gap-1 w-full p-1">
                  <TabsTrigger value="txt2img" className="text-xs px-3 py-1.5 h-auto">
                    Text-to-Image
                  </TabsTrigger>
                  <TabsTrigger value="img2img" className="text-xs px-3 py-1.5 h-auto">
                    Img2Img
                  </TabsTrigger>
                  <TabsTrigger value="style" className="text-xs px-3 py-1.5 h-auto">
                    Style
                  </TabsTrigger>
                  <TabsTrigger value="txt2vid" className="text-xs px-3 py-1.5 h-auto">
                    Text-to-Video
                  </TabsTrigger>
                  <TabsTrigger value="img2vid" className="text-xs px-3 py-1.5 h-auto">
                    Img2Vid
                  </TabsTrigger>
                  <TabsTrigger value="inpaint" className="text-xs px-3 py-1.5 h-auto">
                    Inpaint
                  </TabsTrigger>
                  <TabsTrigger value="upscale" className="text-xs px-3 py-1.5 h-auto">
                    Upscale
                  </TabsTrigger>
                  <TabsTrigger value="removebg" className="text-xs px-3 py-1.5 h-auto">
                    Remove BG
                  </TabsTrigger>
                  <TabsTrigger value="controlnet" className="text-xs px-3 py-1.5 h-auto">
                    ControlNet
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* txt2img */}
              <TabsContent value="txt2img" className="space-y-4">
                {renderPromptInputs()}
                <Button onClick={handleTxt2Img} disabled={generating} className="w-full" size="lg">
                  {generating ? "Generating..." : "Generate Image"}
                </Button>
              </TabsContent>

              {/* img2img */}
              <TabsContent value="img2img" className="space-y-4">
                {renderImageUpload()}
                {renderPromptInputs()}
                <div>
                  <Label className="text-xs">Denoise Strength (0 = no change, 1 = full redraw)</Label>
                  <Input type="number" value={denoise} onChange={(e) => setDenoise(Number(e.target.value))} min={0} max={1} step={0.05} />
                </div>
                <Button onClick={handleImg2Img} disabled={generating} className="w-full" size="lg">
                  {generating ? "Generating..." : "Generate (2 credits)"}
                </Button>
              </TabsContent>

              {/* Style Transfer */}
              <TabsContent value="style" className="space-y-4">
                {renderImageUpload()}
                <div>
                  <Label className="text-xs">Style</Label>
                  <Select value={style} onValueChange={(v) => v && setStyle(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STYLES.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Strength ({styleStrength})</Label>
                  <Input type="range" min={0.3} max={1} step={0.05} value={styleStrength}
                    onChange={(e) => setStyleStrength(Number(e.target.value))} />
                </div>
                <Button onClick={handleStyleTransfer} disabled={generating} className="w-full" size="lg">
                  {generating ? "Generating..." : "Apply Style (3 credits)"}
                </Button>
              </TabsContent>

              {/* txt2vid */}
              <TabsContent value="txt2vid" className="space-y-4">
                <div>
                  <Label className="text-xs">Video Model</Label>
                  <Select value={videoModel} onValueChange={(v) => v && setVideoModel(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIDEO_MODELS_T2V.map((m) => {
                        const locked = PLAN_RANK[userPlan] < PLAN_RANK[m.minPlan];
                        return (
                          <SelectItem key={m.id} value={m.id} disabled={locked}>
                            <span className="flex items-center gap-1.5">
                              {m.name}
                              <span className="text-[10px] text-muted-foreground">({m.credits} cr)</span>
                              {m.badge && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded">{m.badge}</span>}
                              {locked && <span className="text-[10px] text-amber-500">{m.minPlan}+</span>}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {renderPromptInputs()}
                <Button onClick={handleTxt2Vid} disabled={generating} className="w-full" size="lg">
                  {generating ? "Generating..." : `Generate Video (${VIDEO_MODELS_T2V.find((m) => m.id === videoModel)?.credits ?? 5} credits)`}
                </Button>
              </TabsContent>

              {/* img2vid */}
              <TabsContent value="img2vid" className="space-y-4">
                <div>
                  <Label className="text-xs">Video Model</Label>
                  <Select value={i2vModel} onValueChange={(v) => v && setI2vModel(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIDEO_MODELS_I2V.map((m) => {
                        const locked = PLAN_RANK[userPlan] < PLAN_RANK[m.minPlan];
                        return (
                          <SelectItem key={m.id} value={m.id} disabled={locked}>
                            <span className="flex items-center gap-1.5">
                              {m.name}
                              <span className="text-[10px] text-muted-foreground">({m.credits} cr)</span>
                              {m.badge && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded">{m.badge}</span>}
                              {locked && <span className="text-[10px] text-amber-500">{m.minPlan}+</span>}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {renderImageUpload()}
                {/* I2V Motion Prompt Suggestions */}
                {suggestingPrompts && (
                  <p className="text-xs text-purple-400 animate-pulse">Analyzing image for motion suggestions...</p>
                )}
                {i2vSuggestions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium">Suggested motions (click to apply):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {i2vSuggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(s.prompt)}
                          className="text-[11px] px-2 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-colors cursor-pointer"
                          title={s.prompt}
                        >
                          {s.icon} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="prompt-img2vid">Prompt (optional)</Label>
                  <Textarea
                    id="prompt-img2vid"
                    placeholder="Describe the motion you want..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Frames</Label>
                    <Select value={String(frameCount)} onValueChange={(v) => v && setFrameCount(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="16">16</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="32">32</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">FPS</Label>
                    <Select value={String(fps)} onValueChange={(v) => v && setFps(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleImg2Vid} disabled={generating} className="w-full" size="lg">
                  {generating ? "Generating..." : `Animate Image (${frameCount > 16 ? 10 : 5} credits)`}
                </Button>
              </TabsContent>

              {/* vid2vid */}
              <TabsContent value="vid2vid" className="space-y-4">
                <div>
                  <Label className="text-xs">Upload Video</Label>
                  <Input type="file" accept="video/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setInputVideo(file);
                  }} className="mt-1" />
                </div>
                {renderPromptInputs()}
                <div>
                  <Label className="text-xs">Denoise Strength</Label>
                  <Input type="number" value={denoise} onChange={(e) => setDenoise(Number(e.target.value))} min={0} max={1} step={0.05} />
                </div>
                <Button onClick={handleVid2Vid} disabled={generating} className="w-full" size="lg">
                  {generating ? "Generating..." : "Transform Video (15 credits)"}
                </Button>
                <p className="text-xs text-muted-foreground">Requires Pro plan or above</p>
              </TabsContent>

              {/* Upscale */}
              <TabsContent value="upscale" className="space-y-4">
                <div className="rounded-lg border border-dashed p-3 bg-muted/30">
                  <p className="text-sm font-medium">AI upscaling up to 4x</p>
                  <p className="text-xs text-muted-foreground">Enhance resolution with RealESRGAN. Sharp, detailed results from low-res images.</p>
                </div>
                {renderImageUpload()}
                <div>
                  <Label className="text-xs">Scale Factor</Label>
                  <Select value={String(upscaleScale)} onValueChange={(v) => v && setUpscaleScale(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="4">4x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpscale} disabled={generating} className="w-full" size="lg">
                  {generating ? "Upscaling..." : "Upscale (1 credit)"}
                </Button>
              </TabsContent>

              {/* Inpaint */}
              <TabsContent value="inpaint" className="space-y-4">
                <div className="rounded-lg border border-dashed p-3 bg-muted/30">
                  <p className="text-sm font-medium">Edit parts of an image</p>
                  <p className="text-xs text-muted-foreground">Upload an image, paint a mask over the area to change, then describe what you want.</p>
                </div>
                {renderImageUpload("Upload Image")}
                <div>
                  <Label className="text-xs">Upload Mask (white = area to edit)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setMaskImage(file);
                  }} className="mt-1" />
                </div>
                {renderPromptInputs()}
                <Button onClick={handleInpaint} disabled={generating} className="w-full" size="lg">
                  {generating ? "Generating..." : "Inpaint (2 credits)"}
                </Button>
              </TabsContent>

              {/* ControlNet */}
              <TabsContent value="controlnet" className="space-y-4">
                <div className="rounded-lg border border-dashed p-3 bg-muted/30">
                  <p className="text-sm font-medium">Guided generation with ControlNet</p>
                  <p className="text-xs text-muted-foreground">Use pose, depth, edges, or scribbles to control the composition. Upload a reference image to guide the AI.</p>
                </div>
                {renderImageUpload("Upload Control Image")}
                <div>
                  <Label className="text-xs">Control Type</Label>
                  <Select value={controlType} onValueChange={(v) => v && setControlType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTROL_TYPES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Control Strength ({controlStrength})</Label>
                  <Input type="range" min={0} max={2} step={0.1} value={controlStrength}
                    onChange={(e) => setControlStrength(Number(e.target.value))} />
                </div>
                {renderPromptInputs()}
                <Button onClick={handleControlNet} disabled={generating} className="w-full" size="lg">
                  {generating ? "Generating..." : "Generate with ControlNet (3 credits)"}
                </Button>
              </TabsContent>

              {/* Remove BG */}
              <TabsContent value="removebg" className="space-y-4">
                <div className="rounded-lg border border-dashed p-3 bg-muted/30">
                  <p className="text-sm font-medium">Remove backgrounds instantly</p>
                  <p className="text-xs text-muted-foreground">Perfect for product photos, profile pictures, and social media. Upload any image and get a clean transparent background.</p>
                </div>
                {renderImageUpload()}
                <Button onClick={handleRemoveBg} disabled={generating} className="w-full" size="lg">
                  {generating ? "Processing..." : "Remove Background (1 credit)"}
                </Button>
              </TabsContent>
            </Tabs>

            {/* Generation Progress */}
            {job && job.status !== "completed" && job.status !== "failed" && (
              <Card className="border-purple-500/30 bg-purple-500/5">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0">
                      <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {job.status === "queued" ? "Waiting in queue..." : "Generating..."}
                      </p>
                      <p className="text-xs text-muted-foreground">{elapsed}s elapsed</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{
                        width: job.status === "queued" ? "5%" :
                          job.progress > 0 ? `${Math.min(job.progress * 100, 95)}%` :
                          `${Math.min(15 + (elapsed / 60) * 80, 90)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Result */}
            {job?.status === "completed" && job.resultUrl && (
              <Card className="border-green-500/30">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-500">Complete! ({elapsed}s)</p>
                    <div className="flex items-center gap-3">
                      {nsfwMode && resultBlurred && (
                        <button
                          onClick={() => setResultBlurred(false)}
                          className="text-xs text-amber-500 hover:underline font-medium"
                        >
                          Remove blur (18+)
                        </button>
                      )}
                      {nsfwMode && !resultBlurred && (
                        <button
                          onClick={() => setResultBlurred(true)}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          Add blur
                        </button>
                      )}
                      <button onClick={() => { import("@/lib/utils").then(m => m.downloadFile(job.resultUrl!, job.type === "video" ? "egaku-video.mp4" : "egaku-image.png")); }} className="text-xs text-purple-500 hover:underline font-medium">Download</button>
                      <a href={job.resultUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline">Open full size</a>
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden bg-muted relative">
                    {job.type === "image" ? (
                      <img
                        src={job.resultUrl}
                        alt="Generated"
                        className={`w-full max-h-[600px] object-contain transition-all duration-300 ${
                          nsfwMode && resultBlurred ? "blur-xl" : ""
                        }`}
                      />
                    ) : (
                      <video
                        src={job.resultUrl}
                        controls
                        loop
                        autoPlay
                        muted
                        className={`w-full max-h-[600px] ${
                          nsfwMode && resultBlurred ? "blur-xl" : ""
                        }`}
                      />
                    )}
                    {nsfwMode && resultBlurred && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => setResultBlurred(false)}
                          className="bg-black/60 text-white px-4 py-2 rounded-lg text-sm hover:bg-black/80 transition-colors"
                        >
                          Click to reveal (18+ verified)
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Failed */}
            {job?.status === "failed" && (
              <Card className="border-red-500/30">
                <CardContent className="pt-5 space-y-2">
                  <p className="text-sm font-medium text-red-500">Generation failed</p>
                  <pre className="text-xs text-muted-foreground mt-1 bg-muted p-3 rounded-md overflow-x-auto select-all whitespace-pre-wrap break-all">
                    {job.error || "An unexpected error occurred."}
                  </pre>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(job.error || "Unknown error");
                      toast.success("Error copied to clipboard");
                    }}>Copy Error</Button>
                    <Button variant="outline" size="sm" onClick={() => { setJob(null); setElapsed(0); }}>Dismiss</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side panel - Settings (collapsible on mobile) */}
          <div>
            {/* Mobile: collapsible */}
            <details className="lg:hidden" open={false}>
              <summary className="cursor-pointer rounded-lg border p-3 text-sm font-medium flex items-center justify-between">
                Settings (Model, Size, Steps...)
                <span className="text-muted-foreground text-xs">tap to expand</span>
              </summary>
              <Card className="mt-2">
                <CardContent className="pt-4">
                  {renderSettingsPanel()}
                </CardContent>
              </Card>
            </details>
            {/* Desktop: always visible */}
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle className="text-sm">Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {renderSettingsPanel()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <PromptAssistant
        token={session?.access_token ?? null}
        onUsePrompt={(p) => setPrompt(p)}
      />
    </>
  );
}
