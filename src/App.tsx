import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Course, SlideDeck } from "./types/slide";
import {
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
  FolderUp,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface UploadItem {
  file: File;
  relativePath: string;
}

async function extractFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<UploadItem[]> {
  const items = dataTransfer.items;
  const results: UploadItem[] = [];

  async function traverseEntry(entry: any, path: string = ""): Promise<void> {
    if (!entry) return;
    if (entry.isFile) {
      if (entry.name.toLowerCase().endsWith(".pdf")) {
        const file = await new Promise<File>((resolve, reject) => {
          entry.file(resolve, reject);
        });
        results.push({
          file,
          relativePath: path ? `${path}/${entry.name}` : entry.name,
        });
      }
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const newPath = path ? `${path}/${entry.name}` : entry.name;

      const readBatch = (): Promise<any[]> =>
        new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));

      let entries: any[] = [];
      let batch: any[] = [];
      do {
        batch = await readBatch();
        entries = entries.concat(batch);
      } while (batch.length > 0);

      for (const child of entries) {
        await traverseEntry(child, newPath);
      }
    }
  }

  if (items && items.length > 0) {
    const promises: Promise<void>[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (typeof (item as any).webkitGetAsEntry === "function") {
        const entry = (item as any).webkitGetAsEntry();
        if (entry) {
          promises.push(traverseEntry(entry, ""));
          continue;
        }
      }
      const file = item.getAsFile();
      if (file && file.name.toLowerCase().endsWith(".pdf")) {
        results.push({ file, relativePath: file.webkitRelativePath || file.name });
      }
    }
    await Promise.all(promises);
  } else if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        results.push({ file, relativePath: file.webkitRelativePath || file.name });
      }
    }
  }

  return results;
}

export const App: React.FC = () => {
  const [decks, setDecks] = useState<SlideDeck[]>(() => loadSlideDecks());
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [filterBookmarked, setFilterBookmarked] = useState<boolean>(false);
  const [filterOfflineOnly, setFilterOfflineOnly] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{
    isImporting: boolean;
    message: string;
    count?: number;
    total?: number;
  } | null>(null);

  const courses: Course[] = useMemo(() => {
    const map = new Map<string, Course>();
    decks.forEach((deck) => {
      if (!map.has(deck.courseId)) {
        const courseName =
          deck.topics.find((t) => t && t !== "Materials" && t !== "TUWEL Slide" && t !== "Student Notes" && t !== "Uploaded Slides" && t !== "Vorlesungsfolien") ||
          deck.courseId.toUpperCase();
        map.set(deck.courseId, {
          id: deck.courseId,
          code: deck.courseId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 7).toUpperCase() || "COURSE",
          name: courseName,
          semester: "WS 2026/27",
          lecturer: "",
          color: "#006699",
          icon: "BookOpen",
          slideCount: 0,
        });
      }
      map.get(deck.courseId)!.slideCount += 1;
    });
    return Array.from(map.values());
  }, [decks]);

  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    decks.forEach((d) => {
      d.topics.forEach((t) => {
        if (t && t !== "TUWEL Slide" && t !== "Materials" && t !== "Student Notes" && t !== "Uploaded Slides" && t !== "Vorlesungsfolien") {
          set.add(t);
        }
      });
    });
    return Array.from(set);
  }, [decks]);

  const [activeReadingDeck, setActiveReadingDeck] = useState<SlideDeck | null>(null);
  const [activeReadingPage, setActiveReadingPage] = useState<number>(1);
  const [isRefreshingVault, setIsRefreshingVault] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const getTauriBridge = useCallback(() => {
    if (typeof window === "undefined") return null;
    return (window as any).__TAURI__ || (window as any).parent?.__TAURI__ || null;
  }, []);

  const loadPhysicalSlides = useCallback(async () => {
    const tauri = getTauriBridge();
    setIsRefreshingVault(true);
    try {
      let physicalFiles: any = null;
      if (tauri?.core?.invoke) {
        physicalFiles = await tauri.core.invoke("list_slide_vault_files");
      } else if ((window as any).parent?.__TAURI_INTERNALS__?.invoke) {
        physicalFiles = await (window as any).parent.__TAURI_INTERNALS__.invoke("list_slide_vault_files");
      }

      if (Array.isArray(physicalFiles)) {
        const convertedDecks: SlideDeck[] = physicalFiles
          .filter((pf: any) => pf.filename && !pf.filename.startsWith("."))
          .map((pf: any, idx: number) => {
            const subfolderTopics = pf.subfolder
              ? pf.subfolder.split("/").map((s: string) => s.trim()).filter(Boolean)
              : [];
            const baseTitle = pf.filename.replace(/\.pdf$/i, "");
            const title = pf.subfolder ? `${pf.subfolder} • ${baseTitle}` : baseTitle;

            return {
              id: `fs-${pf.path}`,
              courseId: pf.course.toLowerCase().replace(/[^a-z0-9]/g, "-"),
              lectureNumber: idx + 1,
              title,
              description: pf.subfolder
                ? `Offline Folie aus Kurs ${pf.course} • ${pf.subfolder}`
                : `Offline Folie aus Kurs ${pf.course}`,
              topics: Array.from(new Set([pf.course, ...subfolderTopics, "TUWEL Slide", "Vorlesungsfolien"])),
              pageCount: 1,
              fileSize: (pf.size_bytes / (1024 * 1024)).toFixed(1) + " MB",
              uploadDate: new Date(pf.modified_timestamp * 1000).toISOString().slice(0, 10),
              cached: true,
              bookmarked: false,
              pdfUrl: pf.path,
              pages: [
                {
                  pageNumber: 1,
                  title,
                  content: [
                    `Datei: ${pf.filename}`,
                    `Kurs: ${pf.course}`,
                    ...(pf.subfolder ? [`Unterordner: ${pf.subfolder}`] : []),
                    `Speicherort: ${pf.path}`,
                  ],
                  notes: "Aus TUWEL oder lokalem Slide Vault synchronisiert.",
                },
              ],
            };
          });

        setDecks((prev) => {
          const diskPaths = new Set(convertedDecks.map((d) => d.pdfUrl).filter(Boolean));
          // Keep standalone IndexedDB decks that are not on disk
          const standaloneDecks = prev.filter(
            (d) => d.id.startsWith("vault-") && (!d.pdfUrl || !diskPaths.has(d.pdfUrl))
          );
          const combined = [...convertedDecks, ...standaloneDecks];
          saveSlideDecks(combined);
          return combined;
        });
      }
    } catch (err) {
      console.warn("Could not query physical vault files:", err);
    } finally {
      setIsRefreshingVault(false);
    }
  }, [getTauriBridge]);

  useEffect(() => {
    loadPhysicalSlides();

    const handleMsg = (e: MessageEvent) => {
      if (
        e.data?.type === "SLIDE_SAVED" ||
        e.data?.type === "REFRESH_SLIDES" ||
        e.data?.type === "VAULT_PATH_CHANGED"
      ) {
        loadPhysicalSlides();
      }
    };
    window.addEventListener("message", handleMsg);

    const handleFocus = () => {
      loadPhysicalSlides();
    };
    window.addEventListener("focus", handleFocus);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadPhysicalSlides();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let unlisten: (() => void) | undefined;
    let unlistenPath: (() => void) | undefined;
    const tauri = getTauriBridge();

    if (tauri?.event?.listen) {
      let debounceTimer: any = null;
      const onTauriEvent = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          loadPhysicalSlides();
        }, 150);
      };

      tauri.event.listen("slide-saved-to-vault", onTauriEvent).then((fn: any) => {
        unlisten = fn;
      });
      tauri.event.listen("slide-vault-path-changed", onTauriEvent).then((fn: any) => {
        unlistenPath = fn;
      });
    }

    return () => {
      window.removeEventListener("message", handleMsg);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (unlisten) unlisten();
      if (unlistenPath) unlistenPath();
    };
  }, [loadPhysicalSlides, getTauriBridge]);

  const storageStats = useMemo(() => calculateStorageQuota(decks), [decks]);

  const determineCourseAndSubfolder = (
    segments: string[]
  ): { courseName: string; courseId: string; subfolderParts: string[] } => {
    if (selectedCourseId) {
      const found = courses.find((c) => c.id === selectedCourseId);
      const courseId = selectedCourseId;
      const courseName = found?.name || selectedCourseId.toUpperCase();
      let rel = segments.slice(0, -1);
      if (
        rel.length > 0 &&
        (rel[0].toLowerCase() === courseName.toLowerCase() ||
          rel[0].toLowerCase() === courseId.toLowerCase() ||
          rel[0].toLowerCase().replace(/[^a-z0-9]/g, "-") === courseId.toLowerCase())
      ) {
        rel = rel.slice(1);
      }
      return { courseName, courseId, subfolderParts: rel };
    }

    if (segments.length <= 1) {
      return {
        courseName: "Materials",
        courseId: "materials",
        subfolderParts: [],
      };
    }

    if (segments.length === 2) {
      const courseName = segments[0];
      const courseId = segments[0].toLowerCase().replace(/[^a-z0-9]/g, "-") || "materials";
      return { courseName, courseId, subfolderParts: [] };
    }

    const isGenericContainer = /^(semester|downloads|vault|slides|tuwel|uni|unterlagen|matrikel|tu\s*wien|tu_cockpit|tu)$/i.test(
      segments[0]
    );
    const matchesExistingCourse1 = courses.some(
      (c) =>
        c.name.toLowerCase() === segments[1].toLowerCase() ||
        c.id === segments[1].toLowerCase().replace(/[^a-z0-9]/g, "-")
    );

    if ((isGenericContainer || matchesExistingCourse1) && segments.length >= 3) {
      const courseName = segments[1];
      const courseId = segments[1].toLowerCase().replace(/[^a-z0-9]/g, "-") || "materials";
      const subfolderParts = segments.slice(2, -1);
      return { courseName, courseId, subfolderParts };
    }

    const courseName = segments[0];
    const courseId = segments[0].toLowerCase().replace(/[^a-z0-9]/g, "-") || "materials";
    const subfolderParts = segments.slice(1, -1);
    return { courseName, courseId, subfolderParts };
  };

  const processUploadItems = async (items: UploadItem[]) => {
    const validItems = items.filter(
      (it) => it.file.name.toLowerCase().endsWith(".pdf") && !it.file.name.startsWith(".")
    );
    if (validItems.length === 0) {
      setImportStatus({
        isImporting: false,
        message: "No valid PDF files found to import.",
      });
      setTimeout(() => setImportStatus(null), 3000);
      return;
    }

    setImportStatus({
      isImporting: true,
      message: `Importing ${validItems.length} slide${validItems.length === 1 ? "" : "s"}...`,
      count: 0,
      total: validItems.length,
    });

    const newDecks: SlideDeck[] = [];
    const uploadDate = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < validItems.length; i++) {
      const { file, relativePath } = validItems[i];
      const segments = relativePath.split("/").map((s) => s.trim()).filter(Boolean);

      const { courseName, courseId, subfolderParts } = determineCourseAndSubfolder(segments);

      const baseTitle = file.name.replace(/\.pdf$/i, "");
      const subfolderStr = subfolderParts.join("/");
      const title = subfolderStr ? `${subfolderStr} • ${baseTitle}` : baseTitle;
      const deckId = `vault-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        // Store in IndexedDB for webview persistence
        await storePDFInVault({
          id: deckId,
          name: file.name,
          dataUrl,
          sizeBytes: file.size,
          uploadDate,
        });

        let savedDiskPath: string | undefined = undefined;

        // If Tauri backend is running, save to filesystem vault with subfolders
        const tauri = getTauriBridge();
        if (tauri?.core?.invoke) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const bytes = Array.from(new Uint8Array(arrayBuffer));
            const subpath = subfolderStr ? `${subfolderStr}/${file.name}` : file.name;
            savedDiskPath = await tauri.core.invoke("save_slide_to_vault", {
              courseName,
              filename: subpath,
              bytes,
            });
          } catch (tErr) {
            console.warn("Could not save to Tauri native vault:", tErr);
          }
        }

        const deckTopics = Array.from(
          new Set([courseName, ...subfolderParts, "Uploaded Slides", "Student Notes"])
        );

        const newDeck: SlideDeck = {
          id: deckId,
          courseId,
          lectureNumber: (i % 8) + 1,
          title,
          description: subfolderStr
            ? `Uploaded slide note (${file.name}) • ${subfolderStr}`
            : `Uploaded slide note (${file.name}) stored in offline vault.`,
          topics: deckTopics,
          pageCount: 1,
          fileSize: sizeMb,
          uploadDate,
          cached: true,
          bookmarked: false,
          pdfUrl: savedDiskPath,
          pages: [
            {
              pageNumber: 1,
              title,
              content: [
                `Dokument: ${file.name}`,
                `Kurs: ${courseName}`,
                ...(subfolderStr ? [`Unterordner: ${subfolderStr}`] : []),
                `Größe: ${sizeMb} • Gespeichert im Slide Vault`,
                `Hochgeladen am: ${uploadDate}`,
              ],
              notes: "Offline PDF-Ansicht im integrierten Dark-Mode Viewer verfügbar.",
            },
          ],
        };

        newDecks.push(newDeck);
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
      }

      setImportStatus({
        isImporting: true,
        message: `Importing ${i + 1} of ${validItems.length} slides...`,
        count: i + 1,
        total: validItems.length,
      });
    }

    if (newDecks.length > 0) {
      if (getTauriBridge()?.core?.invoke) {
        await loadPhysicalSlides();
      } else {
        setDecks((prev) => {
          const updated = [...newDecks, ...prev];
          saveSlideDecks(updated);
          return updated;
        });
      }

      setImportStatus({
        isImporting: false,
        message: `Successfully imported ${newDecks.length} slide deck${newDecks.length === 1 ? "" : "s"}!`,
      });
    } else {
      setImportStatus({
        isImporting: false,
        message: "No slides were imported.",
      });
    }

    setTimeout(() => {
      setImportStatus(null);
    }, 4000);
  };

  const handleUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const items: UploadItem[] = Array.from(fileList)
      .filter((f) => f.name.toLowerCase().endsWith(".pdf"))
      .map((f) => ({ file: f, relativePath: f.webkitRelativePath || f.name }));
    e.target.value = "";
    processUploadItems(items);
  };

  const handleUploadFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const items: UploadItem[] = Array.from(fileList)
      .filter((f) => f.name.toLowerCase().endsWith(".pdf"))
      .map((f) => ({ file: f, relativePath: f.webkitRelativePath || f.name }));
    e.target.value = "";
    processUploadItems(items);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer) return;
    try {
      setImportStatus({
        isImporting: true,
        message: "Scanning folder and subfolders for slides...",
      });
      const items = await extractFilesFromDataTransfer(e.dataTransfer);
      if (items.length === 0) {
        setImportStatus({
          isImporting: false,
          message: "No PDF files found in dropped items.",
        });
        setTimeout(() => setImportStatus(null), 3000);
        return;
      }
      await processUploadItems(items);
    } catch (err) {
      console.error("Drop processing failed:", err);
      setImportStatus({
        isImporting: false,
        message: "Failed to read dropped files.",
      });
      setTimeout(() => setImportStatus(null), 3000);
    }
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
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
      }}
      onDrop={handleDrop}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        backgroundColor: "var(--tu-bg-canvas)",
        color: "var(--tu-text-primary)",
        overflow: "hidden",
      }}
    >
      {isDragging && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 102, 153, 0.2)",
            backdropFilter: "blur(4px)",
            border: "2px dashed var(--tu-accent)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              backgroundColor: "var(--tu-bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <FolderUp size={32} color="var(--tu-accent)" />
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--tu-text-primary)" }}>
            Drop PDF slides or course folders here
          </div>
          <div style={{ fontSize: "12px", color: "var(--tu-text-secondary)" }}>
            Folder structures and nested subfolders will be preserved automatically
          </div>
        </div>
      )}

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
            multiple
            onChange={handleUploadFiles}
            style={{ display: "none" }}
          />

          <input
            type="file"
            ref={folderInputRef}
            {...({ webkitdirectory: "", directory: "" } as any)}
            multiple
            onChange={handleUploadFolder}
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
            title="Upload one or multiple PDF slides from device"
          >
            <Upload size={14} />
            <span>Upload Slides</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              backgroundColor: "var(--tu-bg-canvas)",
              color: "var(--tu-text-primary)",
              borderRadius: "6px",
              border: "1px solid var(--tu-border)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Upload a folder with multiple subfolders"
          >
            <FolderUp size={14} color="var(--tu-accent)" />
            <span>Upload Folder</span>
          </button>

          <button
            onClick={() => loadPhysicalSlides()}
            disabled={isRefreshingVault}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              backgroundColor: "var(--tu-bg-canvas)",
              color: "var(--tu-text-secondary)",
              borderRadius: "6px",
              border: "1px solid var(--tu-border)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: isRefreshingVault ? "default" : "pointer",
              transition: "all 0.15s ease",
            }}
            title="Dateisystem synchronisieren / Folien aus physischem Ordner neu laden"
          >
            <RefreshCw
              size={14}
              color="var(--tu-accent)"
              className={isRefreshingVault ? "animate-spin" : ""}
            />
            <span>{isRefreshingVault ? "Synchronisiere..." : "Ordner synchronisieren"}</span>
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
            availableTopics={availableTopics}
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

      {importStatus && (
        <div
          className="animate-fade-in"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "var(--tu-bg-surface)",
            border: "1px solid var(--tu-border-focus)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
            borderRadius: "8px",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            zIndex: 100,
            fontSize: "13px",
            color: "var(--tu-text-primary)",
          }}
        >
          {importStatus.isImporting ? (
            <div
              className="animate-spin"
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid var(--tu-accent-subtle)",
                borderTopColor: "var(--tu-accent)",
                borderRadius: "50%",
              }}
            />
          ) : (
            <CheckCircle2 size={16} color="var(--tu-status-success)" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
