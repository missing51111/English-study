import { supabase } from "@/lib/supabase";

export type StudyImageLevel = "baby" | "elementary" | "junior" | "high" | "toeic";

export type StudyImageRecord = {
  id: string;
  type: "word" | "phrase" | "question";
  english_text: string;
  japanese_text: string;
  image_group: "words" | "questions";
  image_name: string | null;
  image_status: string | null;
  level: StudyImageLevel;
};

type WordRow = {
  id: string;
  level: StudyImageLevel;
  word: string;
  meaning: string;
  part_of_speech: string | null;
  image_name?: string | null;
  image_status?: string | null;
};

type QuestionRow = {
  id: string;
  level: StudyImageLevel;
  sentence: string;
  japanese: string;
  image_name?: string | null;
  image_status?: string | null;
};

function isPhraseText(text: string): boolean {
  return /\s/.test(text.trim());
}

function normalizeWordType(row: WordRow): "word" | "phrase" {
  const pos = (row.part_of_speech ?? "").toLowerCase();
  return pos.includes("phrase") || isPhraseText(row.word) ? "phrase" : "word";
}

export async function fetchWordImageRecords(level?: StudyImageLevel): Promise<StudyImageRecord[]> {
  let query = supabase
    .from("words")
    .select("id,level,word,meaning,part_of_speech,image_name,image_status")
    .order("word", { ascending: true });

  if (level) query = query.eq("level", level);

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as WordRow[]).map((row) => ({
    id: row.id,
    type: normalizeWordType(row),
    english_text: row.word,
    japanese_text: row.meaning,
    image_group: "words",
    image_name: row.image_name ?? null,
    image_status: row.image_status ?? null,
    level: row.level,
  }));
}

export async function fetchQuestionImageRecords(level?: StudyImageLevel): Promise<StudyImageRecord[]> {
  let query = supabase
    .from("questions")
    .select("id,level,sentence,japanese,image_name,image_status")
    .order("created_at", { ascending: true });

  if (level) query = query.eq("level", level);

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as QuestionRow[]).map((row) => ({
    id: row.id,
    type: "question",
    english_text: row.sentence,
    japanese_text: row.japanese,
    image_group: "questions",
    image_name: row.image_name ?? null,
    image_status: row.image_status ?? null,
    level: row.level,
  }));
}
