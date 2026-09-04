"""
ratelimit.py — thread-safe IP-based rate limiter for SEO Command Center.

Protects crawling, upload, and API endpoints from spam and denial-of-service abuse.
Supports reverse proxies (Render, Cloudflare, AWS ALB) via X-Forwarded-For / CF-Connecting-IP.
"""

from __future__ import annotations

import collections
import threading
import time


class IPRateLimiter:
    """
    Sliding-window rate limiter per client IP.
    
    Default rules:
      - 'crawl': 5 requests per 10 minutes (crawling is network-intensive)
      - 'upload': 10 requests per 10 minutes
      - 'demo': 20 requests per 5 minutes
      - 'default': 60 requests per 1 minute
    """

    def __init__(self):
        self._lock = threading.Lock()
        # Storage: { (ip, category): [timestamp, timestamp, ...] }
        self._history = collections.defaultdict(list)
        self._last_cleanup = time.time()

        # Rules: category -> (max_requests, window_seconds)
        self.rules = {
            "crawl": (5, 600),     # 5 crawls per 10 minutes
            "upload": (10, 600),   # 10 uploads per 10 minutes
            "demo": (20, 300),     # 20 demos per 5 minutes
            "default": (120, 60),  # 120 requests per minute
        }

    def check(self, ip: str, category: str = "default") -> tuple[bool, int, int]:
        """
        Check if an IP has exceeded its allowed quota.
        Returns: (allowed: bool, retry_after_seconds: int, remaining_calls: int)
        """
        clean_ip = (ip or "127.0.0.1").strip()
        max_calls, window = self.rules.get(category, self.rules["default"])
        now = time.time()
        key = (clean_ip, category)

        with self._lock:
            # Periodic cleanup every 5 minutes
            if now - self._last_cleanup > 300:
                self._cleanup(now)
                self._last_cleanup = now

            timestamps = self._history[key]
            # Discard timestamps older than window
            cutoff = now - window
            self._history[key] = [t for t in timestamps if t > cutoff]
            current_calls = len(self._history[key])

            if current_calls >= max_calls:
                oldest_in_window = self._history[key][0]
                retry_after = max(1, int(oldest_in_window + window - now))
                return False, retry_after, 0

            self._history[key].append(now)
            remaining = max_calls - (current_calls + 1)
            return True, 0, remaining

    def _cleanup(self, now: float) -> None:
        """Drop stale keys whose newest timestamp is past its max window."""
        max_window = max(w for _, w in self.rules.values())
        cutoff = now - max_window
        stale_keys = [k for k, ts in self._history.items() if not ts or ts[-1] < cutoff]
        for k in stale_keys:
            del self._history[k]


# Global rate limiter instance
limiter = IPRateLimiter()


def get_client_ip(headers: dict | None, socket_client_address: tuple | None = None) -> str:
    """Extract real client IP from Cloudflare, reverse proxy, or socket address."""
    headers = headers or {}
    # 1. Cloudflare header
    cf_ip = headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.split(",")[0].strip()

    # 2. X-Forwarded-For header (Render / Heroku / Nginx)
    xff = headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()

    # 3. Real-IP header
    real_ip = headers.get("X-Real-IP")
    if real_ip:
        return real_ip.split(",")[0].strip()

    # 4. Direct socket address
    if socket_client_address and len(socket_client_address) > 0:
        return str(socket_client_address[0])

    return "127.0.0.1"
