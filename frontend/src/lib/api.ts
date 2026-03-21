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

async function fetchAPI(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API error");
  }
  return res.json();
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Auth
export const api = {
  health: () => fetchAPI("/health"),

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
  getStyles: () => fetchAPI("/generate/styles"),

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
};
