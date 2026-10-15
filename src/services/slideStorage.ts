import { Course, SlideDeck } from "../types/slide";

export const INITIAL_COURSES: Course[] = [
  {
    id: "algodat",
    code: "185.A48",
    name: "Algorithmen und Datenstrukturen",
    semester: "WS 2026/27",
    lecturer: "Univ.Prof. Dr. Günther Raidl",
    color: "#0284c7",
    icon: "Binary",
    slideCount: 0,
  },
  {
    id: "analysis1",
    code: "101.A01",
    name: "Analysis 1 für Informatik",
    semester: "WS 2026/27",
    lecturer: "Ao.Univ.Prof. Dr. Michael Kaltenbäck",
    color: "#8b5cf6",
    icon: "FunctionSquare",
    slideCount: 0,
  },
  {
    id: "eprog",
    code: "185.A91",
    name: "Einführung in das Programmieren 1",
    semester: "WS 2026/27",
    lecturer: "Univ.Prof. Dr. Jens Knoop",
    color: "#10b981",
    icon: "Code2",
    slideCount: 0,
  },
  {
    id: "linalg",
    code: "101.A02",
    name: "Lineare Algebra für Informatik",
    semester: "WS 2026/27",
    lecturer: "Univ.Prof. Dr. Martin Goldstern",
    color: "#f59e0b",
    icon: "Boxes",
    slideCount: 0,
  },
  {
    id: "dbs",
    code: "184.708",
    name: "Datenbanksysteme",
    semester: "WS 2026/27",
    lecturer: "Univ.Prof. Dr. Reinhard Pichler",
    color: "#ec4899",
    icon: "Database",
    slideCount: 0,
  },
];

export const INITIAL_DECKS: SlideDeck[] = [];

const STORAGE_KEY_DECKS = "tu_slide_vault_decks";

export function loadSlideDecks(): SlideDeck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DECKS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load slide decks from localStorage", e);
  }
  return INITIAL_DECKS;
}

export function saveSlideDecks(decks: SlideDeck[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks));
  } catch (e) {
    console.error("Failed to save slide decks to localStorage", e);
  }
}

export function toggleCachedState(id: string): SlideDeck[] {
  const decks = loadSlideDecks();
  const updated = decks.map((deck) =>
    deck.id === id ? { ...deck, cached: !deck.cached } : deck
  );
  saveSlideDecks(updated);
  return updated;
}

export function toggleBookmarkState(id: string): SlideDeck[] {
  const decks = loadSlideDecks();
  const updated = decks.map((deck) =>
    deck.id === id ? { ...deck, bookmarked: !deck.bookmarked } : deck
  );
  saveSlideDecks(updated);
  return updated;
}

export function calculateStorageQuota(decks: SlideDeck[]): {
  usedMb: number;
  totalQuotaMb: number;
  percent: number;
  cachedCount: number;
} {
  const cachedDecks = decks.filter((d) => d.cached);
  const usedMb = cachedDecks.reduce((sum, d) => {
    const mb = parseFloat(d.fileSize.replace(" MB", "")) || 4.0;
    return sum + mb;
  }, 0);
  const totalQuotaMb = 100;
  const percent = Math.min(100, Math.round((usedMb / totalQuotaMb) * 100));

  return {
    usedMb: Math.round(usedMb * 10) / 10,
    totalQuotaMb,
    percent,
    cachedCount: cachedDecks.length,
  };
}
