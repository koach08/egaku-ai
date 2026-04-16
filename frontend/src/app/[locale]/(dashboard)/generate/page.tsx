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
  { id: "fal_flux_pro", name: "Flux Pro v1.1", type: "Premium", credits: 5, minPlan: "basic", badge: "★ Best" },
  { id: "fal_ideogram", name: "Ideogram v3 (Text)", type: "Premium", credits: 5, minPlan: "lite", badge: "★ Text" },
  { id: "fal_luma_photon", name: "Luma Photon", type: "Premium", credits: 5, minPlan: "lite", badge: "New" },
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

// ── Color Grading Presets (CSS filter-based, client-side only) ──
const COLOR_GRADES = [
  { id: "none", name: "None", filter: "", minPlan: "free" },
  { id: "teal_orange", name: "Teal & Orange", filter: "contrast(1.15) saturate(1.3) hue-rotate(-8deg)", minPlan: "free" },
  { id: "vintage_warm", name: "Vintage Warm", filter: "sepia(0.25) contrast(1.1) brightness(1.05) saturate(0.9)", minPlan: "free" },
  { id: "noir", name: "Film Noir", filter: "grayscale(1) contrast(1.4) brightness(0.9)", minPlan: "free" },
  { id: "cold_blue", name: "Cold Blue", filter: "saturate(0.8) brightness(1.05) hue-rotate(15deg) contrast(1.05)", minPlan: "basic" },
  { id: "golden_hour", name: "Golden Hour", filter: "sepia(0.15) saturate(1.3) brightness(1.1) contrast(1.05)", minPlan: "basic" },
  { id: "bleach_bypass", name: "Bleach Bypass", filter: "saturate(0.4) contrast(1.5) brightness(0.95)", minPlan: "basic" },
  { id: "cross_process", name: "Cross Process", filter: "hue-rotate(25deg) saturate(1.4) contrast(1.15) brightness(1.05)", minPlan: "basic" },
  { id: "moody_dark", name: "Moody Dark", filter: "brightness(0.85) contrast(1.3) saturate(0.7) sepia(0.1)", minPlan: "pro" },
  { id: "pastel_dream", name: "Pastel Dream", filter: "brightness(1.15) contrast(0.9) saturate(0.6) sepia(0.05)", minPlan: "pro" },
  { id: "neon_glow", name: "Neon Glow", filter: "saturate(1.8) contrast(1.2) brightness(1.1) hue-rotate(-5deg)", minPlan: "pro" },
  { id: "matte_film", name: "Matte Film", filter: "contrast(0.95) brightness(1.08) saturate(0.85) sepia(0.08)", minPlan: "pro" },
  { id: "high_contrast_bw", name: "High Contrast B&W", filter: "grayscale(1) contrast(1.8) brightness(0.95)", minPlan: "pro" },
  { id: "retro_fade", name: "Retro Fade", filter: "sepia(0.35) contrast(0.95) brightness(1.1) saturate(0.7) hue-rotate(5deg)", minPlan: "basic" },
];

// ── Cinema Camera Presets ──
const CINEMA_PRESETS = [
  { id: "none", name: "None", suffix: "", icon: "🎬", minPlan: "free" },
  { id: "blockbuster", name: "Cinematic Blockbuster", suffix: ", shot on ARRI Alexa 35, Cooke S7/i 50mm T2.0, shallow depth of field, anamorphic lens flare, 2.39:1 cinematic framing", icon: "🎥", minPlan: "free" },
  { id: "indie_a24", name: "Indie / A24", suffix: ", shot on ARRI AMIRA, Zeiss Super Speed 35mm T1.3, natural lighting, 16mm film grain, muted desaturated palette, handheld camera", icon: "🎞️", minPlan: "free" },
  { id: "vintage_70s", name: "Vintage 70s", suffix: ", shot on Panavision Panaflex, anamorphic Panavision C-Series lenses, heavy halation, warm color cast, film grain, soft focus edges", icon: "📽️", minPlan: "free" },
  { id: "music_video", name: "Music Video / Fashion", suffix: ", shot on RED V-Raptor 8K, Sigma Cine 85mm T1.5, extreme shallow DOF, high contrast, teal and orange grade, slow motion", icon: "💃", minPlan: "basic" },
  { id: "documentary", name: "Documentary", suffix: ", shot on Sony FX6, Sony 24-70mm f/2.8 GM, available light, slight camera shake, realistic skin tones, broadcast look", icon: "📹", minPlan: "basic" },
  { id: "horror", name: "Horror / Thriller", suffix: ", shot on RED Monstro 8K, Leica Summilux-C 29mm T1.4, dutch angle, underexposed, desaturated, green-tinted shadows, wide-angle distortion", icon: "👻", minPlan: "basic" },
  { id: "wes_anderson", name: "Wes Anderson", suffix: ", shot on ARRI Alexa Mini, Zeiss Master Prime 40mm T1.3, perfectly symmetrical composition, pastel color palette, flat lighting, centered framing", icon: "🏨", minPlan: "basic" },
  { id: "imax_epic", name: "IMAX Epic", suffix: ", shot on ARRI Alexa 65, Hasselblad Prime 65 50mm, IMAX aspect ratio, extreme resolution, vast depth of field f/8, sweeping crane shot", icon: "🏔️", minPlan: "pro" },
  { id: "neon_noir", name: "Neon Noir / Cyberpunk", suffix: ", shot on Blackmagic URSA Mini Pro 12K, Sigma Art 35mm f/1.4, neon reflections on wet pavement, high contrast, deep blacks, cyan and magenta grade", icon: "🌃", minPlan: "pro" },
  { id: "dreamy", name: "Dreamy / Ethereal", suffix: ", shot on Canon C500 Mark II, Canon CN-E 85mm T1.3, Pro-Mist diffusion filter, golden hour backlighting, lens flare, warm highlights, soft skin", icon: "✨", minPlan: "pro" },
  { id: "tarantino", name: "Tarantino", suffix: ", shot on 35mm film, Panavision Ultra Speed 40mm T1.1, trunk shot POV, low angle, saturated reds, 1970s exploitation film aesthetic, visible film scratches", icon: "🩸", minPlan: "pro" },
  { id: "spielberg", name: "Spielberg Classic", suffix: ", shot on Panavision Millennium XL2, anamorphic G-Series, lens flare, magic hour lighting, 2.39:1 widescreen, dolly zoom", icon: "🦖", minPlan: "pro" },
  { id: "drone_aerial", name: "Drone / Aerial", suffix: ", shot on DJI Inspire 3, Zenmuse X9 24mm, aerial establishing shot, golden hour, sweeping orbital movement, vast landscape, tilt-shift", icon: "🚁", minPlan: "basic" },
  { id: "surveillance", name: "Found Footage / CCTV", suffix: ", shot on low-resolution CCTV camera, wide-angle fisheye lens, infrared night vision, timestamp overlay, VHS tracking lines, high ISO noise", icon: "📷", minPlan: "basic" },
  { id: "anime_cinema", name: "Anime Cinematic", suffix: ", anime feature film quality, Makoto Shinkai style lighting, detailed backgrounds, volumetric light rays, 2.39:1 cinematic letterbox, vibrant color palette", icon: "🌸", minPlan: "basic" },
];

const VIDEO_MODELS_T2V = [
  { id: "fal_ltx_t2v", name: "LTX 2.3", credits: 5, minPlan: "free", badge: "Fast", maxDuration: 5 },
  { id: "fal_wan_t2v", name: "Wan 2.1", credits: 10, minPlan: "free", maxDuration: 5 },
  { id: "fal_kling_t2v", name: "Kling v2", credits: 15, minPlan: "basic", badge: "HD", maxDuration: 10 },
  { id: "fal_minimax_t2v", name: "Minimax Hailuo", credits: 15, minPlan: "basic", badge: "HD", maxDuration: 6 },
  { id: "fal_kling25_t2v", name: "Kling 2.5 Pro", credits: 25, minPlan: "basic", badge: "★ Cinema", maxDuration: 10 },
  { id: "fal_grok_t2v", name: "Grok Video (xAI)", credits: 30, minPlan: "basic", badge: "★ Audio", maxDuration: 6 },
  { id: "fal_veo3_t2v", name: "Veo 3 (Google)", credits: 40, minPlan: "pro", badge: "★ Audio", maxDuration: 8 },
  { id: "fal_sora2_t2v", name: "Sora 2 (OpenAI)", credits: 50, minPlan: "pro", badge: "★ Best 20s", maxDuration: 20 },
  { id: "fal_luma_t2v", name: "Luma Dream Machine", credits: 20, minPlan: "basic", badge: "New", maxDuration: 5 },
  { id: "fal_hunyuan_t2v", name: "Hunyuan (Tencent)", credits: 15, minPlan: "basic", badge: "New", maxDuration: 5 },
  { id: "fal_mochi_t2v", name: "Mochi v1 (Genmo)", credits: 10, minPlan: "free", badge: "New", maxDuration: 5 },
  { id: "fal_seedance_t2v", name: "Seedance 1 (ByteDance)", credits: 20, minPlan: "basic", badge: "★ TikTok", maxDuration: 10 },
  { id: "fal_seedance2_t2v", name: "Seedance 2 (ByteDance)", credits: 60, minPlan: "pro", badge: "★ Audio · Best", maxDuration: 15 },
  { id: "fal_seedance2_fast_t2v", name: "Seedance 2 Fast (ByteDance)", credits: 50, minPlan: "basic", badge: "★ Fast", maxDuration: 15 },
  { id: "fal_pika_t2v", name: "Pika v2", credits: 20, minPlan: "basic", badge: "★ Cinema", maxDuration: 6 },
  { id: "fal_vidu_t2v", name: "Vidu Q1 (Kuaishou)", credits: 15, minPlan: "basic", badge: "New", maxDuration: 8 },
  { id: "fal_luma15_t2v", name: "Luma v1.5", credits: 20, minPlan: "basic", badge: "New", maxDuration: 5 },
];

const VIDEO_MODELS_I2V = [
  { id: "fal_ltx_i2v", name: "LTX 2 I2V", credits: 5, minPlan: "free", badge: "Fast", maxDuration: 5 },
  { id: "fal_wan_i2v", name: "Wan 2.1 I2V", credits: 10, minPlan: "free", maxDuration: 5 },
  { id: "fal_wan26_i2v", name: "Wan 2.6 I2V", credits: 12, minPlan: "free", badge: "★ 15s", maxDuration: 15 },
  { id: "fal_kling_i2v", name: "Kling v2 I2V", credits: 15, minPlan: "basic", badge: "HD", maxDuration: 10 },
  { id: "fal_kling25_i2v", name: "Kling 2.5 Pro I2V", credits: 25, minPlan: "basic", badge: "★ Cinema", maxDuration: 10 },
  { id: "fal_sora2_i2v", name: "Sora 2 I2V", credits: 50, minPlan: "pro", badge: "★ Best 20s", maxDuration: 20 },
  { id: "fal_seedance2_i2v", name: "Seedance 2 I2V (ByteDance)", credits: 60, minPlan: "pro", badge: "★ Audio · Best", maxDuration: 15 },
  { id: "fal_seedance2_fast_i2v", name: "Seedance 2 Fast I2V", credits: 50, minPlan: "basic", badge: "★ Fast", maxDuration: 15 },
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

  // Read remix params from URL (1-Click Remix from gallery)
  const [remixLoaded, setRemixLoaded] = useState(false);

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

  // Face Swap
  const [faceSourceFile, setFaceSourceFile] = useState<File | null>(null);

  // Batch
  const [batchSize, setBatchSize] = useState(1);

  // I2V mode: animate (preserve image) or reimagine (create new from image)
  const [i2vMode, setI2vMode] = useState<"animate" | "reimagine">("animate");

  // Compare mode
  const [compareModels, setCompareModels] = useState(["fal_flux_dev", "fal_flux_pro", "fal_ideogram"]);
  const [compareResults, setCompareResults] = useState<Record<string, string | null>>({});
  const [comparing, setComparing] = useState(false);

  // Consistent Character
  const [characterRef, setCharacterRef] = useState<File | null>(null);
  const [idWeight, setIdWeight] = useState(1.0);

  // Cinema Preset
  const [cinemaPreset, setCinemaPreset] = useState("none");

  // Color Grading
  const [colorGrade, setColorGrade] = useState("none");

  // Video model
  const [videoModel, setVideoModel] = useState("fal_ltx_t2v");
  const [i2vModel, setI2vModel] = useState("fal_ltx_i2v");

  // I2V prompt suggestions
  const [i2vSuggestions, setI2vSuggestions] = useState<{label: string; prompt: string; icon: string}[]>([]);
  const [suggestingPrompts, setSuggestingPrompts] = useState(false);

  // Video params
  const [frameCount, setFrameCount] = useState(16);
  const [fps, setFps] = useState(8);
  const [videoDuration, setVideoDuration] = useState(5); // seconds
  const [videoResolution, setVideoResolution] = useState("720p");

  // Computed max duration per model
  const txt2vidMaxDuration = VIDEO_MODELS_T2V.find((m) => m.id === videoModel)?.maxDuration ?? 5;
  const img2vidMaxDuration = VIDEO_MODELS_I2V.find((m) => m.id === i2vModel)?.maxDuration ?? 5;

  // Upscale
  const [upscaleScale, setUpscaleScale] = useState(2);

  // NSFW
  const [nsfwMode, setNsfwMode] = useState(false);
  const [nsfwConsented, setNsfwConsented] = useState(false);
  const [showNsfwDialog, setShowNsfwDialog] = useState(false);
  const [resultBlurred, setResultBlurred] = useState(true);

  const [userPlan, setUserPlan] = useState("free");
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
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

  // Fetch credit balance + auto-claim daily bonus
  useEffect(() => {
    if (!session) return;
    // Fetch balance
    api.getBalance(session.access_token)
      .then((data) => setCreditBalance(data.balance ?? null))
      .catch(() => {});
    // Auto-claim daily bonus
    api.claimDailyCredits(session.access_token)
      .then((data) => {
        if (data.claimed) {
          toast.success(`Daily bonus: +${data.amount} credit! Balance: ${data.new_balance}`);
          setCreditBalance(data.new_balance);
        }
      })
      .catch(() => {});
  }, [session]);

  // Load remix params from URL (?prompt=...&model=...)
  useEffect(() => {
    if (remixLoaded) return;
    const params = new URLSearchParams(window.location.search);
    const p = params.get("prompt");
    if (p) {
      setPrompt(p);
      const m = params.get("model");
      if (m) setModel(m);
      const np = params.get("negative_prompt");
      if (np) setNegativePrompt(np);
      const w = params.get("width");
      if (w) setWidth(Number(w));
      const h = params.get("height");
      if (h) setHeight(Number(h));
      const s = params.get("steps");
      if (s) setSteps(Number(s));
      const c = params.get("cfg");
      if (c) setCfg(Number(c));
    }
    setRemixLoaded(true);
  }, [remixLoaded]);

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
              Enter any idea and watch AI create stunning images. {anonRemaining !== null ? `${anonRemaining} free ${anonRemaining === 1 ? "generation" : "generations"} remaining.` : "5 free generations to start."}
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
                  Get 50 free credits, access to 15+ AI models, video generation, and more.
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
        prompt: buildPrompt(prompt), negative_prompt: negativePrompt, model, width, height, steps, cfg, sampler, seed, nsfw: nsfwMode, batch_size: batchSize,
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
        prompt: buildPrompt(prompt), negative_prompt: negativePrompt, model, image: b64,
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
        prompt: buildPrompt(prompt), negative_prompt: negativePrompt, model: videoModel,
        width: 512, height: 512, steps, cfg, sampler, seed,
        frame_count: frameCount, fps, nsfw: nsfwMode,
        duration: Math.min(videoDuration, txt2vidMaxDuration), resolution: videoResolution,
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
        prompt: buildPrompt(prompt), model: i2vModel, image: b64, width: 512, height: 512,
        steps, cfg, denoise, sampler, seed,
        frame_count: frameCount, fps, nsfw: nsfwMode,
        mode: i2vMode,
        duration: Math.min(videoDuration, img2vidMaxDuration), resolution: videoResolution,
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
        prompt: buildPrompt(prompt), negative_prompt: negativePrompt, model,
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
        prompt: buildPrompt(prompt), negative_prompt: negativePrompt, model,
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

  const handleCompare = async () => {
    if (!prompt.trim() || !session) { toast.error("Enter a prompt"); return; }
    setComparing(true);
    setCompareResults({});

    const results: Record<string, string | null> = {};

    // Generate with each selected model in parallel
    const promises = compareModels.map(async (modelId) => {
      try {
        const res = await api.generateImage(session.access_token, {
          prompt: buildPrompt(prompt), negative_prompt: negativePrompt,
          model: modelId, width, height, steps, cfg, sampler, seed: -1, nsfw: nsfwMode,
        });
        if (res.status === "completed" && res.result_url) {
          results[modelId] = resolveResultUrl(res.result_url) || null;
        } else {
          // Poll for result
          for (let i = 0; i < 60; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const status = await api.getJobStatus(session.access_token, res.job_id);
            if (status.status === "completed" && status.result_url) {
              results[modelId] = resolveResultUrl(status.result_url) || null;
              break;
            }
            if (status.status === "failed") break;
          }
        }
      } catch {
        results[modelId] = null;
      }
      setCompareResults({ ...results });
    });

    await Promise.all(promises);
    setComparing(false);
    toast.success("Comparison complete!");
  };

  const handleConsistentCharacter = async () => {
    if (!characterRef) { toast.error("Please upload a reference face photo"); return; }
    if (!prompt.trim()) { toast.error("Please enter a scene description"); return; }
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const refB64 = await fileToBase64(characterRef);
      const res = await api.consistentCharacter(session!.access_token, {
        prompt: buildPrompt(prompt),
        reference_image: refB64,
        width: Number(width),
        height: Number(height),
        id_weight: idWeight,
        seed: Number(seed),
        nsfw: nsfwMode,
      });
      if (res.result_url) {
        setJob({ jobId: res.job_id, status: "completed", resultUrl: res.result_url, progress: 1, type: "image", startedAt: Date.now() });
        setGenerating(false);
      } else {
        startJob(res.job_id, "image", res.credits_used);
      }
    } catch (err: unknown) {
      showError(err);
    }
  };

  const handleFaceSwap = async () => {
    if (!faceSourceFile) { toast.error("Please upload your face photo"); return; }
    if (!inputImage) { toast.error("Please upload a target image"); return; }
    setGenerating(true); setJob(null); setElapsed(0); setResultBlurred(nsfwMode);
    try {
      const sourceB64 = await fileToBase64(faceSourceFile);
      const targetB64 = await fileToBase64(inputImage);
      const res = await api.faceSwap(session!.access_token, {
        source_image: sourceB64,
        target_image: targetB64,
        nsfw: nsfwMode,
      });
      if (res.result_url) {
        setJob({ jobId: res.job_id, status: "completed", resultUrl: res.result_url, progress: 1, type: "image", startedAt: Date.now() });
        setGenerating(false);
      } else {
        startJob(res.job_id, "image", res.credits_used);
      }
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

  /** Build final prompt with cinema preset suffix appended */
  const buildPrompt = (base: string) => {
    const preset = CINEMA_PRESETS.find((p) => p.id === cinemaPreset);
    if (!preset || preset.id === "none") return base;
    return base + preset.suffix;
  };

  const PROMPT_TEMPLATES = [
    { label: "🏔 Landscape", prompt: "Breathtaking mountain landscape at golden hour, crystal clear lake reflection, dramatic clouds, shot on Hasselblad, 8K" },
    { label: "👤 Portrait", prompt: "Stunning portrait photograph, beautiful soft lighting, shallow depth of field, professional studio quality, shot on Canon EOS R5, 85mm f/1.2, 8K" },
    { label: "🌆 Cyberpunk", prompt: "Neon-lit cyberpunk city at night in rain, holographic signs, flying cars, wet streets reflecting colorful lights, Blade Runner atmosphere, 8K" },
    { label: "🎌 Anime", prompt: "Beautiful anime illustration, detailed eyes, flowing hair, vibrant colors, Studio Ghibli meets Makoto Shinkai quality, 4K" },
    { label: "🍣 Food", prompt: "Ultra-premium food photography, perfectly plated dish, dramatic directional lighting, dark background, Michelin star restaurant quality, 8K" },
    { label: "🚀 Sci-Fi", prompt: "Epic sci-fi concept art, massive space station orbiting an alien planet, volumetric lighting, cinematic composition, 8K" },
    { label: "🐉 Fantasy", prompt: "Majestic fantasy scene, ancient dragon perched on a mountain peak, magical aurora in the sky, detailed scales, epic composition, 8K" },
    { label: "📸 Product", prompt: "Professional product photography, luxury item on clean background, dramatic studio lighting, sharp focus, commercial quality, 8K" },
  ];

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
        {!prompt.trim() && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PROMPT_TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => setPrompt(t.prompt)}
                className="text-[11px] px-2 py-1 rounded-full border border-muted hover:border-purple-500/40 hover:text-purple-400 transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cinema Camera Preset */}
      <div>
        <Label className="text-xs flex items-center gap-1.5">
          <span>Cinema Preset</span>
          <span className="text-[10px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 px-1.5 rounded">Film Look</span>
        </Label>
        <Select value={cinemaPreset} onValueChange={(v) => v && setCinemaPreset(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CINEMA_PRESETS.map((p) => {
              const locked = PLAN_RANK[userPlan] < PLAN_RANK[p.minPlan];
              return (
                <SelectItem key={p.id} value={p.id} disabled={locked}>
                  <span className="flex items-center gap-1.5">
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                    {locked && <span className="text-[10px] text-amber-500">{p.minPlan}+</span>}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {cinemaPreset !== "none" && (
          <p className="text-[10px] text-muted-foreground mt-1 italic">
            {CINEMA_PRESETS.find((p) => p.id === cinemaPreset)?.suffix.slice(2)}
          </p>
        )}
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
                  <TabsTrigger value="faceswap" className="text-xs px-3 py-1.5 h-auto">
                    Face Swap
                  </TabsTrigger>
                  <TabsTrigger value="character" className="text-xs px-3 py-1.5 h-auto">
                    Character Lock
                  </TabsTrigger>
                  <TabsTrigger value="compare" className="text-xs px-3 py-1.5 h-auto">
                    Compare
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* txt2img */}
              <TabsContent value="txt2img" className="space-y-4">
                {renderPromptInputs()}
                <div className="flex items-center gap-3">
                  <Button onClick={handleTxt2Img} disabled={generating} className="flex-1" size="lg">
                    {generating ? "Generating..." : `Generate${batchSize > 1 ? ` (${batchSize} images)` : ""}`}
                  </Button>
                  <div className="flex items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground">Batch</Label>
                    <Select value={String(batchSize)} onValueChange={(v) => setBatchSize(Number(v))}>
                      <SelectTrigger className="w-[60px] h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1x</SelectItem>
                        <SelectItem value="2">2x</SelectItem>
                        <SelectItem value="4">4x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                              <span className="text-[10px] text-muted-foreground">({m.credits} cr · max {m.maxDuration}s)</span>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Duration: {Math.min(videoDuration, txt2vidMaxDuration)}s</Label>
                    <Input type="range" min={3} max={txt2vidMaxDuration} step={1} value={Math.min(videoDuration, txt2vidMaxDuration)}
                      onChange={(e) => setVideoDuration(Number(e.target.value))} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Max {txt2vidMaxDuration}s for this model
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Resolution</Label>
                    <Select value={videoResolution} onValueChange={(v) => v && setVideoResolution(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleTxt2Vid} disabled={generating} className="w-full" size="lg">
                  {generating ? "Generating..." : `Generate Video (${VIDEO_MODELS_T2V.find((m) => m.id === videoModel)?.credits ?? 5} credits)`}
                </Button>
              </TabsContent>

              {/* img2vid */}
              <TabsContent value="img2vid" className="space-y-4">
                {/* Mode Selector — Animate vs Reimagine */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setI2vMode("animate")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      i2vMode === "animate"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-muted hover:border-purple-500/30"
                    }`}
                  >
                    <p className="text-sm font-semibold">🎬 Animate</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Preserve image, add natural motion</p>
                  </button>
                  <button
                    onClick={() => setI2vMode("reimagine")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      i2vMode === "reimagine"
                        ? "border-pink-500 bg-pink-500/10"
                        : "border-muted hover:border-pink-500/30"
                    }`}
                  >
                    <p className="text-sm font-semibold">✨ Reimagine</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">New video inspired by image</p>
                  </button>
                </div>
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
                              <span className="text-[10px] text-muted-foreground">({m.credits} cr · max {m.maxDuration}s)</span>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Duration: {Math.min(videoDuration, img2vidMaxDuration)}s</Label>
                    <Input type="range" min={3} max={img2vidMaxDuration} step={1} value={Math.min(videoDuration, img2vidMaxDuration)}
                      onChange={(e) => setVideoDuration(Number(e.target.value))} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Max {img2vidMaxDuration}s for this model
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Resolution</Label>
                    <Select value={videoResolution} onValueChange={(v) => v && setVideoResolution(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleImg2Vid} disabled={generating} className="w-full" size="lg">
                  {generating ? "Generating..." : `Animate Image (${videoDuration > 10 ? 15 : videoDuration > 5 ? 10 : 5} credits)`}
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

              {/* Multi-Model Compare */}
              <TabsContent value="compare" className="space-y-4">
                <div className="rounded-lg border border-dashed p-3 bg-muted/30">
                  <p className="text-sm font-medium">Multi-Model Compare</p>
                  <p className="text-xs text-muted-foreground">Same prompt, multiple models, side by side. See which model works best for your idea.</p>
                </div>
                {renderPromptInputs()}
                <div>
                  <Label className="text-xs">Models to compare (select up to 3)</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {MODELS.filter((m) => PLAN_RANK[userPlan] >= PLAN_RANK[m.minPlan]).map((m) => {
                      const selected = compareModels.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            if (selected) {
                              setCompareModels((prev) => prev.filter((id) => id !== m.id));
                            } else if (compareModels.length < 3) {
                              setCompareModels((prev) => [...prev, m.id]);
                            }
                          }}
                          className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                            selected ? "bg-purple-500/20 border-purple-500/50 text-purple-400" : "border-muted hover:border-purple-500/30"
                          }`}
                        >
                          {m.name} ({m.credits}cr)
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button
                  onClick={handleCompare}
                  disabled={comparing || compareModels.length === 0 || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  size="lg"
                >
                  {comparing ? "Comparing..." : `Compare ${compareModels.length} Models (${compareModels.length * 3}+ credits)`}
                </Button>
                {/* Results grid */}
                {Object.keys(compareResults).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {compareModels.map((modelId) => {
                      const modelInfo = MODELS.find((m) => m.id === modelId);
                      const resultUrl = compareResults[modelId];
                      return (
                        <div key={modelId} className="rounded-lg border overflow-hidden">
                          <div className="p-2 bg-muted text-xs font-medium text-center">{modelInfo?.name || modelId}</div>
                          {resultUrl ? (
                            <img src={resultUrl} alt={modelInfo?.name} className="w-full aspect-square object-cover" />
                          ) : comparing ? (
                            <div className="w-full aspect-square flex items-center justify-center bg-muted/50">
                              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="w-full aspect-square flex items-center justify-center bg-muted/50 text-xs text-muted-foreground">Failed</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Consistent Character (PuLID) */}
              <TabsContent value="character" className="space-y-4">
                <div className="rounded-lg border border-dashed p-3 bg-muted/30">
                  <p className="text-sm font-medium">Character Lock (PuLID)</p>
                  <p className="text-xs text-muted-foreground">Upload a face photo, then describe any scene. The AI will generate the scene with your character&apos;s face preserved. Perfect for storyboards, comics, and consistent multi-scene projects.</p>
                </div>
                <div>
                  <Label className="text-xs">Reference Face Photo</Label>
                  <Input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCharacterRef(file);
                  }} className="mt-1" />
                  {characterRef && <p className="text-xs text-muted-foreground mt-1">{characterRef.name}</p>}
                </div>
                {renderPromptInputs()}
                <div>
                  <Label className="text-xs">Identity Strength ({idWeight})</Label>
                  <Input type="range" min={0.1} max={2} step={0.1} value={idWeight}
                    onChange={(e) => setIdWeight(Number(e.target.value))} />
                  <p className="text-[10px] text-muted-foreground">Higher = more faithful to reference face, lower = more creative freedom</p>
                </div>
                <Button onClick={handleConsistentCharacter} disabled={generating} className="w-full" size="lg">
                  {generating ? "Generating..." : "Generate with Character Lock (5 credits)"}
                </Button>
                <p className="text-xs text-muted-foreground">Requires Pro plan or higher</p>
              </TabsContent>

              {/* Face Swap */}
              <TabsContent value="faceswap" className="space-y-4">
                <div className="rounded-lg border border-dashed p-3 bg-muted/30">
                  <p className="text-sm font-medium">AI Face Swap</p>
                  <p className="text-xs text-muted-foreground">Upload your face photo and a target image. Your face will be seamlessly placed onto the target. Basic plan required.</p>
                </div>
                <div>
                  <Label className="text-xs">Source Face (your photo)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFaceSourceFile(file);
                  }} className="mt-1" />
                  {faceSourceFile && <p className="text-xs text-muted-foreground mt-1">{faceSourceFile.name}</p>}
                </div>
                <div>
                  <Label className="text-xs">Target Image (where to put your face)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setInputImage(file);
                  }} className="mt-1" />
                  {inputImage && <p className="text-xs text-muted-foreground mt-1">{inputImage.name}</p>}
                </div>
                <Button onClick={handleFaceSwap} disabled={generating} className="w-full" size="lg">
                  {generating ? "Swapping..." : "Swap Face (3 credits)"}
                </Button>
                <p className="text-xs text-muted-foreground">Requires Basic plan or higher</p>
              </TabsContent>
            </Tabs>

            {/* Generation Progress — shown from button click until complete */}
            {(generating || (job && job.status !== "completed" && job.status !== "failed")) && (
              <Card className="border-purple-500/30 bg-purple-500/5 animate-pulse-slow">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0">
                      <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-purple-300">
                        {!job ? "🎨 Sending request to AI..." :
                         job.status === "queued" ? "⏳ Waiting in queue..." :
                         "🎨 Generating your content..."}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {elapsed > 0 ? `${elapsed}s elapsed` : "Just started"}
                        {elapsed > 30 && " — Videos can take 1-3 minutes"}
                        {elapsed > 90 && " — Complex prompts take longer"}
                      </p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]"
                      style={{
                        width: !job ? "8%" :
                          job.status === "queued" ? "12%" :
                          job.progress > 0 ? `${Math.min(job.progress * 100, 95)}%` :
                          `${Math.min(15 + (elapsed / 60) * 80, 90)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Please don&apos;t close this tab. Your generation is processing.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Completed Result */}
            {job?.status === "completed" && job.resultUrl && (
              <Card className="border-green-500/30">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-green-500">Complete! ({elapsed}s)</p>
                      {creditBalance !== null && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {creditBalance} credits left
                        </span>
                      )}
                    </div>
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
                      <button onClick={() => { const addWatermark = PLAN_RANK[userPlan] < PLAN_RANK["basic"]; import("@/lib/utils").then(m => m.downloadFile(job.resultUrl!, job.type === "video" ? "egaku-video.mp4" : "egaku-image.png", addWatermark)); }} className="text-xs text-purple-500 hover:underline font-medium">Download{PLAN_RANK[userPlan] < PLAN_RANK["basic"] ? " (watermark)" : ""}</button>
                      <a href={job.resultUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline">Open full size</a>
                      <button
                        onClick={() => {
                          const text = `Created with EGAKU AI\n${window.location.origin}`;
                          const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(job.resultUrl!)}`;
                          window.open(xUrl, '_blank', 'width=600,height=400');
                        }}
                        className="text-xs text-muted-foreground hover:text-blue-400 transition-colors"
                        title="Share on X"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                  {/* Color Grading Selector */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-xs flex items-center gap-1.5">
                      <span>Color Grade</span>
                      <span className="text-[10px] bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 px-1.5 rounded">Post</span>
                    </Label>
                    <div className="flex gap-1 flex-wrap">
                      {COLOR_GRADES.map((g) => {
                        const locked = PLAN_RANK[userPlan] < PLAN_RANK[g.minPlan];
                        return (
                          <button
                            key={g.id}
                            onClick={() => !locked && setColorGrade(g.id)}
                            disabled={locked}
                            className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                              colorGrade === g.id
                                ? "border-purple-500 bg-purple-500/20 text-purple-300"
                                : locked
                                ? "border-muted text-muted-foreground/40 cursor-not-allowed"
                                : "border-muted hover:border-muted-foreground/30 text-muted-foreground"
                            }`}
                            title={locked ? `${g.minPlan}+ plan required` : g.name}
                          >
                            {g.name}{locked ? ` (${g.minPlan}+)` : ""}
                          </button>
                        );
                      })}
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
                        style={colorGrade !== "none" ? { filter: COLOR_GRADES.find((g) => g.id === colorGrade)?.filter } : undefined}
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
                        style={colorGrade !== "none" ? { filter: COLOR_GRADES.find((g) => g.id === colorGrade)?.filter } : undefined}
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

                  {/* Upgrade CTA for free/lite users */}
                  {PLAN_RANK[userPlan] < PLAN_RANK["basic"] && (
                    <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white px-1.5 py-0.5 rounded">LAUNCH50</span>
                          <p className="text-xs font-medium">初月50%OFF — 先着100名限定</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Basic ¥490/月で Kling 2.5 / Face Swap / 1080p動画 / NSFWが全部使える
                        </p>
                      </div>
                      <a href="/#pricing" className="text-xs bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white px-3 py-1.5 rounded-lg transition-opacity whitespace-nowrap font-medium">
                        Upgrade →
                      </a>
                    </div>
                  )}
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
