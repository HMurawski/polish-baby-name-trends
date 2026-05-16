import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import NameSearch from "./name-search";

type Gender = "female" | "male";

type RankingRecord = {
  rank: number;
  name: string;
  name_normalized: string;
  gender: Gender;
  count: number;
  share: number;
};

type LatestRankings = {
  female: RankingRecord[];
  male: RankingRecord[];
};

type NameIndexRecord = {
  name: string;
  name_normalized: string;
  gender: Gender;
};

const genderLabels: Record<Gender, string> = {
  female: "Dziewczynki",
  male: "Chłopcy",
};

function dataPath(fileName: string) {
  return path.join(process.cwd(), "public", "data", fileName);
}

async function readJson<T>(fileName: string): Promise<T> {
  const content = await readFile(dataPath(fileName), "utf-8");
  return JSON.parse(content) as T;
}

function formatCount(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatShare(value: number) {
  return `${(value * 100).toFixed(2).replace(".", ",")}%`;
}

function profileHref(gender: Gender, nameNormalized: string) {
  return `/name/${gender}/${encodeURIComponent(nameNormalized)}`;
}

export default async function Home() {
  const [rankings, namesIndex] = await Promise.all([
    readJson<LatestRankings>("latest_rankings_2025.json"),
    readJson<NameIndexRecord[]>("names_index.json"),
  ]);

  return (
    <main className="page-shell">
      <section className="intro-section">
        <div>
          <p className="eyebrow">Imię w Klasie</p>
          <h1>Czy w klasie będzie drugie dziecko o tym samym imieniu?</h1>
          <p className="intro-copy">
            Sprawdź, jak często wybierane jest imię dziecka, czy zyskuje na popularności
            i co to może oznaczać w przyszłej klasie. Zamiast samego rankingu dostajesz
            kontekst: trend, porównanie i prosty kalkulator.
          </p>
          <div className="hero-actions" aria-label="Główne akcje">
            <Link className="primary-action" href="/calculator">
              Policz szansę w klasie
            </Link>
            <Link className="secondary-action" href="/compare">
              Porównaj dwa imiona
            </Link>
          </div>
          <p className="trust-line">
            Produkcja opiera się na oficjalnych danych publicznych dane.gov.pl. Ta publiczna
            wersja repozytorium używa małych przykładowych danych 2023-2025.
          </p>
        </div>
        <div className="stats-strip" aria-label="Zakres danych">
          <div>
            <span>Dane</span>
            <strong>2023-2025</strong>
          </div>
          <div>
            <span>Zakres</span>
            <strong>Polska</strong>
          </div>
          <div>
            <span>Imiona</span>
            <strong>Pierwsze</strong>
          </div>
        </div>
      </section>

      <section className="check-section" aria-labelledby="check-title">
        <div className="section-heading">
          <p className="eyebrow">Co możesz sprawdzić</p>
          <h2 id="check-title">Szybki kontekst przed wyborem imienia</h2>
        </div>
        <div className="check-grid">
          <article className="check-item">
            <h3>Czy imię jest dziś częste?</h3>
            <p>
              Zobacz liczbę nadań, ranking i udział w roczniku. Dzięki temu wiesz,
              czy imię jest naprawdę popularne, czy tylko często pojawia się w rozmowach.
            </p>
          </article>
          <article className="check-item">
            <h3>Czy popularność rośnie?</h3>
            <p>
              Profil imienia pokazuje, czy liczba nadań rośnie, spada albo wraca po latach.
              To pomaga odróżnić chwilową modę od stabilnego wyboru.
            </p>
          </article>
          <article className="check-item">
            <h3>Co to znaczy dla klasy?</h3>
            <p>
              Kalkulator przekłada udział imienia w roczniku na prosty szacunek:
              jak duża jest szansa, że w grupie będzie jeszcze dziecko o tym samym imieniu.
            </p>
          </article>
        </div>
      </section>

      <NameSearch namesIndex={namesIndex} />

      <section className="method-note home-note" aria-label="O kalkulatorze">
        <p>
          To narzędzie korzysta z danych ogólnopolskich, więc pomaga zobaczyć skalę
          popularności, ale nie przewiduje składu konkretnej klasy. Szkoła, miejscowość
          i grupa rówieśnicza mogą różnić się od średniej dla całej Polski.
        </p>
      </section>

      <section className="rankings-grid" aria-label="Najpopularniejsze imiona w 2025">
        {(["female", "male"] as Gender[]).map((gender) => (
          <RankingTable
            gender={gender}
            key={gender}
            rows={rankings[gender].slice(0, 10)}
          />
        ))}
      </section>
    </main>
  );
}

function RankingTable({
  gender,
  rows,
}: {
  gender: Gender;
  rows: RankingRecord[];
}) {
  return (
    <section className="ranking-panel">
      <div className="section-heading">
        <p className="eyebrow">Ranking 2025</p>
        <h2>Najczęściej nadawane imiona: {genderLabels[gender]}</h2>
        <p className="muted">
          Ranking pokazuje najnowszy rocznik w danych. Kliknij imię, żeby zobaczyć jego historię
          i sprawdzić, czy nadal rośnie.
        </p>
      </div>
      <ol className="ranking-list">
        {rows.map((row) => (
          <li key={`${row.gender}|${row.name_normalized}`}>
            <span className="rank-number">{row.rank}</span>
            <Link className="rank-name" href={profileHref(row.gender, row.name_normalized)}>
              {row.name}
            </Link>
            <span className="rank-meta">
              {formatCount(row.count)} nadań · {formatShare(row.share)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
