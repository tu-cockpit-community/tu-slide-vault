import React from "react";
import { Course } from "../types/slide";
import {
  Bookmark,
  HardDrive,
  Layers,
} from "lucide-react";

interface CourseSidebarProps {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (courseId: string | null) => void;
  storageStats: {
    usedMb: number;
    totalQuotaMb: number;
    percent: number;
    cachedCount: number;
  };
  filterBookmarked: boolean;
  onToggleBookmarked: () => void;
  filterOfflineOnly: boolean;
  onToggleOfflineOnly: () => void;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  courses,
  selectedCourseId,
  onSelectCourse,
  storageStats,
  filterBookmarked,
  onToggleBookmarked,
  filterOfflineOnly,
  onToggleOfflineOnly,
}) => {
  return (
    <aside
      style={{
        width: "280px",
        minWidth: "280px",
        backgroundColor: "var(--tu-bg-surface)",
        borderRight: "1px solid var(--tu-border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div style={{ padding: "16px", borderBottom: "1px solid var(--tu-border)" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--tu-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
          Library Views
        </div>

        <button
          onClick={() => onSelectCourse(null)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            backgroundColor: selectedCourseId === null && !filterBookmarked && !filterOfflineOnly ? "var(--tu-accent-subtle)" : "transparent",
            color: selectedCourseId === null && !filterBookmarked && !filterOfflineOnly ? "var(--tu-text-primary)" : "var(--tu-text-secondary)",
            fontWeight: selectedCourseId === null && !filterBookmarked && !filterOfflineOnly ? 600 : 400,
            marginBottom: "4px",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={16} color="var(--tu-accent)" />
            <span>All Courses & Materials</span>
          </div>
        </button>

        <button
          onClick={onToggleBookmarked}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            backgroundColor: filterBookmarked ? "rgba(245, 158, 11, 0.15)" : "transparent",
            color: filterBookmarked ? "#f59e0b" : "var(--tu-text-secondary)",
            fontWeight: filterBookmarked ? 600 : 400,
            marginBottom: "4px",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Bookmark size={16} color="#f59e0b" />
            <span>Bookmarked Slides</span>
          </div>
        </button>

        <button
          onClick={onToggleOfflineOnly}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            backgroundColor: filterOfflineOnly ? "rgba(16, 185, 129, 0.15)" : "transparent",
            color: filterOfflineOnly ? "var(--tu-status-success)" : "var(--tu-text-secondary)",
            fontWeight: filterOfflineOnly ? 600 : 400,
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HardDrive size={16} color="var(--tu-status-success)" />
            <span>Cached Offline Only</span>
          </div>
          <span style={{ fontSize: "11px", backgroundColor: "var(--tu-bg-canvas)", padding: "2px 6px", borderRadius: "10px" }}>
            {storageStats.cachedCount}
          </span>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--tu-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
          Active Courses (WS 2026/27)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {courses.map((course) => {
            const isSelected = selectedCourseId === course.id;
            return (
              <button
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: isSelected ? "1px solid var(--tu-border-focus)" : "1px solid transparent",
                  backgroundColor: isSelected ? "var(--tu-accent-subtle)" : "transparent",
                  color: "var(--tu-text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: course.color,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: course.color }}>
                      {course.code}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--tu-text-muted)" }}>
                    {course.slideCount} decks
                  </span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {course.name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--tu-text-secondary)", marginTop: "2px" }}>
                  {course.lecturer}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: "16px",
          borderTop: "1px solid var(--tu-border)",
          backgroundColor: "var(--tu-bg-canvas)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--tu-text-secondary)" }}>
            <HardDrive size={14} />
            <span>Offline Slide Quota</span>
          </div>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--tu-text-primary)" }}>
            {storageStats.percent}%
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: "6px",
            backgroundColor: "var(--tu-border)",
            borderRadius: "3px",
            overflow: "hidden",
            marginBottom: "6px",
          }}
        >
          <div
            style={{
              width: `${storageStats.percent}%`,
              height: "100%",
              backgroundColor: storageStats.percent > 90 ? "var(--tu-status-error)" : "var(--tu-accent)",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--tu-text-muted)" }}>
          <span>{storageStats.usedMb} MB used</span>
          <span>{storageStats.totalQuotaMb} MB max</span>
        </div>
      </div>
    </aside>
  );
};
