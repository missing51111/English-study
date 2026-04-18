"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchQuestionImageRecords,
  fetchWordImageRecords,
  type StudyImageRecord,
  type StudyImageLevel,
} from "@/lib/studyImageRecords";
import {
  STUDY_IMAGE_SIZE,
  STUDY_IMAGE_STYLE_LABEL,
  STUDY_IMAGE_STYLE_PROMPT,
  buildStudyImagePrompt,
  getStudyImageDecision,
  getStudyImageFileName,
  getStudyImageRelativePath,
} from "@/lib/studyImageGeneration";

type Tab = "words" | "questions";
type FilterLevel = StudyImageLevel | "all";

type ExportRow = StudyImageRecord & {
  shouldGenerate: boolean;
  skipReason: string | null;
  fileName: string;
  relativePath: string;
  prompt: string;
};

type AssetCheckState = "idle" | "checking" | "ready" | "missing";

const LEVELS: StudyImageLevel[] = ["baby", "elementary", "junior", "high", "toeic"];

const LEVEL_LABEL: Record<StudyImageLevel, string> = {
  baby: "ベビー",
  elementary: "小学生",
  junior: "中学生",
  high: "高校生",
  toeic: "TOEIC",
};

const LEVEL_COLOR: Record<StudyImageLevel, string> = {
  baby: "bg-pink-100 text-pink-700 border-pink-300",
  elementary: "bg-yellow-100 text-yellow-700 border-yellow-300",
  junior: "bg-blue-100 text-blue-700 border-blue-300",
  high: "bg-purple-100 text-purple-700 border-purple-300",
  toeic: "bg-gray-100 text-gray-700 border-gray-300",
};

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toExportRows(records: StudyImageRecord[]): ExportRow[] {
  return records.map((record) => {
    const decision = getStudyImageDecision(record);
    return {
      ...record,
      shouldGenerate: decision.shouldGenerate,
      skipReason: decision.skipReason,
      fileName: getStudyImageFileName(record),
      relativePath: getStudyImageRelativePath(record),
      prompt: buildStudyImagePrompt(record),
    };
  });
}

function buildCsv(rows: ExportRow[]): string {
  const header = [
    "type",
    "level",
    "db_id",
    "english_text",
    "japanese_text",
    "image_group",
    "image_filename",
    "relative_path",
    "should_generate",
    "skip_reason",
    "style_label",
    "size",
    "style_prompt",
    "generation_prompt",
  ].join(",");

  const lines = rows.map((row) =>
    [
      row.type,
      row.level,
      row.id,
      escapeCsv(row.english_text),
      escapeCsv(row.japanese_text),
      row.image_group,
      row.fileName,
      row.relativePath,
      row.shouldGenerate ? "yes" : "no",
      escapeCsv(row.skipReason ?? ""),
      escapeCsv(STUDY_IMAGE_STYLE_LABEL),
      STUDY_IMAGE_SIZE,
      escapeCsv(STUDY_IMAGE_STYLE_PROMPT),
      escapeCsv(row.prompt),
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

function checkImageAvailability(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = `${src}?v=${Date.now()}`;
  });
}

export default function ImageExportPage() {
  const [tab, setTab] = useState<Tab>("words");
  const [selectedLevel, setSelectedLevel] = useState<FilterLevel>("all");
  const [wordRows, setWordRows] = useState<ExportRow[]>([]);
  const [questionRows, setQuestionRows] = useState<ExportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetStates, setAssetStates] = useState<Record<string, AssetCheckState>>({});
  const [isCheckingAssets, setIsCheckingAssets] = useState(false);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [wordRecords, questionRecords] = await Promise.all([
          fetchWordImageRecords(),
          fetchQuestionImageRecords(),
        ]);

        if (cancelled) return;

        setWordRows(toExportRows(wordRecords));
        setQuestionRows(toExportRows(questionRecords));
      } catch (loadError) {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : "画像エクスポートデータの取得に失敗しました。";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredWords = useMemo(
    () => (selectedLevel === "all" ? wordRows : wordRows.filter((row) => row.level === selectedLevel)),
    [selectedLevel, wordRows]
  );

  const filteredQuestions = useMemo(
    () => (selectedLevel === "all" ? questionRows : questionRows.filter((row) => row.level === selectedLevel)),
    [selectedLevel, questionRows]
  );

  const currentRows = tab === "words" ? filteredWords : filteredQuestions;
  const allCurrentRows = tab === "words" ? wordRows : questionRows;
  const readyCount = currentRows.filter((row) => row.shouldGenerate).length;
  const selectedPreviewRow = currentRows.find((row) => row.id === selectedPreviewId) ?? null;
  const checkedReadyCount = currentRows.filter((row) => assetStates[row.id] === "ready").length;
  const checkedMissingCount = currentRows.filter((row) => assetStates[row.id] === "missing").length;

  const countsByLevel = useMemo(() => {
    const source = tab === "words" ? wordRows : questionRows;

    return Object.fromEntries(
      LEVELS.map((level) => [
        level,
        {
          total: source.filter((row) => row.level === level).length,
          ready: source.filter((row) => row.level === level && row.shouldGenerate).length,
        },
      ])
    ) as Record<StudyImageLevel, { total: number; ready: number }>;
  }, [questionRows, tab, wordRows]);

  const downloadCurrentCsv = (onlyReady: boolean) => {
    const rows = onlyReady ? currentRows.filter((row) => row.shouldGenerate) : currentRows;
    const levelSuffix = selectedLevel === "all" ? "all" : selectedLevel;
    const readySuffix = onlyReady ? "_ready" : "_all";
    downloadCsv(buildCsv(rows), `${tab}_images_${levelSuffix}${readySuffix}.csv`);
  };

  const downloadAllLevelsCsv = () => {
    downloadCsv(buildCsv(allCurrentRows), `${tab}_images_all.csv`);
  };

  const runAssetCheck = async () => {
    const targetRows = currentRows.filter((row) => row.shouldGenerate);
    if (targetRows.length === 0) return;

    setIsCheckingAssets(true);
    setAssetStates((previous) => {
      const next = { ...previous };
      targetRows.forEach((row) => {
        next[row.id] = "checking";
      });
      return next;
    });

    const results = await Promise.all(
      targetRows.map(async (row) => ({
        id: row.id,
        exists: await checkImageAvailability(row.relativePath),
      }))
    );

    setAssetStates((previous) => {
      const next = { ...previous };
      results.forEach((result) => {
        next[result.id] = result.exists ? "ready" : "missing";
      });
      return next;
    });
    setIsCheckingAssets(false);
  };

  useEffect(() => {
    if (!selectedPreviewId && currentRows.length > 0) {
      setSelectedPreviewId(currentRows[0].id);
      return;
    }

    if (selectedPreviewId && !currentRows.some((row) => row.id === selectedPreviewId)) {
      setSelectedPreviewId(currentRows[0]?.id ?? null);
    }
  }, [currentRows, selectedPreviewId]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">Canva / 画像生成運用</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">学習画像エクスポート</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                DBの <code className="rounded bg-slate-100 px-1">id</code> をそのまま画像ファイル名に使う前提で、
                画像化しやすい単語・熟語・問題文だけをCSVで書き出します。Canvaに渡す共通タッチのプロンプトも同梱しています。
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">
              <p className="font-bold">{STUDY_IMAGE_SIZE} PNG</p>
              <p className="mt-1 text-slate-300">保存先: <code>/public/images/words</code> / <code>/public/images/questions</code></p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[1.4fr,1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">統一タッチ</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              小さなカード表示でも見やすいように、やさしい学習カード風の正方形イラストで統一します。
              文字は入れず、主役をひとつに絞るルールです。
            </p>
            <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-sm leading-6 text-slate-100">
              {STUDY_IMAGE_STYLE_PROMPT}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">命名ルール</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                画像ファイル名は原則 <code className="rounded bg-slate-100 px-1">DBのid.png</code> です。
              </p>
              <p>
                `words` は <code className="rounded bg-slate-100 px-1">/images/words/&lt;id&gt;.png</code>。
              </p>
              <p>
                `questions` は <code className="rounded bg-slate-100 px-1">/images/questions/&lt;id&gt;.png</code>。
              </p>
              <p>
                画像化しないものはCSV上で <code className="rounded bg-slate-100 px-1">should_generate = no</code> にしています。
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["words", "questions"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    tab === value
                      ? "bg-indigo-600 text-white shadow"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {value === "words" ? "単語・熟語" : "問題文"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLevel("all")}
                className={`rounded-xl border px-3 py-1.5 text-sm font-bold transition ${
                  selectedLevel === "all"
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                全レベル
              </button>
              {LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-bold transition ${
                    selectedLevel === level
                      ? LEVEL_COLOR[level]
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {LEVEL_LABEL[level]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {LEVELS.map((level) => (
              <div key={level} className={`rounded-2xl border p-3 ${LEVEL_COLOR[level]}`}>
                <p className="text-sm font-black">{LEVEL_LABEL[level]}</p>
                <p className="mt-2 text-2xl font-black">{countsByLevel[level].ready}</p>
                <p className="text-xs opacity-80">画像化候補 / 全{countsByLevel[level].total}件</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => downloadCurrentCsv(true)}
              disabled={loading || !!error}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              画像化候補のみCSV
              <span className="ml-2 text-xs text-indigo-100">({readyCount}件)</span>
            </button>
            <button
              onClick={() => downloadCurrentCsv(false)}
              disabled={loading || !!error}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              フィルター結果を全部CSV
            </button>
            {selectedLevel !== "all" && (
              <button
                onClick={downloadAllLevelsCsv}
                disabled={loading || !!error}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                全レベルCSV
              </button>
            )}
            <button
              onClick={() => void runAssetCheck()}
              disabled={loading || !!error || isCheckingAssets || readyCount === 0}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCheckingAssets ? "画像存在チェック中..." : "配置済み画像を確認"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">画像化候補</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{readyCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">確認OK</p>
              <p className="mt-2 text-2xl font-black text-emerald-700">{checkedReadyCount}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-700">不足画像</p>
              <p className="mt-2 text-2xl font-black text-rose-700">{checkedMissingCount}</p>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            画像エクスポートデータを読み込み中です...
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
            Supabase から画像エクスポート情報を取得できませんでした。<br />
            <span className="font-mono text-xs">{error}</span>
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[1.5fr,0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-black text-slate-900">エクスポート一覧</h2>
                <p className="mt-1 text-sm text-slate-600">
                  <code className="rounded bg-slate-100 px-1">generation_prompt</code> を Canva 側のベース指示として使えます。
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">レベル</th>
                      <th className="px-4 py-3">種別</th>
                      <th className="px-4 py-3">英語</th>
                      <th className="px-4 py-3">画像化</th>
                      <th className="px-4 py-3">配置確認</th>
                      <th className="px-4 py-3">ファイル名</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row, index) => {
                      const assetState = assetStates[row.id] ?? "idle";

                      return (
                        <tr
                          key={row.id}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50/70"} cursor-pointer transition hover:bg-indigo-50`}
                          onClick={() => setSelectedPreviewId(row.id)}
                        >
                          <td className="px-4 py-3 align-top">
                            <div className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${LEVEL_COLOR[row.level]}`}>
                              {LEVEL_LABEL[row.level]}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-slate-600">{row.type}</td>
                          <td className="px-4 py-3 align-top font-semibold text-slate-900">
                            <div>{row.english_text}</div>
                            <div className="mt-1 font-mono text-[11px] text-slate-400">{row.id}</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            {row.shouldGenerate ? (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                                生成する
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
                                スキップ
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {assetState === "ready" && (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                                OK
                              </span>
                            )}
                            {assetState === "missing" && (
                              <span className="inline-flex rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700">
                                不足
                              </span>
                            )}
                            {assetState === "checking" && (
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                                確認中
                              </span>
                            )}
                            {assetState === "idle" && (
                              <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                                未確認
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="font-mono text-xs text-indigo-700">{row.fileName}</div>
                            <div className="mt-1 text-xs text-slate-500">{row.relativePath}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {currentRows.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  該当データがありません。
                </div>
              )}
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">プレビューと確認</h2>
              {selectedPreviewRow ? (
                <div className="mt-4 space-y-4">
                  <div className="aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                    <img
                      src={selectedPreviewRow.relativePath}
                      alt={selectedPreviewRow.english_text}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${LEVEL_COLOR[selectedPreviewRow.level]}`}>
                        {LEVEL_LABEL[selectedPreviewRow.level]}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {selectedPreviewRow.type}
                      </span>
                    </div>
                    <p className="text-lg font-black text-slate-900">{selectedPreviewRow.english_text}</p>
                    <p className="text-sm leading-6 text-slate-600">{selectedPreviewRow.japanese_text}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-mono text-xs text-indigo-700">{selectedPreviewRow.fileName}</p>
                    <p className="mt-1 text-xs">{selectedPreviewRow.relativePath}</p>
                    {selectedPreviewRow.shouldGenerate ? (
                      <p className="mt-3 text-xs leading-5">{selectedPreviewRow.prompt}</p>
                    ) : (
                      <p className="mt-3 text-xs leading-5 text-slate-500">{selectedPreviewRow.skipReason}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">一覧から1件選ぶと、画像プレビューとパス確認ができます。</p>
              )}
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}
