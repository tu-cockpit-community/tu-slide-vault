import React, { useState, useMemo } from "react";
import { Course, SlideDeck } from "./types/slide";
import {
  INITIAL_COURSES,
  loadSlideDecks,
  toggleCachedState,
  toggleBookmarkState,
  calculateStorageQuota,
} from "./services/slideStorage";
import { searchSlides } from "./services/pdfIndexer";
import { CourseSidebar } from "./components/CourseSidebar";
import { SlideSearchBar } from "./components/SlideSearchBar";
import { SlideDeckGrid } from "./components/SlideDeckGrid";
import { PDFViewerModal } from "./components/PDFViewerModal";
import {
  BookOpen,
  HardDrive,
} from "lucide-react";

export const App: React.FC = () => {
  const [courses] = useState<Course[]>(INITIAL_COURSES);
  const [decks, setDecks] = useState<SlideDeck[]>(() => loadSlideDecks());
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [filterBookmarked, setFilterBookmarked] = useState<boolean>(false);
  const [filterOfflineOnly, setFilterOfflineOnly] = useState<boolean>(false);

  const [activeReadingDeck, setActiveReadingDeck] = useState<SlideDeck | null>(null);
  const [activeReadingPage, setActiveReadingPage] = useState<number>(1);

  const storageStats = useMemo(() => calculateStorageQuota(decks), [decks]);

  const handleToggleCache = (id: string) => {
    const updated = toggleCachedState(id);
    setDecks(updated);
  };

  const handleToggleBookmark = (id: string) => {
    const updated = toggleBookmarkState(id);
    setDecks(updated);
  };

  const filteredCandidateDecks = useMemo(() => {
    let list = decks;
    if (filterBookmarked) {
      list = list.filter((d) => d.bookmarked);
    }
    if (filterOfflineOnly) {
      list = list.filter((d) => d.cached);
    }
    return list;
  }, [decks, filterBookmarked, filterOfflineOnly]);

  const searchResults = useMemo(() => {
    const effectiveQuery = activeTopic ? activeTopic : query;
    return searchSlides(filteredCandidateDecks, effectiveQuery, selectedCourseId);
  }, [filteredCandidateDecks, query, activeTopic, selectedCourseId]);

  const handleSelectTopic = (topic: string) => {
    if (activeTopic === topic) {
      setActiveTopic(null);
    } else {
      setActiveTopic(topic);
      setQuery("");
    }
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    if (activeTopic) {
      setActiveTopic(null);
    }
  };

  const handleOpenDeck = (deck: SlideDeck, pageNumber: number = 1) => {
    setActiveReadingDeck(deck);
    setActiveReadingPage(pageNumber);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        backgroundColor: "var(--tu-bg-canvas)",
        color: "var(--tu-text-primary)",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          height: "56px",
          backgroundColor: "var(--tu-bg-surface)",
          borderBottom: "1px solid var(--tu-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "var(--tu-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <BookOpen size={18} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              TU Slide Vault
            </div>
            <div style={{ fontSize: "11px", color: "var(--tu-text-secondary)" }}>
              Offline Lecture Slides & Full-Text Search
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              backgroundColor: "var(--tu-bg-canvas)",
              borderRadius: "6px",
              border: "1px solid var(--tu-border)",
              fontSize: "12px",
              color: "var(--tu-text-secondary)",
            }}
          >
            <HardDrive size={13} color="var(--tu-status-success)" />
            <span>{storageStats.cachedCount} Decks Offline</span>
          </div>

          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: "var(--tu-accent-subtle)",
              color: "var(--tu-accent)",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid var(--tu-border-focus)",
            }}
          >
            WS 2026/27
          </div>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <CourseSidebar
          courses={courses}
          selectedCourseId={selectedCourseId}
          onSelectCourse={(id) => {
            setSelectedCourseId(id);
            setFilterBookmarked(false);
            setFilterOfflineOnly(false);
          }}
          storageStats={storageStats}
          filterBookmarked={filterBookmarked}
          onToggleBookmarked={() => {
            setFilterBookmarked((prev) => !prev);
            setSelectedCourseId(null);
          }}
          filterOfflineOnly={filterOfflineOnly}
          onToggleOfflineOnly={() => {
            setFilterOfflineOnly((prev) => !prev);
            setSelectedCourseId(null);
          }}
        />

        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: "20px 24px",
            gap: "16px",
          }}
        >
          <SlideSearchBar
            query={query}
            onQueryChange={handleQueryChange}
            resultCount={searchResults.length}
            totalCount={filteredCandidateDecks.length}
            onSelectTopic={handleSelectTopic}
            activeTopic={activeTopic}
          />

          <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
            <SlideDeckGrid
              searchResults={searchResults}
              courses={courses}
              onOpenDeck={handleOpenDeck}
              onToggleCache={handleToggleCache}
              onToggleBookmark={handleToggleBookmark}
            />
          </div>
        </main>
      </div>

      {activeReadingDeck && (
        <PDFViewerModal
          deck={activeReadingDeck}
          initialPageNumber={activeReadingPage}
          courses={courses}
          onClose={() => setActiveReadingDeck(null)}
        />
      )}
    </div>
  );
};

export default App;
