export type AppLevel = "baby" | "elementary" | "junior" | "high" | "toeic";

export type VocabularyItem = {
  word: string;
  meaning: string;
  part_of_speech: string | null | undefined;
};

export const VOCABULARY_LEVEL_TARGETS: Record<
  AppLevel,
  { words: number; phrases: number; label: string }
> = {
  baby: { words: 120, phrases: 20, label: "ベビー" },
  elementary: { words: 400, phrases: 40, label: "小学生" },
  junior: { words: 800, phrases: 120, label: "中学生" },
  high: { words: 2000, phrases: 200, label: "高校生" },
  toeic: { words: 1500, phrases: 250, label: "TOEIC" },
};

export const VOCABULARY_LEVEL_RANGES: Record<
  AppLevel,
  { minimum: number; comfortable: number }
> = {
  baby: { minimum: 180, comfortable: 220 },
  elementary: { minimum: 450, comfortable: 600 },
  junior: { minimum: 850, comfortable: 1000 },
  high: { minimum: 1300, comfortable: 1800 },
  toeic: { minimum: 700, comfortable: 900 },
};

export function primaryPartOfSpeech(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .split("/")
    .map((part) => part.trim().toLowerCase())
    .find(Boolean) ?? null;
}

export function isPhraseText(text: string): boolean {
  return /\s/.test(text.trim());
}

export function isPhraseItem(item: { word: string; part_of_speech: string | null | undefined }): boolean {
  const pos = (item.part_of_speech ?? "").toLowerCase();
  return pos.includes("phrase") || isPhraseText(item.word);
}

export function isTestableWordItem(item: { word: string; part_of_speech: string | null | undefined }): boolean {
  if (isPhraseItem(item)) return false;
  return /^[a-z]+$/i.test(item.word.trim());
}

export function getVocabularyPriority(item: VocabularyItem, level: AppLevel): number {
  const pos = primaryPartOfSpeech(item.part_of_speech);
  const phrase = isPhraseItem(item);
  const lettersOnly = isTestableWordItem(item);

  if (level === "baby" || level === "elementary") {
    if (!phrase && (pos === "noun" || pos === "verb" || pos === "adj")) return 4;
    if (phrase) return 3;
    if (lettersOnly) return 2;
    return 1;
  }

  if (level === "junior") {
    if (!phrase && (pos === "verb" || pos === "noun" || pos === "adj")) return 4;
    if (phrase) return 3;
    if (lettersOnly) return 2;
    return 1;
  }

  if (level === "high") {
    if (!phrase && (pos === "verb" || pos === "noun" || pos === "adj" || pos === "adv")) return 4;
    if (phrase) return 3;
    return 1;
  }

  if (!phrase && (pos === "noun" || pos === "verb" || pos === "adj")) return 4;
  if (!phrase && (pos === "adv" || pos === "prep")) return 3;
  if (phrase) return 2;
  return 1;
}

export function getVocabularyFocusLabel(item: VocabularyItem, level: AppLevel): string {
  const priority = getVocabularyPriority(item, level);
  if (priority >= 4) return "おすすめ";
  if (priority === 3) return level === "toeic" ? "実用" : "重要";
  if (priority === 2) return "発展";
  return "補助";
}

export function sortWordsForDisplay<T extends VocabularyItem>(words: T[], level: AppLevel): T[] {
  return [...words].sort((a, b) => {
    const priorityDiff = getVocabularyPriority(b, level) - getVocabularyPriority(a, level);
    if (priorityDiff !== 0) return priorityDiff;

    const phraseDiff = Number(isPhraseItem(a)) - Number(isPhraseItem(b));
    if (phraseDiff !== 0) return phraseDiff;

    const posA = primaryPartOfSpeech(a.part_of_speech) ?? "";
    const posB = primaryPartOfSpeech(b.part_of_speech) ?? "";
    const posDiff = posA.localeCompare(posB);
    if (posDiff !== 0) return posDiff;

    return a.word.localeCompare(b.word);
  });
}

export function getRemainingVocabularyCount(level: AppLevel, totalCount: number) {
  const range = VOCABULARY_LEVEL_RANGES[level];
  return {
    minimum: Math.max(0, range.minimum - totalCount),
    comfortable: Math.max(0, range.comfortable - totalCount),
  };
}
