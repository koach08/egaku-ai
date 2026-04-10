"""Prompt optimization API — enhances prompts for better generation quality."""

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.services.prompt_optimizer import optimize_prompt, recommend_resolution

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/optimize", tags=["optimization"])


class OptimizeRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    model: str = ""
    nsfw: bool = False
    cinema_preset: str | None = None
    auto_enhance: bool = True


class OptimizeResponse(BaseModel):
    original_prompt: str
    optimized_prompt: str
    negative_prompt: str
    recommended_model: str
    content_type: str
    recommended_width: int
    recommended_height: int


@router.post("/prompt", response_model=OptimizeResponse)
async def optimize_prompt_endpoint(
    body: OptimizeRequest,
    settings: Settings = Depends(get_settings),
):
    """Optimize a prompt for maximum generation quality.

    This endpoint analyzes the prompt content and:
    - Adds quality-enhancing keywords appropriate for the target model
    - Recommends the best model for the content type
    - Suggests optimal resolution
    - Generates an appropriate negative prompt
    """
    result = optimize_prompt(
        prompt=body.prompt,
        model_id=body.model,
        nsfw=body.nsfw,
        cinema_preset=body.cinema_preset,
        auto_enhance=body.auto_enhance,
    )

    width, height = recommend_resolution(
        result["model_family"],
        result["content_type"],
    )

    return OptimizeResponse(
        original_prompt=body.prompt,
        optimized_prompt=result["prompt"],
        negative_prompt=result["negative_prompt"],
        recommended_model=result["recommended_model_fal"],
        content_type=result["content_type"],
        recommended_width=width,
        recommended_height=height,
    )
