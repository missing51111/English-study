"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Question, Level } from "@/types/database";

// ============================================================
// 型
// ============================================================
interface WordToken {
  id: string;
  word: string;
}

interface TouchState {
  token: WordToken;
  source: "bank" | "slots";
  index: number;
  startX: number;
  startY: number;
  isDragging: boolean;
  ghost: HTMLDivElement | null;
}

// ============================================================
// ユーティリティ
// ============================================================
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wordsToTokens(words: string[]): WordToken[] {
  return words.map((word, i) => ({ id: `${word}-${i}`, word }));
}

// ドラッグ開始と判定する移動距離（px）
const DRAG_THRESHOLD = 8;

// ============================================================
// テーマ
// ============================================================
const LEVEL_THEME: Record<string, {
  bg: string; card: string; border: string; innerCard: string;
  titleText: string; bodyText: string; subText: string;
  accent: string; bar: string; startBtn: string; startText: string;
}> = {
  baby:       { bg: "bg-rose-50",   card: "bg-white", border: "border-rose-300",   innerCard: "bg-rose-100",   titleText: "text-rose-900",   bodyText: "text-rose-800",   subText: "text-rose-500",   accent: "text-rose-700",   bar: "bg-rose-500",   startBtn: "bg-rose-600 hover:bg-rose-500",    startText: "text-white" },
  elementary: { bg: "bg-amber-50",  card: "bg-white", border: "border-amber-300",  innerCard: "bg-amber-100",  titleText: "text-amber-900",  bodyText: "text-amber-900",  subText: "text-amber-600",  accent: "text-amber-700",  bar: "bg-amber-500",  startBtn: "bg-amber-600 hover:bg-amber-500",   startText: "text-white" },
  junior:     { bg: "bg-blue-50",   card: "bg-white", border: "border-blue-300",   innerCard: "bg-blue-100",   titleText: "text-blue-900",   bodyText: "text-blue-900",   subText: "text-blue-600",   accent: "text-blue-700",   bar: "bg-blue-500",   startBtn: "bg-blue-600 hover:bg-blue-500",    startText: "text-white" },
  high:       { bg: "bg-violet-50", card: "bg-white", border: "border-violet-300", innerCard: "bg-violet-100", titleText: "text-violet-900", bodyText: "text-violet-900", subText: "text-violet-600", accent: "text-violet-700", bar: "bg-violet-500", startBtn: "bg-violet-600 hover:bg-violet-500", startText: "text-white" },
  toeic:      { bg: "bg-gray-100",  card: "bg-white", border: "border-gray-400",   innerCard: "bg-gray-200",   titleText: "text-gray-900",   bodyText: "text-gray-900",   subText: "text-gray-600",   accent: "text-gray-700",   bar: "bg-gray-600",   startBtn: "bg-gray-700 hover:bg-gray-600",    startText: "text-white" },
};

const LEVEL_LABEL: Record<string, string> = {
  baby: "ベビー", elementary: "小学生", junior: "中学生", high: "高校生", toeic: "TOEIC",
};

// モックデータ
const MOCK_QUESTIONS: Question[] = [
  { id: "mock-1", level: "baby",       sentence: "I like cats .",                          japanese: "わたしは ねこが すきです。",           words: ["I", "like", "cats"],                                                          punctuation: ".", hint: "ねこ = cats",                      created_at: "" },
  { id: "mock-2", level: "elementary", sentence: "I play soccer every day .",              japanese: "わたしは毎日サッカーをします。",        words: ["I", "play", "soccer", "every", "day"],                                        punctuation: ".", hint: "every day = まいにち",             created_at: "" },
  { id: "mock-3", level: "junior",     sentence: "Could you tell me the way to the station ?", japanese: "駅への道を教えていただけますか。",  words: ["Could", "you", "tell", "me", "the", "way", "to", "the", "station"],           punctuation: "?", hint: "丁寧な依頼表現",                  created_at: "" },
  { id: "mock-4", level: "high",       sentence: "It is important that we protect the environment .", japanese: "私たちが環境を守ることは重要です。", words: ["It", "is", "important", "that", "we", "protect", "the", "environment"],    punctuation: ".", hint: "仮主語構文",                       created_at: "" },
  { id: "mock-5", level: "toeic",      sentence: "The project was completed ahead of schedule .", japanese: "プロジェクトは予定より早く完了した。", words: ["The", "project", "was", "completed", "ahead", "of", "schedule"],          punctuation: ".", hint: "ahead of schedule = 予定より早く", created_at: "" },
];

// ============================================================
// QuizPage
// ============================================================
export default function QuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = (searchParams.get("level") ?? "baby") as Level;
  const t = LEVEL_THEME[level] ?? LEVEL_THEME.baby;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [bank, setBank] = useState<WordToken[]>([]);
  const [slots, setSlots] = useState<WordToken[]>([]);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // タッチドラッグの状態（rerenderしないのでref）
  const touchState = useRef<TouchState | null>(null);
  // タッチで処理済みのとき、後から来るclickを無視するフラグ
  const touchHandled = useRef(false);

  // ============================================================
  // Supabaseから問題取得
  // ============================================================
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === "your-supabase-project-url") {
      const mocked = MOCK_QUESTIONS.filter(q => q.level === level);
      setQuestions(shuffle(mocked.length > 0 ? mocked : MOCK_QUESTIONS));
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("questions").select("*").eq("level", level).limit(10);
    setQuestions(shuffle((!error && data && data.length > 0)
      ? (data as Question[])
      : MOCK_QUESTIONS.filter(q => q.level === level)));
    setLoading(false);
  }, [level]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  // ============================================================
  // 問題セットアップ
  // ============================================================
  useEffect(() => {
    if (questions.length === 0) return;
    const q = questions[currentIndex];
    setBank(shuffle(wordsToTokens(q.words)));
    setSlots([]);
    setResult(null);
    setShowHint(false);
  }, [questions, currentIndex]);

  const currentQ = questions[currentIndex];

  // ============================================================
  // タップ操作（タッチ/クリック共通）
  // bank は常に全単語を保持。slots に選択順を管理。
  // ============================================================
  const tapBank = useCallback((token: WordToken) => {
    setSlots(prev => {
      const isSelected = prev.some(s => s.id === token.id);
      if (isSelected) {
        // すでに選択済み（薄い表示）→ 解除
        return prev.filter(s => s.id !== token.id);
      } else {
        // 未選択 → 末尾に追加
        return [...prev, token];
      }
    });
  }, []);

  const tapSlot = useCallback((token: WordToken) => {
    // スロットから外す（bank はそのまま → 自動的に明るく戻る）
    setSlots(prev => prev.filter(t => t.id !== token.id));
  }, []);

  // ============================================================
  // ドキュメントレベルのタッチハンドラ（非passive、スクロール抑制のため）
  // ============================================================
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      const ts = touchState.current;
      if (!ts) return;

      const touch = e.touches[0];
      const dx = touch.clientX - ts.startX;
      const dy = touch.clientY - ts.startY;

      // 閾値を超えたらドラッグ開始
      if (!ts.isDragging && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        ts.isDragging = true;

        // ゴースト（指に追従する半透明コピー）を生成
        const ghost = document.createElement("div");
        ghost.textContent = ts.token.word;
        Object.assign(ghost.style, {
          position: "fixed",
          left: `${touch.clientX}px`,
          top: `${touch.clientY}px`,
          transform: "translate(-50%, -50%)",
          padding: "8px 14px",
          borderRadius: "12px",
          fontWeight: "bold",
          fontSize: "16px",
          background: "#6366f1",
          color: "white",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          pointerEvents: "none",
          zIndex: "9999",
          opacity: "0.85",
          whiteSpace: "nowrap",
          userSelect: "none",
        });
        document.body.appendChild(ghost);
        ts.ghost = ghost;
      }

      if (ts.isDragging) {
        e.preventDefault(); // ドラッグ中はページスクロールを抑制
        if (ts.ghost) {
          ts.ghost.style.left = `${touch.clientX}px`;
          ts.ghost.style.top = `${touch.clientY}px`;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const ts = touchState.current;
      if (!ts) return;

      // ゴーストを除去
      ts.ghost?.remove();
      ts.ghost = null;

      if (!ts.isDragging) {
        // タップとして処理（後から来るclickはスキップ）
        touchHandled.current = true;
        if (ts.source === "bank") tapBank(ts.token);
        else tapSlot(ts.token);
        touchState.current = null;
        return;
      }

      // ドラッグ終了：指の下にある要素を探してドロップ先を特定
      const touch = e.changedTouches[0];
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);

      let dropSource: "bank" | "slots" | null = null;
      let dropIndex: number | null = null;

      for (const el of elements) {
        const h = el as HTMLElement;
        if (h.dataset.tokenSource) {
          dropSource = h.dataset.tokenSource as "bank" | "slots";
          dropIndex = h.dataset.tokenIndex !== undefined ? parseInt(h.dataset.tokenIndex) : null;
          break;
        }
        if (h.dataset.dropArea) {
          dropSource = h.dataset.dropArea as "bank" | "slots";
          break;
        }
      }

      const { token, source, index } = ts;
      touchState.current = null;

      // ドロップ先に応じて状態を更新
      if (source === "bank" && dropSource === "slots") {
        // バンク → スロット（bank は消さず slots に追加）
        setSlots(prev => {
          if (prev.some(s => s.id === token.id)) return prev; // すでに選択済みなら無視
          const arr = [...prev];
          arr.splice(dropIndex !== null ? dropIndex : arr.length, 0, token);
          return arr;
        });
      } else if (source === "slots" && dropSource === "bank") {
        // スロット → バンク（slots から外すだけ。bank はそのまま）
        setSlots(prev => prev.filter((_, i) => i !== index));
      } else if (source === "slots" && dropSource === "slots" && dropIndex !== null && dropIndex !== index) {
        // スロット内並び替え
        setSlots(prev => {
          const arr = [...prev];
          const [moved] = arr.splice(index, 1);
          arr.splice(dropIndex!, 0, moved);
          return arr;
        });
      }
      // それ以外（バンク内など）は何もしない
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [tapBank, tapSlot]);

  // ============================================================
  // 単語トークンのタッチ開始ハンドラ
  // ============================================================
  const handleTokenTouchStart = (
    e: React.TouchEvent,
    token: WordToken,
    source: "bank" | "slots",
    index: number,
  ) => {
    if (result) return;
    e.stopPropagation();
    const touch = e.touches[0];
    touchState.current = {
      token, source, index,
      startX: touch.clientX,
      startY: touch.clientY,
      isDragging: false,
      ghost: null,
    };
  };

  // タッチ後のclickイベントを無視するラッパー
  const handleTokenClick = (fn: () => void) => {
    if (touchHandled.current) {
      touchHandled.current = false;
      return;
    }
    if (result) return;
    fn();
  };

  // ============================================================
  // 判定
  // ============================================================
  const judge = async () => {
    if (!currentQ || slots.length === 0) return;
    const isCorrect = slots.map(t => t.word).join(" ") === currentQ.words.join(" ");
    setResult(isCorrect ? "correct" : "wrong");
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && supabaseUrl !== "your-supabase-project-url") {
      const mockUserId = "00000000-0000-0000-0000-000000000000";
      await supabase.from("user_answers").insert({ user_id: mockUserId, question_id: currentQ.id, is_correct: isCorrect });
      if (!isCorrect) {
        const { data: existing } = await supabase.from("wrong_answers").select("id")
          .eq("user_id", mockUserId).eq("question_id", currentQ.id).eq("reviewed", false).maybeSingle();
        if (!existing) {
          await supabase.from("wrong_answers").insert({ user_id: mockUserId, question_id: currentQ.id, reviewed: false });
        }
      }
    }
  };

  // ============================================================
  // 次の問題
  // ============================================================
  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) setCurrentIndex(prev => prev + 1);
    else router.push("/");
  };

  // ============================================================
  // ローディング / 問題なし
  // ============================================================
  if (loading) {
    return (
      <div className={`min-h-screen ${t.bg} flex items-center justify-center`}>
        <p className={`text-lg font-bold ${t.bodyText}`}>よみこみちゅう…</p>
      </div>
    );
  }
  if (!currentQ) {
    return (
      <div className={`min-h-screen ${t.bg} flex flex-col items-center justify-center gap-4 p-6`}>
        <p className={`text-lg font-bold ${t.bodyText}`}>問題が見つかりませんでした</p>
        <button onClick={() => router.push("/")} className={`px-6 py-3 rounded-2xl font-bold ${t.startBtn} ${t.startText}`}>
          ホームに戻る
        </button>
      </div>
    );
  }

  const isBaby = level === "baby";
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className={`min-h-screen ${t.bg} flex flex-col max-w-md mx-auto p-4 gap-4`}>

      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/")} className={`text-2xl ${t.subText}`}>←</button>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-bold ${t.subText}`}>{LEVEL_LABEL[level]} — {currentIndex + 1} / {questions.length}</span>
            <span className={`text-xs font-bold ${t.accent}`}>⭐ {score.correct} / {score.total}</span>
          </div>
          <div className={`w-full rounded-full h-2 ${t.innerCard}`}>
            <div className={`h-2 rounded-full transition-all ${t.bar}`} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* 日本語の意味 */}
      <div className={`rounded-2xl p-4 border ${t.card} ${t.border}`}>
        <p className={`text-xs font-bold mb-1 ${t.subText}`}>{isBaby ? "にほんごのいみ" : "日本語の意味"}</p>
        <p className={`font-bold leading-relaxed ${isBaby ? "text-lg" : "text-base"} ${t.titleText}`}>{currentQ.japanese}</p>
        {currentQ.hint && (
          <div className="mt-2">
            <button onClick={() => setShowHint(v => !v)} className={`text-xs underline ${t.subText}`}>
              {showHint ? (isBaby ? "ヒントをとじる" : "ヒントを閉じる") : (isBaby ? "ヒントをみる" : "ヒントを見る")}
            </button>
            {showHint && <p className={`mt-1 text-sm rounded-xl px-3 py-2 ${t.innerCard} ${t.bodyText}`}>💡 {currentQ.hint}</p>}
          </div>
        )}
      </div>

      {/* 回答スロット */}
      <div className={`rounded-2xl p-4 border min-h-[80px] ${t.card} ${t.border}`}>
        <p className={`text-xs font-bold mb-2 ${t.subText}`}>{isBaby ? "こたえ" : "回答"}</p>
        {/* data-drop-area="slots"：スロット内の空きエリアへのドロップを受け付ける */}
        <div className="flex flex-wrap gap-2 min-h-[40px]" data-drop-area="slots">
          {slots.map((token, i) => (
            <div
              key={token.id}
              data-token-source="slots"
              data-token-index={String(i)}
              onTouchStart={e => handleTokenTouchStart(e, token, "slots", i)}
              onClick={() => handleTokenClick(() => tapSlot(token))}
              style={{ touchAction: "none" }}
              className={`
                px-3 py-2 rounded-xl font-bold cursor-pointer select-none
                transition-all active:scale-95
                ${result === "correct" ? "bg-green-400 text-white" :
                  result === "wrong"   ? "bg-red-400 text-white" :
                  `${t.startBtn} ${t.startText}`}
                ${isBaby ? "text-lg" : "text-sm"}
              `}
            >
              {token.word}
            </div>
          ))}
          {slots.length > 0 && (
            <span className={`self-center font-bold text-xl ${t.bodyText}`}>{currentQ.punctuation}</span>
          )}
        </div>

        {result && (
          <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-bold ${result === "correct" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {result === "correct"
              ? <span>{isBaby ? "🎉 せいかい！" : "🎉 正解！"}</span>
              : <span>
                  {isBaby ? "😢 ざんねん… せいかいは：" : "😢 不正解… 正解は："}
                  <span className="ml-1 font-black">{currentQ.words.join(" ")}{currentQ.punctuation}</span>
                </span>
            }
          </div>
        )}
      </div>

      {/* 単語バンク */}
      <div className={`rounded-2xl p-4 border ${t.card} ${t.border}`}>
        <p className={`text-xs font-bold mb-2 ${t.subText}`}>{isBaby ? "ことば" : "単語"}</p>
        {/* data-drop-area="bank"：バンクエリアへのドロップを受け付ける */}
        <div className="flex flex-wrap gap-2 min-h-[40px]" data-drop-area="bank">
          {bank.map((token, i) => {
            const isSelected = slots.some(s => s.id === token.id);
            return (
              <div
                key={token.id}
                data-token-source="bank"
                data-token-index={String(i)}
                onTouchStart={e => handleTokenTouchStart(e, token, "bank", i)}
                onClick={() => handleTokenClick(() => tapBank(token))}
                style={{ touchAction: "none" }}
                className={`
                  px-3 py-2 rounded-xl border font-bold select-none
                  transition-all
                  ${t.innerCard} ${t.border} ${t.bodyText}
                  ${isBaby ? "text-lg" : "text-sm"}
                  ${isSelected
                    ? "opacity-30 cursor-pointer"
                    : "cursor-pointer active:scale-95"}
                `}
              >
                {token.word}
              </div>
            );
          })}
          {bank.every(t => slots.some(s => s.id === t.id)) && bank.length > 0 && !result && (
            <p className={`text-xs ${t.subText}`}>{isBaby ? "ぜんぶ えらんだね！" : "すべて選択済み"}</p>
          )}
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex flex-col gap-2">
        {!result ? (
          <>
            <button
              onClick={judge}
              disabled={slots.length === 0}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 ${slots.length === 0 ? "opacity-40 cursor-not-allowed" : ""} ${t.startBtn} ${t.startText}`}
            >
              {isBaby ? "✅ こたえる！" : "✅ 回答する"}
            </button>
            <button
              onClick={() => { setBank(shuffle(wordsToTokens(currentQ.words))); setSlots([]); setResult(null); }}
              className={`w-full py-3 rounded-2xl font-bold text-sm border transition-all active:scale-95 ${t.innerCard} ${t.border} ${t.bodyText}`}
            >
              {isBaby ? "🔄 やりなおす" : "🔄 リセット"}
            </button>
          </>
        ) : (
          <button
            onClick={nextQuestion}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 ${t.startBtn} ${t.startText}`}
          >
            {currentIndex + 1 < questions.length
              ? (isBaby ? "➡️ つぎへ！" : "➡️ 次の問題")
              : (isBaby ? "🏠 おわり！" : "🏠 終了してホームへ")}
          </button>
        )}
      </div>

      <div className="h-4" />
    </div>
  );
}
