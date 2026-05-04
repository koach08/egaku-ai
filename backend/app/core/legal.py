"""Content policy, prompt compliance checker, and region rules.

NSFW Policy:
- Child exploitation content (CSAM): ALWAYS blocked globally, no exceptions.
- Other NSFW (non-JP/KR regions): Fully allowed, no mosaic, R18 tag required.
- JP region: Nude OK with R18 tag. Explicit genitals → mosaic required for public posts.
  Private (non-public) items have no mosaic requirement.
- Admin accounts bypass region NSFW restrictions but must manually manage public/private.
"""

PROHIBITED_KEYWORDS = [
    # English - minors
    "child", "children", "kid", "kids", "minor", "minors",
    "underage", "loli", "lolita", "shota", "shotacon",
    "preteen", "toddler", "infant", "baby",
    "young girl", "young boy", "little girl", "little boy",
    "elementary school", "middle school",
    "year-old girl", "year old girl", "year-old boy", "year old boy",
    "teenage girl", "teenage boy", "teen girl", "teen boy",
    "no panties", "no underwear",
    "schoolgirl", "school girl", "school uniform",
    # Japanese
    "小学生", "中学生", "幼女", "幼児", "ロリ", "ショタ",
    "児童", "未成年", "女児", "男児", "園児", "高校生",
    "パンツなし", "下着なし", "制服",
    # Age patterns (caught by check function below)
    "1yo", "2yo", "3yo", "4yo", "5yo", "6yo", "7yo", "8yo", "9yo",
    "10yo", "11yo", "12yo", "13yo", "14yo", "15yo", "16yo", "17yo",
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


import re

# Regex to catch age patterns like "3 year old", "11-year-old", "5 yo", etc.
_AGE_PATTERN = re.compile(
    r'\b(\d{1,2})\s*[-]?\s*(?:year[s]?\s*[-]?\s*old|yo|y\.o\.?)\b', re.IGNORECASE
)


def check_prompt_compliance(prompt: str) -> tuple[bool, list[str]]:
    """Check if a prompt contains prohibited content keywords.
    Returns (is_safe, flagged_terms).
    Child exploitation content is ALWAYS blocked — no exceptions.
    """
    prompt_lower = prompt.lower()
    flagged = [kw for kw in PROHIBITED_KEYWORDS if kw.lower() in prompt_lower]

    # Check age patterns — block any reference to persons under 18
    for match in _AGE_PATTERN.finditer(prompt_lower):
        age = int(match.group(1))
        if age < 18:
            flagged.append(f"age_reference:{match.group(0)}")

    return len(flagged) == 0, flagged


def get_region_rules(country_code: str) -> dict:
    return REGION_RULES.get(country_code, REGION_RULES["DEFAULT"])


NSFW_PROMPT_KEYWORDS = {
    "nude", "naked", "topless", "nsfw", "sex", "erotic", "hentai", "porn",
    "lingerie", "underwear", "bikini", "see-through", "undress", "strip",
    "seduc", "provocat", "breast", "boob", "ass ", "butt ", "penis", "vagina",
    "desnud", "nudo", "nackt", "裸", "ヌード", "全裸", "エロ", "セックス", "おっぱい", "ペニス",
}


def check_nsfw_prompt(prompt: str) -> bool:
    """Detect if a prompt is likely NSFW (but not necessarily prohibited).
    Used for auto-routing to NSFW-capable models.
    """
    prompt_lower = prompt.lower()
    return any(kw in prompt_lower for kw in NSFW_PROMPT_KEYWORDS)


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
