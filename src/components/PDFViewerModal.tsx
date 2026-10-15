import React, { useState, useEffect } from "react";
import { Course, SlideDeck } from "../types/slide";
import {
  ChevronLeft,
  ChevronRight,
  Moon,
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
  const resolveUrl = (rawUrl?: string): string | undefined => {
    if (!rawUrl) return undefined;
    if (
      rawUrl.startsWith("data:") ||
      rawUrl.startsWith("blob:") ||
      rawUrl.startsWith("http:") ||
      rawUrl.startsWith("https:") ||
      rawUrl.startsWith("asset:")
    ) {
      return rawUrl;
    }
    const tauri =
      typeof window !== "undefined"
        ? (window as any).__TAURI__ || (window as any).parent?.__TAURI__
        : null;
    if (tauri?.core?.convertFileSrc) {
      try {
        return tauri.core.convertFileSrc(rawUrl);
      } catch (e) {
        console.warn("Failed to convert file src:", e);
      }
    }
    return rawUrl;
  };

  const [currentPage, setCurrentPage] = useState<number>(initialPageNumber);
  const [invertDark, setInvertDark] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string | undefined>(() =>
    resolveUrl(deck.pdfUrl)
  );

  useEffect(() => {
    if (deck.pdfUrl) {
      const converted = resolveUrl(deck.pdfUrl);
      setResolvedPdfUrl(converted);
    } else if (!resolvedPdfUrl && deck.id.startsWith("vault-")) {
      getPDFFromVault(deck.id).then((entry) => {
        if (entry?.dataUrl) {
          setResolvedPdfUrl(entry.dataUrl);
        }
      });
    }
  }, [deck.id, deck.pdfUrl]);

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
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
      }}
    >
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: course ? course.color : "var(--tu-accent)",
            }}
          />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700 }}>
              {deck.title}
            </div>
            <div style={{ fontSize: "11px", color: "var(--tu-text-secondary)" }}>
              {course ? `${course.code} ${course.name}` : "Course"} • Lecture {deck.lectureNumber}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
              Page {currentPage} / {deck.pages.length}
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

          <div style={{ display: "flex", alignItems: "center", gap: "4px", borderLeft: "1px solid var(--tu-border)", paddingLeft: "14px" }}>
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
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: "11px", color: "var(--tu-text-muted)", minWidth: "40px", textAlign: "center" }}>
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
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setInvertDark((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid var(--tu-border)",
              backgroundColor: invertDark ? "var(--tu-accent-subtle)" : "var(--tu-bg-canvas)",
              color: invertDark ? "var(--tu-accent)" : "var(--tu-text-secondary)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
            title="Invert bright white presentation slides into eye-friendly dark mode"
          >
            {invertDark ? <Moon size={14} /> : <Sun size={14} />}
            <span>{invertDark ? "Invert Dark Mode (On)" : "Original White"}</span>
          </button>

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
            title="Close Slide Viewer (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
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

          {resolvedPdfUrl ? (
            <div style={{ flex: 1, width: "100%", height: "100%", minHeight: "440px", display: "flex", flexDirection: "column" }}>
              <iframe
                src={`${resolvedPdfUrl}#page=${currentPage}`}
                title={deck.title}
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "440px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>
          ) : (
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
          )}

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
      </div>

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
    </div>
  );
};
