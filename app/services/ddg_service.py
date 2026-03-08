import time
import logging
from functools import lru_cache
from typing import List, Dict, Optional

from duckduckgo_search import ddg

logger = logging.getLogger(__name__)


class DuckDuckGoService:
    """Wrapper around `duckduckgo_search.ddg` providing retries and
    normalized output.

    Note: duckduckgo-search performs HTTP scraping of DuckDuckGo results; be
    mindful of usage limits and respect robots and terms of service.
    """

    def __init__(self, region: str = "wt-wt", safesearch: str = "Moderate", retries: int = 2):
        self.region = region
        self.safesearch = safesearch
        self.retries = retries

    @lru_cache(maxsize=512)
    def search(self, query: str, max_results: int = 10) -> List[Dict[str, Optional[str]]]:
        last_err = None
        for attempt in range(self.retries + 1):
            try:
                # ddg returns a list of dicts with keys like 'title','href','body'
                results = ddg(query, region=self.region, safesearch=self.safesearch, max_results=max_results)
                if not results:
                    return []
                parsed = []
                for r in results:
                    parsed.append({
                        "title": r.get("title"),
                        "href": r.get("href"),
                        "body": r.get("body"),
                    })
                return parsed
            except Exception as e:
                last_err = e
                logger.debug("ddg search attempt %s failed: %s", attempt + 1, e)
                time.sleep(0.4 * (2 ** attempt))
        logger.exception("DuckDuckGo search failed for query: %s", query)
        raise last_err


__all__ = ["DuckDuckGoService"]
