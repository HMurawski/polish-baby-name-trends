"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Gender = "female" | "male";

type NameIndexRecord = {
  name: string;
  name_normalized: string;
  gender: Gender;
};

const genderLabels: Record<Gender, string> = {
  female: "Dziewczynki",
  male: "Chłopcy",
};

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function profileHref(gender: Gender, nameNormalized: string) {
  return `/name/${gender}/${encodeURIComponent(nameNormalized)}`;
}

export default function NameSearch({ namesIndex }: { namesIndex: NameIndexRecord[] }) {
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    const normalizedQuery = normalizeQuery(query);
    if (normalizedQuery.length < 2) {
      return [];
    }

    return namesIndex
      .filter((item) => {
        return (
          item.name_normalized.includes(normalizedQuery) ||
          item.name.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 10);
  }, [namesIndex, query]);

  return (
    <section className="search-section" aria-labelledby="search-title">
      <div className="section-heading">
        <p className="eyebrow">Wyszukiwarka</p>
        <h2 id="search-title">Znajdź imię w danych</h2>
        <p className="muted">
          Wpisz imię, żeby zobaczyć jego profil: najnowszy ranking, udział w roczniku,
          trend oraz link do kalkulatora klasy.
        </p>
      </div>
      <label className="search-box">
        <span>Imię</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="np. Zofia, Antoni, Laura"
          type="search"
        />
      </label>
      <div className="suggestions" aria-live="polite">
        {query.trim().length >= 2 && suggestions.length === 0 ? (
          <p className="muted">Nie znaleźliśmy takiego imienia w obecnym zakresie danych.</p>
        ) : (
          suggestions.map((item) => (
            <Link
              className="suggestion-item"
              href={profileHref(item.gender, item.name_normalized)}
              key={`${item.gender}|${item.name_normalized}`}
            >
              <strong>{item.name}</strong>
              <span>{genderLabels[item.gender]}</span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
