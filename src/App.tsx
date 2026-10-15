import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Course, SlideDeck } from "./types/slide";
import {
  INITIAL_COURSES,
  loadSlideDecks,
  saveSlideDecks,
  toggleCachedState,
  toggleBookmarkState,
  calculateStorageQuota,
} from "./services/slideStorage";
import { storePDFInVault } from "./services/vaultIndexedDB";
import { searchSlides } from "./services/pdfIndexer";
import { CourseSidebar } from "./components/CourseSidebar";
import { SlideSearchBar } from "./components/SlideSearchBar";
import { SlideDeckGrid } from "./components/SlideDeckGrid";
import { PDFViewerModal } from "./components/PDFViewerModal";
import {
  BookOpen,
  HardDrive,
  Upload,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPhysicalSlides = useCallback(async () => {
    if (typeof window !== "undefined" && (window as any).__TAURI__?.core?.invoke) {
      try {
        const physicalFiles = await (window as any).__TAURI__.core.invoke("list_slide_vault_files");
        if (Array.isArray(physicalFiles) && physicalFiles.length > 0) {
          const convertedDecks: SlideDeck[] = physicalFiles.map((pf: any, idx: number) => ({
            id: `fs-${idx}-${pf.filename}`,
            courseId: pf.course.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            lectureNumber: idx + 1,
            title: pf.filename.replace(/\.pdf$/i, ""),
            description: `Offline Folie aus Kurs ${pf.course}`,
            topics: [pf.course, "TUWEL Slide", "Vorlesungsfolien"],
            pageCount: 1,
            fileSize: (pf.size_bytes / (1024 * 1024)).toFixed(1) + " MB",
            uploadDate: new Date(pf.modified_timestamp * 1000).toISOString().slice(0, 10),
            cached: true,
            bookmarked: false,
            pdfUrl: pf.path,
            pages: [
              {
                pageNumber: 1,
                title: pf.filename,
                content: [`Datei: ${pf.filename}`, `Kurs: ${pf.course}`, `Speicherort: ${pf.path}`],
                notes: "Aus TUWEL oder lokalem Slide Vault synchronisiert.",
              },
            ],
          }));

          setDecks((prev) => {
            const existingTitles = new Set(prev.map((d) => d.title));
            const fresh = convertedDecks.filter((d) => !existingTitles.has(d.title));
            return [...fresh, ...prev];
          });
        }
      } catch (err) {
        console.warn("Could not query physical vault files:", err);
      }
    }
  }, []);

  useEffect(() => {
    loadPhysicalSlides();

    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === "SLIDE_SAVED" || e.data?.type === "REFRESH_SLIDES") {
        loadPhysicalSlides();
      }
    };
    window.addEventListener("message", handleMsg);

    let unlisten: (() => void) | undefined;
    if ((window as any).__TAURI__?.event?.listen) {
      (window as any).__TAURI__.event.listen("slide-saved-to-vault", () => {
        loadPhysicalSlides();
      }).then((fn: any) => {
        unlisten = fn;
      });
    }

    return () => {
      window.removeEventListener("message", handleMsg);
      if (unlisten) unlisten();
    };
  }, [loadPhysicalSlides]);

  const storageStats = useMemo(() => calculateStorageQuota(decks), [decks]);

  const handleUploadPDF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const deckId = `vault-${Date.now()}`;
      const title = file.name.replace(/\.pdf$/i, "");
      const courseId = selectedCourseId || (courses[0]?.id || "algodat");
      const course = courses.find((c) => c.id === courseId);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      const uploadDate = new Date().toISOString().slice(0, 10);

      await storePDFInVault({
        id: deckId,
        name: file.name,
        dataUrl,
        sizeBytes: file.size,
        uploadDate,
      });

      const newDeck: SlideDeck = {
        id: deckId,
        courseId,
        lectureNumber: Math.floor(Math.random() * 8) + 1,
        title,
        description: `Uploaded PDF slide notes (${file.name}) stored in offline vault.`,
        topics: [course?.name || "Materials", "Uploaded Slides", "Student Notes"],
        pageCount: 1,
        fileSize: sizeMb,
        uploadDate,
        cached: true,
        bookmarked: false,
        pdfUrl: dataUrl,
        pages: [
          {
            pageNumber: 1,
            title: title,
            content: [
              `Document: ${file.name}`,
              `File Size: ${sizeMb} • Stored in IndexedDB`,
              `Uploaded on ${uploadDate} for ${course?.name || "Course"}`,
            ],
            notes: "Direct PDF viewing available in dark-mode viewer.",
          },
        ],
      };

      const updated = [newDeck, ...decks];
      setDecks(updated);
      saveSlideDecks(updated);
    };
    reader.readAsDataURL(file);
  };

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
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,application/pdf"
            onChange={handleUploadPDF}
            style={{ display: "none" }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              backgroundColor: "var(--tu-accent)",
              color: "#ffffff",
              borderRadius: "6px",
              border: "none",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
            title="Upload PDF Slides / Notes from device to offline vault"
          >
            <Upload size={14} />
            <span>Upload Slides</span>
          </button>

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
