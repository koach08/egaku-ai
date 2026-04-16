const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

/** Resolve backend-relative URLs (e.g. /api/generate/result/xxx) to full URLs */
export function resolveResultUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/api/")) {
    // API_BASE ends with /api, so strip /api from the relative URL
    return API_BASE + url.slice(4);
  }
  return url;
}

const USER_FRIENDLY_ERRORS: Record<number, string> = {
  401: "Please sign in to continue",
  402: "Not enough credits. Please upgrade your plan or wait for daily bonus.",
  403: "This feature requires a higher plan. Check pricing for details.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again.",
  503: "This service is temporarily busy. Please try again in a moment.",
};

async function fetchAPI(path: string, options: RequestInit = {}, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      if (!res.ok) {
        // Don't retry client errors (4xx)
        if (res.status >= 400 && res.status < 500) {
          const error = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(error.detail || USER_FRIENDLY_ERRORS[res.status] || "Request failed");
        }
        // Retry server errors (5xx)
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || USER_FRIENDLY_ERRORS[res.status] || "Server error. Please try again.");
      }
      return res.json();
    } catch (err) {
      if (err instanceof TypeError && attempt < retries) {
        // Network error — retry
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Auth
export const api = {
  health: () => fetchAPI("/health"),

  // Feedback (works authenticated or anonymous)
  submitFeedback: (
    token: string | null,
    body: {
      feature: string;
      category: "bug" | "feature_request" | "praise" | "general";
      message: string;
      rating?: number;
      page_url?: string;
      user_agent?: string;
    },
  ) =>
    fetchAPI("/feedback", {
      method: "POST",
      headers: token ? authHeaders(token) : {},
      body: JSON.stringify(body),
    }),

  // Auth
  initUser: (token: string) =>
    fetchAPI("/auth/init", { method: "POST", headers: authHeaders(token) }),
  getMe: (token: string) =>
    fetchAPI("/auth/me", { headers: authHeaders(token) }),
  verifyAge: (token: string, confirmed: boolean) =>
    fetchAPI("/auth/verify-age", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ confirmed }),
    }),
  updateProfile: (
    token: string,
    data: { display_name?: string; bio?: string }
  ) =>
    fetchAPI("/auth/profile", {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
  markEmailVerified: (token: string) =>
    fetchAPI("/auth/mark-email-verified", {
      method: "POST",
      headers: authHeaders(token),
    }),

  // Generation
  generateImage: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/image", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  generateVideo: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/video", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  getJobStatus: (token: string, jobId: string) =>
    fetchAPI(`/generate/status/${jobId}`, { headers: authHeaders(token) }),

  // Advanced generation
  img2img: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/img2img", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  img2vid: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/img2vid", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  vid2vid: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/vid2vid", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  lipsync: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/lipsync", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  talkingAvatar: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/talking-avatar", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  upscale: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/upscale", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  inpaint: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/inpaint", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  controlnet: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/controlnet", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  removeBg: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/remove-bg", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  styleTransfer: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/style-transfer", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  faceSwap: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/face-swap", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  consistentCharacter: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/consistent-character", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  getMyReferralCode: (token: string) =>
    fetchAPI("/referrals/my-code", { headers: authHeaders(token) }),
  checkPromoCode: (code: string) =>
    fetchAPI("/promo/check", { method: "POST", body: JSON.stringify({ code }) }),
  redeemPromoCode: (token: string, code: string) =>
    fetchAPI("/promo/redeem", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ code }),
    }),
  useReferralCode: (token: string, code: string) =>
    fetchAPI("/referrals/use-code", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ code }),
    }),
  claimDailyCredits: (token: string) =>
    fetchAPI("/credits/daily", {
      method: "POST",
      headers: authHeaders(token),
    }),
  getStyles: () => fetchAPI("/generate/styles"),

  // Anonymous generation (no auth required)
  generateAnonymous: (prompt: string) =>
    fetchAPI("/generate/anonymous", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  // Credits
  getBalance: (token: string) =>
    fetchAPI("/credits/balance", { headers: authHeaders(token) }),
  getCreditHistory: (token: string) =>
    fetchAPI("/credits/history", { headers: authHeaders(token) }),
  getCosts: () => fetchAPI("/credits/costs"),

  // Gallery (user's own items - My Gallery page)
  getMyGallery: (token: string, userId: string, page = 1, limit = 24, nsfw = true) =>
    fetchAPI(`/gallery/user/${userId}?page=${page}&limit=${limit}&nsfw=${nsfw}`, {
      headers: authHeaders(token),
    }),
  // Keep old name as alias
  getGallery: (token: string, page = 1, _filter = "all") =>
    fetchAPI(`/gallery/?page=${page}&nsfw=true`, {
      headers: authHeaders(token),
    }),
  deleteGalleryItem: (token: string, id: string) =>
    fetchAPI(`/gallery/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    }),

  // Image-to-Video prompt suggestions
  suggestI2VPrompts: (token: string, imageUrl: string, nsfw = false) =>
    fetchAPI("/generate/img2vid/suggest-prompts", {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, nsfw }),
    }),

  // Models & CivitAI
  searchCivitai: (
    query: string,
    type = "LORA",
    sort = "Highest Rated",
    nsfw = false,
    page = 1,
    limit = 20,
  ) => {
    const params = new URLSearchParams({
      query,
      model_type: type,
      sort,
      nsfw: String(nsfw),
      page: String(page),
      limit: String(limit),
    });
    return fetchAPI(`/models/civitai/search?${params.toString()}`);
  },
  getCivitaiModel: (modelId: number) =>
    fetchAPI(`/models/civitai/${modelId}`),
  addCivitaiModel: (
    token: string,
    data: {
      civitai_model_id: number;
      civitai_version_id: number;
      name: string;
      base_model: string;
      preview_url?: string;
      model_type?: string;
      safetensors_name?: string;
    },
  ) =>
    fetchAPI("/models/civitai/add", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
  removeCivitaiModel: (token: string, modelId: number) =>
    fetchAPI(`/models/civitai/${modelId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    }),
  getAvailableModels: (token: string) =>
    fetchAPI("/models/available", { headers: authHeaders(token) }),
  // Keep old name for compatibility
  searchModels: (query: string, type = "LORA") =>
    fetchAPI(`/models/civitai/search?query=${encodeURIComponent(query)}&model_type=${type}`),

  // Gallery actions (toggle public/private on a gallery item)
  publishGalleryItem: (token: string, id: string) =>
    fetchAPI(`/gallery/${id}/publish`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  unpublishGalleryItem: (token: string, id: string) =>
    fetchAPI(`/gallery/${id}/unpublish`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  // Keep old names for compatibility
  publishGeneration: (token: string, id: string) =>
    fetchAPI(`/gallery/${id}/publish`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  unpublishGeneration: (token: string, id: string) =>
    fetchAPI(`/gallery/${id}/unpublish`, {
      method: "POST",
      headers: authHeaders(token),
    }),

  // Explore (public gallery)
  getExplore: (page = 1, sort = "newest", nsfw = false) =>
    fetchAPI(`/explore/?page=${page}&sort=${sort}&nsfw=${nsfw}`),
  getExploreItem: (id: string) =>
    fetchAPI(`/explore/${id}`),

  // Public Gallery
  getPublicGallery: (
    page = 1,
    limit = 24,
    sort = "latest",
    nsfw = false,
    tag?: string
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
      nsfw: String(nsfw),
    });
    if (tag) params.set("tag", tag);
    return fetchAPI(`/gallery/?${params.toString()}`);
  },
  getGalleryItem: (id: string) =>
    fetchAPI(`/gallery/${id}`),
  publishToGallery: (
    token: string,
    data: {
      generation_id: string;
      title: string;
      description?: string;
      tags?: string[];
      nsfw?: boolean;
    }
  ) =>
    fetchAPI("/gallery/publish", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
  toggleLike: (token: string, galleryId: string) =>
    fetchAPI(`/gallery/${galleryId}/like`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  getRemixData: (token: string, galleryId: string) =>
    fetchAPI(`/gallery/${galleryId}/remix`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  getUserGallery: (userId: string, page = 1, limit = 24) =>
    fetchAPI(
      `/gallery/user/${userId}?page=${page}&limit=${limit}`
    ),

  // Follow system
  followUser: (token: string, userId: string) =>
    fetchAPI(`/gallery/user/${userId}/follow`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  unfollowUser: (token: string, userId: string) =>
    fetchAPI(`/gallery/user/${userId}/follow`, {
      method: "DELETE",
      headers: authHeaders(token),
    }),
  getFollowers: (userId: string, page = 1, limit = 20) =>
    fetchAPI(`/gallery/user/${userId}/followers?page=${page}&limit=${limit}`),
  getFollowing: (userId: string, page = 1, limit = 20) =>
    fetchAPI(`/gallery/user/${userId}/following?page=${page}&limit=${limit}`),
  getUserProfile: (userId: string) =>
    fetchAPI(`/gallery/user/${userId}/profile`),

  // Billing
  getPlans: () => fetchAPI("/billing/plans"),
  getSubscription: (token: string) =>
    fetchAPI("/billing/subscription", { headers: authHeaders(token) }),
  createCheckout: (token: string, plan: string) =>
    fetchAPI(`/billing/checkout?plan=${plan}`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  createCryptoCheckout: (token: string, plan: string) =>
    fetchAPI(`/billing/checkout-crypto?plan=${plan}`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  createPortalSession: (token: string) =>
    fetchAPI("/billing/portal", {
      method: "POST",
      headers: authHeaders(token),
    }),

  // Chat
  promptAssist: (token: string, message: string, history: { role: string; content: string }[]) =>
    fetchAPI("/chat/prompt-assist", {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    }),

  // Download
  getSelfHostedDownload: (token: string) =>
    fetchAPI("/download/self-hosted", { headers: authHeaders(token) }),

  // Adult Expression
  getAdultPlans: () => fetchAPI("/adult/plans"),
  getAdultSubscription: (token: string) =>
    fetchAPI("/adult/subscription", { headers: authHeaders(token) }),
  adultOptIn: (token: string) =>
    fetchAPI("/adult/opt-in", { method: "POST", headers: authHeaders(token) }),
  adultOptOut: (token: string) =>
    fetchAPI("/adult/opt-out", { method: "POST", headers: authHeaders(token) }),
  createAdultCheckout: (token: string, plan: string) =>
    fetchAPI(`/adult/checkout?plan=${plan}`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  createAdultCryptoCheckout: (token: string, plan: string) =>
    fetchAPI(`/adult/checkout-crypto?plan=${plan}`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  getAdultModels: () => fetchAPI("/adult/models"),
  getAdultShowcase: (page = 1, limit = 20, token?: string) =>
    fetchAPI(`/adult/showcase?page=${page}&limit=${limit}`, token ? { headers: authHeaders(token) } : {}),
  publishToAdultShowcase: (token: string, generationId: string) =>
    fetchAPI(`/adult/showcase/publish/${generationId}`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  getAdultRegionRules: (token?: string) =>
    fetchAPI("/adult/region-rules", token ? { headers: authHeaders(token) } : {}),
  generateAdult: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/adult/generate", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  generateAdultVideo: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/adult/generate-video", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  generateAdultCivitai: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/adult/generate-civitai", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  adultImg2Img: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/adult/img2img", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  adultControlNet: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/adult/controlnet", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  adultInpaint: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/adult/inpaint", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  adultLoRA: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/adult/generate-lora", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),

  // Character Reference Video (PixVerse C1)
  characterVideo: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/character-video", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),

  // Voice Cloning (fal-ai/chatterbox)
  voiceClone: (token: string, params: Record<string, unknown>) =>
    fetchAPI("/generate/voice-clone", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),

  // User-trained LoRA models
  trainLora: (
    token: string,
    params: {
      name: string;
      trigger_word: string;
      images: string[];
      steps?: number;
      is_style?: boolean;
      nsfw?: boolean;
    }
  ) =>
    fetchAPI("/lora/train", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  listLoras: (token: string) =>
    fetchAPI("/lora/list", { headers: authHeaders(token) }),
  getLora: (token: string, id: string) =>
    fetchAPI(`/lora/${id}`, { headers: authHeaders(token) }),
  deleteLora: (token: string, id: string) =>
    fetchAPI(`/lora/${id}`, { method: "DELETE", headers: authHeaders(token) }),
  generateWithLora: (
    token: string,
    params: {
      lora_id: string;
      prompt: string;
      lora_strength?: number;
      width?: number;
      height?: number;
      seed?: number;
      num_images?: number;
    }
  ) =>
    fetchAPI("/lora/generate", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),

  // Prompt Battle
  createBattle: (
    token: string,
    params: { theme: string; prompt: string; nsfw?: boolean },
  ) =>
    fetchAPI("/battle/create", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  acceptBattle: (
    token: string,
    id: string,
    params: { prompt: string },
  ) =>
    fetchAPI(`/battle/${id}/accept`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(params),
    }),
  listBattles: (
    status: "waiting_opponent" | "voting" | "completed" = "voting",
    page = 1,
    limit = 20,
    nsfw = false,
    token?: string,
  ) =>
    fetchAPI(
      `/battle/list?status=${status}&page=${page}&limit=${limit}&nsfw=${nsfw}`,
      token ? { headers: authHeaders(token) } : {},
    ),
  getBattle: (token: string | null, id: string) =>
    fetchAPI(`/battle/${id}`, token ? { headers: authHeaders(token) } : {}),
  voteBattle: (token: string, id: string, voted_for: "A" | "B") =>
    fetchAPI(`/battle/${id}/vote`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ voted_for }),
    }),
  battleLeaderboard: (limit = 20) =>
    fetchAPI(`/battle/leaderboard?limit=${limit}`),
  myBattles: (token: string) =>
    fetchAPI("/battle/me", { headers: authHeaders(token) }),

  // TTS (Text-to-Speech)
  getTTSVoices: () => fetchAPI("/tts/voices"),
  synthesizeSpeech: async (
    token: string,
    params: { text: string; language?: string; engine?: string; voice_id?: string; reference_audio?: string }
  ): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/tts/synthesize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "TTS failed" }));
      throw new Error(err.detail || "TTS failed");
    }
    return res.blob();
  },
};
