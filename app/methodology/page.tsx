import Link from "next/link";

export default function MethodologyPage() {
  return (
    <main className="page-shell">
      <section className="profile-hero">
        <div>
          <p className="eyebrow">Metodologia</p>
          <h1>Jak czytać dane o imionach</h1>
          <p className="intro-copy">
            Krótki, praktyczny opis tego, skąd biorą się liczby w aplikacji i jak rozsądnie
            traktować wyniki.
          </p>
        </div>
        <div className="profile-highlight">
          <span>Zakres MVP</span>
          <strong>Sample 2023-2025</strong>
          <p className="formula-note">Prognoza 2026 jest dostępna tylko w kalkulatorze.</p>
        </div>
      </section>

      <section className="methodology-grid">
        <article className="methodology-card">
          <h2>Źródło danych</h2>
          <p>
            Dane pochodzą z publicznych zasobów dane.gov.pl dotyczących imion nadawanych
            dzieciom w Polsce. W aplikacji pokazujemy przetworzone dane w prostszej formie:
            ranking, udział w roczniku, zmianę rok do roku i trend.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Zakres danych</h2>
          <p>
            Publiczna wersja showcase obejmuje tylko przykładowe dane dla sześciu imion
            z lat 2023-2025. Produkcja używa oficjalnych publicznych danych o pierwszych
            imionach nadawanych dzieciom w Polsce.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Udział imienia</h2>
          <p>
            Udział mówi, jaka część dzieci danej płci w wybranym roku otrzymała konkretne imię.
            Przykładowo udział 2% oznacza około dwoje dzieci na sto w tej samej grupie płci
            i rocznika.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Ranking</h2>
          <p>
            Ranking liczony jest osobno dla roku i płci. Im niższy numer, tym częściej dane imię
            było nadawane w tym roczniku. Przy remisie zachowujemy stabilny porządek alfabetyczny.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Dane regionalne</h2>
          <p>
            Porównanie regionalne oznacza województwo rejestracji urodzenia. Nie mówi ono o miejscu
            zamieszkania dziecka, miejscu zamieszkania rodziców ani przyszłej szkole lub klasie.
            W tej wersji lokalnej trend regionalny jest pokazany tylko dla przykładowych lat 2023-2025.
          </p>
          <p>
            W trendzie regionalnym porównujemy udział imienia w roczniku, a nie samą liczbę nadań.
            Dane regionalne warto traktować jako kontekst, nie jako przewidywanie realnej klasy.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Kalkulator klasy</h2>
          <p>
            Kalkulator używa wzoru P = 1 - (1 - p)^n, gdzie p to udział imienia w roczniku,
            a n to liczba dzieci tej samej płci w klasie poza Twoim dzieckiem. Wynik jest
            szacunkiem prawdopodobieństwa, że w tej grupie pojawi się jeszcze dziecko o tym samym imieniu.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Prognoza 2026</h2>
          <p>
            Prognoza 2026 jest ostrożnym szacunkiem. Patrzymy, jak zmieniał się udział imienia
            w ostatnich latach, a następnie wykorzystujemy tylko część tego trendu, żeby nie
            zakładać, że moda będzie rosła lub spadała w takim samym tempie. To nie są oficjalne
            dane i nie jest to model ML.
          </p>
        </article>

        <article className="methodology-card">
          <h2>Ograniczenia</h2>
          <p>
            Wyniki opierają się na danych ogólnopolskich i regionalnych danych o województwie
            rejestracji urodzenia. Konkretna klasa nie jest losową próbą całej Polski ani wybranego
            województwa, a popularność imion może różnić się lokalnie między szkołami, miejscowościami
            i regionami.
          </p>
        </article>
      </section>

      <section className="method-note">
        <p className="eyebrow">Następny krok</p>
        <p>
          Wróć do <Link className="inline-link" href="/">rankingu imion</Link>, sprawdź{" "}
          <Link className="inline-link" href="/calculator">kalkulator klasy</Link> albo
          przeczytaj krótką stronę{" "}
          <Link className="inline-link" href="/about">o projekcie i danych</Link>.
        </p>
      </section>
    </main>
  );
}
