#!/usr/bin/env python3
"""FarmCast standalone weather fetch CLI — calls WeatherAI /v1/weather once."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime

import requests
from dotenv import load_dotenv

API_BASE = "https://api.weather-ai.co"
SEPARATOR = "─────────────────────────────────"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch weather forecast from the WeatherAI API.",
    )
    parser.add_argument("--lat", type=float, required=True, help="Latitude")
    parser.add_argument("--lon", type=float, required=True, help="Longitude")
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Forecast days (default 7, max 7 on free plan)",
    )
    parser.add_argument("--crop", type=str, default=None, help="Crop type label")
    parser.add_argument(
        "--lang",
        type=str,
        default="en",
        help="Language code (default en)",
    )
    parser.add_argument(
        "--no-ai",
        action="store_true",
        help="Disable AI summary to save quota",
    )
    return parser.parse_args()


def extract_error_message(response: requests.Response) -> str:
    try:
        payload = response.json()
        if isinstance(payload, dict):
            for key in ("error", "message", "detail"):
                value = payload.get(key)
                if isinstance(value, str) and value:
                    return value
        return json.dumps(payload)
    except (json.JSONDecodeError, ValueError):
        text = response.text.strip()
        return text if text else response.reason


def format_day_line(day: dict) -> str:
    date_str = day.get("date", "")
    try:
        label = datetime.fromisoformat(date_str.replace("Z", "+00:00")).strftime(
            "%a %b %d"
        )
    except ValueError:
        label = date_str or "Unknown"

    temp_max = day.get("temp_max", "?")
    temp_min = day.get("temp_min", "?")
    rain = day.get("precipitation_probability", "?")
    wind = day.get("wind_speed", "?")

    return f"  {label} : {temp_max}°C / {temp_min}°C  Rain: {rain}%  Wind: {wind} km/h"


def fetch_weather(
    api_key: str,
    lat: float,
    lon: float,
    days: int,
    lang: str,
    use_ai: bool,
) -> requests.Response:
    params = {
        "lat": lat,
        "lon": lon,
        "days": days,
        "units": "metric",
        "ai": "true" if use_ai else "false",
        "lang": lang,
    }
    headers = {"Authorization": f"Bearer {api_key}"}

    return requests.get(
        f"{API_BASE}/v1/weather",
        params=params,
        headers=headers,
        timeout=15,
    )


def main() -> None:
    load_dotenv()
    args = parse_args()

    api_key = os.getenv("WEATHERAI_API_KEY")
    if not api_key:
        print("Error: WEATHERAI_API_KEY not set in environment or .env", file=sys.stderr)
        sys.exit(1)

    days = min(max(args.days, 1), 7)

    try:
        response = fetch_weather(
            api_key=api_key,
            lat=args.lat,
            lon=args.lon,
            days=days,
            lang=args.lang,
            use_ai=not args.no_ai,
        )
        response.raise_for_status()
    except requests.HTTPError:
        status = response.status_code
        message = extract_error_message(response)
        print(f"Error {status}: {message}", file=sys.stderr)
        sys.exit(1)
    except requests.ConnectionError as exc:
        print(f"Connection failed: {exc}", file=sys.stderr)
        sys.exit(1)

    data = response.json()
    current = data.get("current", {})
    daily = data.get("daily", [])
    ai_summary = data.get("ai_summary", "")
    remaining = response.headers.get("X-RateLimit-Remaining", "unknown")

    crop_label = args.crop if args.crop else "Not specified"
    ai_note = ai_summary if not args.no_ai and ai_summary else "AI disabled (--no-ai flag)"

    current_temp = current.get("temp_max", "?")
    current_condition = current.get("condition", "Unknown")

    print("=== FarmCast Weather Report ===")
    print(f"Location : {args.lat}, {args.lon}")
    print(f"Crop     : {crop_label}")
    print(f"Plan     : Free | Requests left: {remaining}")
    print(SEPARATOR)
    print(f"Current  : {current_temp}°C, {current_condition}")
    print(f"AI Note  : {ai_note}")
    print(SEPARATOR)
    print(f"{days}-Day Forecast:")

    for day in daily:
        print(format_day_line(day))

    print(SEPARATOR)


if __name__ == "__main__":
    main()
