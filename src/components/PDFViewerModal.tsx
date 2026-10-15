import React, { useState, useEffect } from "react";
import { Course, SlideDeck } from "../types/slide";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Moon,
  RotateCcw,
  Sun,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { getPDFFromVault } from "../services/vaultIndexedDB";

interface PDFViewerModalProps {
  deck: SlideDeck;
  initialPageNumber?: number;
  courses: Course[];
  onClose: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  deck,
  initialPageNumber = 1,
  courses,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPageNumber);
  const [invertDark, setInvertDark] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let createdBlobUrl: string | null = null;

    const loadPdf = async () => {
      setLoading(true);
      setLoadError(null);
      setResolvedPdfUrl(null);

      try {
        const rawUrl = deck.pdfUrl;

        // 1. Direct blob:, data:, or http(s) URL
        if (
          rawUrl &&
          (rawUrl.startsWith("blob:") ||
            rawUrl.startsWith("data:") ||
            rawUrl.startsWith("http:") ||
            rawUrl.startsWith("https:"))
        ) {
          if (active) {
            setResolvedPdfUrl(rawUrl);
            setLoading(false);
          }
          return;
        }

        // 2. Local disk file path (e.g. from physical vault)
        if (rawUrl) {
          const invokeFn =
            (window as any).__TAURI__?.core?.invoke ||
            (window as any).parent?.__TAURI__?.core?.invoke ||
            (window as any).__TAURI_INTERNALS__?.invoke ||
            (window as any).parent?.__TAURI_INTERNALS__?.invoke;

          if (!invokeFn) {
            throw new Error("Tauri IPC bridge is not available to load physical file.");
          }

          const b64: string = await invokeFn("read_vault_pdf_bytes", {
            filePath: rawUrl,
            path: rawUrl,
          });

          if (!b64 || typeof b64 !== "string") {
            throw new Error("No PDF data returned from slide vault.");
          }

          const binary = atob(b64);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
          }

          const blob = new Blob([bytes], { type: "application/pdf" });
          createdBlobUrl = URL.createObjectURL(blob);

          if (active) {
            setResolvedPdfUrl(createdBlobUrl);
            setLoading(false);
          }
          return;
        }

        // 3. IndexedDB cached deck
        if (deck.id.startsWith("vault-")) {
          const entry = await getPDFFromVault(deck.id);
          if (entry?.dataUrl) {
            if (entry.dataUrl.startsWith("data:")) {
              const b64 = entry.dataUrl.split(",")[1];
              if (b64) {
                const binary = atob(b64);
                const len = binary.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                  bytes[i] = binary.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: "application/pdf" });
                createdBlobUrl = URL.createObjectURL(blob);
                if (active) {
                  setResolvedPdfUrl(createdBlobUrl);
                  setLoading(false);
                }
                return;
              }
            }
            if (active) {
              setResolvedPdfUrl(entry.dataUrl);
              setLoading(false);
            }
            return;
          }
        }

        // 4. No PDF source
        if (active) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Failed to load PDF for deck:", deck.title, err);
        if (active) {
          setLoadError(err?.message || "Failed to load PDF document.");
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      active = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [deck.id, deck.pdfUrl]);

  const handleOpenExternal = async () => {
    if (!deck.pdfUrl) return;
    try {
      const invokeFn =
        (window as any).__TAURI__?.core?.invoke ||
        (window as any).parent?.__TAURI__?.core?.invoke ||
        (window as any).__TAURI_INTERNALS__?.invoke ||
        (window as any).parent?.__TAURI_INTERNALS__?.invoke;

      if (invokeFn) {
        await invokeFn("open_slide_file", { path: deck.pdfUrl });
      }
    } catch (e) {
      console.warn("Could not open in external viewer:", e);
    }
  };

  const course = courses.find((c) => c.id === deck.courseId);
  const page = deck.pages.find((p) => p.pageNumber === currentPage) || deck.pages[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevPage();
      } else if (e.key === "ArrowRight") {
        handleNextPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, deck.pages.length]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(deck.pages.length, prev + 1));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
      }}
    >
      {/* Top Navigation Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          backgroundColor: "var(--tu-bg-surface)",
          borderBottom: "1px solid var(--tu-border)",
          color: "var(--tu-text-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: course ? course.color : "var(--tu-accent)",
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {deck.title}
            </div>
            <div style={{ fontSize: "11px", color: "var(--tu-text-secondary)" }}>
              {course ? `${course.code} • ${course.name}` : "Kurs"}
              {deck.pdfUrl && !deck.pdfUrl.startsWith("data:") && !deck.pdfUrl.startsWith("blob:") ? ` • ${deck.pdfUrl}` : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          {deck.pages.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                style={{
                  background: "var(--tu-bg-canvas)",
                  border: "1px solid var(--tu-border)",
                  color: currentPage <= 1 ? "var(--tu-text-muted)" : "var(--tu-text-primary)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  cursor: currentPage <= 1 ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Previous Page (Left Arrow)"
              >
                <ChevronLeft size={16} />
              </button>

              <span style={{ fontSize: "12px", fontWeight: 600, minWidth: "80px", textAlign: "center" }}>
                Seite {currentPage} / {deck.pages.length}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= deck.pages.length}
                style={{
                  background: "var(--tu-bg-canvas)",
                  border: "1px solid var(--tu-border)",
                  color: currentPage >= deck.pages.length ? "var(--tu-text-muted)" : "var(--tu-text-primary)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  cursor: currentPage >= deck.pages.length ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Next Page (Right Arrow)"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", borderLeft: "1px solid var(--tu-border)", paddingLeft: "12px" }}>
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              style={{
                background: "var(--tu-bg-canvas)",
                border: "1px solid var(--tu-border)",
                color: "var(--tu-text-secondary)",
                borderRadius: "6px",
                padding: "4px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="Verkleinern"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: "11px", color: "var(--tu-text-muted)", minWidth: "38px", textAlign: "center" }}>
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              style={{
                background: "var(--tu-bg-canvas)",
                border: "1px solid var(--tu-border)",
                color: "var(--tu-text-secondary)",
                borderRadius: "6px",
                padding: "4px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="Vergrößern"
            >
              <ZoomIn size={14} />
            </button>
            {zoomLevel !== 100 && (
              <button
                onClick={() => setZoomLevel(100)}
                style={{
                  background: "var(--tu-bg-canvas)",
                  border: "1px solid var(--tu-border)",
                  color: "var(--tu-text-secondary)",
                  borderRadius: "6px",
                  padding: "4px 6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Zoom zurücksetzen"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>

          {/* External Viewer button (for physical files) */}
          {deck.pdfUrl && !deck.pdfUrl.startsWith("data:") && !deck.pdfUrl.startsWith("blob:") && (
            <button
              onClick={handleOpenExternal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "6px",
                border: "1px solid var(--tu-border)",
                backgroundColor: "var(--tu-bg-canvas)",
                color: "var(--tu-text-primary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
              title="In nativer System-App öffnen (macOS Preview / Acrobat / PDF Reader)"
            >
              <ExternalLink size={13} color="var(--tu-accent)" />
              <span>Extern öffnen</span>
            </button>
          )}

          {/* Dark mode filter button */}
          <button
            onClick={() => setInvertDark((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "6px",
              border: "1px solid var(--tu-border)",
              backgroundColor: invertDark ? "var(--tu-accent-subtle)" : "var(--tu-bg-canvas)",
              color: invertDark ? "var(--tu-accent)" : "var(--tu-text-secondary)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
            title="Helle Folien in augenschonenden Dark Mode invertieren"
          >
            {invertDark ? <Moon size={14} /> : <Sun size={14} />}
            <span>{invertDark ? "Dark Invert (Ein)" : "Original"}</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: "var(--tu-bg-canvas)",
              border: "1px solid var(--tu-border)",
              color: "var(--tu-text-primary)",
              borderRadius: "6px",
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            title="Schließen (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              color: "#cbd5e1",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                border: "3px solid rgba(255, 255, 255, 0.2)",
                borderTopColor: "var(--tu-accent)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <div style={{ fontSize: "14px", fontWeight: 500 }}>
              Vorlesungsfolien werden geladen...
            </div>
          </div>
        ) : loadError ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--tu-bg-surface)",
              border: "1px solid var(--tu-border)",
              borderRadius: "12px",
              padding: "36px",
              maxWidth: "520px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--tu-status-error, #ef4444)" }}>
              PDF konnte nicht geladen werden
            </div>
            <div style={{ fontSize: "12px", color: "var(--tu-text-secondary)", lineHeight: "1.5" }}>
              {loadError}
            </div>
            {deck.pdfUrl && (
              <button
                onClick={handleOpenExternal}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  marginTop: "8px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "var(--tu-accent)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <ExternalLink size={15} />
                <span>In System-Viewer öffnen</span>
              </button>
            )}
          </div>
        ) : resolvedPdfUrl ? (
          <div
            className={invertDark ? "slide-invert-dark" : ""}
            style={{
              width: "100%",
              maxWidth: "1400px",
              height: "calc(100vh - 120px)",
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease",
            }}
          >
            <object
              data={`${resolvedPdfUrl}#page=${currentPage}`}
              type="application/pdf"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "10px",
                backgroundColor: "#ffffff",
              }}
            >
              <iframe
                src={`${resolvedPdfUrl}#page=${currentPage}`}
                title={deck.title}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                }}
              />
            </object>
          </div>
        ) : (
          <div
            className={invertDark ? "slide-invert-dark" : ""}
            style={{
              width: "900px",
              maxWidth: "100%",
              aspectRatio: "16 / 9",
              backgroundColor: "#ffffff",
              color: "#1e293b",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "36px 48px",
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "2px solid #006699",
                paddingBottom: "12px",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#006699", letterSpacing: "0.02em" }}>
                TU WIEN • {course ? course.name.toUpperCase() : "COURSE"}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                Lecture {deck.lectureNumber} • Page {currentPage}
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", lineHeight: 1.25 }}>
                {page ? page.title : deck.title}
              </h1>

              {page && page.content && (
                <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "24px" }}>
                  {page.content.map((bullet, idx) => (
                    <li key={idx} style={{ fontSize: "16px", color: "#334155", lineHeight: 1.5 }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}

              {page && page.codeSnippet && (
                <pre
                  style={{
                    backgroundColor: "#0f172a",
                    color: "#38bdf8",
                    padding: "14px 18px",
                    borderRadius: "8px",
                    fontFamily: "var(--tu-font-mono)",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    overflowX: "auto",
                    marginTop: "8px",
                  }}
                >
                  <code>{page.codeSnippet}</code>
                </pre>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #cbd5e1",
                paddingTop: "12px",
                marginTop: "16px",
                fontSize: "11px",
                color: "#64748b",
              }}
            >
              <div>
                {page && page.notes ? `💡 Note: ${page.notes}` : "TU Wien Academic Materials • Standalone Slide Vault"}
              </div>
              <div>
                WS 2026/27 • Slide {currentPage} of {deck.pages.length}
              </div>
            </div>
          </div>
        )}
      </div>

      {deck.pages.length > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: "var(--tu-bg-surface)",
            borderTop: "1px solid var(--tu-border)",
            overflowX: "auto",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--tu-text-muted)", whiteSpace: "nowrap", marginRight: "8px" }}>
            Quick Jump:
          </span>
          {deck.pages.map((p) => {
            const isCurrent = p.pageNumber === currentPage;
            return (
              <button
                key={p.pageNumber}
                onClick={() => setCurrentPage(p.pageNumber)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: isCurrent ? "2px solid var(--tu-accent)" : "1px solid var(--tu-border)",
                  backgroundColor: isCurrent ? "var(--tu-accent-subtle)" : "var(--tu-bg-canvas)",
                  color: isCurrent ? "var(--tu-text-primary)" : "var(--tu-text-secondary)",
                  fontSize: "11px",
                  fontWeight: isCurrent ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                P. {p.pageNumber}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
