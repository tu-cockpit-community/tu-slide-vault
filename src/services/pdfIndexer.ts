import { SlideDeck, SlideSearchResult } from "../types/slide";

export function searchSlides(
  decks: SlideDeck[],
  query: string,
  selectedCourseId?: string | null
): SlideSearchResult[] {
  const trimmed = query.trim().toLowerCase();
  let candidateDecks = decks;

  if (selectedCourseId && selectedCourseId !== "all") {
    candidateDecks = candidateDecks.filter((d) => d.courseId === selectedCourseId);
  }

  if (!trimmed) {
    return candidateDecks.map((deck) => ({
      deck,
      matchedSnippet: deck.description,
      matchType: "title",
    }));
  }

  const results: SlideSearchResult[] = [];

  for (const deck of candidateDecks) {
    // 1. Check title
    if (deck.title.toLowerCase().includes(trimmed)) {
      results.push({
        deck,
        matchedSnippet: `Matched in title: ${deck.title}`,
        matchType: "title",
      });
      continue;
    }

    // 2. Check topics
    const matchedTopic = deck.topics.find((t) => t.toLowerCase().includes(trimmed));
    if (matchedTopic) {
      results.push({
        deck,
        matchedSnippet: `Topic: ${matchedTopic} (${deck.topics.join(", ")})`,
        matchType: "topic",
      });
      continue;
    }

    // 3. Check page content
    let foundPageMatch = false;
    for (const page of deck.pages) {
      if (page.title.toLowerCase().includes(trimmed)) {
        results.push({
          deck,
          matchedPageNumber: page.pageNumber,
          matchedSnippet: `Page ${page.pageNumber}: ${page.title}`,
          matchType: "content",
        });
        foundPageMatch = true;
        break;
      }

      for (const bullet of page.content) {
        if (bullet.toLowerCase().includes(trimmed)) {
          results.push({
            deck,
            matchedPageNumber: page.pageNumber,
            matchedSnippet: `Slide ${page.pageNumber}: "...${bullet}..."`,
            matchType: "content",
          });
          foundPageMatch = true;
          break;
        }
      }
      if (foundPageMatch) break;

      if (page.codeSnippet && page.codeSnippet.toLowerCase().includes(trimmed)) {
        results.push({
          deck,
          matchedPageNumber: page.pageNumber,
          matchedSnippet: `Slide ${page.pageNumber} code: "...${trimmed}..."`,
          matchType: "content",
        });
        foundPageMatch = true;
        break;
      }
    }
  }

  return results;
}
