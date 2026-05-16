"use client";

import { useEffect, useState } from "react";

export type TrendPoint = {
  year: number;
  count: number;
  share: number;
  rank: number;
  yoy_change: number | null;
  rank_change: number | null;
};

type ChartMetric = "count" | "rank" | "share";

const nationalAxisYears = [2023, 2024, 2025];

function formatCount(value: number) {
  return new Intl.NumberFormat("pl-PL").format(Math.round(value));
}

function formatShare(value: number) {
  const percent = value * 100;

  if (percent === 0) {
    return "0%";
  }

  const precision = percent < 0.01 ? 4 : percent < 0.1 ? 3 : 2;
  return `${percent.toFixed(precision).replace(".", ",")}%`;
}

function formatSignedCount(value: number) {
  if (value === 0) {
    return "0";
  }

  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatCount(Math.abs(value))}`;
}

function formatRank(value: number) {
  return `${formatCount(value)}. miejsce`;
}

function pointForYear(points: TrendPoint[], year: number) {
  return points.find((point) => point.year === year) ?? null;
}

function latestPoint(points: TrendPoint[]) {
  return points.reduce((latest, point) => (point.year > latest.year ? point : latest));
}

function peakCountPoint(points: TrendPoint[]) {
  return points.reduce((peak, point) => (point.count > peak.count ? point : peak));
}

function bestRankPoint(points: TrendPoint[]) {
  return points.reduce((best, point) => (point.rank < best.rank ? point : best));
}

function worstRankPoint(points: TrendPoint[]) {
  return points.reduce((worst, point) => (point.rank > worst.rank ? point : worst));
}

function buildPath(
  points: Array<TrendPoint | null>,
  xForYear: (year: number) => number,
  yForValue: (value: number) => number,
  metric: ChartMetric,
) {
  const segments: string[] = [];
  let currentSegment = "";

  points.forEach((point) => {
    if (!point) {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = "";
      return;
    }

    const command = currentSegment ? "L" : "M";
    currentSegment += `${currentSegment ? " " : ""}${command} ${xForYear(point.year).toFixed(1)} ${yForValue(point[metric]).toFixed(1)}`;
  });

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}

function selectedYearDescription(point: TrendPoint | null, selectedYear: number) {
  if (!point) {
    return `${selectedYear}: brak danych dla tego roku.`;
  }

  const parts = [
    `${point.year}: ${formatCount(point.count)} nadań`,
    `udział ${formatShare(point.share)}`,
    `ranking ${formatCount(point.rank)}.`,
  ];

  if (point.yoy_change !== null) {
    parts.push(`zmiana YoY ${formatSignedCount(point.yoy_change)}`);
  }

  return parts.join(" · ");
}

function metricLabel(metric: ChartMetric) {
  if (metric === "count") {
    return "Liczba nadań";
  }
  if (metric === "rank") {
    return "Ranking";
  }
  return "Udział w roczniku";
}

function metricCaption(metric: ChartMetric) {
  if (metric === "rank") {
    return "Im bliżej góry, tym lepsza pozycja";
  }
  if (metric === "share") {
    return "Udział imienia w kolejnych rocznikach";
  }
  return "Liczba nadań w kolejnych latach";
}

function formatMetricValue(metric: ChartMetric, value: number) {
  if (metric === "count") {
    return formatCount(value);
  }
  if (metric === "rank") {
    return formatRank(value);
  }
  return formatShare(value);
}

export default function ProfileTrendCharts({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return (
      <p className="muted">
        Nie mamy wystarczających danych, żeby pokazać trend tego imienia.
      </p>
    );
  }

  return <ProfileTrendChartsInner points={points} />;
}

function ProfileTrendChartsInner({ points }: { points: TrendPoint[] }) {
  const sortedPoints = points.slice().sort((a, b) => a.year - b.year);
  const latest = latestPoint(sortedPoints);
  const peak = peakCountPoint(sortedPoints);
  const bestRank = bestRankPoint(sortedPoints);
  const worstRank = worstRankPoint(sortedPoints);
  const [selectedYear, setSelectedYear] = useState(latest.year);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>("count");
  const selectedPoint = pointForYear(sortedPoints, selectedYear);

  useEffect(() => {
    setSelectedYear(latest.year);
  }, [latest.year]);

  return (
    <div className="profile-chart-stack">
      <div className="profile-chart-summary-grid" aria-label="Podsumowanie trendu imienia">
        <article>
          <span>Popularność w liczbie nadań</span>
          <strong>
            Najnowszy rok: {latest.year} - {formatCount(latest.count)} nadań
          </strong>
          <p>
            Szczyt popularności: {peak.year} - {formatCount(peak.count)} nadań
          </p>
          <p>Od szczytu: {formatSignedCount(latest.count - peak.count)} nadań</p>
        </article>
        <article>
          <span>Pozycja w rankingu</span>
          <strong>Najnowszy ranking: {formatRank(latest.rank)}</strong>
          <p>
            Najlepszy ranking: {formatRank(bestRank.rank)} w {bestRank.year}
          </p>
          <p>
            Najniższy ranking: {formatRank(worstRank.rank)} w {worstRank.year}
          </p>
        </article>
      </div>

      <div className="profile-chart-readout" aria-live="polite">
        {selectedYearDescription(selectedPoint, selectedYear)}
      </div>

      <div className="profile-metric-toggle" aria-label="Wybierz metrykę trendu">
        {(["count", "rank", "share"] as ChartMetric[]).map((metric) => (
          <button
            aria-pressed={selectedMetric === metric}
            className={
              selectedMetric === metric ? "trend-toggle-button active" : "trend-toggle-button"
            }
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            type="button"
          >
            {metricLabel(metric)}
          </button>
        ))}
      </div>

      <InteractiveTrendChart
        label={metricLabel(selectedMetric)}
        metric={selectedMetric}
        note={
          selectedMetric === "rank"
            ? "Niższa liczba oznacza lepszą pozycję, dlatego 1. miejsce jest najwyżej."
            : undefined
        }
        points={sortedPoints}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        yearEnd={2025}
        yearStart={2023}
      />
    </div>
  );
}

export function InteractiveTrendChart({
  label,
  metric,
  note,
  points,
  comparisonPoints,
  primaryLabel = "Polska",
  comparisonLabel,
  selectedYear,
  setSelectedYear,
  yearStart,
  yearEnd,
}: {
  label: string;
  metric: ChartMetric;
  note?: string;
  points: TrendPoint[];
  comparisonPoints?: TrendPoint[];
  primaryLabel?: string;
  comparisonLabel?: string;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  yearStart: number;
  yearEnd: number;
}) {
  const width = 760;
  const height = 270;
  const padding = { top: 28, right: 36, bottom: 54, left: 86 };
  const pointByYear = new Map(points.map((point) => [point.year, point]));
  const comparisonPointByYear = new Map(
    (comparisonPoints ?? []).map((point) => [point.year, point]),
  );
  const years = Array.from({ length: yearEnd - yearStart + 1 }, (_, index) => yearStart + index);
  const chartPoints = years.map((year) => pointByYear.get(year) ?? null);
  const comparisonChartPoints = years.map((year) => comparisonPointByYear.get(year) ?? null);
  const allValues = [...points, ...(comparisonPoints ?? [])].map((point) => point[metric]);
  const rawMin = metric === "rank" ? Math.min(...allValues) : 0;
  const rawMax = Math.max(...allValues);
  const valueMin =
    rawMin === rawMax ? (metric === "rank" ? Math.max(1, rawMin - 1) : 0) : rawMin;
  const valueMax = rawMin === rawMax ? rawMax + (metric === "share" ? 0.001 : 1) : rawMax;
  const valueMid =
    metric === "share" ? (valueMin + valueMax) / 2 : Math.round((valueMin + valueMax) / 2);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const selectedPoint = pointByYear.get(selectedYear) ?? null;
  const selectedComparisonPoint = comparisonPointByYear.get(selectedYear) ?? null;
  const selectedX = xForYear(selectedYear);
  const axisYears =
    yearStart === 2023 && yearEnd === 2025
      ? nationalAxisYears
      : [yearStart, Math.round((yearStart + yearEnd) / 2), yearEnd];

  function xForYear(year: number) {
    return padding.left + ((year - yearStart) / (yearEnd - yearStart)) * chartWidth;
  }

  function yForValue(value: number) {
    const ratio = (value - valueMin) / (valueMax - valueMin);
    const scaled = metric === "rank" ? ratio : 1 - ratio;
    return padding.top + scaled * chartHeight;
  }

  const segments = buildPath(chartPoints, xForYear, yForValue, metric);
  const comparisonSegments = buildPath(comparisonChartPoints, xForYear, yForValue, metric);
  const axisValues = Array.from(new Set([valueMin, valueMid, valueMax]));

  return (
    <figure className="profile-trend-chart">
      <figcaption>
        <strong>{label}</strong>
        <span>{metricCaption(metric)}</span>
      </figcaption>
      {comparisonPoints && comparisonLabel ? (
        <div className="chart-legend">
          <span>
            <i aria-hidden="true" className="legend-line legend-line-primary" /> {primaryLabel}
          </span>
          <span>
            <i aria-hidden="true" className="legend-line legend-line-secondary" /> {comparisonLabel}
          </span>
        </div>
      ) : null}
      <label className="form-field chart-year-control">
        <span>Rok na wykresie</span>
        <select
          value={selectedYear}
          onChange={(event) => setSelectedYear(Number(event.target.value))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
      <svg
        aria-label={`${label} w latach ${yearStart}-${yearEnd}`}
        className="compare-chart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {axisValues.map((value) => {
          const y = yForValue(value);
          return (
            <g key={`${metric}-y-${value}`}>
              <line
                stroke="#e5ebe7"
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
              />
              <text fill="#61706a" fontSize="12" textAnchor="end" x={padding.left - 10} y={y + 4}>
                {formatMetricValue(metric, value)}
              </text>
            </g>
          );
        })}
        <line
          stroke="#d7ded9"
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={height - padding.bottom}
        />
        {axisYears.map((year) => (
          <g key={`${metric}-x-${year}`}>
            <line
              stroke="#edf2ef"
              x1={xForYear(year)}
              x2={xForYear(year)}
              y1={padding.top}
              y2={height - padding.bottom}
            />
            <text fill="#61706a" fontSize="12" textAnchor="middle" x={xForYear(year)} y={height - 24}>
              {year}
            </text>
          </g>
        ))}
        <line
          stroke="#143f36"
          strokeDasharray="4 5"
          x1={selectedX}
          x2={selectedX}
          y1={padding.top}
          y2={height - padding.bottom}
        />
        {segments.map((segment) => (
          <path
            d={segment}
            fill="none"
            key={segment}
            stroke="#236b5b"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ))}
        {comparisonSegments.map((segment) => (
          <path
            d={segment}
            fill="none"
            key={`comparison-${segment}`}
            stroke="#d99a3f"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ))}
        {selectedPoint ? (
          <circle
            cx={selectedX}
            cy={yForValue(selectedPoint[metric])}
            fill="#ffffff"
            r="6"
            stroke="#236b5b"
            strokeWidth="3"
          />
        ) : null}
        {selectedComparisonPoint ? (
          <circle
            cx={selectedX}
            cy={yForValue(selectedComparisonPoint[metric])}
            fill="#ffffff"
            r="6"
            stroke="#d99a3f"
            strokeWidth="3"
          />
        ) : null}
        {years.map((year) => {
          const targetWidth = chartWidth / years.length;
          return (
            <rect
              aria-hidden="true"
              focusable="false"
              fill="transparent"
              height={chartHeight}
              key={`${metric}-target-${year}`}
              onClick={() => setSelectedYear(year)}
              onPointerDown={() => setSelectedYear(year)}
              onPointerEnter={() => setSelectedYear(year)}
              onPointerMove={() => setSelectedYear(year)}
              width={targetWidth}
              x={xForYear(year) - targetWidth / 2}
              y={padding.top}
            />
          );
        })}
      </svg>
      {note ? <p className="muted">{note}</p> : null}
    </figure>
  );
}
