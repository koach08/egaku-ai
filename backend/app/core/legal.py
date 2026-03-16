"""Content policy, prompt compliance checker, and region rules.

NSFW Policy:
- Child exploitation content (CSAM): ALWAYS blocked globally, no exceptions.
- Other NSFW (non-JP/KR regions): Fully allowed, no mosaic, R18 tag required.
- JP region: Nude OK with R18 tag. Explicit genitals → mosaic required for public posts.
  Private (non-public) items have no mosaic requirement.
- Admin accounts bypass region NSFW restrictions but must manually manage public/private.
"""

PROHIBITED_KEYWORDS = [
    "child", "children", "kid", "kids", "minor", "minors",
    "underage", "loli", "lolita", "shota", "shotacon",
    "preteen", "toddler", "infant", "baby",
    "young girl", "young boy", "little girl", "little boy",
    "elementary school", "middle school",
    "小学生", "中学生", "幼女", "幼児", "ロリ", "ショタ",
    "児童", "未成年",
]

# Admin emails that bypass region-based NSFW restrictions
ADMIN_EMAILS = {"kshgks59@gmail.com", "japanesebusinessman4@gmail.com"}

REGION_RULES = {
    "JP": {"mosaic_required": True, "age_verification": "strict", "nsfw_public_allowed": True, "r18_tag_required": True},
    "KR": {"mosaic_required": True, "age_verification": "strict", "nsfw_public_allowed": False, "r18_tag_required": True},
    "DE": {"mosaic_required": False, "age_verification": "strict", "nsfw_public_allowed": True, "r18_tag_required": True},
    "AU": {"mosaic_required": False, "age_verification": "standard", "nsfw_public_allowed": True, "r18_tag_required": False},
    "US": {"mosaic_required": False, "age_verification": "standard", "nsfw_public_allowed": True, "r18_tag_required": False},
    "GB": {"mosaic_required": False, "age_verification": "standard", "nsfw_public_allowed": True, "r18_tag_required": False},
    "BR": {"mosaic_required": False, "age_verification": "standard", "nsfw_public_allowed": True, "r18_tag_required": False},
    "DEFAULT": {"mosaic_required": False, "age_verification": "standard", "nsfw_public_allowed": True, "r18_tag_required": False},
}


def check_prompt_compliance(prompt: str) -> tuple[bool, list[str]]:
    """Check if a prompt contains prohibited content keywords.
    Returns (is_safe, flagged_terms).
    Child exploitation content is ALWAYS blocked — no exceptions.
    """
    prompt_lower = prompt.lower()
    flagged = [kw for kw in PROHIBITED_KEYWORDS if kw.lower() in prompt_lower]
    return len(flagged) == 0, flagged


def get_region_rules(country_code: str) -> dict:
    return REGION_RULES.get(country_code, REGION_RULES["DEFAULT"])


def is_admin(email: str) -> bool:
    """Check if the email belongs to an admin account."""
    return email in ADMIN_EMAILS


def can_publish_nsfw(country_code: str, email: str = "") -> bool:
    """Check if NSFW content can be published publicly from this region.

    - Admins always can (they manage public/private manually).
    - KR: blocked entirely.
    - JP: allowed with R18 tag (mosaic handled separately).
    - Others: allowed.
    """
    if email and is_admin(email):
        return True
    rules = get_region_rules(country_code)
    return rules.get("nsfw_public_allowed", True)
