import React from "react";
import { Course, SlideDeck, SlideSearchResult } from "../types/slide";
import {
  BookOpen,
  Bookmark,
  CheckCircle2,
  Download,
  FileText,
  Sparkles,
} from "lucide-react";

interface SlideDeckGridProps {
  searchResults: SlideSearchResult[];
  courses: Course[];
  onOpenDeck: (deck: SlideDeck, pageNumber?: number) => void;
  onToggleCache: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}

export const SlideDeckGrid: React.FC<SlideDeckGridProps> = ({
  searchResults,
  courses,
  onOpenDeck,
  onToggleCache,
  onToggleBookmark,
}) => {
  const getCourse = (courseId: string): Course | undefined => {
    return courses.find((c) => c.id === courseId);
  };

  if (searchResults.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
          textAlign: "center",
          color: "var(--tu-text-secondary)",
        }}
      >
        <FileText size={48} color="var(--tu-text-muted)" style={{ marginBottom: "16px" }} />
        <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--tu-text-primary)", marginBottom: "6px" }}>
          No slide materials found
        </div>
        <div style={{ fontSize: "13px", maxWidth: "400px" }}>
          Try clearing your search query or selecting a different course from the library sidebar.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "16px",
        padding: "4px 0",
      }}
    >
      {searchResults.map(({ deck, matchedSnippet, matchedPageNumber, matchType }) => {
        const course = getCourse(deck.courseId);
        return (
          <div
            key={deck.id}
            style={{
              backgroundColor: "var(--tu-bg-surface)",
              border: "1px solid var(--tu-border)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
              position: "relative",
              transition: "transform 0.15s ease, border-color 0.15s ease",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      backgroundColor: course ? `${course.color}22` : "var(--tu-accent-subtle)",
                      color: course ? course.color : "var(--tu-accent)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: `1px solid ${course ? `${course.color}44` : "var(--tu-border)"}`,
                    }}
                  >
                    {course ? course.code : "Course"}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor: "var(--tu-bg-canvas)",
                      color: "var(--tu-text-secondary)",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      border: "1px solid var(--tu-border)",
                    }}
                  >
                    Lec {deck.lectureNumber}
                  </span>
                </div>

                <button
                  onClick={() => onToggleBookmark(deck.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: deck.bookmarked ? "#f59e0b" : "var(--tu-text-muted)",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title={deck.bookmarked ? "Remove bookmark" : "Bookmark this slide deck"}
                >
                  <Bookmark size={16} fill={deck.bookmarked ? "#f59e0b" : "none"} />
                </button>
              </div>

              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--tu-text-primary)",
                  marginBottom: "6px",
                  lineHeight: 1.3,
                }}
              >
                {deck.title}
              </h3>

              <p
                style={{
                  fontSize: "12px",
                  color: "var(--tu-text-secondary)",
                  marginBottom: "12px",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {deck.description}
              </p>

              {matchType !== "title" && (
                <div
                  style={{
                    backgroundColor: "var(--tu-bg-canvas)",
                    border: "1px solid var(--tu-border)",
                    borderRadius: "6px",
                    padding: "6px 8px",
                    fontSize: "11px",
                    color: "var(--tu-text-secondary)",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Sparkles size={12} color="var(--tu-accent)" />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {matchedSnippet}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "14px" }}>
                {deck.topics.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: "10px",
                      backgroundColor: "var(--tu-bg-canvas)",
                      color: "var(--tu-text-muted)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "1px solid var(--tu-border-subtle)",
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--tu-border)",
                paddingTop: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--tu-text-muted)" }}>
                <span>{deck.pageCount} pgs</span>
                <span>•</span>
                <span>{deck.fileSize}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => onToggleCache(deck.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 8px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor: deck.cached ? "var(--tu-status-success)" : "var(--tu-border)",
                    backgroundColor: deck.cached ? "rgba(16, 185, 129, 0.1)" : "transparent",
                    color: deck.cached ? "var(--tu-status-success)" : "var(--tu-text-secondary)",
                    fontSize: "11px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  title={deck.cached ? "Cached locally for offline study" : "Download to offline vault"}
                >
                  {deck.cached ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Cached</span>
                    </>
                  ) : (
                    <>
                      <Download size={13} />
                      <span>Cache</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onOpenDeck(deck, matchedPageNumber)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "var(--tu-accent)",
                    color: "var(--tu-accent-text)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <BookOpen size={13} />
                  <span>Read</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
