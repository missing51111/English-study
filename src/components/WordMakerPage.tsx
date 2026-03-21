"use client";

import { useState, useLayoutEffect, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { THEMES } from "@/lib/themes";

// ============================================================
// 型
// ============================================================
interface WordEntry {
  word: string;
  meaning: string;
  level: string;
}

type GamePhase = "intro" | "playing" | "complete" | "no-ticket" | "all-done";

// ============================================================
// フォールバック単語リスト（Supabase 未設定時）
// ============================================================
const FALLBACK_WORDS: WordEntry[] = [
  // baby — 2〜3 letters
  { word: "go",   meaning: "いく",       level: "baby" },
  { word: "up",   meaning: "うえ",       level: "baby" },
  { word: "ok",   meaning: "おっけー",   level: "baby" },
  { word: "cat",  meaning: "ねこ",       level: "baby" },
  { word: "dog",  meaning: "いぬ",       level: "baby" },
  { word: "run",  meaning: "はしる",     level: "baby" },
  { word: "red",  meaning: "あかい",     level: "baby" },
  { word: "sun",  meaning: "たいよう",   level: "baby" },
  { word: "cup",  meaning: "コップ",     level: "baby" },
  { word: "hat",  meaning: "ぼうし",     level: "baby" },
  { word: "bag",  meaning: "かばん",     level: "baby" },
  { word: "bus",  meaning: "バス",       level: "baby" },
  { word: "bed",  meaning: "ベッド",     level: "baby" },
  { word: "box",  meaning: "はこ",       level: "baby" },
  { word: "map",  meaning: "ちず",       level: "baby" },
  { word: "pen",  meaning: "ペン",       level: "baby" },
  { word: "ant",  meaning: "あり",       level: "baby" },
  { word: "bee",  meaning: "はち",       level: "baby" },
  { word: "cow",  meaning: "うし",       level: "baby" },
  { word: "pig",  meaning: "ぶた",       level: "baby" },
  { word: "fox",  meaning: "きつね",     level: "baby" },
  // baby — 4 letters
  { word: "frog", meaning: "かえる",     level: "baby" },
  { word: "duck", meaning: "あひる",     level: "baby" },
  { word: "fish", meaning: "さかな",     level: "baby" },
  { word: "bird", meaning: "とり",       level: "baby" },
  { word: "tree", meaning: "き",         level: "baby" },
  { word: "door", meaning: "ドア",       level: "baby" },
  { word: "book", meaning: "ほん",       level: "baby" },
  { word: "ball", meaning: "ボール",     level: "baby" },
  { word: "milk", meaning: "ぎゅうにゅう", level: "baby" },
  { word: "cake", meaning: "ケーキ",     level: "baby" },
  { word: "rice", meaning: "ごはん",     level: "baby" },
  { word: "star", meaning: "ほし",       level: "baby" },
  { word: "moon", meaning: "つき",       level: "baby" },
  { word: "rain", meaning: "あめ",       level: "baby" },
  { word: "snow", meaning: "ゆき",       level: "baby" },
  { word: "wind", meaning: "かぜ",       level: "baby" },
  { word: "fire", meaning: "ひ",         level: "baby" },
  { word: "hand", meaning: "て",         level: "baby" },
  { word: "foot", meaning: "あし",       level: "baby" },
  { word: "nose", meaning: "はな",       level: "baby" },
  { word: "eyes", meaning: "め",         level: "baby" },
  { word: "hair", meaning: "かみ",       level: "baby" },
  { word: "frog", meaning: "かえる",     level: "baby" },
  // elementary — 5〜6 letters
  { word: "apple", meaning: "りんご",     level: "elementary" },
  { word: "bread", meaning: "パン",       level: "elementary" },
  { word: "chair", meaning: "いす",       level: "elementary" },
  { word: "class", meaning: "クラス",     level: "elementary" },
  { word: "clock", meaning: "とけい",     level: "elementary" },
  { word: "cloud", meaning: "くも",       level: "elementary" },
  { word: "dance", meaning: "おどる",     level: "elementary" },
  { word: "drink", meaning: "のむ",       level: "elementary" },
  { word: "earth", meaning: "ちきゅう",   level: "elementary" },
  { word: "field", meaning: "のはら",     level: "elementary" },
  { word: "floor", meaning: "ゆか",       level: "elementary" },
  { word: "fruit", meaning: "くだもの",   level: "elementary" },
  { word: "green", meaning: "みどり",     level: "elementary" },
  { word: "heart", meaning: "こころ",     level: "elementary" },
  { word: "house", meaning: "いえ",       level: "elementary" },
  { word: "juice", meaning: "ジュース",   level: "elementary" },
  { word: "light", meaning: "ひかり",     level: "elementary" },
  { word: "music", meaning: "おんがく",   level: "elementary" },
  { word: "night", meaning: "よる",       level: "elementary" },
  { word: "ocean", meaning: "うみ",       level: "elementary" },
  { word: "paper", meaning: "かみ",       level: "elementary" },
  { word: "peach", meaning: "もも",       level: "elementary" },
  { word: "piano", meaning: "ピアノ",     level: "elementary" },
  { word: "plant", meaning: "しょくぶつ", level: "elementary" },
  { word: "river", meaning: "かわ",       level: "elementary" },
  { word: "salad", meaning: "サラダ",     level: "elementary" },
  { word: "sheep", meaning: "ひつじ",     level: "elementary" },
  { word: "smile", meaning: "ほほえむ",   level: "elementary" },
  { word: "snake", meaning: "へび",       level: "elementary" },
  { word: "sport", meaning: "スポーツ",   level: "elementary" },
  { word: "stone", meaning: "いし",       level: "elementary" },
  { word: "sugar", meaning: "さとう",     level: "elementary" },
  { word: "table", meaning: "テーブル",   level: "elementary" },
  { word: "tiger", meaning: "とら",       level: "elementary" },
  { word: "train", meaning: "でんしゃ",   level: "elementary" },
  { word: "water", meaning: "みず",       level: "elementary" },
  { word: "white", meaning: "しろ",       level: "elementary" },
  { word: "world", meaning: "せかい",     level: "elementary" },
];

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

const LEVEL_ORDER: Record<string, number> = {
  baby: 0, elementary: 1, junior: 2, high: 3, toeic: 4,
};

// コンフェッティ（固定シード）
const CONFETTI = Array.from({ length: 50 }, (_, i) => ({
  color: ["#fb7185","#fbbf24","#34d399","#60a5fa","#a78bfa","#f97316","#ec4899","#facc15"][i % 8],
  left:  (i * 19 + 7) % 97,
  delay: (i * 0.073) % 1.2,
  dur:   1.6 + (i * 0.11) % 1.1,
  size:  8  + (i * 7)   % 14,
  round: i % 3 === 0,
}));

// ============================================================
// WordMakerPage
// ============================================================
export default function WordMakerPage() {
  const router = useRouter();
  const [themeId, setThemeId]   = useState("pink");
  const [level,   setLevel]     = useState("baby");
  const [tickets, setTickets]   = useState(0);
  const [allWords, setAllWords] = useState<WordEntry[]>([]);
  const [acquired, setAcquired] = useState<string[]>([]);
  const [phase,   setPhase]     = useState<GamePhase>("intro");

  // ゲーム中の状態
  const [targetWord,    setTargetWord]    = useState("");
  const [targetMeaning, setTargetMeaning] = useState("");
  const [built,         setBuilt]         = useState<string[]>([]);
  const [currentPos,    setCurrentPos]    = useState(1);
  const [candidates,    setCandidates]    = useState<string[]>([]);
  const [wrongFlash,    setWrongFlash]    = useState(false);
  const [correctPos,    setCorrectPos]    = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebWord,     setCelebWord]     = useState("");

  // ── 初期化 ──────────────────────────────────────────────
  useLayoutEffect(() => {
    const th  = localStorage.getItem("theme");
    if (th && THEMES.find(t => t.id === th)) setThemeId(th);
    const lv  = localStorage.getItem("level");
    if (lv) setLevel(lv);
    const tk  = localStorage.getItem("tickets");
    setTickets(tk ? parseInt(tk) : 0);
    const acq = localStorage.getItem("acquiredWords");
    if (acq) setAcquired(JSON.parse(acq));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("words")
          .select("word, meaning, level")
          .in("level", ["baby", "elementary", "junior", "high", "toeic"])
          .order("word");
        setAllWords(data && data.length > 0 ? (data as WordEntry[]) : FALLBACK_WORDS);
      } catch {
        setAllWords(FALLBACK_WORDS);
      }
    })();
  }, []);

  // ── 候補生成 ──────────────────────────────────────────────
  const genCandidates = useCallback((
    wordPool: string[], pos: number, correct: string
  ): string[] => {
    const chars = new Set<string>();
    for (const w of wordPool) {
      if (pos < w.length) chars.add(w[pos]);
    }
    chars.add(correct); // 正解は必ず含める
    let arr = shuffle([...chars]);
    // 最低4つ確保（ランダムな文字で補填）
    const pool = "abcdefghijklmnopqrstuvwxyz".split("");
    let pi = 0;
    while (arr.length < 4 && pi < pool.length) {
      if (!arr.includes(pool[pi])) arr.push(pool[pi]);
      pi++;
    }
    return arr.slice(0, 8);
  }, []);

  // ── ゲーム開始 ────────────────────────────────────────────
  const startGame = useCallback((currentAcquired: string[]) => {
    if (tickets <= 0) { setPhase("no-ticket"); return; }

    const unacquired = allWords
      .filter(w => w.word.length >= 2 && !currentAcquired.includes(w.word.toLowerCase()))
      .sort((a, b) =>
        (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99) ||
        a.word.length - b.word.length ||
        a.word.localeCompare(b.word)
      );

    if (unacquired.length === 0) { setPhase("all-done"); return; }

    // チケット消費
    const newTk = tickets - 1;
    setTickets(newTk);
    localStorage.setItem("tickets", String(newTk));

    const target = unacquired[0];
    const word   = target.word.toLowerCase();
    setTargetWord(word);
    setTargetMeaning(target.meaning);
    setBuilt([word[0]]); // 1文字目は自動付与
    setCurrentPos(1);
    setCandidates(genCandidates(unacquired.map(u => u.word.toLowerCase()), 1, word[1]));
    setPhase("playing");
  }, [tickets, allWords, genCandidates]);

  // ── 文字タップ ────────────────────────────────────────────
  const handleTap = useCallback((letter: string) => {
    if (phase !== "playing") return;
    const expected = targetWord[currentPos];

    if (letter === expected) {
      // ✅ 正解
      setCorrectPos(currentPos);
      setTimeout(() => setCorrectPos(null), 500);

      const newBuilt = [...built, letter];
      setBuilt(newBuilt);

      if (newBuilt.length === targetWord.length) {
        // 🎊 単語完成！
        const newAcq = [...acquired, targetWord];
        setAcquired(newAcq);
        localStorage.setItem("acquiredWords", JSON.stringify(newAcq));
        setCelebWord(targetWord);
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          setPhase("complete");
        }, 3200);
      } else {
        // 次の文字へ
        const nextPos = currentPos + 1;
        setCurrentPos(nextPos);
        const pool = allWords
          .filter(w => !acquired.includes(w.word.toLowerCase()))
          .map(w => w.word.toLowerCase());
        setCandidates(genCandidates(pool, nextPos, targetWord[nextPos]));
      }
    } else {
      // ❌ 不正解
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 500);
    }
  }, [phase, targetWord, currentPos, built, acquired, allWords, genCandidates]);

  // ── テーマ・フラグ ────────────────────────────────────────
  const t       = THEMES.find(th => th.id === themeId) ?? THEMES[0];
  const isBaby  = level === "baby";
  const isKid   = level === "baby" || level === "elementary";
  const wordLevel = allWords.find(w => w.word === targetWord)?.level ?? level;
  const showBabyUI = wordLevel === "baby" || isBaby;

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className={`min-h-screen ${t.bg} flex flex-col max-w-md mx-auto p-4 gap-4`}>

      {/* ======================================================
          コンフェッティ＋お祝いオーバーレイ
          ====================================================== */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {CONFETTI.map((p, i) => (
            <div key={i} style={{
              position: "absolute", left: `${p.left}%`, top: "-24px",
              width: `${p.size}px`, height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: p.round ? "50%" : "3px",
              animation: `confetti-fall ${p.dur}s ${p.delay}s ease-in forwards`,
            }} />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="bg-white rounded-3xl px-8 py-7 text-center shadow-2xl border-4 border-yellow-400"
              style={{ animation: "celebrate-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
            >
              <div className="text-6xl mb-3 inline-block"
                style={{ animation: "star-spin 1s ease-in-out infinite" }}>⭐</div>
              <p className="text-3xl font-black text-yellow-500 tracking-wide drop-shadow">GET!</p>
              <p className="text-2xl font-black text-gray-800 mt-1 tracking-widest">{celebWord.toUpperCase()}</p>
              <p className={`text-base font-bold mt-2 ${isKid ? "text-pink-500" : "text-indigo-500"}`}>
                {showBabyUI ? "たんごを ゲット！🎊" : "単語を取得しました🎊"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/")} className={`text-2xl ${t.subText}`}>←</button>
        <div className="flex-1">
          <p className={`font-black text-base ${t.titleText}`}>
            🔡 {showBabyUI ? "たんごを つくろう！" : "単語つくりゲーム"}
          </p>
        </div>
        <div className={`rounded-xl px-3 py-1.5 flex items-center gap-1 ${t.innerCard}`}>
          <span className="text-lg">🎫</span>
          <span className={`font-black text-xl ${t.accent}`}>{tickets}</span>
          <span className={`text-xs ${t.subText}`}>{isKid ? "まい" : "枚"}</span>
        </div>
      </div>

      {/* ===== イントロ ===== */}
      {phase === "intro" && (
        <div className="flex flex-col gap-4 mt-2">
          <div className={`rounded-2xl p-5 border ${t.card} ${t.border} text-center space-y-3`}>
            <div className="text-6xl">🔡</div>
            <p className={`text-xl font-black ${t.titleText}`}>
              {showBabyUI ? "たんごを つくろう！" : "単語つくりゲーム"}
            </p>
            <p className={`text-sm leading-relaxed ${t.bodyText}`}>
              {showBabyUI
                ? "さいしょの もじは プレゼント🎁\nのこりの もじを えらんで\nたんごを かんせいさせよう！"
                : "最初の1文字はプレゼント🎁\n残りの文字を選んで\n単語を完成させよう！"}
            </p>
            <div className={`rounded-xl p-3 ${t.innerCard} flex items-center justify-center gap-2`}>
              <span className="text-2xl">🎫</span>
              <span className={`font-bold ${t.bodyText}`}>
                {showBabyUI ? `チケット ${tickets}まい` : `チケット残り ${tickets}枚`}
              </span>
            </div>
          </div>

          {/* ルール説明 */}
          <div className={`rounded-2xl p-4 border ${t.card} ${t.border} space-y-2`}>
            <p className={`text-xs font-bold ${t.subText}`}>{showBabyUI ? "あそびかた" : "ルール"}</p>
            {[
              { icon: "1️⃣", text: showBabyUI ? "にほんごのいみを みてね"   : "日本語の意味を確認" },
              { icon: "2️⃣", text: showBabyUI ? "さいしょの もじがもらえる" : "最初の1文字が与えられる" },
              { icon: "3️⃣", text: showBabyUI ? "つぎの もじを えらぼう"    : "次の文字をタップして選ぶ" },
              { icon: "4️⃣", text: showBabyUI ? "たんごが かんせい！ゲット！": "単語完成でゲット！🎊" },
            ].map(r => (
              <div key={r.icon} className="flex items-center gap-2">
                <span className="text-lg">{r.icon}</span>
                <span className={`text-sm ${t.bodyText}`}>{r.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => startGame(acquired)}
            disabled={tickets <= 0}
            className={`w-full py-5 rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95
              ${tickets > 0
                ? `${t.startBtn} ${t.startText}`
                : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            {tickets > 0
              ? (showBabyUI ? "🎮 はじめる！（🎫1まい）" : "🎮 スタート！（🎫1枚）")
              : (showBabyUI ? "😢 チケットが ないよ"     : "😢 チケットが足りません")}
          </button>
        </div>
      )}

      {/* ===== チケットなし ===== */}
      {phase === "no-ticket" && (
        <div className={`rounded-2xl p-6 border ${t.card} ${t.border} text-center space-y-4 mt-4`}>
          <div className="text-6xl">😢</div>
          <p className={`text-lg font-black ${t.titleText}`}>
            {showBabyUI ? "チケットが ないよ！" : "チケットが足りません"}
          </p>
          <p className={`text-sm ${t.bodyText}`}>
            {showBabyUI
              ? "ミッションをクリアして\nチケットをもらおう！"
              : "ミッションをクリアして\nチケットを入手しましょう。"}
          </p>
          <button
            onClick={() => router.push("/")}
            className={`w-full py-3 rounded-2xl font-bold ${t.startBtn} ${t.startText}`}
          >
            🏠 {showBabyUI ? "ホームへ" : "ホームへ戻る"}
          </button>
        </div>
      )}

      {/* ===== 全単語クリア ===== */}
      {phase === "all-done" && (
        <div className={`rounded-2xl p-6 border ${t.card} ${t.border} text-center space-y-4 mt-4`}>
          <div className="text-6xl">🏆</div>
          <p className={`text-lg font-black ${t.titleText}`}>
            {showBabyUI ? "ぜんぶ おぼえたよ！" : "全単語取得済みです！"}
          </p>
          <p className={`text-sm ${t.bodyText}`}>
            {showBabyUI ? "すごい！ぜんぶ クリア！🎉" : "素晴らしい！すべての単語を取得しました🎉"}
          </p>
          <button
            onClick={() => router.push("/")}
            className={`w-full py-3 rounded-2xl font-bold ${t.startBtn} ${t.startText}`}
          >
            🏠 {showBabyUI ? "ホームへ" : "ホームへ戻る"}
          </button>
        </div>
      )}

      {/* ===== プレイ中 ===== */}
      {phase === "playing" && (
        <>
          {/* 日本語の意味 */}
          <div className={`rounded-2xl p-4 border ${t.card} ${t.border}`}>
            <p className={`text-xs font-bold mb-1 ${t.subText}`}>
              {showBabyUI ? "にほんごのいみ" : "日本語の意味"}
            </p>
            <p className={`font-black leading-snug ${showBabyUI ? "text-3xl" : "text-2xl"} ${t.titleText}`}>
              {targetMeaning}
            </p>
          </div>

          {/* 組み立てフレーム */}
          <div className={`rounded-2xl p-4 border ${t.card} ${t.border}`}>
            <p className={`text-xs font-bold mb-3 ${t.subText}`}>
              {showBabyUI ? "つくっているところ" : "組み立て中"}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {targetWord.split("").map((_, i) => {
                const filled = i < built.length;
                const isFirst = i === 0;
                const isJustCorrect = correctPos === i;
                return (
                  <div
                    key={i}
                    className={`
                      w-14 h-14 rounded-xl flex items-center justify-center
                      font-black text-2xl transition-all duration-300
                      ${filled
                        ? isJustCorrect
                          ? "bg-green-400 text-white scale-125"
                          : isFirst
                            ? "bg-amber-300 text-amber-900"   // 1文字目は別色（ヒント）
                            : `${t.startBtn} ${t.startText}`
                        : `border-2 border-dashed ${t.border} ${t.subText}`}
                    `}
                  >
                    {filled ? built[i].toUpperCase() : ""}
                  </div>
                );
              })}
            </div>
            <p className={`text-xs text-center mt-3 ${t.subText}`}>
              {showBabyUI
                ? `${currentPos + 1}もじめを えらんでね！`
                : `${currentPos + 1}文字目を選んでください`}
            </p>
          </div>

          {/* 文字選択ボタン */}
          <div className={`rounded-2xl p-4 border ${t.card} ${t.border}`}>
            <p className={`text-xs font-bold mb-3 ${t.subText}`}>
              {showBabyUI ? "もじを えらぼう" : "文字を選ぼう"}
            </p>
            <div
              className="grid grid-cols-4 gap-2"
              style={wrongFlash ? { animation: "shake 0.45s ease" } : {}}
            >
              {candidates.map((letter, i) => (
                <button
                  key={i}
                  onClick={() => handleTap(letter)}
                  className={`py-4 rounded-xl font-black text-2xl transition-all active:scale-90
                    ${wrongFlash
                      ? "bg-red-100 text-red-500 border-2 border-red-300"
                      : `${t.innerCard} border ${t.border} ${t.bodyText} hover:scale-105`}
                  `}
                >
                  {letter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== 完了 ===== */}
      {phase === "complete" && (
        <div className="flex flex-col gap-3 mt-2">
          <div className={`rounded-2xl p-6 border ${t.card} ${t.border} text-center space-y-3`}>
            <div className="text-6xl">🎊</div>
            <p className={`text-2xl font-black ${t.titleText}`}>
              {showBabyUI ? "できた！" : "単語ゲット！"}
            </p>
            <div className={`rounded-xl py-3 px-4 ${t.innerCard} flex items-center justify-center gap-3`}>
              <span className={`text-3xl font-black ${t.accent} tracking-widest`}>
                {targetWord.toUpperCase()}
              </span>
              <span className={`text-xl font-bold ${t.bodyText}`}>{targetMeaning}</span>
            </div>
            <p className={`text-xs ${t.subText}`}>
              {showBabyUI ? "あたらしい たんごを おぼえたよ！" : "新しい単語を取得しました！"}
            </p>
          </div>

          <button
            onClick={() => startGame(acquired)}
            disabled={tickets <= 0}
            className={`w-full py-5 rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95
              ${tickets > 0
                ? `${t.startBtn} ${t.startText}`
                : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            {tickets > 0
              ? (showBabyUI ? `🔄 もういちど！（🎫${tickets}まい）` : `🔄 次の単語（🎫${tickets}枚）`)
              : (showBabyUI ? "😢 チケットが ないよ"                : "😢 チケットが足りません")}
          </button>

          <button
            onClick={() => router.push("/")}
            className={`w-full py-3 rounded-2xl font-bold border ${t.innerCard} ${t.border} ${t.bodyText} transition-all active:scale-95`}
          >
            🏠 {showBabyUI ? "ホームへ" : "ホームへ戻る"}
          </button>
        </div>
      )}
    </div>
  );
}
