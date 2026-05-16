import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Imię w Klasie - popularność imion dzieci w Polsce",
    template: "%s | Imię w Klasie",
  },
  description:
    "Sprawdź popularność imienia dziecka w Polsce, ranking, trend oraz szacunkową szansę, że w klasie pojawi się drugie dziecko o tym samym imieniu. Publiczna wersja showcase używa przykładowych danych.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Imię w Klasie - sprawdź popularność imienia dziecka",
    description:
      "Narzędzie dla rodziców do sprawdzania popularności imion, trendów i szacunkowej szansy powtórzenia imienia w klasie. Publiczna wersja showcase używa przykładowych danych.",
    url: "/",
    siteName: "Imię w Klasie",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Imię w Klasie - popularność imion dzieci",
    description:
      "Sprawdź ranking, trend i szacunkową szansę powtórzenia imienia w klasie. Publiczna wersja showcase używa przykładowych danych.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>
        <header className="site-header">
          <nav className="site-nav" aria-label="Główna nawigacja">
            <Link className="site-brand" href="/">
              Imię w Klasie
            </Link>
            <div className="nav-links">
              <Link href="/">Strona główna</Link>
              <Link href="/calculator">Kalkulator</Link>
              <Link href="/compare">Porównywarka</Link>
              <Link href="/methodology">Metodologia</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
