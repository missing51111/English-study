"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GENERATED_QUESTION_IMAGE_MANIFEST } from "@/lib/generatedQuestionImages";
import { supabase } from "@/lib/supabase";
import { THEMES } from "@/lib/themes";
import StudyItemImage from "@/components/StudyItemImage";
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
// レベルラベル
// ============================================================

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

function applyGeneratedQuestionImage(question: Question): Question {
  const generatedImage = GENERATED_QUESTION_IMAGE_MANIFEST[question.id];
  if (!generatedImage) return question;

  return {
    ...question,
    image_name: generatedImage.imageName,
    image_status: generatedImage.imageStatus,
  };
}

// ============================================================
// QuizPage
// ============================================================
export default function QuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = (searchParams.get("level") ?? "baby") as Level;

  const [themeId, setThemeId] = useState("pink");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [bank, setBank] = useState<WordToken[]>([]);
  const [slots, setSlots] = useState<WordToken[]>([]);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // 単語取得お祝い演出
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebWord, setCelebWord] = useState("");

  // 今日の日付を YYYY-MM-DD 形式（ローカル時間）で返す
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // 起動時にlocalStorageからテーマ・当日スコアを復元
  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && THEMES.find(th => th.id === savedTheme)) setThemeId(savedTheme);
    const saved = localStorage.getItem("dailyScore");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === getTodayStr()) {
        setScore({ correct: parsed.correct, total: parsed.total });
      }
    }
  }, []);

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
      const mocked = MOCK_QUESTIONS
        .filter(q => q.level === level)
        .map(applyGeneratedQuestionImage);
      setQuestions(
        shuffle(mocked.length > 0 ? mocked : MOCK_QUESTIONS.map(applyGeneratedQuestionImage))
      );
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("questions").select("*").eq("level", level).limit(10);
    setQuestions(
      shuffle(
        (!error && data && data.length > 0)
          ? (data as Question[]).map(applyGeneratedQuestionImage)
          : MOCK_QUESTIONS.filter(q => q.level === level).map(applyGeneratedQuestionImage)
      )
    );
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
    setSelectedSlotIdx(null);
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

  const tapSlot = useCallback((token: WordToken, index: number) => {
    setSelectedSlotIdx(prev => {
      if (prev === null) {
        // 1回目：選択してハイライト
        return index;
      } else if (prev === index) {
        // 同じトークンを再タップ：選択解除
        return null;
      } else {
        // 別のトークンをタップ：2つを入れ替え
        setSlots(slots => {
          const arr = [...slots];
          [arr[prev], arr[index]] = [arr[index], arr[prev]];
          return arr;
        });
        return null;
      }
    });
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
        else tapSlot(ts.token, ts.index);
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
  // 音声読み上げ
  // ============================================================
  const speakSentence = useCallback((sentence: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(sentence);
      utt.lang = "en-US";
      utt.rate = 0.85;
      // iPad対策: ボイス未指定だと単語ごとに読む場合があるため明示的に指定
      const voices = window.speechSynthesis.getVoices();
      const enVoice =
        voices.find(v => v.lang === "en-US" && v.localService) ??
        voices.find(v => v.lang.startsWith("en-") && v.localService) ??
        voices.find(v => v.lang.startsWith("en-"));
      if (enVoice) utt.voice = enVoice;
      window.speechSynthesis.speak(utt);
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", doSpeak, { once: true });
    }
  }, []);

  // ============================================================
  // 判定
  // ============================================================
  const judge = async () => {
    if (!currentQ || slots.length === 0) return;
    const isCorrect = slots.map(t => t.word).join(" ") === currentQ.words.join(" ");
    setResult(isCorrect ? "correct" : "wrong");
    speakSentence(currentQ.words.join(" ") + currentQ.punctuation);
    setScore(prev => {
      const next = { correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 };
      // 当日スコアをlocalStorageに保存（0時を過ぎると自動リセット）
      localStorage.setItem("dailyScore", JSON.stringify({ date: getTodayStr(), ...next }));
      return next;
    });

    // 正解時：対象単語をacquiredWordsに追加（新規取得なら派手な演出）
    if (isCorrect && currentQ.word) {
      const savedAcq = localStorage.getItem("acquiredWords");
      const acqArr: string[] = savedAcq ? JSON.parse(savedAcq) : [];
      if (!acqArr.includes(currentQ.word)) {
        acqArr.push(currentQ.word);
        localStorage.setItem("acquiredWords", JSON.stringify(acqArr));
        // 新規単語取得！お祝い演出を起動
        setCelebWord(currentQ.word);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3200);
      }
    }

    // ミッション：問題を解いた数をカウント（正誤問わず、難易度問わず）
    const today = getTodayStr();
    const savedM = localStorage.getItem("dailyMissions");
    const prev = savedM ? JSON.parse(savedM) : null;
    const prevQuiz = prev?.date === today ? (prev.quizCount ?? 0) : 0;
    const prevReview = prev?.date === today ? (prev.reviewCount ?? 0) : 0;
    const prevTicketAwarded = prev?.date === today ? (prev.ticketAwarded ?? false) : false;
    localStorage.setItem("dailyMissions", JSON.stringify({
      date: today,
      quizCount: prevQuiz + 1,
      reviewCount: prevReview,
      ticketAwarded: prevTicketAwarded,
    }));

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

  const t = THEMES.find(th => th.id === themeId) ?? THEMES[0];

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
  const shouldShowQuestionHintImage =
    level === "elementary" && currentQ.image_status === "ready";
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  // コンフェッティのピース（固定シードで毎回同じ位置）
  const CONFETTI = Array.from({ length: 50 }, (_, i) => ({
    color: ["#fb7185","#fbbf24","#34d399","#60a5fa","#a78bfa","#f97316","#ec4899","#facc15"][i % 8],
    left:  ((i * 19 + 7)  % 97),
    delay: ((i * 0.073)   % 1.2),
    dur:   1.6 + (i * 0.11) % 1.1,
    size:  8 + (i * 7)   % 14,
    round: i % 3 === 0,
  }));

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className={`min-h-screen ${t.bg} flex flex-col max-w-md mx-auto p-4 gap-4`}>

      {/* ======================================================
          単語取得お祝いオーバーレイ
          ====================================================== */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {/* コンフェッティ */}
          {CONFETTI.map((p, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${p.left}%`,
                top: "-24px",
                width:  `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                borderRadius: p.round ? "50%" : "3px",
                animation: `confetti-fall ${p.dur}s ${p.delay}s ease-in forwards`,
              }}
            />
          ))}

          {/* 中央カード */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="bg-white rounded-3xl px-8 py-7 text-center shadow-2xl border-4 border-yellow-400"
              style={{ animation: "celebrate-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
            >
              <div
                className="text-6xl mb-3 inline-block"
                style={{ animation: "star-spin 1s ease-in-out infinite" }}
              >⭐</div>
              <p className="text-3xl font-black text-yellow-500 tracking-wide drop-shadow">NEW!</p>
              <p className="text-2xl font-black text-gray-800 mt-1 tracking-widest">{celebWord}</p>
              <p className={`text-base font-bold mt-2 ${isBaby ? "text-pink-500" : "text-indigo-500"}`}>
                {isBaby ? "たんごを ゲット！🎊" : "単語を取得しました🎊"}
              </p>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex items-center justify-between mb-1">
          <p className={`text-xs font-bold ${t.subText}`}>{isBaby ? "にほんごのいみ" : "日本語の意味"}</p>
          <button
            onClick={() => speakSentence(currentQ.words.join(" ") + currentQ.punctuation)}
            className="text-3xl opacity-60 hover:opacity-100 active:scale-90 transition-all leading-none"
            aria-label="英文を読み上げる"
          >🔊</button>
        </div>
        <p className={`font-bold leading-relaxed ${isBaby ? "text-lg" : "text-base"} ${t.titleText}`}>{currentQ.japanese}</p>
        {shouldShowQuestionHintImage && (
          <div className={`mt-3 rounded-2xl border p-2 ${t.innerCard} ${t.border}`}>
            <p className={`mb-2 text-[11px] font-bold uppercase tracking-[0.18em] ${t.subText}`}>
              Hint Image
            </p>
            <StudyItemImage
              id={currentQ.id}
              kind="questions"
              alt={`${currentQ.sentence} hint image`}
              imageName={currentQ.image_name}
              imageStatus={currentQ.image_status}
              className="aspect-[4/3] w-full"
              sizes="(max-width: 768px) 100vw, 360px"
            />
          </div>
        )}
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
          {isBaby && !result ? (
            // ベビー：字数ヒント枠つきスロット
            <>
              {currentQ.words.map((word, i) => {
                const token = slots[i];
                return token ? (
                  <div
                    key={token.id}
                    data-token-source="slots"
                    data-token-index={String(i)}
                    onTouchStart={e => handleTokenTouchStart(e, token, "slots", i)}
                    onClick={() => handleTokenClick(() => tapSlot(token, i))}
                    style={{ touchAction: "none" }}
                    className={`px-3 py-2 rounded-xl font-bold cursor-pointer select-none transition-all active:scale-95 text-lg
                      ${selectedSlotIdx === i ? `${t.bar} text-white ring-2 ring-white ring-offset-1 scale-105` : `${t.startBtn} ${t.startText}`}`}
                  >
                    {token.word}
                  </div>
                ) : (
                  <div
                    key={`hint-${i}`}
                    className="px-3 py-2 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center"
                    style={{ minWidth: `${Math.max(word.length * 14, 40)}px` }}
                  >
                    <span className="text-gray-300 tracking-widest text-lg leading-none select-none">
                      {"·".repeat(word.length)}
                    </span>
                  </div>
                );
              })}
              {slots.length > 0 && (
                <span className={`self-center font-bold text-xl ${t.bodyText}`}>{currentQ.punctuation}</span>
              )}
            </>
          ) : (
            // 通常スロット（baby結果表示 or 非babyも含む）
            <>
              {slots.map((token, i) => (
                <div
                  key={token.id}
                  data-token-source="slots"
                  data-token-index={String(i)}
                  onTouchStart={e => handleTokenTouchStart(e, token, "slots", i)}
                  onClick={() => handleTokenClick(() => tapSlot(token, i))}
                  style={{ touchAction: "none" }}
                  className={`
                    px-3 py-2 rounded-xl font-bold cursor-pointer select-none
                    transition-all active:scale-95
                    ${result === "correct" ? "bg-green-400 text-white" :
                      result === "wrong"   ? "bg-red-400 text-white" :
                      selectedSlotIdx === i ? `${t.bar} text-white ring-2 ring-white ring-offset-1 scale-105` :
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
            </>
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
              onClick={() => { setBank(shuffle(wordsToTokens(currentQ.words))); setSlots([]); setSelectedSlotIdx(null); setResult(null); }}
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
