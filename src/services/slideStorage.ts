import { Course, SlideDeck } from "../types/slide";

export const INITIAL_COURSES: Course[] = [];

export const INITIAL_DECKS: SlideDeck[] = [];

const STORAGE_KEY_DECKS = "tu_slide_vault_decks_v2";

export function loadSlideDecks(): SlideDeck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DECKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((d) => d && !d.id?.startsWith("deck-"));
      }
    }
    // Check legacy key and migrate only genuine user uploads or synced filesystem decks
    const legacyRaw = localStorage.getItem("tu_slide_vault_decks");
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed)) {
        const genuine = parsed.filter(
          (d) => d && (d.id?.startsWith("vault-") || d.id?.startsWith("fs-"))
        );
        if (genuine.length > 0) {
          saveSlideDecks(genuine);
          return genuine;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load slide decks from localStorage", e);
  }
  return INITIAL_DECKS;
}

export function saveSlideDecks(decks: SlideDeck[]): void {
  try {
    // Strip giant base64 data URLs to prevent QuotaExceededError in localStorage
    // (Full PDF binary data URLs are stored reliably in IndexedDB)
    const sanitized = decks.map((d) =>
      d.pdfUrl && d.pdfUrl.startsWith("data:") ? { ...d, pdfUrl: undefined } : d
    );
    localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(sanitized));
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
