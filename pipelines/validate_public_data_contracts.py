"""Validate public frontend JSON data contracts.

This script is read-only. It checks the generated JSON files in public/data and
does not normalize, rewrite, or regenerate any data.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


PUBLIC_DATA_DIR = Path("public/data")
VALID_GENDERS = {"female", "male"}
VALID_FORECAST_METHODS = {"damped_3y_share_trend", "last_year_share"}
REGION_LEVEL = "registration_voivodeship"
NATIONAL_FILES = {
    "names_index": "names_index.json",
    "latest_rankings": "latest_rankings_2025.json",
    "name_summaries": "name_summaries.json",
    "name_series": "name_series.json",
    "name_forecasts": "name_forecasts.json",
}
REGIONAL_FILES = {
    "regions_index": "regions_index.json",
    "latest_region_rankings": "latest_region_rankings_2025.json",
    "name_region_summaries": "name_region_summaries.json",
    "name_region_series": "name_region_series.json",
}


class ContractValidationError(Exception):
    """Raised when a public JSON contract is invalid."""


def load_json_file(file_name: str) -> Any:
    path = PUBLIC_DATA_DIR / file_name
    if not path.is_file():
        raise ContractValidationError(f"Required JSON file does not exist: {path}")
    try:
        with path.open("r", encoding="utf-8") as input_file:
            return json.load(input_file)
    except UnicodeDecodeError as exc:
        raise ContractValidationError(f"JSON file is not valid UTF-8: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ContractValidationError(f"JSON file is invalid: {path}: {exc}") from exc
    except OSError as exc:
        raise ContractValidationError(f"Could not read JSON file {path}: {exc}") from exc


def require_dict(value: Any, name: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ContractValidationError(f"{name} must be a JSON object.")
    if not value:
        raise ContractValidationError(f"{name} must not be empty.")
    return value


def require_list(value: Any, name: str) -> list[Any]:
    if not isinstance(value, list):
        raise ContractValidationError(f"{name} must be a JSON array.")
    if not value:
        raise ContractValidationError(f"{name} must not be empty.")
    return value


def require_object(value: Any, context: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ContractValidationError(f"{context} must be an object.")
    return value


def require_string(row: dict[str, Any], field: str, context: str) -> str:
    value = row.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ContractValidationError(f"{context}: `{field}` must be a non-empty string.")
    return value


def require_optional_number(value: Any, field: str, context: str) -> None:
    if value is not None and not isinstance(value, (int, float)):
        raise ContractValidationError(f"{context}: `{field}` must be numeric or null.")


def require_gender(value: Any, context: str) -> str:
    if value not in VALID_GENDERS:
        raise ContractValidationError(f"{context}: invalid gender {value!r}.")
    return str(value)


def require_name_position(value: Any, context: str) -> str:
    if value != "first":
        raise ContractValidationError(f"{context}: `name_position` must be first.")
    return str(value)


def require_region_level(value: Any, context: str) -> str:
    if value != REGION_LEVEL:
        raise ContractValidationError(f"{context}: `region_level` must be {REGION_LEVEL}.")
    return str(value)


def require_non_negative_int(value: Any, field: str, context: str) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or value < 0:
        raise ContractValidationError(f"{context}: `{field}` must be a non-negative integer.")
    return value


def require_positive_int(value: Any, field: str, context: str) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
        raise ContractValidationError(f"{context}: `{field}` must be a positive integer.")
    return value


def require_share(value: Any, field: str, context: str) -> float:
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise ContractValidationError(f"{context}: `{field}` must be numeric.")
    parsed_value = float(value)
    if parsed_value < 0 or parsed_value > 1:
        raise ContractValidationError(f"{context}: `{field}` must be between 0 and 1.")
    return parsed_value


def validate_rank_count_share_record(row: dict[str, Any], context: str) -> None:
    require_positive_int(row.get("rank"), "rank", context)
    require_non_negative_int(row.get("count"), "count", context)
    require_share(row.get("share"), "share", context)


def validate_names_index(data: Any) -> int:
    rows = require_list(data, "names_index.json")
    seen_keys: set[tuple[str, str]] = set()
    for index, value in enumerate(rows):
        context = f"names_index[{index}]"
        row = require_object(value, context)
        name_normalized = require_string(row, "name_normalized", context)
        require_string(row, "name", context)
        gender = require_gender(row.get("gender"), context)
        key = (name_normalized, gender)
        if key in seen_keys:
            raise ContractValidationError(f"{context}: duplicate name_normalized + gender: {key}")
        seen_keys.add(key)
    return len(rows)


def validate_latest_rankings(data: Any) -> int:
    rankings = require_dict(data, "latest_rankings_2025.json")
    if set(rankings) != VALID_GENDERS:
        raise ContractValidationError("latest_rankings_2025.json must contain female and male keys.")

    record_count = 0
    for gender, value in rankings.items():
        records = require_list(value, f"latest_rankings_2025[{gender}]")
        for index, item in enumerate(records):
            context = f"latest_rankings_2025[{gender}][{index}]"
            row = require_object(item, context)
            require_gender(row.get("gender"), context)
            if row["gender"] != gender:
                raise ContractValidationError(f"{context}: record gender does not match key.")
            require_string(row, "name", context)
            require_string(row, "name_normalized", context)
            validate_rank_count_share_record(row, context)
            record_count += 1
    return record_count


def validate_name_summaries(data: Any) -> int:
    rows = require_list(data, "name_summaries.json")
    seen_keys: set[tuple[str, str, str]] = set()
    for index, value in enumerate(rows):
        context = f"name_summaries[{index}]"
        row = require_object(value, context)
        name_normalized = require_string(row, "name_normalized", context)
        require_string(row, "name", context)
        gender = require_gender(row.get("gender"), context)
        name_position = str(row.get("name_position", "first"))
        require_name_position(name_position, context)
        key = (name_normalized, gender, name_position)
        if key in seen_keys:
            raise ContractValidationError(f"{context}: duplicate summary grain: {key}")
        seen_keys.add(key)

        require_non_negative_int(row.get("latest_count"), "latest_count", context)
        require_positive_int(row.get("latest_rank"), "latest_rank", context)
        require_share(row.get("latest_share"), "latest_share", context)
        for field in [
            "previous_year_count",
            "yoy_change",
            "yoy_change_pct",
            "previous_year_rank",
            "rank_change",
        ]:
            require_optional_number(row.get(field), field, context)
    return len(rows)


def validate_name_series(data: Any) -> int:
    series = require_dict(data, "name_series.json")
    for key, value in series.items():
        parts = key.split("|")
        if len(parts) != 2:
            raise ContractValidationError(f"name_series key has invalid shape: {key}")
        gender, name_normalized = parts
        require_gender(gender, f"name_series[{key}]")
        if not name_normalized:
            raise ContractValidationError(f"name_series key has empty name_normalized: {key}")
        points = require_list(value, f"name_series[{key}]")
        validate_series_points(points, f"name_series[{key}]", min_year=None, max_year=None)
    return len(series)


def validate_forecasts(data: Any) -> int:
    forecasts = require_dict(data, "name_forecasts.json")
    found_forecast_2026 = False
    for key, value in forecasts.items():
        parts = key.split("|")
        if len(parts) != 2:
            raise ContractValidationError(f"name_forecasts key has invalid shape: {key}")
        gender, name_normalized = parts
        require_gender(gender, f"name_forecasts[{key}]")
        if not name_normalized:
            raise ContractValidationError(f"name_forecasts key has empty name_normalized: {key}")

        points = require_list(value, f"name_forecasts[{key}]")
        seen_years: set[int] = set()
        for index, item in enumerate(points):
            context = f"name_forecasts[{key}][{index}]"
            row = require_object(item, context)
            year = require_positive_int(row.get("year"), "year", context)
            if year in seen_years:
                raise ContractValidationError(f"{context}: duplicate forecast year {year}.")
            seen_years.add(year)
            if year == 2026:
                found_forecast_2026 = True
            require_share(row.get("forecast_share"), "forecast_share", context)
            forecast_method = row.get("forecast_method")
            if forecast_method not in VALID_FORECAST_METHODS:
                raise ContractValidationError(
                    f"{context}: unsupported forecast_method {forecast_method!r}."
                )
            source_year = require_positive_int(row.get("source_year"), "source_year", context)
            if source_year != 2025:
                raise ContractValidationError(f"{context}: source_year must be 2025.")
            if row.get("is_forecast") is not True:
                raise ContractValidationError(f"{context}: is_forecast must be true.")

    if not found_forecast_2026:
        raise ContractValidationError("name_forecasts.json must contain 2026 forecast records.")
    return len(forecasts)


def validate_regions_index(data: Any) -> tuple[int, set[str]]:
    rows = require_list(data, "regions_index.json")
    region_codes: set[str] = set()
    for index, value in enumerate(rows):
        context = f"regions_index[{index}]"
        row = require_object(value, context)
        require_region_level(row.get("region_level"), context)
        region_code = require_string(row, "region_code", context)
        require_string(row, "region_name", context)
        if region_code in region_codes:
            raise ContractValidationError(f"{context}: duplicate region_code {region_code}.")
        region_codes.add(region_code)
    return len(rows), region_codes


def validate_regional_metric_record(
    row: dict[str, Any], context: str, region_codes: set[str], year_field: str = "year"
) -> None:
    require_gender(row.get("gender"), context)
    require_name_position(row.get("name_position"), context)
    require_region_level(row.get("region_level"), context)
    region_code = require_string(row, "region_code", context)
    if region_code not in region_codes:
        raise ContractValidationError(f"{context}: unknown region_code {region_code}.")
    require_string(row, "region_name", context)
    require_string(row, "name", context)
    require_string(row, "name_normalized", context)
    year = require_positive_int(row.get(year_field), year_field, context)
    if year < 2023 or year > 2025:
        raise ContractValidationError(f"{context}: regional year must be within 2023-2025.")


def validate_latest_region_rankings(data: Any, region_codes: set[str]) -> int:
    rankings = require_dict(data, "latest_region_rankings_2025.json")
    record_count = 0
    for key, value in rankings.items():
        parts = key.split("|")
        if len(parts) != 3:
            raise ContractValidationError(f"Regional ranking key has invalid shape: {key}")
        gender, region_level, region_code = parts
        require_gender(gender, f"latest_region_rankings[{key}]")
        require_region_level(region_level, f"latest_region_rankings[{key}]")
        if region_code not in region_codes:
            raise ContractValidationError(f"Regional ranking key has unknown region_code: {key}")

        records = require_list(value, f"latest_region_rankings[{key}]")
        ranks = []
        for index, item in enumerate(records):
            context = f"latest_region_rankings[{key}][{index}]"
            row = require_object(item, context)
            validate_regional_metric_record(row, context, region_codes)
            if row["gender"] != gender or row["region_level"] != region_level or row["region_code"] != region_code:
                raise ContractValidationError(f"{context}: record does not match ranking key.")
            validate_rank_count_share_record(row, context)
            ranks.append(row["rank"])
            record_count += 1

        expected_ranks = list(range(1, len(records) + 1))
        if ranks != expected_ranks:
            raise ContractValidationError(f"Regional ranking ranks are not contiguous for {key}.")
    return record_count


def validate_name_region_summaries(data: Any, region_codes: set[str]) -> int:
    rows = require_list(data, "name_region_summaries.json")
    seen_keys: set[tuple[str, str, str, str, str]] = set()
    for index, value in enumerate(rows):
        context = f"name_region_summaries[{index}]"
        row = require_object(value, context)
        validate_regional_metric_record(row, context, region_codes, year_field="latest_year")
        key = (
            row["name_normalized"],
            row["gender"],
            row["name_position"],
            row["region_level"],
            row["region_code"],
        )
        if key in seen_keys:
            raise ContractValidationError(f"{context}: duplicate regional summary grain: {key}")
        seen_keys.add(key)
        require_non_negative_int(row.get("latest_count"), "latest_count", context)
        require_positive_int(row.get("latest_rank"), "latest_rank", context)
        require_share(row.get("latest_share"), "latest_share", context)
    return len(rows)


def validate_name_region_series(data: Any, region_codes: set[str]) -> int:
    series = require_dict(data, "name_region_series.json")
    for key, value in series.items():
        parts = key.split("|")
        if len(parts) != 4:
            raise ContractValidationError(f"Regional series key has invalid shape: {key}")
        gender, name_normalized, region_level, region_code = parts
        require_gender(gender, f"name_region_series[{key}]")
        if not name_normalized:
            raise ContractValidationError(f"Regional series key has empty name_normalized: {key}")
        require_region_level(region_level, f"name_region_series[{key}]")
        if region_code not in region_codes:
            raise ContractValidationError(f"Regional series key has unknown region_code: {key}")

        points = require_list(value, f"name_region_series[{key}]")
        validate_series_points(points, f"name_region_series[{key}]", min_year=2023, max_year=2025)
    return len(series)


def validate_series_points(
    points: list[Any], context: str, min_year: int | None, max_year: int | None
) -> None:
    seen_years: set[int] = set()
    years: list[int] = []
    for index, item in enumerate(points):
        point_context = f"{context}[{index}]"
        row = require_object(item, point_context)
        year = require_positive_int(row.get("year"), "year", point_context)
        if min_year is not None and year < min_year:
            raise ContractValidationError(f"{point_context}: year must be >= {min_year}.")
        if max_year is not None and year > max_year:
            raise ContractValidationError(f"{point_context}: year must be <= {max_year}.")
        if year in seen_years:
            raise ContractValidationError(f"{point_context}: duplicate year {year}.")
        seen_years.add(year)
        years.append(year)
        require_non_negative_int(row.get("count"), "count", point_context)
        require_share(row.get("share"), "share", point_context)
        require_positive_int(row.get("rank"), "rank", point_context)

    if years != sorted(years):
        raise ContractValidationError(f"{context}: points must be sorted by year ascending.")


def validate_contracts() -> dict[str, int]:
    names_index = load_json_file(NATIONAL_FILES["names_index"])
    latest_rankings = load_json_file(NATIONAL_FILES["latest_rankings"])
    name_summaries = load_json_file(NATIONAL_FILES["name_summaries"])
    name_series = load_json_file(NATIONAL_FILES["name_series"])
    name_forecasts = load_json_file(NATIONAL_FILES["name_forecasts"])

    regions_index = load_json_file(REGIONAL_FILES["regions_index"])
    latest_region_rankings = load_json_file(REGIONAL_FILES["latest_region_rankings"])
    name_region_summaries = load_json_file(REGIONAL_FILES["name_region_summaries"])
    name_region_series = load_json_file(REGIONAL_FILES["name_region_series"])

    counts: dict[str, int] = {}
    counts["names_index"] = validate_names_index(names_index)
    counts["latest_rankings_records"] = validate_latest_rankings(latest_rankings)
    counts["name_summaries"] = validate_name_summaries(name_summaries)
    counts["name_series_keys"] = validate_name_series(name_series)
    counts["name_forecast_keys"] = validate_forecasts(name_forecasts)

    regions_count, region_codes = validate_regions_index(regions_index)
    counts["regions_index"] = regions_count
    counts["latest_region_ranking_records"] = validate_latest_region_rankings(
        latest_region_rankings, region_codes
    )
    counts["latest_region_ranking_keys"] = len(latest_region_rankings)
    counts["name_region_summaries"] = validate_name_region_summaries(
        name_region_summaries, region_codes
    )
    counts["name_region_series_keys"] = validate_name_region_series(
        name_region_series, region_codes
    )
    return counts


def main() -> int:
    try:
        counts = validate_contracts()
    except ContractValidationError as exc:
        print(f"Validation error: {exc}", file=sys.stderr)
        return 1

    print("Public data contract validation passed.")
    for key in sorted(counts):
        print(f"- {key}: {counts[key]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
