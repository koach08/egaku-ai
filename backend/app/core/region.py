"""GeoIP region detection using MaxMind GeoLite2 or Cloudflare headers."""

import logging
from pathlib import Path

from fastapi import Request

from app.core.config import Settings

logger = logging.getLogger(__name__)

_geoip_reader = None


def _get_reader(settings: Settings):
    global _geoip_reader
    if _geoip_reader is not None:
        return _geoip_reader
    db_path = Path(settings.geoip_db_path)
    if db_path.exists():
        try:
            import geoip2.database
            _geoip_reader = geoip2.database.Reader(str(db_path))
        except Exception as e:
            logger.warning(f"Failed to load GeoIP database: {e}")
    return _geoip_reader


def detect_region(request: Request, ip: str, settings: Settings) -> str:
    """Detect country code from request. Priority: CF header > GeoIP > DEFAULT."""
    # Cloudflare provides country header automatically
    cf_country = request.headers.get("cf-ipcountry")
    if cf_country and cf_country != "XX":
        return cf_country.upper()

    # Fallback to MaxMind GeoLite2
    reader = _get_reader(settings)
    if reader and ip not in ("127.0.0.1", "0.0.0.0"):
        try:
            response = reader.country(ip)
            if response.country.iso_code:
                return response.country.iso_code.upper()
        except Exception:
            pass

    return "US"  # Default fallback
