export interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  lecturer: string;
  color: string;
  icon: string;
  slideCount: number;
}

export interface SlidePage {
  pageNumber: number;
  title: string;
  content: string[];
  notes?: string;
  codeSnippet?: string;
}

export interface SlideDeck {
  id: string;
  courseId: string;
  lectureNumber: number;
  title: string;
  description: string;
  topics: string[];
  pageCount: number;
  fileSize: string;
  uploadDate: string;
  cached: boolean;
  bookmarked: boolean;
  pdfUrl?: string;
  pages: SlidePage[];
}

export interface SlideSearchResult {
  deck: SlideDeck;
  matchedPageNumber?: number;
  matchedSnippet: string;
  matchType: "title" | "topic" | "content";
}
