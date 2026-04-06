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
    output_format: str = "gif"
    nsfw: bool = False


class Vid2VidRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    model: str = ""
    video: str = ""  # base64 encoded input video
    width: int = Field(512, ge=256, le=1024)
    height: int = Field(512, ge=256, le=1024)
    steps: int = Field(20, ge=1, le=100)
    cfg: float = Field(7.5, ge=1.0, le=30.0)
    denoise: float = Field(0.6, ge=0.0, le=1.0)
    sampler: str = "euler_ancestral"
    scheduler: str = "normal"
    seed: int = -1
    fps: int = Field(8, ge=4, le=30)
    output_format: str = "gif"
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


class ConsistentCharacterRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    reference_image: str = ""  # base64 encoded face/character reference
    width: int = Field(1024, ge=512, le=2048)
    height: int = Field(1024, ge=512, le=2048)
    id_weight: float = Field(1.0, ge=0.1, le=2.0)  # how strongly to preserve identity
    seed: int = -1
    nsfw: bool = False


class GenerationResponse(BaseModel):
    job_id: str
    status: JobStatus = JobStatus.queued
    credits_used: int
    result_url: str | None = None


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
    "vid2vid": 15,
    "upscale": 1,
    "inpaint": 2,
    "controlnet": 3,
    "remove_bg": 1,
    "style_transfer": 3,
    "face_swap": 3,
    "consistent_character": 5,
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
