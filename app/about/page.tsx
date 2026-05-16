import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="page-shell">
      <section className="profile-hero">
        <div>
          <p className="eyebrow">O projekcie</p>
          <h1>Przejrzystość danych i założeń</h1>
          <p className="intro-copy">
            Imię w Klasie pomaga rodzicom sprawdzić popularność imienia, zobaczyć trend,
            porównać kilka propozycji i oszacować, czy w przyszłej klasie może pojawić się
            jeszcze dziecko o tym samym imieniu.
          </p>
        </div>
        <div className="profile-highlight">
          <span>Status</span>
          <strong>MVP V1</strong>
          <p className="formula-note">
            To narzędzie informacyjne, nie oficjalny rejestr i nie predykcja konkretnej klasy.
          </p>
        </div>
      </section>

      <section className="methodology-grid">
        <article className="methodology-card">
          <h2>Co można tu sprawdzić</h2>
          <p>
            Aplikacja pokazuje popularność imion, ranking w roczniku, trend w czasie,
            porównanie dwóch imion oraz przybliżone prawdopodobieństwo powtórzenia imienia
            w grupie dzieci tej samej płci.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Źródła danych</h2>
          <p>
            Korzystamy z oficjalnych publicznych zasobów dane.gov.pl dotyczących imion
            nadawanych dzieciom w Polsce. Dane źródłowe są oparte na publicznych statystykach
            rejestru PESEL i przetwarzane lokalnie do plików używanych przez aplikację.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Zakres ogólnopolski</h2>
          <p>
            Produkcyjna aplikacja obejmuje pierwsze imiona nadawane dzieciom w Polsce.
            Publiczna wersja repozytorium używa małej próbki 2023-2025, aby pokazać
            kontrakty danych i interfejs bez publikowania pełnej warstwy danych.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Zakres regionalny</h2>
          <p>
            Dane regionalne oznaczają województwo rejestracji urodzenia.
            Nie oznaczają miejsca zamieszkania dziecka, miejsca zamieszkania rodziców ani
            przyszłej szkoły lub klasy.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Prognoza 2026</h2>
          <p>
            Prognoza 2026 jest ostrożnym szacunkiem używanym tylko jako kontekst dla
            aktualnego lub przyszłego rocznika w kalkulatorze. Nie jest oficjalną statystyką
            nadanych imion i nie jest predykcją ML.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Czego aplikacja nie przewiduje</h2>
          <p>
            Wyniki nie przewidują składu konkretnej klasy, szkoły ani lokalnej społeczności.
            Kalkulator opiera się na udziałach w danych ogólnopolskich lub szacunku dla
            rocznika, więc powinien być traktowany jako orientacyjna pomoc w decyzji.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Wersja showcase</h2>
          <p>
            Publiczne repozytorium showcase używa małych przykładowych plików JSON. Pełna
            warstwa danych i produkcyjne pipeline'y ETL pozostają poza tym repozytorium.
          </p>
        </article>
      </section>

      <section className="method-note">
        <p className="eyebrow">Dalej</p>
        <p>
          Zobacz szczegóły w{" "}
          <Link className="inline-link" href="/methodology">
            metodologii
          </Link>
          , przejdź do{" "}
          <Link className="inline-link" href="/calculator">
            kalkulatora klasy
          </Link>{" "}
          albo{" "}
          <Link className="inline-link" href="/compare">
            porównaj dwa imiona
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
