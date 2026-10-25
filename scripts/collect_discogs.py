#!/usr/bin/env python3
"""Collect current Discogs release asking-price floors into a short-lived public snapshot.

Uses documented, unauthenticated Discogs API endpoints. Not sold prices or real
individual listings. Any failure leaves existing snapshot untouched; the site
refuses to display data after its expiration timestamp. No personal data.
"""
import datetime as dt
import json
import math
import os
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data/market-signals.json"
BASE = "https://api.discogs.com"
RELEASE_IDS = (249504, 15012, 92833, 200, 1426780, 1)
USER_AGENT = "DealAtlas/0.4 (https://sky-net-x.github.io/dealatlas/)"
# Discogs prohibits displaying API-derived dynamic data > 6h old.
LIFETIME = dt.timedelta(hours=5, minutes=30)


def get_json(path, requester=None):
    request = urllib.request.Request(BASE + path, headers={
        "Accept": "application/json", "User-Agent": USER_AGENT
    })
    if requester is None:
        requester = urllib.request.urlopen
    with requester(request, timeout=18) as response:
        if response.status != 200:
            raise ValueError("Unexpected API status")
        return json.load(response)


def normalized_release(release_id, info, stats):
    if not isinstance(info, dict) or info.get("id") != release_id:
        raise ValueError(f"Invalid release metadata for {release_id}")
    if not isinstance(stats, dict) or stats.get("blocked_from_sale"):
        return None

    # Explicitly validate current asking-price floor: NEVER historical sold price.
    low = stats.get("lowest_price")
    count = stats.get("num_for_sale")
    if not isinstance(low, dict) or low.get("currency") != "USD":
        return None
    raw = low.get("value")
    if isinstance(raw, bool) or not isinstance(raw, (float, int)) or not math.isfinite(raw) or raw <= 0:
        return None
    if isinstance(count, bool) or not isinstance(count, int) or count <= 0:
        return None
    artists = info.get("artists") or []
    artist = str(artists[0].get("name", ""))[:90] if artists and isinstance(artists[0], dict) else ""
    title = str(info.get("title") or "").strip()[:160]
    if not title:
        return None
    year = info.get("year")
    return {
        "id": str(release_id),
        "title": title,
        "artist": artist,
        "year": year if isinstance(year, int) and 1900 <= year <= 2100 else None,
        "lowestAsk": round(float(raw), 2),
        "currency": "USD",
        "listingsCount": count,
        "url": f"https://www.discogs.com/release/{release_id}",
        "source": "Discogs API",
        "priceType": "lowest_current_asking_price",
        "conditionVerified": False,
        "soldPriceVerified": False,
    }


def build_snapshot(fetcher=get_json, clock=None, pause=None):
    clock = clock or (lambda: dt.datetime.now(dt.timezone.utc))
    # Sequential and deliberately slow to respect the unauthenticated limit.
    pause = pause or time.sleep
    collected = []
    for position, release_id in enumerate(RELEASE_IDS):
        if position:
            pause(2.5)
        info = fetcher(f"/releases/{release_id}")
        pause(2.5)
        stats = fetcher(f"/marketplace/stats/{release_id}?curr_abbr=USD")
        candidate = normalized_release(release_id, info, stats)
        if candidate:
            collected.append(candidate)
    if not collected:
        raise ValueError("No current market signal: will not publish empty snapshot")
    at = clock()
    if at.tzinfo is None:
        raise ValueError("Time must be timezone aware")
    iso = lambda t: t.astimezone(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schemaVersion": 1,
        "source": "Discogs API",
        "kind": "current_asking_price_floor_not_sold",
        "fetchedAt": iso(at),
        "expiresAt": iso(at + LIFETIME),
        "items": collected,
        "note": "Public release marketplace statistics, not individual offers, completed sales, resale value, or verified bargains. Condition and shipping vary.",
    }


def save_snapshot(snapshot, target=OUTPUT):
    target.parent.mkdir(parents=True, exist_ok=True)
    # Atomic replacement avoids truncated files if network or process fails.
    with tempfile.NamedTemporaryFile("w", encoding="utf8", dir=target.parent, delete=False) as tmp:
        json.dump(snapshot, tmp, ensure_ascii=False, indent=2, allow_nan=False)
        tmp.write("\n")
        temporary = Path(tmp.name)
    os.replace(temporary, target)


def main():
    # Restricted marketplace pricing is disabled until explicit commercial/public-display permission.
    if os.environ.get('DISCOGS_MARKETPLACE_PERMISSION_APPROVED') != 'true':
        print('Discogs marketplace-price collection DISABLED pending written rights review.')
        return 2
    snapshot = build_snapshot()
    save_snapshot(snapshot)
    print(f"Collected {len(snapshot['items'])} current asking-price signals. Expires at {snapshot['expiresAt']}.")


if __name__ == "__main__":
    main()
