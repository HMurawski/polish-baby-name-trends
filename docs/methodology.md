# Methodology

This public repository documents the product approach without publishing the full production data layer.

## Source Principle

The production app uses official Polish public baby-name data. Those source datasets are transformed into frontend JSON contracts that support rankings, name profiles, trends, a calculator, comparisons, and regional context.

The showcase repository uses sample fixtures only. The numbers are deterministic demo values for a tiny set of names and should not be treated as analytical results.

## National Metrics

For each name, gender, and year, the app-facing data tracks:

- count of first-name assignments,
- share within the same gender and year,
- rank within the same gender and year,
- year-over-year count and rank changes where available.

## Regional Context

Regional data means województwo rejestracji urodzenia. It does not mean where a child lives, where parents live, or where the child may attend school.

Regional comparisons are best read as context. They are not a regional class predictor.

## Calculator

The calculator uses:

```text
P = 1 - (1 - p)^n
```

`p` is the name share in the selected year and gender. `n` is the number of other children of the same gender in the group. The result is a simplified probability estimate, not a prediction of any real class or school.

## 2026 Forecast

The 2026 value is a cautious estimate used for product context. It is not official data and not an ML model. The public showcase keeps this caveat visible because the same interpretation rule matters in production.
