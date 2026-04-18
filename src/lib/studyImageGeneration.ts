import type { StudyImageRecord } from "@/lib/studyImageRecords";

export const STUDY_IMAGE_SIZE = "1024x1024";

export const STUDY_IMAGE_STYLE_LABEL = "やさしい学習カード風イラスト";

export const STUDY_IMAGE_STYLE_PROMPT = [
  "Create a square educational app illustration for children.",
  "Use a consistent friendly style with soft rounded shapes and clean digital painting.",
  "Keep the composition simple with one main subject or one easy-to-read scene.",
  "Use bright but gentle colors and soft shadows.",
  "Use no background or a transparent background if possible.",
  "Avoid decorative scenery unless it is necessary for understanding the scene.",
  "No text, no letters, no numbers, no speech bubbles, no watermark, no logo.",
  "Make the image easy to understand at small mobile card size.",
].join(" ");

type StudyImageDecision = {
  shouldGenerate: boolean;
  skipReason: string | null;
  subjectPrompt: string | null;
};

const ABSTRACT_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "if",
  "so",
  "because",
  "that",
  "which",
  "who",
  "whom",
  "whose",
  "this",
  "these",
  "those",
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "have",
  "has",
  "had",
  "will",
  "would",
  "can",
  "could",
  "may",
  "might",
  "must",
  "shall",
  "should",
  "to",
  "of",
  "for",
  "in",
  "on",
  "at",
  "by",
  "with",
  "from",
  "about",
  "into",
  "after",
  "before",
  "during",
  "without",
  "within",
  "under",
  "over",
  "between",
  "through",
  "across",
  "toward",
  "until",
  "further",
  "notice",
  "advised",
]);

const ABSTRACT_PHRASES = [
  "in fact",
  "for example",
  "as soon as",
  "in order to",
  "according to",
  "ahead of schedule",
  "be advised",
  "have been",
  "would have",
  "had i known",
];

const IMAGEABLE_PHRASES = [
  "get up",
  "sit down",
  "stand up",
  "look at",
  "listen to",
  "wake up",
  "go home",
  "come in",
  "put on",
  "take off",
  "wash hands",
  "brush teeth",
  "ride a bike",
  "play soccer",
  "play the piano",
];

const ABSTRACT_QUESTION_TERMS = [
  "environment",
  "truth",
  "important",
  "schedule",
  "project",
  "meeting",
  "postponed",
  "notice",
  "advised",
  "completed",
  "differently",
];

function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function stripSentencePunctuation(text: string): string {
  return text.replace(/[.?!,]/g, "").replace(/\s+/g, " ").trim();
}

function isAbstractPhrase(text: string): boolean {
  const normalized = normalizeText(text);
  return ABSTRACT_PHRASES.some((phrase) => normalized.includes(phrase));
}

function isClearlyImageablePhrase(text: string): boolean {
  const normalized = normalizeText(text);
  return IMAGEABLE_PHRASES.some((phrase) => normalized === phrase);
}

function decideWordOrPhrase(record: StudyImageRecord): StudyImageDecision {
  const normalized = normalizeText(record.english_text);
  const compact = normalized.replace(/\s+/g, "");

  if (!compact) {
    return {
      shouldGenerate: false,
      skipReason: "英語テキストが空のため",
      subjectPrompt: null,
    };
  }

  if (record.type === "phrase") {
    if (isClearlyImageablePhrase(normalized)) {
      return {
        shouldGenerate: true,
        skipReason: null,
        subjectPrompt: `Show the phrase "${record.english_text}" as one clear everyday action scene.`,
      };
    }

    if (normalized.split(" ").length > 4 || isAbstractPhrase(normalized)) {
      return {
        shouldGenerate: false,
        skipReason: "熟語が抽象的で絵にしづらいため",
        subjectPrompt: null,
      };
    }

    return {
      shouldGenerate: true,
      skipReason: null,
      subjectPrompt: `Create one simple scene that visually explains the phrase "${record.english_text}".`,
    };
  }

  if (compact.length <= 2 || ABSTRACT_WORDS.has(normalized)) {
    return {
      shouldGenerate: false,
      skipReason: "機能語または抽象度が高く絵にしづらいため",
      subjectPrompt: null,
    };
  }

  return {
    shouldGenerate: true,
    skipReason: null,
    subjectPrompt: `Illustrate the English word "${record.english_text}" as one clear object, animal, person, or action.`,
  };
}

function decideQuestion(record: StudyImageRecord): StudyImageDecision {
  const plainSentence = stripSentencePunctuation(record.english_text);
  const normalized = normalizeText(plainSentence);
  const words = normalized.split(" ").filter(Boolean);

  if (words.length === 0) {
    return {
      shouldGenerate: false,
      skipReason: "問題文が空のため",
      subjectPrompt: null,
    };
  }

  if (words.length > 10) {
    return {
      shouldGenerate: false,
      skipReason: "問題文が長く、1枚の絵で表しにくいため",
      subjectPrompt: null,
    };
  }

  if (
    normalized.includes("if ") ||
    normalized.includes("would have") ||
    normalized.includes("have been") ||
    normalized.includes("had i known") ||
    ABSTRACT_QUESTION_TERMS.some((term) => normalized.includes(term))
  ) {
    return {
      shouldGenerate: false,
      skipReason: "抽象表現や文法中心で絵にしづらいため",
      subjectPrompt: null,
    };
  }

  return {
    shouldGenerate: true,
    skipReason: null,
    subjectPrompt: `Create one simple illustration based on this Japanese meaning: "${record.japanese_text}". Show only the clearest subject or action from the sentence. Keep it literal, easy to understand, and suitable as a hint image.`,
  };
}

export function getStudyImageDecision(record: StudyImageRecord): StudyImageDecision {
  if (record.type === "question") return decideQuestion(record);
  return decideWordOrPhrase(record);
}

export function getStudyImageFileName(record: StudyImageRecord): string {
  const baseName = record.image_name?.trim() || record.id;
  return `${baseName}.png`;
}

export function getStudyImageRelativePath(record: StudyImageRecord): string {
  return `/images/${record.image_group}/${getStudyImageFileName(record)}`;
}

export function buildStudyImagePrompt(record: StudyImageRecord): string {
  const decision = getStudyImageDecision(record);
  if (!decision.subjectPrompt) return "";

  const typeLine =
    record.type === "question"
      ? "This image is for an English sentence question hint card."
      : record.type === "phrase"
        ? "This image is for an English phrase card."
        : "This image is for an English vocabulary card.";

  return [
    STUDY_IMAGE_STYLE_PROMPT,
    typeLine,
    decision.subjectPrompt,
    `Japanese meaning: "${record.japanese_text}".`,
  ].join(" ");
}
