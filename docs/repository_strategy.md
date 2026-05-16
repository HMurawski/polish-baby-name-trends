# Repository Strategy

## Private Production Repository

`HMurawski/polish-baby-name-trends-prod` is the full production source. It owns the complete data layer, production ETL, generated datasets, source manifests, operational process, and private planning context.

## Public Showcase Repository

`HMurawski/polish-baby-name-trends-showcase` is a sanitized portfolio and case-study version. It demonstrates the product experience, frontend architecture, static JSON contracts, validation approach, and build workflow without publishing the full generated data product.

## Why Production Data And ETL Are Excluded

The generated JSON files, raw datasets, processed datasets, source manifests, and ETL scripts are enough to reconstruct much of the production data layer. Keeping them private preserves a clean boundary between a public engineering showcase and the complete production product.

This also keeps the public repo easier to review: sample fixtures are small, deterministic, and sufficient for local development and CI verification.

## What Remains Public

- Next.js App Router frontend.
- TypeScript React UI implementation.
- Static JSON contract examples in `public/data`.
- Sample data generator and validator in `pipelines`.
- Public methodology and data-contract documentation.
- GitHub Actions build verification.

## What Remains Private

- Full generated national and regional JSON outputs.
- Raw and processed datasets.
- Production download, transform, forecast, and export pipelines.
- Source-resource manifests and data-discovery notes.
- Operational playbooks, internal roadmap, release process, and private planning notes.
- Exploratory notebooks with local outputs or paths.
