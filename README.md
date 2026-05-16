# Imię w Klasie / Polish Baby Name Trends

[Live product](https://polish-baby-name-trends.vercel.app)

> This repository is a sanitized public showcase version. It uses sample data and intentionally excludes the full production data layer and production ETL pipelines.

Imię w Klasie is a small data product for parents choosing a child name in Poland. Instead of showing only a popularity ranking, it explains how common a name is, how its trend is changing, and what a simplified class-size estimate might imply.

## Product Problem

Parents often hear that a name is "popular" without knowing whether that means a top-three national name, a stable classic, or a name that is rising quickly in the current cohort. The product turns public baby-name statistics into a quick decision-support tool for a non-technical user.

Target users are parents and families comparing name ideas before birth, especially when they care about whether a child may share a name with several classmates.

## Current V1 Features

- Homepage rankings for the latest year in the app data.
- Name profile pages with rank, count, share, year-over-year change, and trend charts.
- A calculator estimating the chance that another child of the same gender in a group has the same name.
- A compare page for two names.
- Methodology and about pages with caveats.
- Regional comparison by województwo rejestracji urodzenia.
- A cautious 2026 forecast caveat in the calculator.

The public fixtures include only: female names `HELENA`, `ZOFIA`, `LAURA`; male names `ANTONI`, `JAN`, `NIKODEM`; years `2023`, `2024`, `2025`; forecast year `2026`; regions `mazowieckie` and `małopolskie`.

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Python sample pipeline and validator
- Static JSON data contracts
- GitHub Actions verification
- Vercel for the production deployment

## Architecture Overview

The frontend reads static JSON files from `public/data`. Server components use the same files for homepage and profile rendering, while client components fetch the static files for calculator and comparison interactions.

The public repository keeps the UI, routing, charting, sample data contracts, validation script, and CI build workflow. The production repository owns the full data ingestion, generated datasets, source manifests, and operational process.

## Data Methodology Summary

Production uses official Polish public baby-name data. The public showcase repo uses deterministic demo fixtures with compatible JSON shapes, so the app can build and run without exposing the complete production data product.

Important caveats:

- Regional data in production means województwo rejestracji urodzenia, not residence or school location.
- 2026 values are cautious estimates, not official statistics and not an ML model.
- The calculator uses a simplified national or regional-share assumption. It does not predict a real class, school, or local community.

## Run Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Verify And Build

```bash
npm run generate:sample-data
npm run verify
npm run build
```

`npm run verify` validates the sample JSON contracts and runs a production Next.js build.

## Intentionally Excluded

This public showcase excludes:

- Full production JSON outputs.
- Raw and processed source datasets.
- Production download, transform, forecast, and export pipelines.
- Full source manifests for public data resources.
- Internal roadmap, monetization notes, release checklists, operational playbooks, and planning notes.
- Exploratory notebooks with local outputs or paths.
- Vercel Analytics wiring from the public showcase code.

## Limitations

The public fixtures are intentionally tiny and are not suitable for data analysis. Non-sample names may 404 or show no data. The sample regional coverage is deliberately limited to two regions and should be read only as a contract and UI demonstration.

## Portfolio Value

This repository demonstrates:

- A production-style data app architecture using static contracts.
- Careful UX around statistical caveats and non-technical interpretation.
- TypeScript/React implementation with server-rendered and client-interactive surfaces.
- Reproducible sample fixtures and contract validation.
- CI-oriented verification for a public showcase without leaking the full production data layer.
