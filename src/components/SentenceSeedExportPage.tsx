"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Level = "baby" | "elementary" | "junior" | "high" | "toeic";

type WordSeedRow = {
  id: string;
  level: Level;
  word: string;
  meaning: string;
  part_of_speech: string | null;
  reading: string | null;
  example_en: string | null;
  example_ja: string | null;
};

type ExportSeedRow = {
  targetLevel: Level;
  sourceLevel: Level;
  dbId: string;
  english: string;
  japanese: string;
  itemType: "word" | "phrase";
  partOfSpeech: string;
  reading: string;
  exampleEn: string;
  exampleJa: string;
};

const LEVEL_ORDER: Level[] = ["baby", "elementary", "junior", "high", "toeic"];

const LEVEL_LABEL: Record<Level, string> = {
  baby: "ベビー",
  elementary: "小学生",
  junior: "中学生",
  high: "高校生",
  toeic: "TOEIC",
};

const LEVEL_COLOR: Record<Level, string> = {
  baby: "border-pink-200 bg-pink-50 text-pink-700",
  elementary: "border-amber-200 bg-amber-50 text-amber-700",
  junior: "border-sky-200 bg-sky-50 text-sky-700",
  high: "border-violet-200 bg-violet-50 text-violet-700",
  toeic: "border-slate-200 bg-slate-100 text-slate-700",
};

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function isPhrase(word: string, partOfSpeech: string | null): boolean {
  const normalized = (partOfSpeech ?? "").toLowerCase();
  return normalized.includes("phrase") || /\s/.test(word.trim());
}

function normalizePartOfSpeech(partOfSpeech: string | null): string {
  return (
    partOfSpeech
      ?.split("/")
      .map((value) => value.trim().toLowerCase())
      .find(Boolean) ?? ""
  );
}

function buildSeedRows(rows: WordSeedRow[], targetLevel: Level): ExportSeedRow[] {
  const maxLevelIndex = LEVEL_ORDER.indexOf(targetLevel);

  return rows
    .filter((row) => LEVEL_ORDER.indexOf(row.level) <= maxLevelIndex)
    .map((row) => ({
      targetLevel,
      sourceLevel: row.level,
      dbId: row.id,
      english: row.word,
      japanese: row.meaning ?? "",
      itemType: isPhrase(row.word, row.part_of_speech) ? "phrase" : "word",
      partOfSpeech: normalizePartOfSpeech(row.part_of_speech),
      reading: row.reading ?? "",
      exampleEn: row.example_en ?? "",
      exampleJa: row.example_ja ?? "",
    }));
}

function buildCsv(rows: ExportSeedRow[]): string {
  const header = [
    "target_level",
    "source_level",
    "db_id",
    "english",
    "japanese",
    "item_type",
    "part_of_speech",
    "reading",
    "example_en",
    "example_ja",
  ].join(",");

  const lines = rows.map((row) =>
    [
      row.targetLevel,
      row.sourceLevel,
      row.dbId,
      escapeCsv(row.english),
      escapeCsv(row.japanese),
      row.itemType,
      escapeCsv(row.partOfSpeech),
      escapeCsv(row.reading),
      escapeCsv(row.exampleEn),
      escapeCsv(row.exampleJa),
    ].join(",")
  );

  return [header, ...lines].join("\n");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SentenceSeedExportPage() {
  const [rows, setRows] = useState<WordSeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level>("baby");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("words")
        .select("id,level,word,meaning,part_of_speech,reading,example_en,example_ja")
        .order("level", { ascending: true })
        .order("word", { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setRows((data ?? []) as WordSeedRow[]);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const exportRows = useMemo(() => buildSeedRows(rows, selectedLevel), [rows, selectedLevel]);

  const countsByLevel = useMemo(
    () =>
      Object.fromEntries(
        LEVEL_ORDER.map((level) => {
          const levelRows = buildSeedRows(rows, level);
          return [
            level,
            {
              total: levelRows.length,
              words: levelRows.filter((row) => row.itemType === "word").length,
              phrases: levelRows.filter((row) => row.itemType === "phrase").length,
            },
          ];
        })
      ) as Record<Level, { total: number; words: number; phrases: number }>,
    [rows]
  );

  const previewRows = exportRows.slice(0, 12);

  const handleDownload = (level: Level) => {
    const seedRows = buildSeedRows(rows, level);
    downloadCsv(buildCsv(seedRows), `sentence_seed_${level}.csv`);
  };

  const handleDownloadAll = () => {
    LEVEL_ORDER.forEach((level) => {
      handleDownload(level);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-600">CSV Export / 文章生成用</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">難易度別 単語DBエクスポート</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            各難易度について、その難易度以下で使える単語・熟語を累積でCSV出力します。
            チャッピーに文を作ってもらう前提なので、列は
            <code className="rounded bg-slate-100 px-1">英語 / 日本語 / 品詞 / 単語 or 熟語 / 読み / 例文</code>
            に絞っています。
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {LEVEL_ORDER.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                    selectedLevel === level
                      ? LEVEL_COLOR[level]
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {LEVEL_LABEL[level]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleDownload(selectedLevel)}
                disabled={loading || !!error}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {LEVEL_LABEL[selectedLevel]} CSV
              </button>
              <button
                onClick={handleDownloadAll}
                disabled={loading || !!error}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                全難易度CSV
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {LEVEL_ORDER.map((level) => (
              <div key={level} className={`rounded-2xl border p-4 ${LEVEL_COLOR[level]}`}>
                <p className="text-sm font-black">{LEVEL_LABEL[level]}</p>
                <p className="mt-2 text-2xl font-black">{countsByLevel[level].total}</p>
                <p className="mt-1 text-xs opacity-80">
                  単語 {countsByLevel[level].words} / 熟語 {countsByLevel[level].phrases}
                </p>
              </div>
            ))}
          </div>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            単語データを読み込み中です...
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
            Supabase から単語データの取得に失敗しました。
            <div className="mt-2 font-mono text-xs">{error}</div>
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-black text-slate-900">CSVプレビュー</h2>
                <p className="mt-1 text-sm text-slate-600">
                  現在は <span className="font-bold">{LEVEL_LABEL[selectedLevel]}</span> 用の先頭12件を表示しています。
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">source</th>
                      <th className="px-4 py-3">type</th>
                      <th className="px-4 py-3">english</th>
                      <th className="px-4 py-3">japanese</th>
                      <th className="px-4 py-3">pos</th>
                      <th className="px-4 py-3">db id</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, index) => (
                      <tr key={`${row.targetLevel}-${row.dbId}`} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${LEVEL_COLOR[row.sourceLevel]}`}>
                            {LEVEL_LABEL[row.sourceLevel]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.itemType}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{row.english}</td>
                        <td className="px-4 py-3 text-slate-600">{row.japanese}</td>
                        <td className="px-4 py-3 text-slate-600">{row.partOfSpeech || "-"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{row.dbId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">出力列</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p><code className="rounded bg-slate-100 px-1">target_level</code> 文章生成の対象難易度</p>
                <p><code className="rounded bg-slate-100 px-1">source_level</code> その単語自体の登録難易度</p>
                <p><code className="rounded bg-slate-100 px-1">english</code> 英語の単語・熟語</p>
                <p><code className="rounded bg-slate-100 px-1">japanese</code> 日本語の意味</p>
                <p><code className="rounded bg-slate-100 px-1">item_type</code> `word` または `phrase`</p>
                <p><code className="rounded bg-slate-100 px-1">part_of_speech</code> 品詞</p>
                <p><code className="rounded bg-slate-100 px-1">reading</code> 読み</p>
                <p><code className="rounded bg-slate-100 px-1">example_en / example_ja</code> 既存例文</p>
                <p><code className="rounded bg-slate-100 px-1">db_id</code> 生成後の問題や管理時に照合しやすいID</p>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="font-bold text-slate-900">使い方の想定</p>
                <p className="mt-2">
                  たとえば <span className="font-semibold">中学生 CSV</span> なら、
                  `baby + elementary + junior` の単語・熟語だけが入ります。
                  そのCSVをチャッピーに渡して、
                  「この一覧だけを使って並び替え問題向けの英文を作る」
                  という流れに向いています。
                </p>
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}
