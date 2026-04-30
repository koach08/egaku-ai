"use client";

import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";

const TOOLS = [
  {
    category: "Image Generation",
    items: [
      { name: "AI Templates", desc: "One tap to create — no prompt needed. Trending styles, portraits, products, videos", href: "/templates", icon: "⚡", badge: "New" },
      { name: "Text to Image", desc: "Generate images from text prompts with 20+ AI models", href: "/generate", icon: "🎨", badge: "Core" },
      { name: "Multi-Model Compare", desc: "Same prompt, 3 models side-by-side — find the best model", href: "/generate?tab=compare", icon: "⚖️", badge: "Unique" },
      { name: "Photo Booth", desc: "Selfie → professional portrait (LinkedIn, dating, resume)", href: "/photo-booth", icon: "📸", badge: "Popular" },
      { name: "Logo Maker", desc: "Brand name → 3 logo variations with Ideogram v3", href: "/logo", icon: "✏️", badge: "New" },
      { name: "Meme Generator", desc: "AI image + text overlay = viral memes", href: "/meme", icon: "😂", badge: "New" },
      { name: "Wallpaper Generator", desc: "Device-perfect wallpapers (iPhone, Android, 4K, Ultrawide)", href: "/wallpaper", icon: "🖼️", badge: "New" },
    ],
  },
  {
    category: "Video Creation",
    items: [
      { name: "Text to Video", desc: "Generate videos with Sora 2, Veo 3, Kling 2.5, and more", href: "/generate?tab=txt2vid", icon: "🎬", badge: "Core" },
      { name: "Image to Video", desc: "Animate any image into a video clip", href: "/generate?tab=img2vid", icon: "▶️", badge: "" },
      { name: "Video-to-Video", desc: "Upload a clip, restyle it — watercolor, anime, cyberpunk", href: "/vid2vid", icon: "🎨", badge: "New" },
      { name: "Character Video", desc: "1-3 reference images → consistent character video (PixVerse C1)", href: "/character-video", icon: "🎭", badge: "New" },
      { name: "Lip Sync", desc: "Any face video + any audio = perfect lip sync", href: "/lip-sync", icon: "👄", badge: "New" },
      { name: "Talking Avatar", desc: "Character image + audio → cinematic talking video", href: "/talking-avatar", icon: "🗣️", badge: "New" },
      { name: "VFX Effects", desc: "Add fire, water, lightning, and more effects to any photo", href: "/vfx", icon: "✨", badge: "New" },
      { name: "Video Shorts", desc: "TikTok / Reels / Shorts vertical video generator", href: "/shorts", icon: "📱", badge: "Popular" },
      { name: "Storyboard Studio", desc: "Multi-scene video production with BGM and narration", href: "/storyboard", icon: "🎞️", badge: "" },
    ],
  },
  {
    category: "Custom AI (Pro-tier)",
    items: [
      { name: "Train Your Own LoRA", desc: "Upload 4-20 photos → custom AI model (15 min training, unlimited uses)", href: "/lora-train", icon: "🧠", badge: "Unique" },
      { name: "My Trained Models", desc: "Generate with your own LoRAs", href: "/my-loras", icon: "📚", badge: "" },
      { name: "Voice Cloning", desc: "5-10 sec voice sample → clone any voice for TTS", href: "/voice-clone", icon: "🎙️", badge: "New" },
    ],
  },
  {
    category: "Image Editing",
    items: [
      { name: "Image to Image", desc: "Transform existing images with AI", href: "/generate?tab=img2img", icon: "🔄", badge: "" },
      { name: "Style Transfer", desc: "Apply Ghibli, anime, oil painting, and more", href: "/generate?tab=style", icon: "🎭", badge: "" },
      { name: "Upscale", desc: "Enhance resolution up to 4x with AI", href: "/generate?tab=upscale", icon: "🔍", badge: "" },
      { name: "Background Removal", desc: "Remove backgrounds instantly", href: "/generate?tab=removebg", icon: "✂️", badge: "" },
      { name: "Inpainting", desc: "Edit specific parts of an image", href: "/generate?tab=inpaint", icon: "🖌️", badge: "" },
      { name: "Object Removal", desc: "Paint over unwanted objects and erase them cleanly", href: "/remove-object", icon: "🧹", badge: "New" },
      { name: "Expand Image", desc: "Extend image borders with AI-generated content", href: "/expand", icon: "↔️", badge: "New" },
      { name: "Sketch to Image", desc: "Draw a rough sketch → AI creates a polished image", href: "/sketch", icon: "✏️", badge: "New" },
      { name: "ControlNet", desc: "Guide generation with pose, depth, edges", href: "/generate?tab=controlnet", icon: "🎯", badge: "" },
    ],
  },
  {
    category: "Face & Character",
    items: [
      { name: "Face Swap", desc: "Swap faces between two images", href: "/generate?tab=faceswap", icon: "🔀", badge: "" },
      { name: "Character Lock", desc: "Keep the same character across multiple scenes (PuLID)", href: "/generate?tab=character", icon: "🔒", badge: "Pro" },
    ],
  },
  {
    category: "Community & Fun",
    items: [
      { name: "Prompt Battle", desc: "Challenge friends to AI art duels — vote for the winner!", href: "/battle", icon: "⚔️", badge: "Unique" },
      { name: "Refer Friends", desc: "Invite friends → both get +50 credits. Upgrade bonus: +500 credits.", href: "/referrals", icon: "🎁", badge: "New" },
      { name: "Explore Gallery", desc: "Browse community creations, get inspired", href: "/gallery", icon: "🌐", badge: "" },
    ],
  },
  {
    category: "Adult (18+)",
    items: [
      { name: "Adult Expression", desc: "Unrestricted AI generation for verified mature creators", href: "/adult", icon: "🔞", badge: "" },
    ],
  },
];

const BADGE_COLORS: Record<string, string> = {
  Core: "bg-blue-500/20 text-blue-400",
  New: "bg-green-500/20 text-green-400",
  Popular: "bg-amber-500/20 text-amber-400",
  Unique: "bg-purple-500/20 text-purple-400",
  Pro: "bg-pink-500/20 text-pink-400",
};

export default function ToolsPage() {
  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">All Tools</h1>
          <p className="text-muted-foreground text-lg">Everything you can create with EGAKU AI — all in one place.</p>
        </div>

        {TOOLS.map((section) => (
          <div key={section.category}>
            <h2 className="text-xl font-bold mb-4 border-b border-muted pb-2">{section.category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {section.items.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="group flex items-start gap-3 p-4 rounded-xl border border-muted hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">{tool.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold group-hover:text-purple-400 transition-colors">{tool.name}</h3>
                      {tool.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${BADGE_COLORS[tool.badge] || "bg-muted text-muted-foreground"}`}>
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tool.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
