import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="empty-state">
        <p className="eyebrow">Nie znaleziono strony</p>
        <h1>Nie znaleziono imienia</h1>
        <p className="intro-copy">
          Nie mamy takiego profilu w obecnym zakresie danych. Wróć do wyszukiwarki
          i wybierz imię z podpowiedzi.
        </p>
        <Link className="text-link" href="/">
          Wróć do strony głównej
        </Link>
      </section>
    </main>
  );
}
