"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ============================================================
// 型
// ============================================================
type Level = "baby" | "elementary" | "junior" | "high" | "toeic";

interface WordRow {
  id: string;
  level: Level;
  word: string;
  meaning: string;
  part_of_speech: string | null;
  image_id: string;
}

interface QuestionRow {
  id: string;
  level: Level;
  sentence: string;
  japanese: string;
  image_id: string;
}

const LEVELS: Level[] = ["baby", "elementary", "junior", "high", "toeic"];
const LEVEL_LABEL: Record<Level, string> = {
  baby: "ベビー", elementary: "小学生", junior: "中学生", high: "高校生", toeic: "TOEIC",
};
const LEVEL_COLOR: Record<Level, string> = {
  baby: "bg-pink-100 text-pink-700 border-pink-300",
  elementary: "bg-yellow-100 text-yellow-700 border-yellow-300",
  junior: "bg-blue-100 text-blue-700 border-blue-300",
  high: "bg-purple-100 text-purple-700 border-purple-300",
  toeic: "bg-gray-100 text-gray-700 border-gray-300",
};

// ============================================================
// ユーティリティ
// ============================================================
function toImageId(word: string): string {
  return "word_" + word.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

function toQuestionImageId(level: Level, index: number): string {
  return `q_${level}_${String(index + 1).padStart(3, "0")}`;
}

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function buildWordCSV(rows: WordRow[]): string {
  const header = "type,level,db_id,word,meaning,part_of_speech,image_id,image_filename";
  const lines = rows.map(r =>
    [
      "word",
      r.level,
      r.id,
      escapeCSV(r.word),
      escapeCSV(r.meaning),
      r.part_of_speech ?? "",
      r.image_id,
      r.image_id + ".png",
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

function buildQuestionCSV(rows: QuestionRow[]): string {
  const header = "type,level,db_id,sentence,japanese,image_id,image_filename";
  const lines = rows.map(r =>
    [
      "question",
      r.level,
      r.id,
      escapeCSV(r.sentence),
      escapeCSV(r.japanese),
      r.image_id,
      r.image_id + ".png",
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

function downloadCSV(content: string, filename: string) {
  const bom = "\uFEFF"; // Excel向けBOM（日本語文字化け防止）
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function ImageExportPage() {
  const [tab, setTab] = useState<"words" | "questions">("words");
  const [selectedLevel, setSelectedLevel] = useState<Level | "all">("all");
  const [wordRows, setWordRows] = useState<WordRow[]>([]);
  const [questionRows, setQuestionRows] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, { words: number; questions: number }>>({});

  // ── データ取得 ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 単語
        const { data: wData } = await supabase
          .from("words")
          .select("id,level,word,meaning,part_of_speech")
          .in("part_of_speech", ["noun", "verb", "adj", "adv", "phrase", "conj", "prep"])
          .order("level")
          .order("word");

        const words: WordRow[] = (wData ?? []).map(w => ({
          id: w.id,
          level: w.level as Level,
          word: w.word,
          meaning: w.meaning,
          part_of_speech: w.part_of_speech,
          image_id: toImageId(w.word),
        }));
        setWordRows(words);

        // 問題文
        const { data: qData } = await supabase
          .from("questions")
          .select("id,level,sentence,japanese")
          .order("level")
          .order("created_at");

        // レベル別にインデックスを付与
        const qByLevel: Partial<Record<Level, typeof qData>> = {};
        for (const q of (qData ?? [])) {
          const lv = q.level as Level;
          if (!qByLevel[lv]) qByLevel[lv] = [];
          qByLevel[lv]!.push(q);
        }
        const questions: QuestionRow[] = [];
        for (const lv of LEVELS) {
          (qByLevel[lv] ?? []).forEach((q, i) => {
            questions.push({
              id: q.id,
              level: lv,
              sentence: q.sentence,
              japanese: q.japanese,
              image_id: toQuestionImageId(lv, i),
            });
          });
        }
        setQuestionRows(questions);

        // カウント集計
        const cnt: Record<string, { words: number; questions: number }> = {};
        for (const lv of LEVELS) {
          cnt[lv] = {
            words: words.filter(w => w.level === lv).length,
            questions: questions.filter(q => q.level === lv).length,
          };
        }
        setCounts(cnt);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── フィルター済みデータ ──────────────────────────────────────
  const filteredWords = selectedLevel === "all"
    ? wordRows
    : wordRows.filter(w => w.level === selectedLevel);

  const filteredQuestions = selectedLevel === "all"
    ? questionRows
    : questionRows.filter(q => q.level === selectedLevel);

  // ── CSV ダウンロード ─────────────────────────────────────────
  const downloadWords = () => {
    const csv = buildWordCSV(filteredWords);
    const suffix = selectedLevel === "all" ? "all" : selectedLevel;
    downloadCSV(csv, `words_image_ids_${suffix}.csv`);
  };

  const downloadQuestions = () => {
    const csv = buildQuestionCSV(filteredQuestions);
    const suffix = selectedLevel === "all" ? "all" : selectedLevel;
    downloadCSV(csv, `questions_image_ids_${suffix}.csv`);
  };

  // ── UI ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-5xl mx-auto">

      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800 mb-1">🖼️ 画像ID エクスポート</h1>
        <p className="text-sm text-gray-500">
          単語・問題文に画像IDを付与してCSVとして出力します。
          画像ファイルは <code className="bg-gray-100 px-1 rounded">image_filename</code> の名前で準備してください。
        </p>
      </div>

      {/* タブ */}
      <div className="flex gap-2 mb-4">
        {(["words", "questions"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              tab === t
                ? "bg-indigo-600 text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            {t === "words" ? "📚 単語（名詞等）" : "📝 問題文"}
          </button>
        ))}
      </div>

      {/* 難易度フィルター */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedLevel("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${
            selectedLevel === "all"
              ? "bg-gray-700 text-white border-gray-700"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          全難易度
        </button>
        {LEVELS.map(lv => (
          <button
            key={lv}
            onClick={() => setSelectedLevel(lv)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${
              selectedLevel === lv
                ? LEVEL_COLOR[lv] + " font-black"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {LEVEL_LABEL[lv]}
            <span className="ml-1.5 text-xs opacity-70">
              ({counts[lv]?.[tab === "words" ? "words" : "questions"] ?? 0})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span className="text-4xl animate-spin mr-3">⏳</span>読み込み中...
        </div>
      ) : (
        <>
          {/* サマリーカード */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {LEVELS.map(lv => (
              <div key={lv} className={`rounded-xl border p-3 text-center ${LEVEL_COLOR[lv]}`}>
                <p className="font-black text-sm">{LEVEL_LABEL[lv]}</p>
                <p className="text-2xl font-black">
                  {tab === "words" ? counts[lv]?.words : counts[lv]?.questions}
                </p>
                <p className="text-xs opacity-70">{tab === "words" ? "単語" : "問題"}</p>
              </div>
            ))}
          </div>

          {/* ダウンロードボタン */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={tab === "words" ? downloadWords : downloadQuestions}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow"
            >
              ⬇️ CSV ダウンロード
              <span className="text-xs opacity-80">
                ({tab === "words" ? filteredWords.length : filteredQuestions.length}件)
              </span>
            </button>
            {selectedLevel !== "all" && (
              <button
                onClick={() => {
                  const allCsv = tab === "words"
                    ? buildWordCSV(wordRows)
                    : buildQuestionCSV(questionRows);
                  const name = tab === "words"
                    ? "words_image_ids_all.csv"
                    : "questions_image_ids_all.csv";
                  downloadCSV(allCsv, name);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
              >
                ⬇️ 全難易度 CSV
              </button>
            )}
          </div>

          {/* プレビューテーブル */}
          {tab === "words" ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["難易度", "db_id (先頭8桁)", "word", "meaning", "品詞", "image_id", "image_filename"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWords.map((row, i) => (
                      <tr key={row.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLOR[row.level]}`}>
                            {LEVEL_LABEL[row.level]}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-400">{row.id.slice(0, 8)}…</td>
                        <td className="px-3 py-2 font-bold text-gray-800">{row.word}</td>
                        <td className="px-3 py-2 text-gray-600">{row.meaning}</td>
                        <td className="px-3 py-2 text-gray-400 text-xs">{row.part_of_speech ?? "-"}</td>
                        <td className="px-3 py-2 font-mono text-xs text-indigo-600">{row.image_id}</td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{row.image_id}.png</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredWords.length === 0 && (
                  <div className="py-12 text-center text-gray-400">データがありません</div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["難易度", "db_id (先頭8桁)", "sentence", "japanese", "image_id", "image_filename"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.map((row, i) => (
                      <tr key={row.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLOR[row.level]}`}>
                            {LEVEL_LABEL[row.level]}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-400">{row.id.slice(0, 8)}…</td>
                        <td className="px-3 py-2 text-gray-800 max-w-[200px] truncate" title={row.sentence}>{row.sentence}</td>
                        <td className="px-3 py-2 text-gray-600 max-w-[160px] truncate" title={row.japanese}>{row.japanese}</td>
                        <td className="px-3 py-2 font-mono text-xs text-indigo-600">{row.image_id}</td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{row.image_id}.png</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredQuestions.length === 0 && (
                  <div className="py-12 text-center text-gray-400">データがありません</div>
                )}
              </div>
            </div>
          )}

          {/* CSV フォーマット説明 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="font-bold text-blue-800 mb-2 text-sm">📋 CSVフォーマット説明</p>
            {tab === "words" ? (
              <div className="space-y-1 text-xs text-blue-700">
                <p><code className="bg-blue-100 px-1 rounded">type</code> — 常に "word"</p>
                <p><code className="bg-blue-100 px-1 rounded">level</code> — 難易度 (baby / elementary / junior / high / toeic)</p>
                <p><code className="bg-blue-100 px-1 rounded">db_id</code> — Supabase wordsテーブルのUUID</p>
                <p><code className="bg-blue-100 px-1 rounded">word</code> — 英単語</p>
                <p><code className="bg-blue-100 px-1 rounded">meaning</code> — 日本語の意味</p>
                <p><code className="bg-blue-100 px-1 rounded">image_id</code> — 画像の識別子 (例: word_cat)</p>
                <p><code className="bg-blue-100 px-1 rounded">image_filename</code> — 用意する画像ファイル名 (例: word_cat.png)</p>
              </div>
            ) : (
              <div className="space-y-1 text-xs text-blue-700">
                <p><code className="bg-blue-100 px-1 rounded">type</code> — 常に "question"</p>
                <p><code className="bg-blue-100 px-1 rounded">level</code> — 難易度</p>
                <p><code className="bg-blue-100 px-1 rounded">db_id</code> — Supabase questionsテーブルのUUID</p>
                <p><code className="bg-blue-100 px-1 rounded">sentence</code> — 英文</p>
                <p><code className="bg-blue-100 px-1 rounded">japanese</code> — 日本語訳</p>
                <p><code className="bg-blue-100 px-1 rounded">image_id</code> — 画像の識別子 (例: q_baby_001)</p>
                <p><code className="bg-blue-100 px-1 rounded">image_filename</code> — 用意する画像ファイル名 (例: q_baby_001.png)</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
