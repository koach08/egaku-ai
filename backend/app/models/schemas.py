"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# --- Enums ---

class PlanType(str, Enum):
    free = "free"
    lite = "lite"
    basic = "basic"
    pro = "pro"
    unlimited = "unlimited"
    studio = "studio"  # Top tier: unlimited models


class GenerationType(str, Enum):
    txt2img = "txt2img"
    txt2vid = "txt2vid"
    img2img = "img2img"
    img2vid = "img2vid"
    vid2vid = "vid2vid"
    upscale = "upscale"
    inpaint = "inpaint"
    controlnet = "controlnet"
    remove_bg = "remove_bg"
    style_transfer = "style_transfer"


class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


# --- Auth ---

class AgeVerifyRequest(BaseModel):
    confirmed: bool


# --- Generation ---

class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    model: str = ""
    width: int = Field(512, ge=256, le=2048)
    height: int = Field(768, ge=256, le=2048)
    steps: int = Field(25, ge=1, le=100)
    cfg: float = Field(7.0, ge=1.0, le=30.0)
    sampler: str = "euler_ancestral"
    scheduler: str = "normal"
    seed: int = -1
    batch_size: int = Field(1, ge=1, le=4)
    lora_name: str = ""
    lora_strength: float = Field(0.8, ge=0.0, le=2.0)
    nsfw: bool = False


class VideoGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    model: str = ""
    image_url: str = ""
    motion_model: str = "mm_sd_v15_v2.ckpt"
    width: int = Field(512, ge=256, le=1024)
    height: int = Field(512, ge=256, le=1024)
    steps: int = Field(20, ge=1, le=100)
    cfg: float = Field(7.5, ge=1.0, le=30.0)
    sampler: str = "euler_ancestral"
    scheduler: str = "normal"
    seed: int = -1
    frame_count: int = Field(16, ge=8, le=32)
    fps: int = Field(8, ge=4, le=30)
    duration: int = Field(5, ge=3, le=15)  # seconds
    resolution: str = "720p"
    output_format: str = "gif"
    nsfw: bool = False


class Img2ImgRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    model: str = ""
    image: str = ""  # base64 encoded input image
    width: int = Field(512, ge=256, le=2048)
    height: int = Field(768, ge=256, le=2048)
    steps: int = Field(25, ge=1, le=100)
    cfg: float = Field(7.0, ge=1.0, le=30.0)
    denoise: float = Field(0.7, ge=0.0, le=1.0)
    sampler: str = "euler_ancestral"
    scheduler: str = "normal"
    seed: int = -1
    nsfw: bool = False


class Img2VidRequest(BaseModel):
    prompt: str = ""
    negative_prompt: str = ""
    model: str = ""
    motion_model: str = "mm_sd_v15_v2.ckpt"
    image: str = ""  # base64 encoded input image
    # mode: "animate" (preserve image, add motion) or "reimagine" (use as inspiration for new video)
    mode: str = "animate"
    width: int = Field(512, ge=256, le=1024)
    height: int = Field(512, ge=256, le=1024)
    steps: int = Field(20, ge=1, le=100)
    cfg: float = Field(7.5, ge=1.0, le=30.0)
    denoise: float = Field(0.7, ge=0.0, le=1.0)
    sampler: str = "euler_ancestral"
    scheduler: str = "normal"
    seed: int = -1
    frame_count: int = Field(16, ge=8, le=32)
    fps: int = Field(8, ge=4, le=30)
    duration: int = Field(5, ge=3, le=15)
    resolution: str = "720p"
    output_format: str = "gif"
    nsfw: bool = False


class Vid2VidRequest(BaseModel):
    """Video-to-video style transfer (WAN 2.7 Edit Video via fal.ai).

    `video` may be:
      - an HTTPS URL to a public MP4/MOV (preferred)
      - a base64 data URL `data:video/mp4;base64,...` (auto-uploaded to
        Supabase Storage by the backend)
    Video must be 2-10 seconds, max 100 MB.
    """
    prompt: str = Field(..., min_length=1, max_length=2000)
    video: str = Field(..., min_length=1)
    reference_image: str = ""  # optional style reference (URL or base64 data URL)
    model: str = "fal_wan27_v2v"
    resolution: str = "720p"  # "720p" or "1080p"
    duration: int = Field(0, ge=0, le=10)  # 0 = match input
    seed: int = -1
    nsfw: bool = False


class UpscaleRequest(BaseModel):
    image: str = ""  # base64 encoded input image
    scale: int = Field(2, ge=2, le=4)
    model: str = "RealESRGAN_x4plus"  # upscale model
    nsfw: bool = False


class InpaintRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    model: str = ""
    image: str = ""  # base64 encoded input image
    mask: str = ""  # base64 encoded mask image (white = inpaint area)
    width: int = Field(512, ge=256, le=2048)
    height: int = Field(768, ge=256, le=2048)
    steps: int = Field(25, ge=1, le=100)
    cfg: float = Field(7.0, ge=1.0, le=30.0)
    denoise: float = Field(0.8, ge=0.0, le=1.0)
    sampler: str = "euler_ancestral"
    scheduler: str = "normal"
    seed: int = -1
    nsfw: bool = False


class ControlNetRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    model: str = ""
    image: str = ""  # base64 encoded control image
    control_type: str = "canny"  # canny, depth, openpose, scribble
    control_strength: float = Field(1.0, ge=0.0, le=2.0)
    width: int = Field(512, ge=256, le=2048)
    height: int = Field(768, ge=256, le=2048)
    steps: int = Field(25, ge=1, le=100)
    cfg: float = Field(7.0, ge=1.0, le=30.0)
    sampler: str = "euler_ancestral"
    scheduler: str = "normal"
    seed: int = -1
    nsfw: bool = False


class RemoveBgRequest(BaseModel):
    image: str = ""  # base64 encoded input image


class ObjectRemovalRequest(BaseModel):
    image: str = ""  # base64 encoded input image
    mask: str = ""  # base64 encoded mask (white = area to remove)


class OutpaintRequest(BaseModel):
    image: str = ""  # base64 encoded input image
    prompt: str = Field("", max_length=2000)
    direction: str = "all"  # left, right, up, down, all
    expand_pixels: int = Field(256, ge=64, le=512)
    seed: int = -1


class VirtualTryOnRequest(BaseModel):
    human_image: str = ""  # base64 encoded person photo
    garment_image: str = ""  # base64 encoded clothing image
    description: str = "a person wearing the garment"


class SoundEffectRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500)
    duration: float = Field(5.0, ge=1.0, le=30.0)


class FindReplaceRequest(BaseModel):
    image: str = ""  # base64 encoded input image
    mask: str = ""  # base64 encoded mask (white = area to replace)
    prompt: str = Field(..., min_length=1, max_length=2000)  # what to put there
    negative_prompt: str = ""
    seed: int = -1


class StyleTransferRequest(BaseModel):
    image: str = ""  # base64 encoded input image
    style: str = "ghibli"  # ghibli, anime, oil_painting, watercolor, cyberpunk, pixel_art, comic, ukiyoe
    strength: float = Field(0.7, ge=0.3, le=1.0)
    prompt_override: str = ""  # optional custom style prompt
    seed: int = -1
    nsfw: bool = False


class FaceSwapRequest(BaseModel):
    source_image: str = ""  # base64 encoded source image (contains face to paste)
    target_image: str = ""  # base64 encoded target image (destination)
    nsfw: bool = False


class LipSyncRequest(BaseModel):
    """Lip-sync a face video to any audio via fal-ai/sync-lipsync/v3.

    `video` and `audio` may each be:
      - an HTTPS URL (public MP4/MOV for video; MP3/WAV/M4A for audio)
      - a base64 data URL (e.g. `data:video/mp4;base64,...` or
        `data:audio/mpeg;base64,...`) — auto-uploaded to Supabase Storage.
    `sync_mode` controls how the model handles length mismatches between the
    video and the audio: cut_off (default) / loop / bounce / silence / remap.
    """
    video: str = Field(..., min_length=1)
    audio: str = Field(..., min_length=1)
    sync_mode: str = "cut_off"


class TalkingAvatarRequest(BaseModel):
    """Generate a talking-avatar video from a still image + audio, via
    fal-ai/bytedance/omnihuman/v1.5 (OmniHuman).

    `image` and `audio` may each be an HTTPS URL or a base64 data URL.
    """
    image: str = Field(..., min_length=1)
    audio: str = Field(..., min_length=1)


class ConsistentCharacterRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    reference_image: str = ""  # base64 encoded face/character reference
    width: int = Field(1024, ge=512, le=2048)
    height: int = Field(1024, ge=512, le=2048)
    id_weight: float = Field(1.0, ge=0.1, le=2.0)  # how strongly to preserve identity
    seed: int = -1
    nsfw: bool = False


class LoRATrainRequest(BaseModel):
    """Kick off a Flux LoRA fine-tuning job for the current user."""
    name: str = Field(..., min_length=1, max_length=64)
    trigger_word: str = Field(..., min_length=1, max_length=32)
    images: list[str] = Field(..., min_length=4, max_length=20)  # base64 data URLs
    steps: int = Field(1000, ge=500, le=3000)
    is_style: bool = False
    nsfw: bool = False


class LoRAListItem(BaseModel):
    id: str
    name: str
    trigger_word: str
    status: str
    progress: int
    lora_url: str | None = None
    nsfw: bool
    created_at: str
    completed_at: str | None = None
    error_message: str | None = None


class LoRAGenerateRequest(BaseModel):
    lora_id: str
    prompt: str = Field(..., min_length=1, max_length=2000)
    lora_strength: float = Field(1.0, ge=0.0, le=2.0)
    width: int = Field(1024, ge=512, le=1536)
    height: int = Field(1024, ge=512, le=1536)
    seed: int = -1
    num_images: int = Field(1, ge=1, le=4)


class GenerationResponse(BaseModel):
    job_id: str
    status: JobStatus = JobStatus.queued
    credits_used: int
    result_url: str | None = None
    result_urls: list[str] = []


class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    result_url: str | None = None
    error: str | None = None
    progress: float = 0.0


# --- Credits ---

class CreditBalance(BaseModel):
    balance: int
    lifetime_used: int
    plan: PlanType


class CreditTransaction(BaseModel):
    id: str
    amount: int
    type: str
    description: str
    created_at: datetime


# --- Gallery (user's own generations) ---

class GalleryItem(BaseModel):
    id: str
    prompt: str
    negative_prompt: str = ""
    model: str = ""
    params: dict = {}
    nsfw: bool = False
    is_public: bool = False
    image_url: str | None = None
    video_url: str | None = None
    credits_used: int = 1
    created_at: datetime


class GalleryListResponse(BaseModel):
    items: list[GalleryItem]
    total: int
    page: int
    per_page: int


# --- Community Gallery (public showcase with likes, tags, remix) ---

class GalleryPublishRequest(BaseModel):
    """Request to publish a generation to the community gallery."""
    generation_id: str = Field(..., description="The job_id of the generation to publish")
    title: str = Field("", max_length=200)
    description: str = Field("", max_length=2000)
    tags: list[str] = Field(default_factory=list, max_length=10)
    nsfw: bool = False
    public: bool = True


class CommunityGalleryItem(BaseModel):
    """A single item in the community gallery."""
    id: str
    user_id: str
    job_id: str
    prompt: str
    negative_prompt: str = ""
    model: str = ""
    steps: int = 0
    cfg: float = 0.0
    seed: int = -1
    width: int = 0
    height: int = 0
    image_url: str | None = None
    video_url: str | None = None
    title: str = ""
    description: str = ""
    tags: list[str] = Field(default_factory=list)
    nsfw: bool = False
    public: bool = True
    likes_count: int = 0
    liked_by_me: bool = False
    author_name: str = "Anonymous"
    created_at: datetime


class CommunityGalleryListResponse(BaseModel):
    """Paginated response for community gallery listing."""
    items: list[CommunityGalleryItem]
    total: int
    page: int
    limit: int


class RemixResponse(BaseModel):
    """Generation parameters returned for remix."""
    prompt: str
    negative_prompt: str = ""
    model: str = ""
    steps: int = 0
    cfg: float = 0.0
    seed: int = -1
    width: int = 0
    height: int = 0


# --- Explore (Public Gallery) ---

class ExploreItem(BaseModel):
    id: str
    prompt: str
    model: str = ""
    nsfw: bool = False
    image_url: str | None = None
    video_url: str | None = None
    author_name: str = "Anonymous"
    likes: int = 0
    created_at: datetime


class ExploreListResponse(BaseModel):
    items: list[ExploreItem]
    total: int
    page: int
    per_page: int


# --- User ---

class UserProfile(BaseModel):
    id: str
    email: str
    display_name: str | None = None
    age_verified: bool = False
    email_verified: bool = True
    region_code: str = "US"
    plan: PlanType = PlanType.free
    created_at: datetime


# Credit costs per generation type
CREDIT_COSTS = {
    "txt2img_sd15": 1,
    "txt2img_sdxl": 2,
    "txt2img_flux_schnell": 3,
    "txt2img_flux_dev": 5,
    "txt2vid_16": 5,
    "txt2vid_32": 10,
    "txt2vid_kling": 15,
    "txt2vid_minimax": 15,
    "txt2vid_wan": 10,
    "img2img": 2,
    "img2vid_16": 5,
    "img2vid_32": 10,
    "img2vid_kling": 15,
    "img2vid_wan": 10,
    "txt2img_nano_banana": 8,
    "txt2img_grok": 8,
    "txt2vid_grok": 30,
    "txt2vid_kling25": 25,
    "txt2vid_veo3": 40,
    "txt2vid_sora2": 50,
    "img2vid_kling25": 25,
    "img2vid_sora2": 50,
    "vid2vid": 40,  # WAN 2.7 edit-video, ~5s output
    "upscale": 1,
    "inpaint": 2,
    "controlnet": 3,
    "remove_bg": 1,
    "style_transfer": 3,
    "face_swap": 3,
    "consistent_character": 5,
    "lipsync": 80,  # fal-ai/sync-lipsync/v3 — covers ~30s of output
    "talking_avatar": 60,  # fal-ai/bytedance/omnihuman/v1.5 — covers ~10s
    "lora_training": 300,  # fal-ai/flux-lora-fast-training — ~$2 raw per run
    "lora_generate": 3,    # per image generated with a user-trained LoRA
    "character_video": 100,  # fal-ai/pixverse/c1/reference-to-video — ~5s @720p
    "voice_clone": 20,  # base cost for up to 500 chars
    "battle_create": 2,  # image generation cost for creating/accepting a prompt battle
    "object_removal": 2,  # fal-ai/lama — fast object removal
    "outpaint": 3,  # expand image canvas via inpainting
    "virtual_tryon": 5,  # fal-ai/idm-vton
    "sound_effect": 3,  # beatoven/sound-effect-generation
    "find_replace": 3,  # inpainting with specific prompt
}


def calculate_resolution_multiplier(width: int, height: int) -> float:
    """Higher resolution costs more credits. Base = 512x512."""
    pixels = width * height
    if pixels <= 512 * 512:
        return 1.0
    if pixels <= 768 * 768:
        return 1.5
    if pixels <= 1024 * 1024:
        return 2.0
    return 3.0


# Plan limits for cost control
PLAN_LIMITS_CONFIG = {
    "free": {
        "daily_generations": 10,
        "daily_video_generations": 5,
        "max_resolution": 512,
        "nsfw_allowed": True,
        "watermark": True,
        "queue_priority": "low",
    },
    "lite": {
        "daily_generations": 50,
        "daily_video_generations": 20,
        "max_resolution": 768,
        "nsfw_allowed": True,
        "watermark": False,
        "queue_priority": "normal",
    },
    "basic": {
        "daily_generations": 200,
        "daily_video_generations": 100,
        "max_resolution": 1024,
        "nsfw_allowed": True,
        "watermark": False,
        "queue_priority": "normal",
    },
    "pro": {
        "daily_generations": 500,
        "daily_video_generations": 250,
        "max_resolution": 2048,
        "nsfw_allowed": True,
        "watermark": False,
        "queue_priority": "high",
    },
    "unlimited": {
        "daily_generations": 99999,
        "daily_video_generations": 99999,
        "max_resolution": 2048,
        "nsfw_allowed": True,
        "watermark": False,
        "queue_priority": "high",
    },
    "studio": {
        "daily_generations": 99999,
        "daily_video_generations": 99999,
        "max_resolution": 2048,
        "nsfw_allowed": True,
        "watermark": False,
        "queue_priority": "highest",
    },
}


# --- Character Reference Video (PixVerse C1) ---

class CharacterReference(BaseModel):
    image: str  # base64 data URL or HTTP URL
    ref_name: str = Field(..., min_length=1, max_length=20)  # used as @ref_name in prompt
    type: str = "subject"  # "subject" or "background"


class CharacterVideoRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    references: list[CharacterReference] = Field(..., min_length=1, max_length=5)
    resolution: str = "720p"  # 360p / 540p / 720p / 1080p
    duration: int = Field(5, ge=3, le=15)
    aspect_ratio: str = "16:9"
    generate_audio: bool = False
    seed: int = -1
    nsfw: bool = False


# --- Voice Cloning (fal-ai/chatterbox) ---

class BattleCreateRequest(BaseModel):
    theme: str = Field(..., min_length=1, max_length=200)
    prompt: str = Field(..., min_length=3, max_length=1000)
    nsfw: bool = False


class BattleAcceptRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000)


class BattleVoteRequest(BaseModel):
    voted_for: str = Field(..., pattern="^[AB]$")


class VoiceCloneRequest(BaseModel):
    """Voice cloning / TTS via fal-ai/chatterbox.

    `reference_audio` may be:
      - an HTTPS URL to a public audio file
      - a base64 data URL (auto-uploaded to Supabase)
      - empty string (uses default Chatterbox voice)
    """
    text: str = Field(..., min_length=1, max_length=5000)
    reference_audio: str = ""
    exaggeration: float = Field(0.5, ge=0.0, le=1.0)
    temperature: float = Field(0.8, ge=0.05, le=2.0)
    cfg: float = Field(0.5, ge=0.1, le=1.0)
    seed: int = -1
