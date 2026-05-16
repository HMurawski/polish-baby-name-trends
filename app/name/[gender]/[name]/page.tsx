import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ProfileTrendCharts from "./ProfileTrendCharts";
import RegionalComparison from "./RegionalComparison";

type Gender = "female" | "male";

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

type Region = {
  region_level: "registration_voivodeship";
  region_code: string;
  region_name: string;
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
  previous_year_count: number | null;
  yoy_change: number | null;
  yoy_change_pct: number | null;
  previous_year_rank: number | null;
  rank_change: number | null;
};

type RegionalSeriesPoint = {
  year: number;
  count: number;
  share: number;
  rank: number;
};

type RouteParams = {
  gender: string;
  name: string;
};

const genderLabels: Record<Gender, string> = {
  female: "Dziewczynki",
  male: "Chłopcy",
};

const genderMetadataLabels: Record<Gender, string> = {
  female: "dla dziewczynek",
  male: "dla chłopców",
};

const genderContextLabels: Record<Gender, string> = {
  female: "wśród dziewczynek",
  male: "wśród chłopców",
};

function isGender(value: string): value is Gender {
  return value === "female" || value === "male";
}

function dataPath(fileName: string) {
  return path.join(process.cwd(), "public", "data", fileName);
}

async function readJson<T>(fileName: string): Promise<T> {
  const content = await readFile(dataPath(fileName), "utf-8");
  return JSON.parse(content) as T;
}

async function readOptionalJson<T>(fileName: string, fallback: T): Promise<T> {
  try {
    return await readJson<T>(fileName);
  } catch {
    return fallback;
  }
}

function formatCount(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatShare(value: number | null) {
  if (value === null) {
    return "brak danych";
  }

  return `${(value * 100).toFixed(2).replace(".", ",")}%`;
}

function formatSignedNumber(value: number | null) {
  if (value === null) {
    return "brak danych";
  }

  if (value === 0) {
    return "0";
  }

  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatCount(Math.abs(value))}`;
}

function formatRank(value: number | null) {
  if (value === null) {
    return "brak danych";
  }

  return `${formatCount(value)}.`;
}

function formatDisplayName(name: string) {
  return name
    .toLocaleLowerCase("pl-PL")
    .replace(/(^|[\s-])(\p{L})/gu, (match) => match.toLocaleUpperCase("pl-PL"));
}

function formatPlaceChange(value: number) {
  const absoluteValue = Math.abs(value);
  return absoluteValue === 1 ? "1 miejsce" : `${formatCount(absoluteValue)} miejsc`;
}

function describeCountChange(value: number | null) {
  if (value === null) {
    return "Brak porównania rok do roku dla liczby nadań.";
  }
  if (value > 0) {
    return `W porównaniu z poprzednim rokiem liczba nadań wzrosła o ${formatCount(value)}.`;
  }
  if (value < 0) {
    return `W porównaniu z poprzednim rokiem liczba nadań spadła o ${formatCount(Math.abs(value))}.`;
  }
  return "Liczba nadań była taka sama jak rok wcześniej.";
}

function describeRankChange(value: number | null) {
  if (value === null) {
    return "Brak porównania rok do roku dla pozycji w rankingu.";
  }
  if (value > 0) {
    return `Pozycja w rankingu poprawiła się o ${formatPlaceChange(value)}.`;
  }
  if (value < 0) {
    return `Pozycja w rankingu spadła o ${formatPlaceChange(value)}.`;
  }
  return "Pozycja w rankingu nie zmieniła się względem poprzedniego roku.";
}

function profileNarrative(summary: NameSummary) {
  const displayName = formatDisplayName(summary.name);
  return [
    `W ${summary.latest_year} roku imię ${displayName} było na ${formatRank(summary.latest_rank)} miejscu ${genderContextLabels[summary.gender]}.`,
    `Nadano je ${formatCount(summary.latest_count)} razy, czyli miało udział ${formatShare(summary.latest_share)} w roczniku.`,
    describeCountChange(summary.yoy_change),
    describeRankChange(summary.rank_change),
  ].join(" ");
}

function findSummary(
  summaries: NameSummary[],
  gender: Gender,
  nameNormalized: string,
) {
  return summaries.find(
    (item) => item.gender === gender && item.name_normalized === nameNormalized,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const routeParams = await params;
  const gender = decodeURIComponent(routeParams.gender);
  const nameNormalized = decodeURIComponent(routeParams.name).toLowerCase();

  if (!isGender(gender)) {
    notFound();
  }

  const summaries = await readJson<NameSummary[]>("name_summaries.json");
  const summary = findSummary(summaries, gender, nameNormalized);

  if (!summary) {
    notFound();
  }

  const displayName = formatDisplayName(summary.name);
  const title = `${displayName} - popularność imienia, ranking i trend 2023-2025`;
  const description = `Sprawdź popularność imienia ${displayName} w Polsce ${genderMetadataLabels[summary.gender]}: ranking ${summary.latest_year} ${formatRank(summary.latest_rank)}, ${formatCount(summary.latest_count)} nadań, udział ${formatShare(summary.latest_share)} i trend 2023-2025.`;
  const url = `/name/${summary.gender}/${encodeURIComponent(summary.name_normalized)}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function NameProfilePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const routeParams = await params;
  const gender = decodeURIComponent(routeParams.gender);
  const nameNormalized = decodeURIComponent(routeParams.name).toLowerCase();

  if (!isGender(gender)) {
    notFound();
  }

  const [summaries, series, regions, regionalSummaries, regionalSeries] = await Promise.all([
    readJson<NameSummary[]>("name_summaries.json"),
    readJson<Record<string, SeriesPoint[]>>("name_series.json"),
    readOptionalJson<Region[]>("regions_index.json", []),
    readOptionalJson<RegionalNameSummary[]>("name_region_summaries.json", []),
    readOptionalJson<Record<string, RegionalSeriesPoint[]>>("name_region_series.json", {}),
  ]);

  const profileKey = `${gender}|${nameNormalized}`;
  const summary = findSummary(summaries, gender, nameNormalized);
  const seriesPoints = series[profileKey] ?? [];
  const regionalSummariesForProfile = regionalSummaries.filter(
    (item) =>
      item.gender === gender &&
      item.name_normalized === nameNormalized &&
      item.name_position === "first" &&
      item.region_level === "registration_voivodeship",
  );
  const regionalSeriesPrefix = `${gender}|${nameNormalized}|registration_voivodeship|`;
  const regionalSeriesByRegion = Object.fromEntries(
    Object.entries(regionalSeries)
      .filter(([key]) => key.startsWith(regionalSeriesPrefix))
      .map(([key, points]) => [key.slice(regionalSeriesPrefix.length), points]),
  );

  if (!summary || seriesPoints.length === 0) {
    notFound();
  }

  const pointByYear = new Map(seriesPoints.map((point) => [point.year, point]));
  const historyYears = [2023, 2024, 2025];
  const chartPoints = historyYears
    .map((year) => pointByYear.get(year))
    .filter((point): point is SeriesPoint => Boolean(point));

  return (
    <main className="page-shell">
      <Link className="back-link" href="/">
        ← Wróć do strony głównej
      </Link>
      <Link
        className="back-link secondary-link"
        href={`/calculator?gender=${summary.gender}&name=${encodeURIComponent(summary.name_normalized)}`}
      >
        Policz szansę w klasie dla tego imienia
      </Link>
      <Link
        className="back-link secondary-link"
        href={`/compare?gender=${summary.gender}&first=${encodeURIComponent(summary.name_normalized)}`}
      >
        Porównaj z drugim imieniem
      </Link>

      <section className="profile-hero">
        <div>
          <p className="eyebrow">Profil imienia</p>
          <h1>{summary.name}</h1>
          <p className="intro-copy">
            {genderLabels[summary.gender]} · pierwsze imię · przykładowe dane 2023-2025
          </p>
        </div>
        <div className="profile-highlight">
          <span>Najnowszy rok</span>
          <strong>{summary.latest_year}</strong>
        </div>
      </section>

      <section className="metric-grid" aria-label="Najważniejsze metryki imienia">
        <MetricCard label="Liczba nadań" value={formatCount(summary.latest_count)} />
        <MetricCard label="Ranking" value={formatRank(summary.latest_rank)} />
        <MetricCard label="Udział w roczniku" value={formatShare(summary.latest_share)} />
        <MetricCard label="Zmiana YoY" value={formatSignedNumber(summary.yoy_change)} />
        <MetricCard label="Zmiana rankingu" value={formatSignedNumber(summary.rank_change)} />
        <MetricCard
          label="Poprzedni ranking"
          value={formatRank(summary.previous_year_rank)}
        />
      </section>

      <section className="profile-summary" aria-label="Krótka interpretacja profilu imienia">
        <p className="eyebrow">W skrócie</p>
        <p>{profileNarrative(summary)}</p>
      </section>

      <section className="history-section">
        <div className="section-heading">
          <p className="eyebrow">Trend 2023-2025</p>
          <h2>Jak zmieniała się popularność imienia</h2>
        </div>
        <ProfileTrendCharts points={chartPoints} />
      </section>

      <RegionalComparison
        regions={regions}
        nationalSummary={summary}
        nationalSeries={seriesPoints}
        regionalSummaries={regionalSummariesForProfile}
        regionalSeriesByRegion={regionalSeriesByRegion}
      />

      <section className="history-section">
        <div className="section-heading">
          <p className="eyebrow">Historia</p>
          <h2>Roczne dane o liczbie nadań</h2>
        </div>
        <div className="table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Rok</th>
                <th>Liczba nadań</th>
                <th>Ranking</th>
                <th>Udział</th>
              </tr>
            </thead>
            <tbody>
              {historyYears.map((year) => {
                const point = pointByYear.get(year);
                return (
                  <tr key={year}>
                    <td>{year}</td>
                    <td>{point ? formatCount(point.count) : "brak danych"}</td>
                    <td>{point ? formatRank(point.rank) : "brak danych"}</td>
                    <td>{point ? formatShare(point.share) : "brak danych"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
