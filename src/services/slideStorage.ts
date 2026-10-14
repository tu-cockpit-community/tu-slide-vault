import { Course, SlideDeck } from "../types/slide";

export const INITIAL_COURSES: Course[] = [
  {
    id: "algodat",
    code: "185.A48",
    name: "Algorithmen und Datenstrukturen",
    semester: "WS 2026/27",
    lecturer: "Univ.Prof. Dr. Günther Raidl",
    color: "#0284c7",
    icon: "Binary",
    slideCount: 5,
  },
  {
    id: "analysis1",
    code: "101.A01",
    name: "Analysis 1 für Informatik",
    semester: "WS 2026/27",
    lecturer: "Ao.Univ.Prof. Dr. Michael Kaltenbäck",
    color: "#8b5cf6",
    icon: "FunctionSquare",
    slideCount: 4,
  },
  {
    id: "eprog",
    code: "185.A91",
    name: "Einführung in das Programmieren 1",
    semester: "WS 2026/27",
    lecturer: "Univ.Prof. Dr. Jens Knoop",
    color: "#10b981",
    icon: "Code2",
    slideCount: 4,
  },
  {
    id: "linalg",
    code: "101.A02",
    name: "Lineare Algebra für Informatik",
    semester: "WS 2026/27",
    lecturer: "Univ.Prof. Dr. Martin Goldstern",
    color: "#f59e0b",
    icon: "Boxes",
    slideCount: 3,
  },
  {
    id: "dbs",
    code: "184.708",
    name: "Datenbanksysteme",
    semester: "WS 2026/27",
    lecturer: "Univ.Prof. Dr. Reinhard Pichler",
    color: "#ec4899",
    icon: "Database",
    slideCount: 3,
  },
];

export const INITIAL_DECKS: SlideDeck[] = [
  {
    id: "algodat-lec01",
    courseId: "algodat",
    lectureNumber: 1,
    title: "Einführung & Asymptotische Komplexität",
    description: "Definition von Algorithmen, Laufzeitanalyse, Landau-Symbole (O, Omega, Theta) und Rechenregeln.",
    topics: ["Komplexität", "Landau-Symbole", "O-Notation", "Worst-Case", "Best-Case"],
    pageCount: 38,
    fileSize: "4.2 MB",
    uploadDate: "2026-10-02",
    cached: true,
    bookmarked: true,
    pages: [
      {
        pageNumber: 1,
        title: "Algorithmen und Datenstrukturen - Vorlesung 1",
        content: [
          "Institut für Logic and Computation",
          "Forschungsbereich Algorithmen und Komplexität",
          "Vorlesung WS 2026/27 - Univ.Prof. Dr. Günther Raidl",
        ],
        notes: "Einführungsvorlesung im Freihaus Hörsaal 1.",
      },
      {
        pageNumber: 2,
        title: "Was ist ein Algorithmus?",
        content: [
          "Eine präzise, endliche Beschreibung eines schrittweisen Verfahrens zur Lösung einer Problemklasse.",
          "Eigenschaften: Determiniertheit, Determinismus, Finitheit, Terminierung.",
          "Effizienzmaßstab: Zeitkomplexität T(n) und Speicherplatzbedarf S(n).",
        ],
      },
      {
        pageNumber: 3,
        title: "Landau-Symbole (Asymptotische Schranken)",
        content: [
          "O(g(n)): Obere Schranke. Existieren c > 0, n_0 >= 0, sodass f(n) <= c * g(n) für alle n >= n_0.",
          "Omega(g(n)): Untere Schranke. f(n) >= c * g(n) für hinreichend große n.",
          "Theta(g(n)): Exakte asymptotische Ordnung: f(n) in O(g(n)) und f(n) in Omega(g(n)).",
        ],
        codeSnippet: "// Typische Komplexitätsklassen:\nO(1)        < O(log n) < O(n) \n< O(n log n) < O(n^2)   < O(2^n) < O(n!)",
      },
    ],
  },
  {
    id: "algodat-lec02",
    courseId: "algodat",
    lectureNumber: 2,
    title: "Divide & Conquer, MergeSort & QuickSort",
    description: "Teile-und-Herrsche-Prinzip, Rekurrenzen lösen mit dem Master-Theorem, Pivot-Strategien in QuickSort.",
    topics: ["Divide-and-Conquer", "MergeSort", "QuickSort", "Master-Theorem", "Rekursion"],
    pageCount: 46,
    fileSize: "5.8 MB",
    uploadDate: "2026-10-09",
    cached: true,
    bookmarked: false,
    pages: [
      {
        pageNumber: 1,
        title: "Divide & Conquer Paradigma",
        content: [
          "1. Divide: Zerlege das Problem in kleinere Teilprobleme derselben Art.",
          "2. Conquer: Löse die Teilprobleme rekursiv (oder direkt im Basisfall).",
          "3. Combine: Setze die Teillösungen zur Gesamtlösung zusammen.",
        ],
      },
      {
        pageNumber: 2,
        title: "MergeSort Analyse",
        content: [
          "Stabiles Sortierverfahren mit garantierter O(n log n) Laufzeit.",
          "Rekursionsgleichung: T(n) = 2 * T(n/2) + O(n).",
          "Zusätzlicher Speicherbedarf: O(n) für das Hilfsarray beim Mergen.",
        ],
        codeSnippet: "void mergeSort(int[] a, int l, int r) {\n  if (l < r) {\n    int m = (l + r) / 2;\n    mergeSort(a, l, m);\n    mergeSort(a, m + 1, r);\n    merge(a, l, m, r);\n  }\n}",
      },
      {
        pageNumber: 3,
        title: "Das Master-Theorem",
        content: [
          "Löst Rekurrenzen der Form T(n) = a * T(n/b) + f(n) mit a >= 1, b > 1.",
          "Fall 1: f(n) = O(n^(log_b(a) - eps)) => T(n) = Theta(n^(log_b(a)))",
          "Fall 2: f(n) = Theta(n^(log_b(a)) * log^k(n)) => T(n) = Theta(n^(log_b(a)) * log^(k+1)(n))",
          "Fall 3: f(n) = Omega(n^(log_b(a) + eps)) => T(n) = Theta(f(n))",
        ],
      },
    ],
  },
  {
    id: "algodat-lec03",
    courseId: "algodat",
    lectureNumber: 3,
    title: "Balancierte Suchbäume (AVL & Rot-Schwarz)",
    description: "Binäre Suchbäume, Baumrotationen, Höhenbalancierung nach Adelson-Velsky und Landis.",
    topics: ["Suchbäume", "AVL-Bäume", "Rot-Schwarz-Bäume", "Rotationen", "Baumbalancierung"],
    pageCount: 52,
    fileSize: "6.1 MB",
    uploadDate: "2026-10-16",
    cached: false,
    bookmarked: true,
    pages: [
      {
        pageNumber: 1,
        title: "Binäre Suchbäume & Degenerationsproblem",
        content: [
          "Invariante: keys(links) < key(v) < keys(rechts).",
          "Problem: Bei sortierter Einfügereihenfolge entartet der Baum zu einer linearen Liste (Höhe h = n, O(n) Suche).",
          "Lösung: Explizite Balancierungsregeln garantieren logarithmische Höhe h = O(log n).",
        ],
      },
      {
        pageNumber: 2,
        title: "AVL-Bäume (Höhenbalancierung)",
        content: [
          "Balance-Faktor: bf(v) = height(rechts) - height(links) in {-1, 0, 1}.",
          "Wiederherstellung bei Verletzung durch Links- und Rechtsrotationen.",
          "Einfügen und Löschen in O(log n) Zeit mit maximal 2 Rotationen beim Einfügen.",
        ],
      },
    ],
  },
  {
    id: "analysis1-lec01",
    courseId: "analysis1",
    lectureNumber: 1,
    title: "Reelle Zahlen, Axiome & Folgenkonvergenz",
    description: "Körperaxiome, Ordnungsaxiome, Vollständigkeitsaxiom, Supremum, Infimum, Epsilon-Definition von Grenzwerten.",
    topics: ["Reelle Zahlen", "Folgen", "Konvergenz", "Supremum", "Epsilon-Kriterium"],
    pageCount: 32,
    fileSize: "3.7 MB",
    uploadDate: "2026-10-04",
    cached: true,
    bookmarked: false,
    pages: [
      {
        pageNumber: 1,
        title: "Vollständigkeit der Reellen Zahlen",
        content: [
          "R ist ein vollständiger archimedisch geordneter Körper.",
          "Supremumsaxiom: Jede nach oben beschränkte nichtleere Teilmenge von R besitzt ein Supremum in R.",
          "Unterschied zu Q: In Q existiert kein Supremum für {x in Q | x^2 < 2}.",
        ],
      },
      {
        pageNumber: 2,
        title: "Konvergenz von Zahlenfolgen",
        content: [
          "Eine Folge (a_n) konvergiert gegen a in R, falls für jedes eps > 0 ein N(eps) in N existiert,",
          "sodass |a_n - a| < eps für alle n >= N(eps).",
          "Grenzwertsätze: Summe, Produkt und Quotient konvergenter Folgen.",
        ],
      },
    ],
  },
  {
    id: "analysis1-lec02",
    courseId: "analysis1",
    lectureNumber: 2,
    title: "Unendliche Reihen & Konvergenzkriterien",
    description: "Partialsummen, geometrische Reihe, harmonische Reihe, Quotientenkriterium, Wurzelkriterium, Leibniz-Kriterium.",
    topics: ["Reihen", "Quotientenkriterium", "Wurzelkriterium", "Leibniz", "Absolute Konvergenz"],
    pageCount: 41,
    fileSize: "4.9 MB",
    uploadDate: "2026-10-11",
    cached: false,
    bookmarked: false,
    pages: [
      {
        pageNumber: 1,
        title: "Definition unendlicher Reihen",
        content: [
          "Summe s_n = sum_{k=1}^n a_k heißt n-te Partialsumme.",
          "Die Reihe konvergiert, falls der Grenzwert lim_{n -> infty} s_n existiert.",
          "Notwendige Bedingung: a_n muss eine Nullfolge sein (lim a_n = 0).",
        ],
      },
    ],
  },
  {
    id: "eprog-lec01",
    courseId: "eprog",
    lectureNumber: 1,
    title: "Java Grundkonzepte & Kontrollstrukturen",
    description: "Compiler vs. Interpreter, JVM Bytecode, primitive Datentypen, Operatoren, Verzweigungen und Schleifen.",
    topics: ["Java", "JVM", "Variablen", "Kontrollstrukturen", "Schleifen"],
    pageCount: 44,
    fileSize: "4.1 MB",
    uploadDate: "2026-10-03",
    cached: true,
    bookmarked: false,
    pages: [
      {
        pageNumber: 1,
        title: "Einführung in das Programmieren 1",
        content: [
          "TU Wien - Fakultät für Informatik",
          "Vorlesung gehalten im AudiMax",
          "Plattformunabhängigkeit durch Java Virtual Machine (Write Once, Run Anywhere).",
        ],
      },
      {
        pageNumber: 2,
        title: "Primitive Datentypen in Java",
        content: [
          "Ganzzahlig: byte (8-bit), short (16-bit), int (32-bit), long (64-bit).",
          "Gleitkomma: float (32-bit IEEE 754), double (64-bit).",
          "Wahrheitswert: boolean (true / false).",
          "Zeichen: char (16-bit Unicode UTF-16).",
        ],
        codeSnippet: "public class HelloWorld {\n  public static void main(String[] args) {\n    System.out.println(\"Servus TU Wien!\");\n  }\n}",
      },
    ],
  },
  {
    id: "eprog-lec02",
    courseId: "eprog",
    lectureNumber: 2,
    title: "Objektorientierte Programmierung: Klassen & Objekte",
    description: "Kapselung, Information Hiding, Konstruktoren, statische vs. Instanzvariablen, Referenztypen.",
    topics: ["OOP", "Klassen", "Objekte", "Konstruktoren", "Kapselung"],
    pageCount: 50,
    fileSize: "5.3 MB",
    uploadDate: "2026-10-10",
    cached: false,
    bookmarked: true,
    pages: [
      {
        pageNumber: 1,
        title: "Prinzip der Datenkapselung",
        content: [
          "Attribute werden als private deklariert.",
          "Zugriff erfolgt ausschließlich über öffentliche Getter- und Setter-Methoden.",
          "Verhindert inkonsistente Objektzustände durch externe Manipulation.",
        ],
      },
    ],
  },
  {
    id: "linalg-lec01",
    courseId: "linalg",
    lectureNumber: 1,
    title: "Vektorräume, Lineare Unabhängigkeit & Basen",
    description: "Definition von Vektorräumen über Körpern K, Linearkombinationen, Erzeugendensysteme, Dimension.",
    topics: ["Vektorräume", "Lineare Unabhängigkeit", "Basis", "Dimension", "Untervektorraum"],
    pageCount: 36,
    fileSize: "3.5 MB",
    uploadDate: "2026-10-05",
    cached: true,
    bookmarked: false,
    pages: [
      {
        pageNumber: 1,
        title: "Axiome des Vektorraums",
        content: [
          "(V, +) ist eine abelsche Gruppe.",
          "Skalarmultiplikation K x V -> V erfüllt Distributiv- und Assoziativgesetze.",
          "Neutrale Elemente: 0_V und 1_K.",
        ],
      },
    ],
  },
  {
    id: "dbs-lec01",
    courseId: "dbs",
    lectureNumber: 1,
    title: "Relationales Modell & Relationale Algebra",
    description: "Relationen, Schemata, Primärschlüssel, Fremdschlüssel, Selektion, Projektion, Join-Operatoren.",
    topics: ["Relationale Algebra", "Relationales Modell", "Primärschlüssel", "Joins", "SQL"],
    pageCount: 42,
    fileSize: "4.8 MB",
    uploadDate: "2026-10-08",
    cached: true,
    bookmarked: true,
    pages: [
      {
        pageNumber: 1,
        title: "Grundbegriffe des Relationalen Modells",
        content: [
          "Relation: Teilmenge des kartesischen Produkts D_1 x D_2 x ... x D_n.",
          "Tupel: Eine Zeile in einer relationalen Tabelle.",
          "Integritätsbedingungen: Entity Integrity (Primärschlüssel darf nicht NULL sein), Referentielle Integrität (Fremdschlüssel muss existieren oder NULL sein).",
        ],
        codeSnippet: "-- Relationale Algebra vs. SQL:\nsigma_{semester='WS26'}(Studenten) \n<=> SELECT * FROM Studenten WHERE semester='WS26';",
      },
    ],
  },
];

const STORAGE_KEY_DECKS = "tu_slide_vault_decks";

export function loadSlideDecks(): SlideDeck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DECKS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load slide decks from localStorage", e);
  }
  return INITIAL_DECKS;
}

export function saveSlideDecks(decks: SlideDeck[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks));
  } catch (e) {
    console.error("Failed to save slide decks to localStorage", e);
  }
}

export function toggleCachedState(id: string): SlideDeck[] {
  const decks = loadSlideDecks();
  const updated = decks.map((deck) =>
    deck.id === id ? { ...deck, cached: !deck.cached } : deck
  );
  saveSlideDecks(updated);
  return updated;
}

export function toggleBookmarkState(id: string): SlideDeck[] {
  const decks = loadSlideDecks();
  const updated = decks.map((deck) =>
    deck.id === id ? { ...deck, bookmarked: !deck.bookmarked } : deck
  );
  saveSlideDecks(updated);
  return updated;
}

export function calculateStorageQuota(decks: SlideDeck[]): {
  usedMb: number;
  totalQuotaMb: number;
  percent: number;
  cachedCount: number;
} {
  const cachedDecks = decks.filter((d) => d.cached);
  const usedMb = cachedDecks.reduce((sum, d) => {
    const mb = parseFloat(d.fileSize.replace(" MB", "")) || 4.0;
    return sum + mb;
  }, 0);
  const totalQuotaMb = 100;
  const percent = Math.min(100, Math.round((usedMb / totalQuotaMb) * 100));

  return {
    usedMb: Math.round(usedMb * 10) / 10,
    totalQuotaMb,
    percent,
    cachedCount: cachedDecks.length,
  };
}
