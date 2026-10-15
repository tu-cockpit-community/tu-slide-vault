import React from "react";
import { Search, X, Tag } from "lucide-react";

interface SlideSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
  onSelectTopic: (topic: string) => void;
  activeTopic: string | null;
  availableTopics: string[];
}

export const SlideSearchBar: React.FC<SlideSearchBarProps> = ({
  query,
  onQueryChange,
  resultCount,
  totalCount,
  onSelectTopic,
  activeTopic,
  availableTopics,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "var(--tu-bg-surface)",
          border: "1px solid var(--tu-border)",
          borderRadius: "8px",
          padding: "8px 14px",
          gap: "10px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        <Search size={18} color="var(--tu-text-secondary)" />
        <input
          type="text"
          placeholder="Search slide titles, topics, code snippets, or slide text..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          style={{
            flex: 1,
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            color: "var(--tu-text-primary)",
            fontSize: "14px",
            fontFamily: "var(--tu-font-sans)",
          }}
        />

        {query && (
          <button
            onClick={() => onQueryChange("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--tu-text-secondary)",
              display: "flex",
              alignItems: "center",
              padding: "2px",
            }}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}

        <div
          style={{
            fontSize: "12px",
            color: "var(--tu-text-muted)",
            borderLeft: "1px solid var(--tu-border)",
            paddingLeft: "10px",
            whiteSpace: "nowrap",
          }}
        >
          {resultCount} of {totalCount} decks
        </div>
      </div>

      {availableTopics.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            overflowX: "auto",
            paddingBottom: "2px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--tu-text-muted)", marginRight: "4px" }}>
            <Tag size={12} />
            <span>Topics:</span>
          </div>

          {availableTopics.map((topic) => {
            const isActive = activeTopic === topic || query.toLowerCase() === topic.toLowerCase();
            return (
              <button
                key={topic}
                onClick={() => onSelectTopic(topic)}
                style={{
                  backgroundColor: isActive ? "var(--tu-accent)" : "var(--tu-bg-elevated)",
                  color: isActive ? "#ffffff" : "var(--tu-text-secondary)",
                  border: "1px solid",
                  borderColor: isActive ? "var(--tu-accent)" : "var(--tu-border)",
                  borderRadius: "14px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {topic}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
