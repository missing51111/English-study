"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

const LEVELS = [
  {
    id: "baby",
    label: "ベビー",
    label_en: "Baby",
    word_count: 200,
    color: "#f9a8d4",
    description:
      "色・数・動物・食べ物・体の部位など具体的な名詞・動作語。フォニックスで発音しやすい語を優先。",
  },
  {
    id: "elementary",
    label: "小学生",
    label_en: "Elementary",
    word_count: 400,
    color: "#fde68a",
    description: "家族・学校・乗り物・天気・簡単な動詞など基礎英語。",
  },
  {
    id: "junior",
    label: "中学生",
    label_en: "Junior High",
    word_count: 400,
    color: "#67e8f9",
    description: "学習指導要領の基本語彙。be動詞〜一般動詞・形容詞・副詞。",
  },
  {
    id: "high",
    label: "高校生",
    label_en: "High School",
    word_count: 400,
    color: "#a5b4fc",
    description: "共通テスト〜大学受験レベル。抽象語・熟語・複合語。",
  },
  {
    id: "toeic",
    label: "TOEIC",
    label_en: "TOEIC",
    word_count: 400,
    color: "#6ee7b7",
    description: "TOEICビジネス語彙。頻出動詞・名詞・会議・メール・契約語彙。",
  },
];

const BATCH = 20;

const LEVEL_BATCHES: Record<string, number> = {
  baby: 10,       // 200語
  elementary: 20, // 400語
  junior: 20,     // 400語
  high: 20,       // 400語
  toeic: 20,      // 400語
};

type WordEntry = {
  word: string;
  meaning_ja: string;
  reading: string;
  pos: string;
  example_en: string;
  example_ja: string;
};

function buildPrompt(
  level: (typeof LEVELS)[number],
  offset: number,
  batchSize: number,
  prevWords: WordEntry[]
): string {
  const prevList =
    prevWords.length > 0
      ? `\n【除外語（既出）】${prevWords
          .slice(-100)
          .map((w) => w.word)
          .join(", ")}`
      : "";

  return `あなたは英語教育の専門家です。以下の条件で英単語リストをJSON配列のみで出力してください。

【レベル】${level.label}（${level.label_en}）
【対象】${level.description}
【出力数】${batchSize}語（通し番号 ${offset + 1}〜${offset + batchSize}）${prevList}

各オブジェクトに以下フィールドを含めてください：
"word": 英単語
"meaning_ja": 日本語の意味（短く）
"reading": カタカナ読み
"pos": 品詞(noun/verb/adj/adv/phrase)
"example_en": 自然な英語例文（1文）
"example_ja": 例文の日本語訳

JSON配列のみ返してください。マークダウンや説明文は不要です。`;
}

function toCSV(words: WordEntry[], levelId: string): string {
  const headers = [
    "level",
    "word",
    "meaning_ja",
    "reading",
    "pos",
    "example_en",
    "example_ja",
  ];
  const esc = (v: unknown) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = words.map((w) =>
    [
      esc(levelId),
      esc(w.word),
      esc(w.meaning_ja),
      esc(w.reading),
      esc(w.pos),
      esc(w.example_en),
      esc(w.example_ja),
    ].join(",")
  );
  return "\uFEFF" + [headers.join(","), ...rows].join("\n");
}

function downloadCSV(words: WordEntry[], levelId: string) {
  const blob = new Blob([toCSV(words, levelId)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `words_${levelId}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type Status = "idle" | "running" | "done" | "error" | "stopped";

export default function VocabGeneratorPage() {
  const [results, setResults] = useState<Record<string, WordEntry[]>>({});
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    () => Object.fromEntries(LEVELS.map((l) => [l.id, "idle"])) as Record<string, Status>
  );
  const [progresses, setProgresses] = useState<
    Record<string, { current: number; total: number }>
  >(
    () =>
      Object.fromEntries(
        LEVELS.map((l) => [
          l.id,
          { current: 0, total: LEVEL_BATCHES[l.id] * BATCH },
        ])
      ) as Record<string, { current: number; total: number }>
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [previewLevel, setPreviewLevel] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<Record<string, string>>({});
  const abortRef = useRef(false);

  const totalGenerated = Object.values(results).reduce(
    (s, ws) => s + ws.length,
    0
  );

  async function runLevel(levelId: string) {
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return;

    abortRef.current = false;
    setRunning(true);
    setErrors((p) => ({ ...p, [levelId]: "" }));
    setStatuses((p) => ({ ...p, [levelId]: "running" }));
    setProgresses((p) => ({
      ...p,
      [levelId]: { current: 0, total: LEVEL_BATCHES[levelId] * BATCH },
    }));

    const batchCount = LEVEL_BATCHES[levelId];
    let lvWords: WordEntry[] = [];

    for (let i = 0; i < batchCount; i++) {
      if (abortRef.current) {
        setStatuses((p) => ({ ...p, [levelId]: "stopped" }));
        setRunning(false);
        return;
      }
      try {
        const prompt = buildPrompt(level, i * BATCH, BATCH, lvWords);
        const res = await fetch("/api/generate-words", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const parsed: WordEntry[] = JSON.parse(
          data.text.replace(/```json|```/g, "").trim()
        );
        lvWords = [...lvWords, ...parsed];
        setResults((p) => ({ ...p, [levelId]: [...lvWords] }));
        setProgresses((p) => ({
          ...p,
          [levelId]: {
            current: lvWords.length,
            total: batchCount * BATCH,
          },
        }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setErrors((p) => ({ ...p, [levelId]: `バッチ${i + 1}エラー: ${msg}` }));
        setStatuses((p) => ({ ...p, [levelId]: "error" }));
        setRunning(false);
        return;
      }
    }
    setStatuses((p) => ({ ...p, [levelId]: "done" }));
    setRunning(false);
  }

  function stop() {
    abortRef.current = true;
  }

  async function saveToSupabase(levelId: string) {
    const words = results[levelId];
    if (!words || words.length === 0) return;
    setSaving(levelId);
    setSaveMsg((p) => ({ ...p, [levelId]: "" }));

    const rows = words.map((w) => ({
      level: levelId,
      word: w.word,
      meaning: w.meaning_ja,
      part_of_speech: w.pos,
    }));

    // 重複しないよう ON CONFLICT DO NOTHING
    const { error, count } = await supabase
      .from("words")
      .upsert(rows, { onConflict: "word,level", ignoreDuplicates: true })
      .select("id");

    if (error) {
      setSaveMsg((p) => ({
        ...p,
        [levelId]: `❌ エラー: ${error.message}`,
      }));
    } else {
      setSaveMsg((p) => ({
        ...p,
        [levelId]: `✅ ${count ?? words.length}語を保存しました`,
      }));
    }
    setSaving(null);
  }

  const statusIcon: Record<Status, string> = {
    idle: "○",
    running: "⟳",
    done: "✓",
    error: "✕",
    stopped: "■",
  };
  const statusColor: Record<Status, string> = {
    idle: "#475569",
    running: "#fbbf24",
    done: "#34d399",
    error: "#f87171",
    stopped: "#94a3b8",
  };

  return (
    <div
      style={{
        fontFamily: "system-ui,sans-serif",
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
        background: "#0f172a",
        minHeight: "100vh",
        color: "#e2e8f0",
      }}
    >
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 4,
          color: "#f1f5f9",
        }}
      >
        📚 単語帳ジェネレーター
      </h1>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
        AIで単語を生成 → Supabaseに保存します
      </p>

      {/* レベル別カード */}
      <div
        style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}
      >
        {LEVELS.map((lv) => {
          const st = statuses[lv.id];
          const pg = progresses[lv.id];
          const pct =
            pg.total > 0 ? Math.round((pg.current / pg.total) * 100) : 0;
          const lvWords = results[lv.id] || [];

          return (
            <div
              key={lv.id}
              style={{
                background: "#1e293b",
                borderRadius: 10,
                padding: "12px 16px",
                border: `1px solid ${
                  st === "running" ? lv.color + "60" : "#1e293b"
                }`,
              }}
            >
              {/* ヘッダー行 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: st === "running" ? 8 : 0,
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    color: statusColor[st],
                    minWidth: 20,
                  }}
                >
                  {statusIcon[st]}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: lv.color,
                    minWidth: 80,
                  }}
                >
                  {lv.label}
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  目標 {(LEVEL_BATCHES[lv.id] * BATCH).toLocaleString()}語
                </span>
                {pg.current > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#94a3b8",
                      marginLeft: "auto",
                    }}
                  >
                    {pg.current.toLocaleString()}語生成済み
                  </span>
                )}

                {/* ボタン群 */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {st === "idle" || st === "stopped" || st === "error" ? (
                    <button
                      onClick={() => runLevel(lv.id)}
                      disabled={running}
                      style={{
                        padding: "4px 14px",
                        borderRadius: 6,
                        border: "none",
                        background: running ? "#334155" : "#6366f1",
                        color: running ? "#64748b" : "#fff",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: running ? "not-allowed" : "pointer",
                      }}
                    >
                      ▶ 生成
                    </button>
                  ) : null}

                  {running && st === "running" && (
                    <button
                      onClick={stop}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "1px solid #ef4444",
                        background: "transparent",
                        color: "#ef4444",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      ■ 停止
                    </button>
                  )}

                  {lvWords.length > 0 && (
                    <>
                      <button
                        onClick={() => downloadCSV(lvWords, lv.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "none",
                          background: "#059669",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ⬇ CSV
                      </button>
                      <button
                        onClick={() => saveToSupabase(lv.id)}
                        disabled={saving === lv.id}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "none",
                          background:
                            saving === lv.id ? "#334155" : "#0284c7",
                          color: saving === lv.id ? "#64748b" : "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor:
                            saving === lv.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {saving === lv.id ? "保存中…" : "☁ DB保存"}
                      </button>
                      <button
                        onClick={() =>
                          setPreviewLevel(
                            previewLevel === lv.id ? null : lv.id
                          )
                        }
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid #334155",
                          background: "transparent",
                          color: "#94a3b8",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        {previewLevel === lv.id ? "▲ 閉じる" : "▼ 確認"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* プログレスバー */}
              {st === "running" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: "#64748b",
                      marginBottom: 4,
                    }}
                  >
                    <span>生成中…</span>
                    <span>{pct}%</span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "#0f172a",
                      borderRadius: 99,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: `linear-gradient(90deg,${lv.color},${lv.color}88)`,
                        borderRadius: 99,
                        transition: "width .3s",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* エラー / 保存メッセージ */}
              {errors[lv.id] && (
                <div style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>
                  ⚠ {errors[lv.id]}
                </div>
              )}
              {saveMsg[lv.id] && (
                <div
                  style={{
                    fontSize: 12,
                    color: saveMsg[lv.id].startsWith("✅")
                      ? "#34d399"
                      : "#f87171",
                    marginTop: 4,
                  }}
                >
                  {saveMsg[lv.id]}
                </div>
              )}

              {/* プレビューテーブル */}
              {previewLevel === lv.id && lvWords.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    overflowX: "auto",
                    borderRadius: 8,
                    border: "1px solid #334155",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 11,
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#0f172a" }}>
                        {[
                          "#",
                          "word",
                          "meaning_ja",
                          "reading",
                          "pos",
                          "example_en",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "6px 10px",
                              textAlign: "left",
                              color: "#64748b",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              borderBottom: "1px solid #1e293b",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lvWords.slice(0, 30).map((w, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: "1px solid #0f172a30",
                            background:
                              i % 2 === 0 ? "transparent" : "#0f172a40",
                          }}
                        >
                          <td
                            style={{ padding: "5px 10px", color: "#475569" }}
                          >
                            {i + 1}
                          </td>
                          <td
                            style={{
                              padding: "5px 10px",
                              color: "#e2e8f0",
                              fontWeight: 600,
                            }}
                          >
                            {w.word}
                          </td>
                          <td
                            style={{ padding: "5px 10px", color: "#94a3b8" }}
                          >
                            {w.meaning_ja}
                          </td>
                          <td
                            style={{ padding: "5px 10px", color: "#94a3b8" }}
                          >
                            {w.reading}
                          </td>
                          <td
                            style={{ padding: "5px 10px", color: "#64748b" }}
                          >
                            {w.pos}
                          </td>
                          <td
                            style={{
                              padding: "5px 10px",
                              color: "#64748b",
                              maxWidth: 220,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {w.example_en}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {lvWords.length > 30 && (
                    <div
                      style={{
                        padding: "6px 10px",
                        color: "#475569",
                        fontSize: 11,
                        textAlign: "center",
                        background: "#0f172a",
                      }}
                    >
                      … 残り {lvWords.length - 30}語（DB保存・CSVに全件含まれます）
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 合計 */}
      {totalGenerated > 0 && (
        <div
          style={{
            background: "#1e293b",
            borderRadius: 10,
            padding: "14px 18px",
          }}
        >
          <div
            style={{
              fontSize: 13,
              
            } as React.CSSProperties}
          >
            合計 {totalGenerated.toLocaleString()}語 生成済み
          </div>
        </div>
      )}
    </div>
  );
}
