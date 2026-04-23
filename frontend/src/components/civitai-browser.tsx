"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  SearchIcon,
  DownloadIcon,
  StarIcon,
  HeartIcon,
  PlusIcon,
  TrashIcon,
  Loader2Icon,
  SparklesIcon,
  EyeOffIcon,
  AlertTriangleIcon,
} from "lucide-react";

type CivitAIModel = {
  id: number;
  name: string;
  type: string;
  nsfw: boolean;
  tags: string[];
  description: string;
  stats: { downloads: number; rating: number; favorites: number };
  creator: string;
  preview_url: string | null;
  latest_version: {
    id: number;
    name: string;
    base_model: string;
    download_url: string;
    file_size_mb: number;
    file_name: string;
  };
};

type UserModel = {
  id: string;
  name: string;
  civitai_model_id: number;
  civitai_version_id: number;
  preview_url?: string;
  category: string;
  description: string;
  source: string;
  safetensors_name?: string;
};

type Props = {
  token: string;
  userPlan: string;
  myModels: UserModel[];
  slotsUsed: number;
  slotsMax: number;
  onRefresh: () => void;
  onUseModel?: (safetensorsName: string) => void;
};

const PLAN_RANK: Record<string, number> = {
  free: 0, lite: 1, basic: 2, pro: 3, unlimited: 4, studio: 5,
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Fallback image for broken previews */
function ModelImage({ src, alt, className, nsfw, nsfwRevealed }: {
  src: string | null;
  alt: string;
  className: string;
  nsfw?: boolean;
  nsfwRevealed?: boolean;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center text-muted-foreground text-xs`}>
        No Preview
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <img
        src={src}
        alt={alt}
        className={`${className} ${nsfw && !nsfwRevealed ? "blur-xl scale-110" : ""}`}
        loading="lazy"
        onError={() => setError(true)}
      />
      {nsfw && !nsfwRevealed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <EyeOffIcon className="h-6 w-6 text-white/70" />
        </div>
      )}
    </div>
  );
}

export function CivitAIBrowser({ token, userPlan, myModels, slotsUsed, slotsMax, onRefresh, onUseModel }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [modelType, setModelType] = useState("LORA");
  const [sort, setSort] = useState("Highest Rated");
  const [showNsfw, setShowNsfw] = useState(false);
  const [revealNsfw, setRevealNsfw] = useState(false);
  const [results, setResults] = useState<CivitAIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [tab, setTab] = useState<"browse" | "my">("browse");
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const canAdd = PLAN_RANK[userPlan] >= PLAN_RANK["basic"];

  const doSearch = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchCivitai(query, modelType, sort, showNsfw, p, 20);
      setResults(data.items || []);
      setTotalPages(data.total_pages || 0);
      setTotalItems(data.total || 0);
      setPage(p);
      setInitialLoaded(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "CivitAI search failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [query, modelType, sort, showNsfw]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !initialLoaded) {
      doSearch();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(1);
  };

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
  };

  // Auto-search when filters change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (initialLoaded) {
      doSearch(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelType, sort, showNsfw]);

  const handleAdd = async (model: CivitAIModel) => {
    if (!canAdd) {
      toast.error("Basic plan or above required for custom models");
      return;
    }
    if (slotsUsed >= slotsMax) {
      toast.error(`Model limit reached (${slotsMax} for ${userPlan} plan). Remove a model first.`);
      return;
    }
    if (myModels.some((m) => m.civitai_model_id === model.id)) {
      toast.error("Model already added");
      return;
    }
    if (!model.latest_version?.id) {
      toast.error("This model has no downloadable version");
      return;
    }

    setAdding(model.id);
    try {
      const res = await api.addCivitaiModel(token, {
        civitai_model_id: model.id,
        civitai_version_id: model.latest_version.id,
        name: model.name,
        base_model: model.latest_version.base_model,
        preview_url: model.preview_url || undefined,
        model_type: model.type === "Checkpoint" ? "Checkpoint" : "LORA",
        safetensors_name: model.latest_version.file_name || "",
      });
      if (res.added) {
        toast.success(`${model.name} added!`);
        onRefresh();
      } else {
        toast.error(res.message || "Already added");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add model";
      toast.error(msg);
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (civitaiModelId: number, name: string) => {
    setRemoving(civitaiModelId);
    try {
      await api.removeCivitaiModel(token, civitaiModelId);
      toast.success(`${name} removed`);
      onRefresh();
    } catch {
      toast.error("Failed to remove model");
    } finally {
      setRemoving(null);
    }
  };

  const isAdded = (modelId: number) => myModels.some((m) => m.civitai_model_id === modelId);

  // LoRA: Basic+, Checkpoint: Pro+
  const canUseCheckpoint = PLAN_RANK[userPlan] >= PLAN_RANK["pro"];
  const canUseForGeneration = (type: string) => {
    if (type === "LORA") return true;
    if (type === "Checkpoint") return canUseCheckpoint;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="w-full gap-1.5" />
        }
      >
        <SparklesIcon className="h-3.5 w-3.5" />
        CivitAI Models ({slotsUsed}/{slotsMax})
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            CivitAI Model Browser
            {canAdd && (
              <Badge variant="secondary" className="text-[10px]">
                {slotsMax - slotsUsed} slots left
              </Badge>
            )}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Browse 100,000+ models from CivitAI. Click &quot;Use Now&quot; to generate instantly, or &quot;Save&quot; to keep for later.
          </p>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b pb-2">
          <button
            onClick={() => setTab("browse")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              tab === "browse"
                ? "bg-purple-500/20 text-purple-400 font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Browse
          </button>
          <button
            onClick={() => setTab("my")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
              tab === "my"
                ? "bg-purple-500/20 text-purple-400 font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Models
            {myModels.length > 0 && (
              <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                {myModels.length}
              </span>
            )}
          </button>
        </div>

        {/* Browse Tab */}
        {tab === "browse" && (
          <div className="flex flex-col gap-3 overflow-hidden flex-1 min-h-0">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Search models... (e.g. anime, realistic, style)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </form>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap items-center">
              <Select value={modelType} onValueChange={(v) => v && handleFilterChange(setModelType, v)}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LORA">LoRA</SelectItem>
                  <SelectItem value="Checkpoint">Checkpoint</SelectItem>
                  <SelectItem value="TextualInversion">Embedding</SelectItem>
                  <SelectItem value="Controlnet">ControlNet</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={(v) => v && handleFilterChange(setSort, v)}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Highest Rated">Highest Rated</SelectItem>
                  <SelectItem value="Most Downloaded">Most Downloaded</SelectItem>
                  <SelectItem value="Newest">Newest</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showNsfw ? "destructive" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowNsfw(!showNsfw)}
              >
                NSFW {showNsfw ? "ON" : "OFF"}
              </Button>

              {showNsfw && (
                <Button
                  variant={revealNsfw ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setRevealNsfw(!revealNsfw)}
                >
                  {revealNsfw ? "Hide Previews" : "Show Previews"}
                </Button>
              )}

              {totalItems > 0 && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatNumber(totalItems)} models
                </span>
              )}
            </div>

            {/* Model type info */}
            {modelType !== "LORA" && modelType !== "Checkpoint" && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2 text-xs text-amber-400">
                <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                {modelType} models are for reference only. Use LoRA or Checkpoint models for generation.
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Results Grid */}
            <div className="overflow-y-auto flex-1 min-h-0 -mx-4 px-4 pb-2">
              {loading && results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2Icon className="h-8 w-8 animate-spin text-purple-500" />
                  <p className="text-xs text-muted-foreground">Searching CivitAI...</p>
                </div>
              ) : !initialLoaded ? null : results.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  No models found. Try a different search.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {results.map((model) => (
                      <div
                        key={model.id}
                        className="group border rounded-lg overflow-hidden bg-card hover:border-purple-500/40 transition-colors"
                      >
                        {/* Preview Image */}
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                          <ModelImage
                            src={model.preview_url}
                            alt={model.name}
                            className="w-full h-full object-cover"
                            nsfw={model.nsfw}
                            nsfwRevealed={revealNsfw}
                          />
                          {model.nsfw && (
                            <Badge variant="destructive" className="absolute top-1.5 left-1.5 text-[10px]">
                              NSFW
                            </Badge>
                          )}
                          {model.latest_version?.base_model && (
                            <Badge variant="secondary" className="absolute top-1.5 right-1.5 text-[10px]">
                              {model.latest_version.base_model}
                            </Badge>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-2.5 space-y-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" title={model.name}>{model.name}</p>
                              <p className="text-[11px] text-muted-foreground">by {model.creator || "Unknown"}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {model.type}
                            </Badge>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <DownloadIcon className="h-3 w-3" />
                              {formatNumber(model.stats.downloads)}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <StarIcon className="h-3 w-3" />
                              {model.stats.rating > 0 ? model.stats.rating.toFixed(1) : "-"}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <HeartIcon className="h-3 w-3" />
                              {formatNumber(model.stats.favorites)}
                            </span>
                            {model.latest_version?.file_size_mb > 0 && (
                              <span className="ml-auto text-[10px]">
                                {model.latest_version.file_size_mb} MB
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {model.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {model.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                              {model.tags.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{model.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-1.5">
                            {/* Use Now — directly use this model for generation */}
                            {onUseModel && model.latest_version?.file_name && (model.type === "Checkpoint" || model.type === "LORA") && (
                              <Button
                                size="sm"
                                variant="default"
                                className="flex-1 text-xs h-7 gap-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                onClick={() => {
                                  onUseModel(model.latest_version.file_name);
                                  setOpen(false);
                                  toast.success(`Selected: ${model.name}`);
                                }}
                              >
                                Use Now
                              </Button>
                            )}
                            {/* Add to My Models */}
                            {isAdded(model.id) ? (
                              <Button variant="outline" size="sm" className="flex-1 text-xs h-7 text-green-500" disabled>
                                Saved
                              </Button>
                            ) : slotsUsed >= slotsMax ? (
                              <Button variant="outline" size="sm" className="flex-1 text-xs h-7" disabled>
                                No slots
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs h-7 gap-1"
                                onClick={() => handleAdd(model)}
                                disabled={adding === model.id}
                              >
                                {adding === model.id ? (
                                  <Loader2Icon className="h-3 w-3 animate-spin" />
                                ) : (
                                  <PlusIcon className="h-3 w-3" />
                                )}
                                {adding === model.id ? "..." : "Save"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1 || loading}
                        onClick={() => doSearch(page - 1)}
                      >
                        Prev
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Page {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages || loading}
                        onClick={() => doSearch(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* My Models Tab */}
        {tab === "my" && (
          <div className="overflow-y-auto flex-1 min-h-0 -mx-4 px-4 pb-2">
            {myModels.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <SparklesIcon className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">
                  No custom models yet.
                </p>
                <Button variant="outline" size="sm" onClick={() => setTab("browse")}>
                  Browse CivitAI
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  {myModels.length} model{myModels.length !== 1 ? "s" : ""} / {slotsMax} slots used.
                  Select these models in the Model dropdown when generating.
                </p>
                {myModels.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center gap-3 border rounded-lg p-3 bg-card hover:border-purple-500/20 transition-colors"
                  >
                    {model.preview_url ? (
                      <img
                        src={model.preview_url}
                        alt={model.name}
                        className="w-16 h-16 rounded-md object-cover shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <SparklesIcon className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{model.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{model.description}</p>
                      {model.safetensors_name && (
                        <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5 truncate">
                          {model.safetensors_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onUseModel && model.safetensors_name && (
                        <Button
                          size="sm"
                          className="text-xs h-7 gap-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => {
                            onUseModel(model.safetensors_name!);
                            setOpen(false);
                            toast.success(`Selected: ${model.name}`);
                          }}
                        >
                          Use
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemove(model.civitai_model_id, model.name)}
                        disabled={removing === model.civitai_model_id}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        {removing === model.civitai_model_id ? (
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
