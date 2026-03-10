"""Content policy, prompt compliance checker, and region rules."""

PROHIBITED_KEYWORDS = [
    "child", "children", "kid", "kids", "minor", "minors",
    "underage", "loli", "lolita", "shota", "shotacon",
    "preteen", "toddler", "infant", "baby",
    "young girl", "young boy", "little girl", "little boy",
    "elementary school", "middle school",
    "小学生", "中学生", "幼女", "幼児", "ロリ", "ショタ",
    "児童", "未成年",
]

REGION_RULES = {
    "JP": {"mosaic_required": True, "age_verification": "strict"},
    "KR": {"mosaic_required": True, "age_verification": "strict"},
    "DE": {"mosaic_required": False, "age_verification": "strict"},
    "AU": {"mosaic_required": False, "age_verification": "standard"},
    "US": {"mosaic_required": False, "age_verification": "standard"},
    "GB": {"mosaic_required": False, "age_verification": "standard"},
    "DEFAULT": {"mosaic_required": False, "age_verification": "standard"},
}


def check_prompt_compliance(prompt: str) -> tuple[bool, list[str]]:
    """Check if a prompt contains prohibited content keywords.
    Returns (is_safe, flagged_terms).
    """
    prompt_lower = prompt.lower()
    flagged = [kw for kw in PROHIBITED_KEYWORDS if kw.lower() in prompt_lower]
    return len(flagged) == 0, flagged


def get_region_rules(country_code: str) -> dict:
    return REGION_RULES.get(country_code, REGION_RULES["DEFAULT"])


# Regions where NSFW public posting is prohibited
NSFW_PUBLIC_BLOCKED_REGIONS = {"JP", "KR", "DE"}


def can_publish_nsfw(country_code: str) -> bool:
    """Check if NSFW content can be published publicly from this region."""
    return country_code not in NSFW_PUBLIC_BLOCKED_REGIONS
