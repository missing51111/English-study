"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
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

interface QuestionPair {
  main: Question;
  bank: WordToken[];
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

function wordsToTokens(words: string[], prefix: string): WordToken[] {
  return words.map((word, i) => ({ id: `${prefix}-${word}-${i}`, word }));
}

const DRAG_THRESHOLD = 8;
const TOTAL_STEPS = 3;

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

// 前置詞リスト（ディストラクター選定に使用）
const PREPOSITIONS = new Set([
  "in", "on", "at", "to", "for", "with", "from", "by", "of", "about",
  "into", "onto", "over", "under", "through", "between", "after", "before",
  "during", "until", "since", "near", "behind", "above", "below", "around",
]);

// ============================================================
// モックデータ
// ============================================================
const MOCK_QUESTIONS: Question[] = [
  { id: "mock-1", level: "baby",       sentence: "I like cats .",                              japanese: "わたしは ねこが すきです。",           words: ["I", "like", "cats"],                                                       punctuation: ".", hint: "ねこ = cats",          created_at: "" },
  { id: "mock-2", level: "baby",       sentence: "She has a dog .",                            japanese: "かのじょは いぬを かっています。",     words: ["She", "has", "a", "dog"],                                                  punctuation: ".", hint: "dog = いぬ",           created_at: "" },
  { id: "mock-3", level: "baby",       sentence: "He is happy .",                              japanese: "かれは うれしいです。",                words: ["He", "is", "happy"],                                                       punctuation: ".", hint: "happy = うれしい",     created_at: "" },
  { id: "mock-4", level: "baby",       sentence: "We play together .",                         japanese: "わたしたちは いっしょに あそびます。", words: ["We", "play", "together"],                                                  punctuation: ".", hint: "together = いっしょに", created_at: "" },
  { id: "mock-5", level: "elementary", sentence: "I play soccer every day .",                  japanese: "わたしは毎日サッカーをします。",        words: ["I", "play", "soccer", "every", "day"],                                     punctuation: ".", hint: "every day = まいにち", created_at: "" },
  { id: "mock-6", level: "elementary", sentence: "She goes to school by bus .",                japanese: "かのじょはバスで学校に行きます。",      words: ["She", "goes", "to", "school", "by", "bus"],                                punctuation: ".", hint: "by bus = バスで",       created_at: "" },
  { id: "mock-7", level: "elementary", sentence: "We study English at home .",                 japanese: "わたしたちは家で英語をべんきょうします。", words: ["We", "study", "English", "at", "home"],                                  punctuation: ".", hint: "at home = うちで",     created_at: "" },
  { id: "mock-8", level: "elementary", sentence: "He runs in the park .",                      japanese: "かれは公園で走ります。",               words: ["He", "runs", "in", "the", "park"],                                         punctuation: ".", hint: "in the park = こうえんで", created_at: "" },
  { id: "mock-9", level: "junior",     sentence: "Could you tell me the way to the station ?", japanese: "駅への道を教えていただけますか。",      words: ["Could", "you", "tell", "me", "the", "way", "to", "the", "station"],        punctuation: "?", hint: "丁寧な依頼表現",       created_at: "" },
  { id: "mock-10", level: "junior",    sentence: "He walked through the park after school .",  japanese: "彼は放課後、公園を歩いて通り抜けた。",  words: ["He", "walked", "through", "the", "park", "after", "school"],               punctuation: ".", hint: "through = 〜を通って",  created_at: "" },
  { id: "mock-11", level: "junior",    sentence: "She is interested in learning English .",    japanese: "彼女は英語を学ぶことに興味があります。", words: ["She", "is", "interested", "in", "learning", "English"],                   punctuation: ".", hint: "be interested in = 〜に興味がある", created_at: "" },
  { id: "mock-12", level: "junior",    sentence: "I have been to the library twice .",         japanese: "私は図書館に2回行ったことがあります。",  words: ["I", "have", "been", "to", "the", "library", "twice"],                      punctuation: ".", hint: "have been to = 〜に行ったことがある", created_at: "" },
  { id: "mock-13", level: "high",      sentence: "It is important that we protect the environment .", japanese: "私たちが環境を守ることは重要です。", words: ["It", "is", "important", "that", "we", "protect", "the", "environment"], punctuation: ".", hint: "仮主語構文",            created_at: "" },
  { id: "mock-14", level: "high",      sentence: "She succeeded in achieving her goals .",     japanese: "彼女は目標を達成することに成功した。",  words: ["She", "succeeded", "in", "achieving", "her", "goals"],                    punctuation: ".", hint: "succeed in = 〜に成功する", created_at: "" },
  { id: "mock-15", level: "high",      sentence: "The book was written by a famous author .",  japanese: "その本は有名な作家によって書かれました。", words: ["The", "book", "was", "written", "by", "a", "famous", "author"],          punctuation: ".", hint: "受動態",               created_at: "" },
  { id: "mock-16", level: "high",      sentence: "He insisted on going there alone .",         japanese: "彼はそこに一人で行くと言い張った。",    words: ["He", "insisted", "on", "going", "there", "alone"],                         punctuation: ".", hint: "insist on = 〜を主張する", created_at: "" },
];

// ============================================================
// ディストラクター選定
// ============================================================
function pickDistractors(mainQ: Question, otherQ: Question, pairIndex: number): WordToken[] {
  const mainWords = new Set(mainQ.words.map(w => w.toLowerCase()));
  const candidates = otherQ.words.filter(w => !mainWords.has(w.toLowerCase()));
  if (candidates.length === 0) return wordsToTokens(otherQ.words.slice(0, 3), `dist${pairIndex}`);
  const prepositions = candidates.filter(w => PREPOSITIONS.has(w.toLowerCase()));
  const others = candidates.filter(w => !PREPOSITIONS.has(w.toLowerCase()));
  const selected = [...shuffle(prepositions).slice(0, 2), ...shuffle(others).slice(0, 2)];
  return wordsToTokens(selected, `dist${pairIndex}`);
}

// ============================================================
// ペア生成
// ============================================================
function buildPairs(pool: Question[]): QuestionPair[] {
  const shuffled = shuffle(pool);
  // プールが少ない場合は折り返し
  const get = (i: number) => shuffled[i % shuffled.length];
  return Array.from({ length: TOTAL_STEPS }, (_, i) => {
    const main = get(i * 2);
    const other = get(i * 2 + 1);
    const mainTokens = wordsToTokens(main.words, `main${i}`);
    const distractors = pickDistractors(main, other, i);
    return { main, bank: shuffle([...mainTokens, ...distractors]) };
  });
}

// ============================================================
// ChallengePage
// ============================================================
export default function ChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = (searchParams.get("level") ?? "baby") as Level;
  const t = LEVEL_THEME[level] ?? LEVEL_THEME.baby;
  const isBaby = level === "baby";

  const [pairs, setPairs] = useState<QuestionPair[]>([]);
  const [step, setStep] = useState(0);          // 0〜2: 現在の問題番号
  const [doneCount, setDoneCount] = useState(0); // 今日の達成済み数（0〜3）
  const [loading, setLoading] = useState(true);

  const [slots, setSlots] = useState<WordToken[]>([]);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(false);

  const touchState = useRef<TouchState | null>(null);
  const touchHandled = useRef(false);

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // ============================================================
  // 初期化：今日の達成数チェック＋問題取得
  // ============================================================
  useLayoutEffect(() => {
    const savedM = localStorage.getItem("dailyMissions");
    if (savedM) {
      const parsed = JSON.parse(savedM);
      if (parsed.date === getTodayStr()) {
        const rc = parsed.reviewCount ?? 0;
        setDoneCount(rc);
        setStep(Math.min(rc, TOTAL_STEPS)); // 途中から再開
      }
    }
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      let pool: Question[] = [];
      if (!supabaseUrl || supabaseUrl === "your-supabase-project-url") {
        pool = MOCK_QUESTIONS.filter(q => q.level === level);
        if (pool.length < 2) pool = MOCK_QUESTIONS;
      } else {
        const { data, error } = await supabase.from("questions").select("*").eq("level", level).limit(20);
        pool = (!error && data && data.length >= 2) ? (data as Question[]) : MOCK_QUESTIONS.filter(q => q.level === level);
        if (pool.length < 2) pool = MOCK_QUESTIONS;
      }
      setPairs(buildPairs(pool));
      setLoading(false);
    };
    fetchQuestions();
  }, [level]);

  // stepが変わったらスロットをリセット
  useEffect(() => {
    setSlots([]);
    setResult(null);
    setShowHint(false);
  }, [step]);

  const currentPair = pairs[step];

  // ============================================================
  // タップ操作
  // ============================================================
  const tapBank = useCallback((token: WordToken) => {
    setSlots(prev => {
      const isSelected = prev.some(s => s.id === token.id);
      return isSelected ? prev.filter(s => s.id !== token.id) : [...prev, token];
    });
  }, []);

  const tapSlot = useCallback((token: WordToken) => {
    setSlots(prev => prev.filter(t => t.id !== token.id));
  }, []);

  // ============================================================
  // タッチイベント
  // ============================================================
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      const ts = touchState.current;
      if (!ts) return;
      const touch = e.touches[0];
      const dx = touch.clientX - ts.startX;
      const dy = touch.clientY - ts.startY;
      if (!ts.isDragging && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        ts.isDragging = true;
        const ghost = document.createElement("div");
        ghost.textContent = ts.token.word;
        Object.assign(ghost.style, {
          position: "fixed", left: `${touch.clientX}px`, top: `${touch.clientY}px`,
          transform: "translate(-50%, -50%)", padding: "8px 14px", borderRadius: "12px",
          fontWeight: "bold", fontSize: "16px", background: "#6366f1", color: "white",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)", pointerEvents: "none",
          zIndex: "9999", opacity: "0.85", whiteSpace: "nowrap", userSelect: "none",
        });
        document.body.appendChild(ghost);
        ts.ghost = ghost;
      }
      if (ts.isDragging) {
        e.preventDefault();
        if (ts.ghost) { ts.ghost.style.left = `${touch.clientX}px`; ts.ghost.style.top = `${touch.clientY}px`; }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      const ts = touchState.current;
      if (!ts) return;
      ts.ghost?.remove(); ts.ghost = null;
      if (!ts.isDragging) {
        touchHandled.current = true;
        if (ts.source === "bank") tapBank(ts.token); else tapSlot(ts.token);
        touchState.current = null; return;
      }
      const touch = e.changedTouches[0];
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      let dropSource: "bank" | "slots" | null = null;
      let dropIndex: number | null = null;
      for (const el of elements) {
        const h = el as HTMLElement;
        if (h.dataset.tokenSource) { dropSource = h.dataset.tokenSource as "bank" | "slots"; dropIndex = h.dataset.tokenIndex !== undefined ? parseInt(h.dataset.tokenIndex) : null; break; }
        if (h.dataset.dropArea) { dropSource = h.dataset.dropArea as "bank" | "slots"; break; }
      }
      const { token, source, index } = ts; touchState.current = null;
      if (source === "bank" && dropSource === "slots") {
        setSlots(prev => { if (prev.some(s => s.id === token.id)) return prev; const arr = [...prev]; arr.splice(dropIndex !== null ? dropIndex : arr.length, 0, token); return arr; });
      } else if (source === "slots" && dropSource === "bank") {
        setSlots(prev => prev.filter((_, i) => i !== index));
      } else if (source === "slots" && dropSource === "slots" && dropIndex !== null && dropIndex !== index) {
        setSlots(prev => { const arr = [...prev]; const [moved] = arr.splice(index, 1); arr.splice(dropIndex!, 0, moved); return arr; });
      }
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    return () => { document.removeEventListener("touchmove", onTouchMove); document.removeEventListener("touchend", onTouchEnd); };
  }, [tapBank, tapSlot]);

  const handleTokenTouchStart = (e: React.TouchEvent, token: WordToken, source: "bank" | "slots", index: number) => {
    if (result) return;
    e.stopPropagation();
    const touch = e.touches[0];
    touchState.current = { token, source, index, startX: touch.clientX, startY: touch.clientY, isDragging: false, ghost: null };
  };

  const handleTokenClick = (fn: () => void) => {
    if (touchHandled.current) { touchHandled.current = false; return; }
    if (result) return;
    fn();
  };

  // ============================================================
  // 判定
  // ============================================================
  const judge = () => {
    if (!currentPair || slots.length === 0) return;
    const isCorrect = slots.map(s => s.word).join(" ") === currentPair.main.words.join(" ");
    setResult(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      // reviewCount をインクリメント
      const today = getTodayStr();
      const savedM = localStorage.getItem("dailyMissions");
      const prev = savedM ? JSON.parse(savedM) : null;
      const prevQuiz = prev?.date === today ? (prev.quizCount ?? 0) : 0;
      const prevReview = prev?.date === today ? (prev.reviewCount ?? 0) : 0;
      const newReview = prevReview + 1;
      localStorage.setItem("dailyMissions", JSON.stringify({
        date: today, quizCount: prevQuiz, reviewCount: newReview,
        ticketAwarded: prev?.ticketAwarded ?? false,
      }));
      setDoneCount(newReview);
    }
  };

  // ============================================================
  // 次の問題へ
  // ============================================================
  const goNext = () => {
    if (step + 1 >= TOTAL_STEPS) {
      // 3問完了 → ホームへ
      router.push("/");
    } else {
      setStep(prev => prev + 1);
    }
  };

  // ============================================================
  // ローディング
  // ============================================================
  if (loading) {
    return (
      <div className={`min-h-screen ${t.bg} flex items-center justify-center`}>
        <p className={`text-lg font-bold ${t.bodyText}`}>{isBaby ? "よみこみちゅう…" : "読み込み中…"}</p>
      </div>
    );
  }

  // ============================================================
  // 今日すでに3問クリア済み
  // ============================================================
  if (doneCount >= TOTAL_STEPS && result !== "correct") {
    return (
      <div className={`min-h-screen ${t.bg} flex flex-col items-center justify-center gap-6 p-6`}>
        <div className="text-6xl">🏆</div>
        <p className={`text-xl font-black text-center ${t.titleText}`}>
          {isBaby ? "きょうは もうクリアしたよ！" : "今日はミッション完了済み！"}
        </p>
        <p className={`text-sm text-center ${t.subText}`}>
          {isBaby ? "あしたもいっしょにがんばろう！" : "また明日チャレンジしよう！"}
        </p>
        <button onClick={() => router.push("/")} className={`px-8 py-4 rounded-2xl font-bold text-lg ${t.startBtn} ${t.startText}`}>
          {isBaby ? "🏠 ホームにもどる" : "🏠 ホームに戻る"}
        </button>
      </div>
    );
  }

  if (!currentPair) {
    return (
      <div className={`min-h-screen ${t.bg} flex flex-col items-center justify-center gap-4 p-6`}>
        <p className={`text-lg font-bold ${t.bodyText}`}>問題が見つかりませんでした</p>
        <button onClick={() => router.push("/")} className={`px-6 py-3 rounded-2xl font-bold ${t.startBtn} ${t.startText}`}>ホームに戻る</button>
      </div>
    );
  }

  const progressPct = ((step + (result === "correct" ? 1 : 0)) / TOTAL_STEPS) * 100;

  // ============================================================
  // UI（問題画面）
  // ============================================================
  return (
    <div className={`min-h-screen ${t.bg} flex flex-col max-w-md mx-auto p-4 gap-4`}>

      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/")} className={`text-2xl ${t.subText}`}>←</button>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-black ${t.titleText}`}>
              {isBaby ? "🏆 じつりょくを ためそう！" : "🏆 実力を試そう！"}
            </span>
            <span className={`text-xs font-bold ${t.accent}`}>{step + 1} / {TOTAL_STEPS}</span>
          </div>
          <div className={`w-full rounded-full h-2 ${t.innerCard}`}>
            <div className={`h-2 rounded-full transition-all ${t.bar}`} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* 説明バナー */}
      <div className={`rounded-2xl p-3 border ${t.innerCard} ${t.border}`}>
        <p className={`text-xs font-bold ${t.accent}`}>
          {isBaby ? "⚠️ よぶんなことばが まじってるよ！" : "⚠️ 余分な単語が混ざっています！"}
        </p>
        <p className={`text-xs mt-0.5 ${t.subText}`}>
          {isBaby ? "ただしいことばだけ えらんでね。" : "正しい単語だけを使って文を作ってください。"}
        </p>
      </div>

      {/* 日本語の意味 */}
      <div className={`rounded-2xl p-4 border ${t.card} ${t.border}`}>
        <p className={`text-xs font-bold mb-1 ${t.subText}`}>{isBaby ? "にほんごのいみ" : "日本語の意味"}</p>
        <p className={`font-bold leading-relaxed ${isBaby ? "text-lg" : "text-base"} ${t.titleText}`}>{currentPair.main.japanese}</p>
        {currentPair.main.hint && (
          <div className="mt-2">
            <button onClick={() => setShowHint(v => !v)} className={`text-xs underline ${t.subText}`}>
              {showHint ? (isBaby ? "ヒントをとじる" : "ヒントを閉じる") : (isBaby ? "ヒントをみる" : "ヒントを見る")}
            </button>
            {showHint && <p className={`mt-1 text-sm rounded-xl px-3 py-2 ${t.innerCard} ${t.bodyText}`}>💡 {currentPair.main.hint}</p>}
          </div>
        )}
      </div>

      {/* 回答スロット */}
      <div className={`rounded-2xl p-4 border min-h-[80px] ${t.card} ${t.border}`}>
        <p className={`text-xs font-bold mb-2 ${t.subText}`}>{isBaby ? "こたえ" : "回答"}</p>
        <div className="flex flex-wrap gap-2 min-h-[40px]" data-drop-area="slots">
          {slots.map((token, i) => (
            <div
              key={token.id}
              data-token-source="slots"
              data-token-index={String(i)}
              onTouchStart={e => handleTokenTouchStart(e, token, "slots", i)}
              onClick={() => handleTokenClick(() => tapSlot(token))}
              style={{ touchAction: "none" }}
              className={`px-3 py-2 rounded-xl font-bold cursor-pointer select-none transition-all active:scale-95 ${result === "correct" ? "bg-green-400 text-white" : result === "wrong" ? "bg-red-400 text-white" : `${t.startBtn} ${t.startText}`} ${isBaby ? "text-lg" : "text-sm"}`}
            >
              {token.word}
            </div>
          ))}
          {slots.length > 0 && (
            <span className={`self-center font-bold text-xl ${t.bodyText}`}>{currentPair.main.punctuation}</span>
          )}
        </div>
        {result === "correct" && (
          <div className="mt-3 rounded-xl px-3 py-2 text-sm font-bold bg-green-100 text-green-800">
            {isBaby ? "🎉 せいかい！すごい！" : "🎉 正解！"}
          </div>
        )}
        {result === "wrong" && (
          <div className="mt-3 rounded-xl px-3 py-2 text-sm font-bold bg-red-100 text-red-800">
            {isBaby ? "😢 ちがうよ… もういちどためしてみよう！" : "😢 不正解… もう一度挑戦してみよう！"}
          </div>
        )}
      </div>

      {/* 単語バンク */}
      <div className={`rounded-2xl p-4 border ${t.card} ${t.border}`}>
        <p className={`text-xs font-bold mb-2 ${t.subText}`}>{isBaby ? "ことば" : "単語"}</p>
        <div className="flex flex-wrap gap-2 min-h-[40px]" data-drop-area="bank">
          {currentPair.bank.map((token, i) => {
            const isSelected = slots.some(s => s.id === token.id);
            return (
              <div
                key={token.id}
                data-token-source="bank"
                data-token-index={String(i)}
                onTouchStart={e => handleTokenTouchStart(e, token, "bank", i)}
                onClick={() => handleTokenClick(() => tapBank(token))}
                style={{ touchAction: "none" }}
                className={`px-3 py-2 rounded-xl border font-bold select-none transition-all ${t.innerCard} ${t.border} ${t.bodyText} ${isBaby ? "text-lg" : "text-sm"} ${isSelected ? "opacity-30 cursor-pointer" : "cursor-pointer active:scale-95"}`}
              >
                {token.word}
              </div>
            );
          })}
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
              onClick={() => { setSlots([]); setResult(null); }}
              className={`w-full py-3 rounded-2xl font-bold text-sm border transition-all active:scale-95 ${t.innerCard} ${t.border} ${t.bodyText}`}
            >
              {isBaby ? "🔄 やりなおす" : "🔄 リセット"}
            </button>
          </>
        ) : result === "correct" ? (
          <button
            onClick={goNext}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 ${t.startBtn} ${t.startText}`}
          >
            {step + 1 < TOTAL_STEPS
              ? (isBaby ? "➡️ つぎへ！" : "➡️ 次の問題")
              : (isBaby ? "🏠 ぜんぶおわり！" : "🏠 ミッション完了！ホームへ")}
          </button>
        ) : (
          <button
            onClick={() => { setSlots([]); setResult(null); }}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 ${t.startBtn} ${t.startText}`}
          >
            {isBaby ? "🔄 もういちど！" : "🔄 もう一度挑戦"}
          </button>
        )}
      </div>

      <div className="h-4" />
    </div>
  );
}
