# Data Contracts

The app reads static JSON files from `public/data`. This showcase repository includes tiny fixtures with the same high-level shapes as production.

## `names_index.json`

Array of searchable name records:

- `name`: display name, uppercase in the current fixtures.
- `name_normalized`: URL/search key, lowercase.
- `gender`: `female` or `male`.

## `latest_rankings_2025.json`

Object keyed by gender:

- `female`: array of latest ranking records.
- `male`: array of latest ranking records.

Each record includes rank, name, normalized name, gender, count, and share.

## `name_summaries.json`

Array of one summary per name and gender. Each summary includes the latest year, count, rank, share, previous-year count, year-over-year count change, previous rank, and rank change.

## `name_series.json`

Object keyed as:

```text
{gender}|{name_normalized}
```

Each value is a year-sorted array of points with year, count, share, rank, year-over-year count change, and rank change.

## `name_forecasts.json`

Object keyed as:

```text
{gender}|{name_normalized}
```

Each value is an array of forecast points. The showcase includes 2026 points with forecast share, forecast method, source year, and `is_forecast: true`.

## `regions_index.json`

Array of region records:

- `region_level`: currently `registration_voivodeship`.
- `region_code`: stable region code.
- `region_name`: display label.

The public fixture intentionally includes only `mazowieckie` and `małopolskie`.

## `latest_region_rankings_2025.json`

Object keyed as:

```text
{gender}|registration_voivodeship|{region_code}
```

Each value is an array of regional ranking records for the latest year. Records include the national ranking fields plus region level, region code, region name, name position, and previous-year comparison fields.

## `name_region_summaries.json`

Array of one regional summary per name, gender, region level, and region code. Each summary includes latest regional count, share, rank, previous count, year-over-year change, previous rank, and rank change.

## `name_region_series.json`

Object keyed as:

```text
{gender}|{name_normalized}|registration_voivodeship|{region_code}
```

Each value is a year-sorted array of regional points with year, count, share, and rank.
