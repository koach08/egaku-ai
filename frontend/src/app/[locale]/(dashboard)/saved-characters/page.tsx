"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  Loader2Icon,
  SparklesIcon,
  Trash2Icon,
  PlusIcon,
  UserIcon,
  DownloadIcon,
} from "lucide-react";

type SavedCharacter = {
  id: string;
  name: string;
  prompt: string;
  negative_prompt: string;
  model: string;
  thumbnail?: string;
  created_at: string;
};

const STORAGE_KEY = "egaku_saved_characters";

function loadCharacters(): SavedCharacter[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCharacters(chars: SavedCharacter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
}

export default function SavedCharactersPage() {
  const { session } = useAuth();
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newNegative, setNewNegative] = useState("worst quality, low quality, blurry, deformed");
  const [newModel, setNewModel] = useState("fal_flux_dev");
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  useEffect(() => {
    setCharacters(loadCharacters());
  }, []);

  const createCharacter = () => {
    if (!newName.trim() || !newPrompt.trim()) {
      toast.error("Name and prompt are required");
      return;
    }
    const char: SavedCharacter = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      prompt: newPrompt.trim(),
      negative_prompt: newNegative.trim(),
      model: newModel,
      created_at: new Date().toISOString(),
    };
    const updated = [char, ...characters];
    setCharacters(updated);
    saveCharacters(updated);
    setNewName("");
    setNewPrompt("");
    setShowCreate(false);
    toast.success(`Character "${char.name}" saved!`);
  };

  const deleteCharacter = (id: string) => {
    const updated = characters.filter((c) => c.id !== id);
    setCharacters(updated);
    saveCharacters(updated);
    toast.success("Character deleted");
  };

  const generateFromCharacter = useCallback(async (char: SavedCharacter) => {
    if (!session?.access_token) return;
    setGenerating(char.id);
    setGeneratedImage(null);
    try {
      const res = await api.generateImage(session.access_token, {
        prompt: char.prompt,
        negative_prompt: char.negative_prompt,
        model: char.model,
        width: 768,
        height: 1024,
        steps: 25,
        cfg: 7,
        sampler: "euler_ancestral",
        seed: -1,
        nsfw: false,
      });

      const jobId = res.job_id;
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await api.getJobStatus(session.access_token, jobId);
        if (status.status === "completed" && status.result_url) {
          const url = resolveResultUrl(status.result_url) || status.result_url;
          setGeneratedImage(url);

          // Save thumbnail
          const updated = characters.map((c) =>
            c.id === char.id ? { ...c, thumbnail: url } : c
          );
          setCharacters(updated);
          saveCharacters(updated);
          toast.success("Generated!");
          return;
        }
        if (status.status === "failed") {
          toast.error("Generation failed");
          return;
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(null);
    }
  }, [session, characters]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Saved Characters</h1>
            <p className="text-sm text-muted-foreground">Save character presets and regenerate anytime.</p>
          </div>
          <Button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-full"
            variant={showCreate ? "outline" : "default"}
          >
            <PlusIcon className="size-4 mr-2" />
            {showCreate ? "Cancel" : "New Character"}
          </Button>
        </div>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to save characters</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Create form */}
            {showCreate && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 space-y-4">
                <h3 className="text-sm font-semibold">New Character</h3>
                <Input
                  placeholder="Character name (e.g., Luna, CyberSamurai)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Textarea
                  placeholder="Character prompt — describe appearance, outfit, style, etc."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  rows={3}
                />
                <Input
                  placeholder="Negative prompt"
                  value={newNegative}
                  onChange={(e) => setNewNegative(e.target.value)}
                />
                <div className="flex gap-3">
                  <Button onClick={createCharacter} className="rounded-full">
                    Save Character
                  </Button>
                  <p className="text-[11px] text-white/30 self-center">
                    Tip: Use the Tag Builder to create prompts, then save them here.
                  </p>
                </div>
              </div>
            )}

            {/* Character list */}
            {characters.length === 0 && !showCreate ? (
              <div className="text-center py-16 text-white/30">
                <UserIcon className="size-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">No saved characters yet.</p>
                <p className="text-xs mt-1">Create a character to reuse the same look across generations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {characters.map((char) => (
                  <div
                    key={char.id}
                    className="rounded-xl border border-white/[0.06] overflow-hidden hover:border-white/15 transition-colors"
                  >
                    {/* Thumbnail */}
                    {char.thumbnail ? (
                      <img src={char.thumbnail} alt={char.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-white/[0.02] flex items-center justify-center">
                        <UserIcon className="size-8 text-white/10" />
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{char.name}</h3>
                        <span className="text-[10px] text-white/30">{char.model}</span>
                      </div>
                      <p className="text-xs text-white/40 line-clamp-2">{char.prompt}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => generateFromCharacter(char)}
                          disabled={generating === char.id}
                          className="flex-1 rounded-full text-xs"
                        >
                          {generating === char.id ? (
                            <Loader2Icon className="size-3 mr-1 animate-spin" />
                          ) : (
                            <SparklesIcon className="size-3 mr-1" />
                          )}
                          Generate (3 cr)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCharacter(char.id)}
                          className="rounded-full text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2Icon className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Generated image */}
            {generatedImage && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 space-y-4">
                <h3 className="text-sm font-medium">Latest Generation</h3>
                <img src={generatedImage} alt="Generated" className="w-full max-w-lg mx-auto rounded-lg" />
                <a href={generatedImage} download={`character-${Date.now()}.png`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-full">
                    <DownloadIcon className="size-4 mr-2" />Download
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
