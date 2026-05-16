"use client";

import { useEffect, useMemo, useState } from "react";

type Gender = "female" | "male";

type NameIndexRecord = {
  name: string;
  name_normalized: string;
  gender: Gender;
};

type NameSummary = {
  name: string;
  name_normalized: string;
  gender: Gender;
  latest_year: number;
  latest_count: number;
  latest_rank: number;
  latest_share: number;
  previous_year_count: number | null;
  yoy_change: number | null;
  yoy_change_pct: number | null;
  previous_year_rank: number | null;
  rank_change: number | null;
};

type SeriesPoint = {
  year: number;
  count: number;
  share: number;
  rank: number;
  yoy_change: number | null;
  rank_change: number | null;
};

type ComparedName = {
  input: string;
  summary: NameSummary | null;
  series: SeriesPoint[];
};

const defaultNames: Record<Gender, [string, string]> = {
  female: ["ZOFIA", "LAURA"],
  male: ["ANTONI", "NIKODEM"],
};

const genderLabels: Record<Gender, string> = {
  female: "Dziewczynki",
  male: "Chłopcy",
};

const yearStart = 2023;
const yearEnd = 2025;
const years = Array.from({ length: yearEnd - yearStart + 1 }, (_, index) => yearStart + index);
const keyAxisYears = years;

function normalizeInput(value: string) {
  return value.trim().toLowerCase();
}

function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "brak danych";
  }
  return new Intl.NumberFormat("pl-PL").format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "brak danych";
  }

  return new Intl.NumberFormat("pl-PL", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSigned(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "brak danych";
  }

  return new Intl.NumberFormat("pl-PL", {
    signDisplay: "exceptZero",
  }).format(value);
}

function formatDifference(value: number) {
  if (value === 0) {
    return "0";
  }

  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatCount(Math.abs(value))}`;
}

export default function ComparePage() {
  const [gender, setGender] = useState<Gender>("female");
  const [firstName, setFirstName] = useState(defaultNames.female[0]);
  const [secondName, setSecondName] = useState(defaultNames.female[1]);
  const [namesIndex, setNamesIndex] = useState<NameIndexRecord[]>([]);
  const [summaries, setSummaries] = useState<NameSummary[]>([]);
  const [series, setSeries] = useState<Record<string, SeriesPoint[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramGender = params.get("gender");
    const first = params.get("first");
    const second = params.get("second");

    if (paramGender === "female" || paramGender === "male") {
      setGender(paramGender);
      setFirstName(first ? decodeURIComponent(first).toUpperCase() : defaultNames[paramGender][0]);
      setSecondName(second ? decodeURIComponent(second).toUpperCase() : defaultNames[paramGender][1]);
      return;
    }

    if (first) {
      setFirstName(decodeURIComponent(first).toUpperCase());
    }
    if (second) {
      setSecondName(decodeURIComponent(second).toUpperCase());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [namesResponse, summariesResponse, seriesResponse] = await Promise.all([
          fetch("/data/names_index.json"),
          fetch("/data/name_summaries.json"),
          fetch("/data/name_series.json"),
        ]);

        if (!namesResponse.ok || !summariesResponse.ok || !seriesResponse.ok) {
          throw new Error("Nie udało się wczytać danych aplikacji. Spróbuj odświeżyć stronę.");
        }

        const [namesData, summariesData, seriesData] = await Promise.all([
          namesResponse.json() as Promise<NameIndexRecord[]>,
          summariesResponse.json() as Promise<NameSummary[]>,
          seriesResponse.json() as Promise<Record<string, SeriesPoint[]>>,
        ]);

        if (!cancelled) {
          setNamesIndex(namesData);
          setSummaries(summariesData);
          setSeries(seriesData);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Nieznany błąd danych.");
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const genderNames = useMemo(() => {
    return namesIndex.filter((item) => item.gender === gender);
  }, [gender, namesIndex]);

  const firstSuggestions = useMemo(() => {
    return getNameOptions(genderNames, firstName);
  }, [firstName, genderNames]);

  const secondSuggestions = useMemo(() => {
    return getNameOptions(genderNames, secondName);
  }, [genderNames, secondName]);

  const comparedNames = useMemo<[ComparedName, ComparedName]>(() => {
    return [
      buildComparedName(firstName, gender, summaries, series),
      buildComparedName(secondName, gender, summaries, series),
    ];
  }, [firstName, gender, secondName, series, summaries]);

  const popularitySentence = useMemo(() => {
    const [first, second] = comparedNames;
    if (!first.summary || !second.summary) {
      return "Wybierz dwa imiona z listy, aby zobaczyć, które jest dziś częstsze i jak zmieniało się w czasie.";
    }

    if (first.summary.latest_rank === second.summary.latest_rank) {
      return `${first.summary.name} i ${second.summary.name} mają taki sam najnowszy ranking. Warto porównać jeszcze trend i liczbę nadań.`;
    }

    const winner =
      first.summary.latest_rank < second.summary.latest_rank ? first.summary : second.summary;
    const other =
      winner === first.summary ? second.summary : first.summary;
    return `W najnowszym roczniku wyżej w rankingu jest ${winner.name}: ${winner.latest_rank}. miejsce, przy ${other.latest_rank}. miejscu dla imienia ${other.name}.`;
  }, [comparedNames]);

  function handleGenderChange(nextGender: Gender) {
    setGender(nextGender);
    setFirstName(defaultNames[nextGender][0]);
    setSecondName(defaultNames[nextGender][1]);
  }

  return (
    <main className="page-shell">
      <section className="profile-hero">
        <div>
          <p className="eyebrow">Porównywarka</p>
          <h1>Porównaj dwa imiona</h1>
          <p className="intro-copy">
            Zobacz obok siebie najnowszy ranking, liczbę nadań i trend dwóch imion.
            To pomaga sprawdzić, czy jedno imię jest tylko chwilowo modne, czy utrzymuje
            popularność przez dłuższy czas.
          </p>
        </div>
        <div className="profile-highlight">
          <span>Zakres</span>
          <strong>2023-2025</strong>
          <p className="formula-note">Dane ogólnopolskie, pierwsze imiona.</p>
        </div>
      </section>

      <section className="calculator-form compare-form" aria-label="Formularz porównywarki">
        <label className="form-field">
          <span>Płeć</span>
          <select value={gender} onChange={(event) => handleGenderChange(event.target.value as Gender)}>
            <option value="female">Dziewczynki</option>
            <option value="male">Chłopcy</option>
          </select>
        </label>
        <NameInput
          label="Pierwsze imię"
          nameOptions={firstSuggestions}
          onChange={setFirstName}
          value={firstName}
        />
        <NameInput
          label="Drugie imię"
          nameOptions={secondSuggestions}
          onChange={setSecondName}
          value={secondName}
        />
      </section>

      {error ? <p className="error-message">{error}</p> : null}

      <section className="history-section">
        <div className="section-heading">
          <p className="eyebrow">Wynik</p>
          <h2>Porównanie: {genderLabels[gender]}</h2>
        </div>
        <p className="comparison-sentence">{popularitySentence}</p>
        <div className="comparison-grid">
          {comparedNames.map((item, index) => (
            <ComparisonCard item={item} key={`${index}-${item.input}`} />
          ))}
        </div>
      </section>

      <section className="history-section">
        <div className="section-heading">
          <p className="eyebrow">Trend 2023-2025</p>
          <h2>Jak zmieniała się liczba nadań</h2>
        </div>
        <CompareChart first={comparedNames[0]} second={comparedNames[1]} />
      </section>
    </main>
  );
}

function getNameOptions(nameOptions: NameIndexRecord[], input: string) {
  const normalized = normalizeInput(input);
  if (normalized.length < 1) {
    return nameOptions.slice(0, 80);
  }

  return nameOptions
    .filter((item) => {
      return item.name_normalized.includes(normalized) || item.name.toLowerCase().includes(normalized);
    })
    .slice(0, 80);
}

function buildComparedName(
  input: string,
  gender: Gender,
  summaries: NameSummary[],
  series: Record<string, SeriesPoint[]>,
): ComparedName {
  const normalized = normalizeInput(input);
  const summary =
    summaries.find((item) => item.gender === gender && item.name_normalized === normalized) ?? null;
  const key = summary ? `${gender}|${summary.name_normalized}` : `${gender}|${normalized}`;
  return {
    input,
    summary,
    series: series[key] ?? [],
  };
}

function NameInput({
  label,
  nameOptions,
  onChange,
  value,
}: {
  label: string;
  nameOptions: NameIndexRecord[];
  onChange: (value: string) => void;
  value: string;
}) {
  const datalistId = `${label.toLowerCase().replaceAll(" ", "-")}-options`;
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        list={datalistId}
        onChange={(event) => onChange(event.target.value)}
        placeholder="np. ZOFIA"
        type="search"
        value={value}
      />
      <datalist id={datalistId}>
        {nameOptions.map((item) => (
          <option key={`${item.gender}|${item.name_normalized}`} value={item.name} />
        ))}
      </datalist>
    </label>
  );
}

function ComparisonCard({ item }: { item: ComparedName }) {
  if (!item.summary) {
    return (
      <div className="comparison-card">
        <h3>{item.input || "Brak imienia"}</h3>
        <p className="muted">Nie znaleźliśmy tego imienia dla wybranej płci. Wybierz imię z podpowiedzi.</p>
      </div>
    );
  }

  return (
    <div className="comparison-card">
      <h3>{item.summary.name}</h3>
      <dl className="comparison-metrics">
        <div>
          <dt>Najnowszy rok</dt>
          <dd>{item.summary.latest_year}</dd>
        </div>
        <div>
          <dt>Najnowsza liczba nadań</dt>
          <dd>{formatCount(item.summary.latest_count)}</dd>
        </div>
        <div>
          <dt>Ranking</dt>
          <dd>{item.summary.latest_rank}.</dd>
        </div>
        <div>
          <dt>Udział w roczniku</dt>
          <dd>{formatPercent(item.summary.latest_share)}</dd>
        </div>
        <div>
          <dt>Zmiana YoY</dt>
          <dd>{formatSigned(item.summary.yoy_change)}</dd>
        </div>
      </dl>
    </div>
  );
}

function CompareChart({ first, second }: { first: ComparedName; second: ComparedName }) {
  const [selectedYear, setSelectedYear] = useState(2025);
  const firstPoints = normalizeSeries(first.series);
  const secondPoints = normalizeSeries(second.series);
  const allValues = [...firstPoints, ...secondPoints]
    .filter((point): point is SeriesPoint => Boolean(point))
    .map((point) => point.count);

  if (allValues.length === 0) {
    return <p className="muted">Brak danych do pokazania trendu dla wybranych imion.</p>;
  }

  const width = 760;
  const height = 300;
  const padding = { top: 28, right: 38, bottom: 56, left: 78 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...allValues);
  const minValue = 0;
  const midValue = Math.round(maxValue / 2);
  const firstLatest = latestPoint(first.series);
  const secondLatest = latestPoint(second.series);
  const firstPeak = peakPoint(first.series);
  const secondPeak = peakPoint(second.series);
  const selectedFirst = pointForYear(first.series, selectedYear);
  const selectedSecond = pointForYear(second.series, selectedYear);
  const selectedX = xForYear(selectedYear);

  function xForYear(year: number) {
    return padding.left + ((year - yearStart) / (yearEnd - yearStart)) * chartWidth;
  }

  function yForCount(count: number) {
    if (maxValue === minValue) {
      return padding.top + chartHeight;
    }
    return padding.top + (1 - (count - minValue) / (maxValue - minValue)) * chartHeight;
  }

  const firstPath = buildPath(firstPoints, xForYear, yForCount);
  const secondPath = buildPath(secondPoints, xForYear, yForCount);
  const firstName = first.summary?.name ?? first.input;
  const secondName = second.summary?.name ?? second.input;
  const latestDifference =
    firstLatest && secondLatest ? firstLatest.count - secondLatest.count : null;

  return (
    <div className="compare-chart-wrap">
      <div className="chart-summary-grid" aria-label="Podsumowanie trendu">
        <div>
          <span>Najnowszy rocznik w danych</span>
          <strong>
            {firstLatest && secondLatest
              ? `${firstLatest.year}: ${firstName} ${formatCount(firstLatest.count)}, ${secondName} ${formatCount(secondLatest.count)}`
              : "brak danych"}
          </strong>
          <p>
            Różnica:{" "}
            {latestDifference === null
              ? "brak danych"
              : `${formatDifference(latestDifference)} nadań`}
          </p>
        </div>
        <div>
          <span>Najwyższa liczba nadań</span>
          <strong>
            {firstPeak
              ? `${firstName}: ${firstPeak.year}, ${formatCount(firstPeak.count)}`
              : `${firstName}: brak danych`}
          </strong>
          <p>
            {secondPeak
              ? `${secondName}: ${secondPeak.year}, ${formatCount(secondPeak.count)} nadań`
              : `${secondName}: brak danych`}
          </p>
        </div>
      </div>
      <div className="chart-legend">
        <span>
          <i aria-hidden="true" className="legend-line legend-line-primary" /> {firstName}
        </span>
        <span>
          <i aria-hidden="true" className="legend-line legend-line-secondary" /> {secondName}
        </span>
        <span className="muted">skala do {formatCount(maxValue)} nadań</span>
      </div>
      <div className="chart-selected-year" aria-live="polite">
        <strong>{selectedYear}</strong>
        <span>
          {firstName}: {formatPointDetails(selectedFirst)}
        </span>
        <span>
          {secondName}: {formatPointDetails(selectedSecond)}
        </span>
      </div>
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
        aria-label="Porównanie liczby nadań w latach 2023-2025"
        className="compare-chart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {[0, midValue, maxValue].map((value) => {
          const y = yForCount(value);
          return (
            <g key={`y-axis-${value}`}>
              <line
                stroke="#e5ebe7"
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
              />
              <text fill="#61706a" fontSize="12" textAnchor="end" x={padding.left - 10} y={y + 4}>
                {formatCount(value)}
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
        {keyAxisYears.map((year) => (
          <g key={`x-axis-${year}`}>
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
        {firstPath.map((path) => (
          <path
            d={path}
            fill="none"
            key={`first-${path}`}
            stroke="#236b5b"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ))}
        {secondPath.map((path) => (
          <path
            d={path}
            fill="none"
            key={`second-${path}`}
            stroke="#d99a3f"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ))}
        {selectedFirst ? (
          <circle
            cx={selectedX}
            cy={yForCount(selectedFirst.count)}
            fill="#ffffff"
            r="6"
            stroke="#236b5b"
            strokeWidth="3"
          />
        ) : null}
        {selectedSecond ? (
          <circle
            cx={selectedX}
            cy={yForCount(selectedSecond.count)}
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
              aria-label={`Pokaż dane dla roku ${year}`}
              fill="transparent"
              aria-hidden="true"
              focusable="false"
              height={chartHeight}
              key={`target-${year}`}
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
    </div>
  );
}

function pointForYear(points: SeriesPoint[], year: number) {
  return points.find((point) => point.year === year) ?? null;
}

function latestPoint(points: SeriesPoint[]) {
  return points.reduce<SeriesPoint | null>((latest, point) => {
    if (!latest || point.year > latest.year) {
      return point;
    }
    return latest;
  }, null);
}

function peakPoint(points: SeriesPoint[]) {
  return points.reduce<SeriesPoint | null>((peak, point) => {
    if (!peak || point.count > peak.count) {
      return point;
    }
    return peak;
  }, null);
}

function formatPointDetails(point: SeriesPoint | null) {
  if (!point) {
    return "brak danych";
  }

  return `${formatCount(point.count)} nadań, ${formatPercent(point.share)}, ranking ${point.rank}.`;
}

function normalizeSeries(points: SeriesPoint[]) {
  const byYear = new Map(points.map((point) => [point.year, point]));
  return years.map((year) => byYear.get(year) ?? null);
}

function buildPath(
  points: Array<SeriesPoint | null>,
  xForYear: (year: number) => number,
  yForCount: (count: number) => number,
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
    currentSegment += `${currentSegment ? " " : ""}${command} ${xForYear(point.year).toFixed(1)} ${yForCount(point.count).toFixed(1)}`;
  });

  if (currentSegment) {
    segments.push(currentSegment);
  }
  return segments;
}
