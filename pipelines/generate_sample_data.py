"""Generate tiny public showcase JSON fixtures.

The production project builds these files from official Polish public baby-name
data. This showcase repository intentionally publishes only a small deterministic
sample with the same frontend-facing shapes.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


PUBLIC_DATA_DIR = Path("public/data")
YEARS = [2023, 2024, 2025]
FORECAST_YEAR = 2026
REGION_LEVEL = "registration_voivodeship"

NAMES: dict[str, list[str]] = {
    "female": ["HELENA", "ZOFIA", "LAURA"],
    "male": ["ANTONI", "JAN", "NIKODEM"],
}

NATIONAL_COUNTS: dict[str, dict[str, dict[int, int]]] = {
    "female": {
        "HELENA": {2023: 2700, 2024: 3100, 2025: 3300},
        "ZOFIA": {2023: 4500, 2024: 4300, 2025: 4100},
        "LAURA": {2023: 3800, 2024: 3950, 2025: 3900},
    },
    "male": {
        "ANTONI": {2023: 5200, 2024: 5000, 2025: 4700},
        "JAN": {2023: 4300, 2024: 4400, 2025: 4500},
        "NIKODEM": {2023: 3600, 2024: 3900, 2025: 4200},
    },
}

NATIONAL_TOTALS = {
    "female": {2023: 123_000, 2024: 121_000, 2025: 119_000},
    "male": {2023: 129_000, 2024: 126_000, 2025: 122_000},
}

REGIONS = [
    {
        "region_level": REGION_LEVEL,
        "region_code": "14",
        "region_name": "MAZOWIECKIE",
    },
    {
        "region_level": REGION_LEVEL,
        "region_code": "12",
        "region_name": "MAŁOPOLSKIE",
    },
]

REGIONAL_TOTALS = {
    "14": {
        "female": {2023: 18_000, 2024: 17_800, 2025: 17_600},
        "male": {2023: 18_900, 2024: 18_500, 2025: 18_200},
    },
    "12": {
        "female": {2023: 10_400, 2024: 10_200, 2025: 10_000},
        "male": {2023: 10_900, 2024: 10_600, 2025: 10_300},
    },
}

REGIONAL_SHARE_MULTIPLIERS = {
    "14": {
        "HELENA": 1.08,
        "ZOFIA": 0.98,
        "LAURA": 0.94,
        "ANTONI": 1.03,
        "JAN": 1.00,
        "NIKODEM": 0.92,
    },
    "12": {
        "HELENA": 0.94,
        "ZOFIA": 1.05,
        "LAURA": 1.02,
        "ANTONI": 0.97,
        "JAN": 1.08,
        "NIKODEM": 1.02,
    },
}


def normalize_name(name: str) -> str:
    return name.lower()


def national_share(gender: str, name: str, year: int) -> float:
    return NATIONAL_COUNTS[gender][name][year] / NATIONAL_TOTALS[gender][year]


def ranking_for_year(gender: str, year: int) -> dict[str, int]:
    ordered = sorted(
        NAMES[gender],
        key=lambda name: (-NATIONAL_COUNTS[gender][name][year], normalize_name(name)),
    )
    return {name: index + 1 for index, name in enumerate(ordered)}


def regional_count(gender: str, name: str, region_code: str, year: int) -> int:
    share = national_share(gender, name, year) * REGIONAL_SHARE_MULTIPLIERS[region_code][name]
    return round(REGIONAL_TOTALS[region_code][gender][year] * share)


def regional_share(gender: str, name: str, region_code: str, year: int) -> float:
    return regional_count(gender, name, region_code, year) / REGIONAL_TOTALS[region_code][gender][year]


def regional_ranking_for_year(gender: str, region_code: str, year: int) -> dict[str, int]:
    ordered = sorted(
        NAMES[gender],
        key=lambda name: (-regional_count(gender, name, region_code, year), normalize_name(name)),
    )
    return {name: index + 1 for index, name in enumerate(ordered)}


def build_names_index() -> list[dict[str, str]]:
    return [
        {"name": name, "name_normalized": normalize_name(name), "gender": gender}
        for gender in ("female", "male")
        for name in NAMES[gender]
    ]


def build_national_series() -> dict[str, list[dict[str, Any]]]:
    series: dict[str, list[dict[str, Any]]] = {}
    rankings = {gender: {year: ranking_for_year(gender, year) for year in YEARS} for gender in NAMES}

    for gender, names in NAMES.items():
        for name in names:
            points = []
            for year in YEARS:
                previous_year = year - 1
                previous_count = NATIONAL_COUNTS[gender][name].get(previous_year)
                previous_rank = rankings[gender].get(previous_year, {}).get(name)
                rank = rankings[gender][year][name]
                points.append(
                    {
                        "year": year,
                        "count": NATIONAL_COUNTS[gender][name][year],
                        "share": national_share(gender, name, year),
                        "rank": rank,
                        "yoy_change": None if previous_count is None else NATIONAL_COUNTS[gender][name][year] - previous_count,
                        "rank_change": None if previous_rank is None else previous_rank - rank,
                    }
                )
            series[f"{gender}|{normalize_name(name)}"] = points
    return series


def build_name_summaries(series: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    summaries = []
    for gender, names in NAMES.items():
        for name in names:
            key = f"{gender}|{normalize_name(name)}"
            latest = series[key][-1]
            previous = series[key][-2]
            yoy_change = latest["count"] - previous["count"]
            summaries.append(
                {
                    "name": name,
                    "name_normalized": normalize_name(name),
                    "gender": gender,
                    "latest_year": latest["year"],
                    "latest_count": latest["count"],
                    "latest_rank": latest["rank"],
                    "latest_share": latest["share"],
                    "previous_year_count": previous["count"],
                    "yoy_change": yoy_change,
                    "yoy_change_pct": yoy_change / previous["count"] if previous["count"] else None,
                    "previous_year_rank": previous["rank"],
                    "rank_change": previous["rank"] - latest["rank"],
                }
            )
    return summaries


def build_latest_rankings(series: dict[str, list[dict[str, Any]]]) -> dict[str, list[dict[str, Any]]]:
    rankings: dict[str, list[dict[str, Any]]] = {}
    for gender, names in NAMES.items():
        rows = []
        for name in names:
            latest = series[f"{gender}|{normalize_name(name)}"][-1]
            rows.append(
                {
                    "rank": latest["rank"],
                    "name": name,
                    "name_normalized": normalize_name(name),
                    "gender": gender,
                    "count": latest["count"],
                    "share": latest["share"],
                }
            )
        rankings[gender] = sorted(rows, key=lambda row: row["rank"])
    return rankings


def build_forecasts(series: dict[str, list[dict[str, Any]]]) -> dict[str, list[dict[str, Any]]]:
    forecasts: dict[str, list[dict[str, Any]]] = {}
    for key, points in series.items():
        change_1 = points[-1]["share"] - points[-2]["share"]
        change_2 = points[-2]["share"] - points[-3]["share"]
        forecast_share = max(0, points[-1]["share"] + ((change_1 + change_2) / 2) * 0.5)
        forecasts[key] = [
            {
                "year": FORECAST_YEAR,
                "forecast_share": forecast_share,
                "forecast_method": "damped_3y_share_trend",
                "source_year": 2025,
                "is_forecast": True,
            }
        ]
    return forecasts


def build_regional_series() -> dict[str, list[dict[str, Any]]]:
    series: dict[str, list[dict[str, Any]]] = {}
    for region in REGIONS:
        region_code = region["region_code"]
        for gender, names in NAMES.items():
            rankings = {
                year: regional_ranking_for_year(gender, region_code, year)
                for year in YEARS
            }
            for name in names:
                key = f"{gender}|{normalize_name(name)}|{REGION_LEVEL}|{region_code}"
                series[key] = [
                    {
                        "year": year,
                        "count": regional_count(gender, name, region_code, year),
                        "share": regional_share(gender, name, region_code, year),
                        "rank": rankings[year][name],
                    }
                    for year in YEARS
                ]
    return series


def build_regional_summaries(regional_series: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    region_by_code = {region["region_code"]: region for region in REGIONS}
    summaries = []

    for key, points in regional_series.items():
        gender, name_normalized, region_level, region_code = key.split("|")
        name = next(item for item in NAMES[gender] if normalize_name(item) == name_normalized)
        region = region_by_code[region_code]
        latest = points[-1]
        previous = points[-2]
        yoy_change = latest["count"] - previous["count"]
        summaries.append(
            {
                "name": name,
                "name_normalized": name_normalized,
                "gender": gender,
                "name_position": "first",
                "region_level": region_level,
                "region_code": region_code,
                "region_name": region["region_name"],
                "latest_year": latest["year"],
                "latest_count": latest["count"],
                "latest_share": latest["share"],
                "latest_rank": latest["rank"],
                "previous_year_count": previous["count"],
                "yoy_change": yoy_change,
                "yoy_change_pct": yoy_change / previous["count"] if previous["count"] else None,
                "previous_year_rank": previous["rank"],
                "rank_change": previous["rank"] - latest["rank"],
            }
        )
    return summaries


def build_latest_region_rankings(regional_summaries: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    rankings: dict[str, list[dict[str, Any]]] = {}
    for region in REGIONS:
        for gender in ("female", "male"):
            key = f"{gender}|{REGION_LEVEL}|{region['region_code']}"
            rows = [
                {
                    **summary,
                    "year": summary["latest_year"],
                    "count": summary["latest_count"],
                    "share": summary["latest_share"],
                    "rank": summary["latest_rank"],
                }
                for summary in regional_summaries
                if summary["gender"] == gender and summary["region_code"] == region["region_code"]
            ]
            rankings[key] = sorted(rows, key=lambda row: row["rank"])
    return rankings


def write_json(file_name: str, data: Any) -> None:
    path = PUBLIC_DATA_DIR / file_name
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)

    national_series = build_national_series()
    regional_series = build_regional_series()
    regional_summaries = build_regional_summaries(regional_series)

    write_json("names_index.json", build_names_index())
    write_json("latest_rankings_2025.json", build_latest_rankings(national_series))
    write_json("name_summaries.json", build_name_summaries(national_series))
    write_json("name_series.json", national_series)
    write_json("name_forecasts.json", build_forecasts(national_series))
    write_json("regions_index.json", REGIONS)
    write_json("latest_region_rankings_2025.json", build_latest_region_rankings(regional_summaries))
    write_json("name_region_summaries.json", regional_summaries)
    write_json("name_region_series.json", regional_series)

    print("Generated public showcase sample data.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
