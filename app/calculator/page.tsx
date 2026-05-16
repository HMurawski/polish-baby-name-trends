"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Gender = "female" | "male";

type NameIndexRecord = {
  name: string;
  name_normalized: string;
  gender: Gender;
};

type SeriesPoint = {
  year: number;
  count: number;
  share: number;
  rank: number;
  yoy_change: number | null;
  rank_change: number | null;
};

type ForecastPoint = {
  year: number;
  forecast_share: number;
  forecast_method: string;
  source_year: number;
  is_forecast: boolean;
};

type CalculatorPoint =
  | {
      kind: "historical";
      share: number;
      count: number;
      rank: number;
    }
  | {
      kind: "forecast";
      share: number;
      forecast_method: string;
      source_year: number;
    };


const years = [2023, 2024, 2025, 2026];
const minClassmateCount = 0;
const maxClassmateCount = 40;

const classSizePresets = [
  {
    label: "Mała klasa",
    value: 8,
    description: "8 dzieci tej samej płci poza Twoim dzieckiem",
  },
  {
    label: "Typowa klasa",
    value: 12,
    description: "12 dzieci tej samej płci poza Twoim dzieckiem",
  },
  {
    label: "Duża klasa",
    value: 16,
    description: "16 dzieci tej samej płci poza Twoim dzieckiem",
  },
];

function normalizeInput(value: string) {
  return value.trim().toLowerCase();
}

function formatPercent(value: number) {
  const percentagePoints = Math.abs(value * 100);
  const fractionDigits = percentagePoints < 0.01 ? 4 : percentagePoints < 0.1 ? 3 : 2;

  return new Intl.NumberFormat("pl-PL", {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("pl-PL").format(value);
}

function interpretation(probability: number) {
  if (probability < 0.05) {
    return "bardzo mała szansa";
  }
  if (probability < 0.15) {
    return "mała szansa";
  }
  if (probability < 0.3) {
    return "umiarkowana szansa";
  }
  if (probability < 0.5) {
    return "wysoka szansa";
  }
  return "bardzo wysoka szansa";
}

function interpretationCopy(probability: number, name: string, classmateCount: number) {
  const classmateText = classmateCount === 1 ? "jednego dziecka" : `${classmateCount} dzieci`;

  if (probability < 0.05) {
    return `Przy ${classmateText} tej samej płci poza Twoim dzieckiem szansa na kolejne dziecko o imieniu ${name} jest bardzo niewielka.`;
  }
  if (probability < 0.15) {
    return `Szansa jest mała, ale imię ${name} pojawia się w roczniku na tyle często, że nie jest zupełnie wyjątkowe.`;
  }
  if (probability < 0.3) {
    return `To już zauważalna szansa. W większej grupie kolejne dziecko o imieniu ${name} jest całkiem realne.`;
  }
  if (probability < 0.5) {
    return `Imię ${name} jest na tyle popularne, że powtórzenie imienia w klasie jest dość prawdopodobne.`;
  }
  return `Imię ${name} jest bardzo popularne w tym roczniku. W takiej grupie powtórzenie imienia jest bardzo możliwe.`;
}

function clampClassmateCount(value: number) {
  if (!Number.isFinite(value)) {
    return minClassmateCount;
  }
  return Math.min(maxClassmateCount, Math.max(minClassmateCount, Math.trunc(value)));
}

function parseClassmateCountInput(value: string) {
  if (value.trim() === "") {
    return minClassmateCount;
  }
  return clampClassmateCount(Number(value));
}

function formatForecastMethod(method: string) {
  if (method === "damped_3y_share_trend") {
    return "Ostrożny trend z ostatnich 3 lat";
  }
  if (method === "last_year_share") {
    return "Udział z poprzedniego rocznika";
  }
  return method;
}

function forecastCaveat(method: string) {
  if (method === "damped_3y_share_trend") {
    return "To ostrożna prognoza oparta na zmianach udziału imienia w ostatnich latach. Nie jest oficjalną statystyką ani predykcją ML.";
  }

  return "Dla tego imienia używamy ostatniego znanego udziału, bo nie ma wystarczających danych do trendu. To nie jest oficjalna statystyka ani predykcja ML.";
}

export default function CalculatorPage() {
  const [namesIndex, setNamesIndex] = useState<NameIndexRecord[]>([]);
  const [series, setSeries] = useState<Record<string, SeriesPoint[]>>({});
  const [forecasts, setForecasts] = useState<Record<string, ForecastPoint[]>>({});
  const [gender, setGender] = useState<Gender>("female");
  const [nameInput, setNameInput] = useState("HELENA");
  const [year, setYear] = useState(2025);
  const [classmateCount, setClassmateCount] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const clampedClassmateCount = clampClassmateCount(classmateCount);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramGender = params.get("gender");
    const paramName = params.get("name");

    if (paramGender === "female" || paramGender === "male") {
      setGender(paramGender);
    }
    if (paramName) {
      setNameInput(decodeURIComponent(paramName));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [namesResponse, seriesResponse, forecastsResponse] = await Promise.all([
          fetch("/data/names_index.json"),
          fetch("/data/name_series.json"),
          fetch("/data/name_forecasts.json"),
        ]);

        if (!namesResponse.ok || !seriesResponse.ok || !forecastsResponse.ok) {
          throw new Error("Nie udało się wczytać danych aplikacji. Spróbuj odświeżyć stronę.");
        }

        const [namesData, seriesData, forecastsData] = await Promise.all([
          namesResponse.json() as Promise<NameIndexRecord[]>,
          seriesResponse.json() as Promise<Record<string, SeriesPoint[]>>,
          forecastsResponse.json() as Promise<Record<string, ForecastPoint[]>>,
        ]);

        if (!cancelled) {
          setNamesIndex(namesData);
          setSeries(seriesData);
          setForecasts(forecastsData);
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

  const selectedName = useMemo(() => {
    const normalized = normalizeInput(nameInput);
    return namesIndex.find(
      (item) => item.gender === gender && item.name_normalized === normalized,
    );
  }, [gender, nameInput, namesIndex]);

  const suggestions = useMemo(() => {
    const normalized = normalizeInput(nameInput);
    if (normalized.length < 2) {
      return [];
    }

    return namesIndex
      .filter((item) => {
        return (
          item.gender === gender &&
          (item.name_normalized.includes(normalized) || item.name.toLowerCase().includes(normalized))
        );
      })
      .slice(0, 8);
  }, [gender, nameInput, namesIndex]);

  const selectedPoint = useMemo<CalculatorPoint | null>(() => {
    if (!selectedName) {
      return null;
    }

    const key = `${gender}|${selectedName.name_normalized}`;
    if (year === 2026) {
      const forecastPoint = forecasts[key]?.find((point) => point.year === year);
      if (!forecastPoint) {
        return null;
      }
      return {
        kind: "forecast",
        share: forecastPoint.forecast_share,
        forecast_method: forecastPoint.forecast_method,
        source_year: forecastPoint.source_year,
      };
    }

    const historicalPoint = series[key]?.find((point) => point.year === year);
    if (!historicalPoint) {
      return null;
    }
    return {
      kind: "historical",
      share: historicalPoint.share,
      count: historicalPoint.count,
      rank: historicalPoint.rank,
    };
  }, [forecasts, gender, selectedName, series, year]);

  const probability = selectedPoint
    ? 1 - Math.pow(1 - selectedPoint.share, clampedClassmateCount)
    : null;

  return (
    <main className="page-shell">
      <Link className="back-link" href="/">
        ← Wróć do strony głównej
      </Link>

      <section className="profile-hero">
        <div>
          <p className="eyebrow">Kalkulator klasy</p>
          <h1>Szansa na powtórzenie imienia w klasie</h1>
          <p className="intro-copy">
            Wybierz imię, płeć dziecka, rok danych i liczbę dzieci tej samej płci w klasie,
            nie licząc Twojego dziecka. Wynik pokazuje, jak często takie imię mogłoby
            powtórzyć się w podobnej grupie.
          </p>
        </div>
        <div className="profile-highlight">
          <span>Jak to liczymy</span>
          <strong>P = 1 - (1 - p)^n</strong>
          <p className="formula-note">
            p to udział imienia w roczniku, a n to liczba dzieci tej samej płci w klasie
            poza Twoim dzieckiem.
          </p>
        </div>
      </section>

      <section className="calculator-layout">
        <div className="calculator-form">
          <label className="form-field">
            <span>Płeć dziecka</span>
            <select value={gender} onChange={(event) => setGender(event.target.value as Gender)}>
              <option value="female">Dziewczynki</option>
              <option value="male">Chłopcy</option>
            </select>
          </label>

          <label className="form-field">
            <span>Imię dziecka</span>
            <input
              list="calculator-name-options"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="np. HELENA"
              type="search"
            />
            <datalist id="calculator-name-options">
              {suggestions.map((item) => (
                <option key={`${item.gender}|${item.name_normalized}`} value={item.name} />
              ))}
            </datalist>
          </label>

          <label className="form-field">
            <span>Rok danych</span>
            <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {years.map((item) => (
                <option key={item} value={item}>
                  {item === 2026 ? "2026 (prognoza)" : item}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Dzieci tej samej płci w klasie poza Twoim dzieckiem</span>
            <input
              min={minClassmateCount}
              max={maxClassmateCount}
              onChange={(event) => setClassmateCount(parseClassmateCountInput(event.target.value))}
              type="number"
              value={clampedClassmateCount}
            />
          </label>

          <div className="class-size-presets" aria-label="Szybki wybór wielkości klasy">
            {classSizePresets.map((preset) => (
              <button
                aria-pressed={clampedClassmateCount === preset.value}
                className={clampedClassmateCount === preset.value ? "preset-button active" : "preset-button"}
                key={preset.value}
                onClick={() => setClassmateCount(clampClassmateCount(preset.value))}
                type="button"
              >
                <strong>{preset.label}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={selectedPoint?.kind === "forecast" ? "calculator-result forecast-result" : "calculator-result"}>
          {error ? <p className="error-message">{error}</p> : null}
          {!selectedName ? (
            <p className="muted">Wpisz imię z podpowiedzi, aby policzyć wynik.</p>
          ) : !selectedPoint || probability === null ? (
            <p className="muted">Nie mamy danych dla tego imienia, płci i roku.</p>
          ) : (
            <>
              <p className="eyebrow">Wynik</p>
              <strong className="probability-value">{formatPercent(probability)}</strong>
              <p className="result-interpretation">{interpretation(probability)}</p>
              <p className="result-copy">
                {interpretationCopy(probability, selectedName.name, clampedClassmateCount)}
              </p>
              <dl className="result-details">
                <div>
                  <dt>Imię</dt>
                  <dd>{selectedName.name}</dd>
                </div>
                <div>
                  <dt>Udział w roczniku</dt>
                  <dd>{formatPercent(selectedPoint.share)}</dd>
                </div>
                <div>
                  <dt>Typ danych</dt>
                  <dd>{selectedPoint.kind === "forecast" ? "Prognoza" : "Dane historyczne"}</dd>
                </div>
                {selectedPoint.kind === "forecast" ? (
                  <>
                    <div>
                      <dt>Rok bazowy prognozy</dt>
                      <dd>{selectedPoint.source_year}</dd>
                    </div>
                    <div>
                      <dt>Metoda prognozy</dt>
                      <dd>{formatForecastMethod(selectedPoint.forecast_method)}</dd>
                    </div>
                  </>
                ) : null}
                <div>
                  <dt>Liczba nadań</dt>
                  <dd>
                    {selectedPoint.kind === "historical"
                      ? formatCount(selectedPoint.count)
                      : "Nie dotyczy prognozy"}
                  </dd>
                </div>
                <div>
                  <dt>Ranking</dt>
                  <dd>
                    {selectedPoint.kind === "historical"
                      ? `${selectedPoint.rank}.`
                      : "Nie dotyczy prognozy"}
                  </dd>
                </div>
                <div>
                  <dt>Inne dzieci tej samej płci</dt>
                  <dd>{clampedClassmateCount} poza Twoim dzieckiem</dd>
                </div>
              </dl>
              {selectedPoint.kind === "forecast" ? (
                <p className="formula-note">
                  {forecastCaveat(selectedPoint.forecast_method)}
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="method-note">
        <p className="eyebrow">Metodologia</p>
        <p>
          To szacunek ogólnopolski, a nie przewidywanie konkretnej klasy. Jeśli w wybranym
          roczniku udział imienia wynosi p, kalkulator sprawdza, jaka jest szansa, że wśród
          n dzieci tej samej płci poza Twoim dzieckiem przynajmniej jedno będzie miało to
          samo imię. Popularność imion może różnić się lokalnie, a skład klasy zależy od
          szkoły, rejonu i wielu czynników społecznych.
        </p>
      </section>
    </main>
  );
}
