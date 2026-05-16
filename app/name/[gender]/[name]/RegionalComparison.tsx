"use client";

import { useEffect, useMemo, useState } from "react";
import { InteractiveTrendChart, type TrendPoint } from "./ProfileTrendCharts";

type Gender = "female" | "male";

type Region = {
  region_level: "registration_voivodeship";
  region_code: string;
  region_name: string;
};

type NationalSummary = {
  name: string;
  name_normalized: string;
  gender: Gender;
  latest_year: number;
  latest_count: number;
  latest_rank: number;
  latest_share: number;
};

type RegionalNameSummary = {
  name: string;
  name_normalized: string;
  gender: Gender;
  name_position: "first";
  region_level: "registration_voivodeship";
  region_code: string;
  region_name: string;
  latest_year: number;
  latest_count: number;
  latest_share: number;
  latest_rank: number;
};

type RegionalSeriesPoint = {
  year: number;
  count: number;
  share: number;
  rank: number;
};

type RegionalComparisonProps = {
  regions: Region[];
  nationalSummary: NationalSummary;
  nationalSeries: TrendPoint[];
  regionalSummaries: RegionalNameSummary[];
  regionalSeriesByRegion: Record<string, RegionalSeriesPoint[]>;
};

const trendYears = [2023, 2024, 2025];
const numberFormatter = new Intl.NumberFormat("pl-PL");

function formatCount(value: number) {
  return numberFormatter.format(Math.round(value));
}

function formatShare(value: number) {
  const percent = value * 100;

  if (percent === 0) {
    return "0%";
  }

  const precision = percent < 0.01 ? 4 : percent < 0.1 ? 3 : 2;
  return `${percent.toFixed(precision).replace(".", ",")}%`;
}

function formatRank(value: number) {
  return `${numberFormatter.format(value)}.`;
}

function filterTrendPoints(points: TrendPoint[]) {
  const allowedYears = new Set(trendYears);
  return points
    .filter((point) => allowedYears.has(point.year))
    .sort((a, b) => a.year - b.year);
}

function normalizeRegionalPoints(points: RegionalSeriesPoint[]) {
  return points
    .map((point) => ({
      ...point,
      yoy_change: null,
      rank_change: null,
    }))
    .filter((point) => trendYears.includes(point.year))
    .sort((a, b) => a.year - b.year);
}

function pointForYear(points: TrendPoint[], year: number) {
  return points.find((point) => point.year === year) ?? null;
}

export default function RegionalComparison({
  regions,
  nationalSummary,
  nationalSeries,
  regionalSummaries,
  regionalSeriesByRegion,
}: RegionalComparisonProps) {
  const regionalByCode = useMemo(() => {
    return new Map(regionalSummaries.map((summary) => [summary.region_code, summary]));
  }, [regionalSummaries]);

  const defaultRegionCode =
    regions.find((region) => regionalByCode.has(region.region_code))?.region_code ??
    regions[0]?.region_code ??
    "";

  const [selectedRegionCode, setSelectedRegionCode] = useState(defaultRegionCode);

  useEffect(() => {
    if (!selectedRegionCode || !regions.some((region) => region.region_code === selectedRegionCode)) {
      setSelectedRegionCode(defaultRegionCode);
    }
  }, [defaultRegionCode, regions, selectedRegionCode]);

  const selectedRegion = regions.find((region) => region.region_code === selectedRegionCode);
  const selectedRegionalSummary = selectedRegionCode
    ? regionalByCode.get(selectedRegionCode)
    : undefined;
  const selectedRegionalSeries = selectedRegionCode
    ? regionalSeriesByRegion[selectedRegionCode] ?? []
    : [];
  const nationalTrendPoints = useMemo(() => filterTrendPoints(nationalSeries), [nationalSeries]);
  const regionalTrendPoints = useMemo(
    () => normalizeRegionalPoints(selectedRegionalSeries),
    [selectedRegionalSeries],
  );
  const latestTrendYear =
    regionalTrendPoints.at(-1)?.year ?? nationalTrendPoints.at(-1)?.year ?? 2025;
  const [selectedTrendYear, setSelectedTrendYear] = useState(latestTrendYear);
  const selectedNationalTrendPoint = pointForYear(nationalTrendPoints, selectedTrendYear);
  const selectedRegionalTrendPoint = pointForYear(regionalTrendPoints, selectedTrendYear);

  useEffect(() => {
    setSelectedTrendYear(latestTrendYear);
  }, [latestTrendYear]);

  return (
    <section className="history-section regional-comparison" aria-labelledby="regional-heading">
      <div className="section-heading">
        <p className="eyebrow">Region</p>
        <h2 id="regional-heading">Polska vs województwo rejestracji urodzenia</h2>
        <p className="muted">
          Sprawdź, jak najnowszy wynik imienia wygląda w wybranym województwie
          rejestracji urodzenia na tle danych ogólnopolskich.
        </p>
      </div>

      {regions.length > 0 ? (
        <label className="form-field regional-select">
          <span>Województwo rejestracji urodzenia</span>
          <select
            value={selectedRegionCode}
            onChange={(event) => setSelectedRegionCode(event.target.value)}
          >
            {regions.map((region) => (
              <option key={region.region_code} value={region.region_code}>
                {region.region_name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="regional-empty">
          Dane regionalne nie są dostępne w lokalnych plikach JSON.
        </p>
      )}

      <div className="comparison-grid regional-metrics-grid">
        <MetricPanel
          title="Polska"
          year={nationalSummary.latest_year}
          rank={nationalSummary.latest_rank}
          share={nationalSummary.latest_share}
          count={nationalSummary.latest_count}
        />

        {selectedRegionalSummary ? (
          <MetricPanel
            title={selectedRegionalSummary.region_name}
            year={selectedRegionalSummary.latest_year}
            rank={selectedRegionalSummary.latest_rank}
            share={selectedRegionalSummary.latest_share}
            count={selectedRegionalSummary.latest_count}
          />
        ) : (
          <div className="comparison-card regional-empty-card">
            <h3>{selectedRegion?.region_name ?? "Wybrane województwo"}</h3>
            <p>
              Brak opublikowanych danych regionalnych dla tego imienia w wybranym
              województwie.
            </p>
          </div>
        )}
      </div>

      <div className="regional-trend">
        <div className="section-heading">
          <h3>Trend udziału 2023-2025</h3>
          <p className="muted">
            Porównanie pokazuje udział imienia w roczniku, nie liczbę nadań.
          </p>
        </div>
        {nationalTrendPoints.length > 0 && regionalTrendPoints.length > 0 ? (
          <>
            <div className="profile-chart-readout regional-trend-readout" aria-live="polite">
              <strong>{selectedTrendYear}</strong>
              <span>
                Polska:{" "}
                {selectedNationalTrendPoint
                  ? formatShare(selectedNationalTrendPoint.share)
                  : "brak danych"}
              </span>
              <span>
                {selectedRegion?.region_name ?? "Wybrane województwo"}:{" "}
                {selectedRegionalTrendPoint
                  ? formatShare(selectedRegionalTrendPoint.share)
                  : "brak danych"}
              </span>
            </div>
            <InteractiveTrendChart
              comparisonLabel={selectedRegion?.region_name ?? "Wybrane województwo"}
              comparisonPoints={regionalTrendPoints}
              label="Udział w roczniku"
              metric="share"
              points={nationalTrendPoints}
              primaryLabel="Polska"
              selectedYear={selectedTrendYear}
              setSelectedYear={setSelectedTrendYear}
              yearEnd={2025}
              yearStart={2023}
            />
          </>
        ) : (
          <p className="regional-empty">
            Brak regionalnego trendu dla tego imienia w wybranym województwie.
          </p>
        )}
      </div>

      <p className="regional-method-note muted">
        Dane regionalne oznaczają województwo rejestracji urodzenia, nie miejsce
        zamieszkania dziecka ani przyszłą klasę szkolną. W tej publicznej wersji
        lokalnej widoczny jest tylko mały zestaw przykładowych regionów.
      </p>
    </section>
  );
}

function MetricPanel({
  title,
  year,
  rank,
  share,
  count,
}: {
  title: string;
  year: number;
  rank: number;
  share: number;
  count: number;
}) {
  return (
    <div className="comparison-card">
      <h3>{title}</h3>
      <p className="muted">Najnowszy dostępny rok: {year}</p>
      <dl className="comparison-metrics">
        <div>
          <dt>Ranking</dt>
          <dd>{formatRank(rank)}</dd>
        </div>
        <div>
          <dt>Udział w roczniku</dt>
          <dd>{formatShare(share)}</dd>
        </div>
        <div>
          <dt>Liczba nadań</dt>
          <dd>{formatCount(count)}</dd>
        </div>
      </dl>
    </div>
  );
}
