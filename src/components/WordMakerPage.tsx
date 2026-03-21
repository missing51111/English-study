"use client";

import { useState, useLayoutEffect, useEffect, useCallback, useMemo } from "react";
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

type GamePhase =
  | "browsing"   // 頭文字を選ぶ
  | "building"   // 文字を積み上げ中
  | "complete"   // 単語完成！
  | "no-ticket"  // チケット不足
  | "all-done";  // 全単語取得済み

// ============================================================
// 絵文字マップ
// ============================================================
const EMOJI_MAP: Record<string, string> = {
  cat:"🐱", dog:"🐶", cow:"🐄", pig:"🐷", fox:"🦊", ant:"🐜", bee:"🐝",
  hen:"🐔", frog:"🐸", duck:"🦆", fish:"🐟", bird:"🐦", sheep:"🐑",
  tiger:"🐯", snake:"🐍", rabbit:"🐰", horse:"🐴", lion:"🦁", bear:"🐻",
  sun:"☀️", moon:"🌙", star:"⭐", rain:"🌧️", snow:"❄️", wind:"🌬️",
  fire:"🔥", tree:"🌳", flower:"🌸", cloud:"☁️", ocean:"🌊",
  river:"🏞️", field:"🌾", stone:"🪨",
  milk:"🥛", cake:"🎂", rice:"🍚", apple:"🍎", bread:"🍞", peach:"🍑",
  fruit:"🍎", sugar:"🍬", juice:"🥤", salad:"🥗", water:"💧",
  book:"📚", ball:"⚽", bus:"🚌", car:"🚗", door:"🚪", bag:"👜",
  hat:"🎩", cup:"☕", box:"📦", map:"🗺️", pen:"🖊️", bed:"🛏️",
  key:"🔑", clock:"🕐", piano:"🎹", train:"🚂",
  hand:"🖐️", foot:"🦶", nose:"👃", eyes:"👀", hair:"💇",
  heart:"❤️", smile:"😊",
  red:"🔴", green:"💚", white:"🤍", music:"🎵", dance:"💃",
  house:"🏠", chair:"🪑", table:"🍽️", light:"💡", sport:"⚽",
  world:"🌏", night:"🌃", class:"🏫", floor:"🏢",
  plant:"🌱", paper:"📄", drink:"🥤",
};

// ============================================================
// フォールバック単語リスト
// ============================================================
const FALLBACK_WORDS: WordEntry[] = [
  { word: "go",     meaning: "いく",         level: "baby" },
  { word: "up",     meaning: "うえ",         level: "baby" },
  { word: "ok",     meaning: "おっけー",     level: "baby" },
  { word: "cat",    meaning: "ねこ",         level: "baby" },
  { word: "dog",    meaning: "いぬ",         level: "baby" },
  { word: "run",    meaning: "はしる",       level: "baby" },
  { word: "red",    meaning: "あかい",       level: "baby" },
  { word: "sun",    meaning: "たいよう",     level: "baby" },
  { word: "cup",    meaning: "コップ",       level: "baby" },
  { word: "hat",    meaning: "ぼうし",       level: "baby" },
  { word: "bag",    meaning: "かばん",       level: "baby" },
  { word: "bus",    meaning: "バス",         level: "baby" },
  { word: "bed",    meaning: "ベッド",       level: "baby" },
  { word: "box",    meaning: "はこ",         level: "baby" },
  { word: "map",    meaning: "ちず",         level: "baby" },
  { word: "pen",    meaning: "ペン",         level: "baby" },
  { word: "ant",    meaning: "あり",         level: "baby" },
  { word: "bee",    meaning: "はち",         level: "baby" },
  { word: "cow",    meaning: "うし",         level: "baby" },
  { word: "pig",    meaning: "ぶた",         level: "baby" },
  { word: "fox",    meaning: "きつね",       level: "baby" },
  { word: "frog",   meaning: "かえる",       level: "baby" },
  { word: "duck",   meaning: "あひる",       level: "baby" },
  { word: "fish",   meaning: "さかな",       level: "baby" },
  { word: "bird",   meaning: "とり",         level: "baby" },
  { word: "tree",   meaning: "き",           level: "baby" },
  { word: "door",   meaning: "ドア",         level: "baby" },
  { word: "book",   meaning: "ほん",         level: "baby" },
  { word: "ball",   meaning: "ボール",       level: "baby" },
  { word: "milk",   meaning: "ぎゅうにゅう", level: "baby" },
  { word: "cake",   meaning: "ケーキ",       level: "baby" },
  { word: "rice",   meaning: "ごはん",       level: "baby" },
  { word: "star",   meaning: "ほし",         level: "baby" },
  { word: "moon",   meaning: "つき",         level: "baby" },
  { word: "rain",   meaning: "あめ",         level: "baby" },
  { word: "snow",   meaning: "ゆき",         level: "baby" },
  { word: "wind",   meaning: "かぜ",         level: "baby" },
  { word: "fire",   meaning: "ひ",           level: "baby" },
  { word: "hand",   meaning: "て",           level: "baby" },
  { word: "foot",   meaning: "あし",         level: "baby" },
  { word: "nose",   meaning: "はな",         level: "baby" },
  { word: "eyes",   meaning: "め",           level: "baby" },
  { word: "hair",   meaning: "かみ",         level: "baby" },
  { word: "hen",    meaning: "にわとり",     level: "baby" },
  { word: "apple",  meaning: "りんご",       level: "elementary" },
  { word: "bread",  meaning: "パン",         level: "elementary" },
  { word: "chair",  meaning: "いす",         level: "elementary" },
  { word: "class",  meaning: "クラス",       level: "elementary" },
  { word: "clock",  meaning: "とけい",       level: "elementary" },
  { word: "cloud",  meaning: "くも",         level: "elementary" },
  { word: "dance",  meaning: "おどる",       level: "elementary" },
  { word: "drink",  meaning: "のむ",         level: "elementary" },
  { word: "earth",  meaning: "ちきゅう",     level: "elementary" },
  { word: "field",  meaning: "のはら",       level: "elementary" },
  { word: "floor",  meaning: "ゆか",         level: "elementary" },
  { word: "fruit",  meaning: "くだもの",     level: "elementary" },
  { word: "green",  meaning: "みどり",       level: "elementary" },
  { word: "heart",  meaning: "こころ",       level: "elementary" },
  { word: "house",  meaning: "いえ",         level: "elementary" },
  { word: "juice",  meaning: "ジュース",     level: "elementary" },
  { word: "light",  meaning: "ひかり",       level: "elementary" },
  { word: "music",  meaning: "おんがく",     level: "elementary" },
  { word: "night",  meaning: "よる",         level: "elementary" },
  { word: "ocean",  meaning: "うみ",         level: "elementary" },
  { word: "paper",  meaning: "かみ",         level: "elementary" },
  { word: "peach",  meaning: "もも",         level: "elementary" },
  { word: "piano",  meaning: "ピアノ",       level: "elementary" },
  { word: "plant",  meaning: "しょくぶつ",   level: "elementary" },
  { word: "river",  meaning: "かわ",         level: "elementary" },
  { word: "salad",  meaning: "サラダ",       level: "elementary" },
  { word: "sheep",  meaning: "ひつじ",       level: "elementary" },
  { word: "smile",  meaning: "ほほえむ",     level: "elementary" },
  { word: "snake",  meaning: "へび",         level: "elementary" },
  { word: "sport",  meaning: "スポーツ",     level: "elementary" },
  { word: "stone",  meaning: "いし",         level: "elementary" },
  { word: "sugar",  meaning: "さとう",       level: "elementary" },
  { word: "table",  meaning: "テーブル",     level: "elementary" },
  { word: "tiger",  meaning: "とら",         level: "elementary" },
  { word: "train",  meaning: "でんしゃ",     level: "elementary" },
  { word: "water",  meaning: "みず",         level: "elementary" },
  { word: "white",  meaning: "しろ",         level: "elementary" },
  { word: "world",  meaning: "せかい",       level: "elementary" },
];

// ============================================================
// ユーティリティ
// ============================================================
const LEVEL_ORDER = ["baby", "elementary", "junior", "high", "toeic"] as const;
type AppLevel = typeof LEVEL_ORDER[number];

const LEVEL_LABEL: Record<string, string> = {
  baby: "ベビー", elementary: "小学生", junior: "中学生", high: "高校生", toeic: "TOEIC",
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 現在のprefixに続く候補文字（実単語のみ）
function getCandidates(prefix: string, wordList: WordEntry[]): string[] {
  return [...new Set(
    wordList
      .filter(w => w.word.startsWith(prefix) && w.word.length > prefix.length)
      .map(w => w.word[prefix.length])
  )];
}

// 次の文字が単語を完成させるか（= ラスト位置）
function isLastPos(prefix: string, candidates: string[], wordList: WordEntry[]): boolean {
  return candidates.some(c => wordList.some(w => w.word === prefix + c));
}

// ダミー文字を生成（実候補・禁止済みに含まれない1文字）
function makeDummy(realCandidates: string[]): string | null {
  const realSet = new Set(realCandidates);
  const pool = shuffle("abcdefghijklmnopqrstuvwxyz".split("").filter(l => !realSet.has(l)));
  return pool[0] ?? null;
}

// コンフェッティ（固定シード）
const CONFETTI = Array.from({ length: 60 }, (_, i) => ({
  color: ["#fb7185","#fbbf24","#34d399","#60a5fa","#a78bfa","#f97316","#ec4899","#facc15"][i % 8],
  left:  (i * 19 + 7)  % 97,
  delay: (i * 0.065)   % 1.5,
  dur:   1.5 + (i * 0.09) % 1.2,
  size:  7   + (i * 7)    % 16,
  round: i % 3 === 0,
}));

// ============================================================
// WordMakerPage
// ============================================================
export default function WordMakerPage() {
  const router = useRouter();
  const [themeId, setThemeId] = useState("pink");
  const [level,   setLevel]   = useState("baby");
  const [tickets, setTickets] = useState(0);
  const [allWords, setAllWords] = useState<WordEntry[]>([]);
  const [acquired, setAcquired] = useState<string[]>([]);
  const [phase,   setPhase]   = useState<GamePhase>("browsing");
  const [built,   setBuilt]   = useState<string[]>([]);

  // 表示用候補（ダミー込みで固定順序）
  const [displayCandidates, setDisplayCandidates] = useState<string[]>([]);
  // ダミー文字
  const [dummyLetter,  setDummyLetter]  = useState<string | null>(null);
  // タップしてブルブル中のダミー文字
  const [shakingDummy, setShakingDummy] = useState(false);
  // タップ後に無効化されたダミー
  const [dummyUsed,    setDummyUsed]    = useState(false);

  // 完成単語
  const [completedEntry,   setCompletedEntry]   = useState<WordEntry | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // ── 初期化 ──────────────────────────────────────────────────
  useLayoutEffect(() => {
    const th  = localStorage.getItem("theme");
    if (th && THEMES.find(t => t.id === th)) setThemeId(th);
    const lv  = localStorage.getItem("level");
    if (lv) setLevel(lv);
    const tk  = localStorage.getItem("tickets");
    setTickets(tk ? parseInt(tk) : 0);
    const acq = localStorage.getItem("acquiredWords");
    if (acq) { try { setAcquired(JSON.parse(acq)); } catch { /* ignore */ } }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("words").select("word, meaning, level").order("word");
        setAllWords(data && data.length > 0 ? (data as WordEntry[]) : FALLBACK_WORDS);
      } catch { setAllWords(FALLBACK_WORDS); }
    })();
  }, []);

  // ── アクティブレベル（一番下の未取得レベル） ──────────────────
  const activeLevel = useMemo((): AppLevel | null => {
    for (const lvl of LEVEL_ORDER) {
      const inLevel = allWords.filter(w => w.level === lvl);
      if (inLevel.length === 0) continue;
      const unacqInLevel = inLevel.filter(w => !acquired.includes(w.word.toLowerCase()));
      if (unacqInLevel.length > 0) return lvl;
    }
    return null;
  }, [allWords, acquired]);

  // ── 現在レベルの未取得単語 ────────────────────────────────────
  const unacquired = useMemo(() => {
    if (!activeLevel) return [];
    return allWords
      .filter(w => w.level === activeLevel)
      .map(w => ({ ...w, word: w.word.toLowerCase() }))
      .filter(w => w.word.length >= 2 && !acquired.includes(w.word));
  }, [allWords, activeLevel, acquired]);

  // ── 表示候補の再計算（built / phase が変わったとき） ──────────
  useEffect(() => {
    setDummyUsed(false);
    setShakingDummy(false);

    const prefix = built.join("");

    if (phase === "browsing") {
      const letters = [...new Set(unacquired.map(w => w.word[0]))].sort();
      setDisplayCandidates(letters);
      setDummyLetter(null);
      return;
    }

    if (phase === "building") {
      const real  = getCandidates(prefix, unacquired);
      const isLast = isLastPos(prefix, real, unacquired);
      const isFirst = false; // phase=building means at least 1 letter is built

      let dummy: string | null = null;
      if (!isFirst && !isLast) {
        dummy = makeDummy(real);
      }
      setDummyLetter(dummy);

      const allCands = dummy ? shuffle([...real, dummy]) : real.sort();
      setDisplayCandidates(allCands);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [built, phase, unacquired.length]);

  // ── タップ処理 ────────────────────────────────────────────────
  const handleTap = useCallback((letter: string) => {
    // ダミーをタップ
    if (letter === dummyLetter) {
      if (dummyUsed) return; // 無効化済み
      setShakingDummy(true);
      setTimeout(() => {
        setShakingDummy(false);
        setDummyUsed(true);
      }, 600);
      return;
    }

    // 最初の文字 → チケット消費
    if (built.length === 0) {
      if (tickets <= 0) { setPhase("no-ticket"); return; }
      const newTk = tickets - 1;
      setTickets(newTk);
      localStorage.setItem("tickets", String(newTk));
      setPhase("building");
    }

    const newBuilt  = [...built, letter];
    const newPrefix = newBuilt.join("");

    // 完成チェック
    const exact = unacquired.find(w => w.word === newPrefix);
    if (exact) {
      setBuilt(newBuilt);
      const newAcq = [...acquired, newPrefix];
      setAcquired(newAcq);
      localStorage.setItem("acquiredWords", JSON.stringify(newAcq));
      setCompletedEntry(exact);
      setShowCelebration(true);
      setTimeout(() => { setShowCelebration(false); setPhase("complete"); }, 3600);
      return;
    }

    // 次の位置へ（buildsを変更 → useEffect が候補を再計算）
    setBuilt(newBuilt);
  }, [dummyLetter, dummyUsed, built, tickets, unacquired, acquired]);

  // ── 1文字戻る ────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (built.length === 0) return;
    if (built.length === 1) {
      setBuilt([]);
      setPhase("browsing");
      return;
    }
    setBuilt(prev => prev.slice(0, -1));
  }, [built]);

  // ── 次の単語へ ───────────────────────────────────────────────
  const nextWord = useCallback(() => {
    setBuilt([]);
    setCompletedEntry(null);
    if (unacquired.length === 0 && !activeLevel) {
      setPhase("all-done");
    } else {
      setPhase("browsing");
    }
  }, [unacquired.length, activeLevel]);

  // ── ヘルパー ──────────────────────────────────────────────────
  const t      = THEMES.find(th => th.id === themeId) ?? THEMES[0];
  const isBaby = level === "baby";
  const isKid  = level === "baby" || level === "elementary";
  const emoji  = completedEntry ? (EMOJI_MAP[completedEntry.word] ?? "✨") : "✨";

  const prefix     = built.join("");
  const matchCount = unacquired.filter(w => w.word.startsWith(prefix)).length;

  const activeLevelLabel = activeLevel ? LEVEL_LABEL[activeLevel] : "";

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className={`min-h-screen ${t.bg} flex flex-col max-w-md mx-auto`}>

      {/* ── コンフェッティ＋お祝いオーバーレイ ──────────────── */}
      {showCelebration && completedEntry && (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
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
              className="bg-white rounded-3xl px-8 py-8 text-center shadow-2xl border-4 border-yellow-400 space-y-2"
              style={{ animation: "celebrate-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
            >
              <div className="text-7xl" style={{ animation: "star-spin 1s ease-in-out infinite" }}>
                {emoji}
              </div>
              <p className="text-3xl font-black text-yellow-500 tracking-wide drop-shadow-md">GET!</p>
              <p className="text-4xl font-black text-gray-900 tracking-widest">
                {completedEntry.word.toUpperCase()}
              </p>
              <p className={`text-xl font-bold ${isKid ? "text-pink-500" : "text-indigo-500"}`}>
                {completedEntry.meaning}
              </p>
              <p className="text-sm text-gray-400">
                {isBaby ? "たんごを ゲット！🎊" : "単語を取得しました🎊"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ヘッダー ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => router.push("/")} className={`text-2xl ${t.subText}`}>←</button>
        <div className="flex-1 min-w-0">
          <p className={`font-black text-base truncate ${t.titleText}`}>
            🔡 {isBaby ? "たんごを さがそう！" : "単語つくりゲーム"}
          </p>
          {/* 現在のレベル表示 */}
          {activeLevel && (
            <p className={`text-xs ${t.subText}`}>
              {isBaby ? `🎯 ${activeLevelLabel}のたんご` : `🎯 ${activeLevelLabel}レベル`}
            </p>
          )}
        </div>
        <div className={`rounded-xl px-3 py-1.5 flex items-center gap-1 ${t.innerCard} flex-shrink-0`}>
          <span className="text-lg">🎫</span>
          <span className={`font-black text-xl ${t.accent}`}>{tickets}</span>
          <span className={`text-xs ${t.subText}`}>{isKid ? "まい" : "枚"}</span>
        </div>
      </div>

      {/* ── 積み上げ文字バー ──────────────────────────────────── */}
      {(phase === "browsing" || phase === "building") && (
        <div className="px-4 pb-2">
          <div className={`rounded-2xl p-3 border ${t.card} ${t.border}`}>
            <div className="flex items-center gap-2 flex-wrap">
              {built.map((ch, i) => (
                <div
                  key={i}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center
                    font-black text-xl shadow ${t.startBtn} ${t.startText}`}
                >
                  {ch.toUpperCase()}
                </div>
              ))}
              {phase === "building" && (
                <div className={`w-11 h-11 rounded-xl border-2 border-dashed ${t.border}
                  flex items-center justify-center`}>
                  <span className={`text-xl ${t.subText}`}>?</span>
                </div>
              )}
              {built.length > 0 && (
                <button
                  onClick={handleBack}
                  className={`ml-auto px-3 py-1.5 rounded-xl text-sm font-bold border
                    ${t.innerCard} ${t.border} ${t.bodyText} active:scale-95 transition-all`}
                >
                  {isBaby ? "← もどる" : "← 戻る"}
                </button>
              )}
            </div>
            <p className={`text-xs mt-2 ${t.subText}`}>
              {phase === "browsing"
                ? (isBaby
                    ? `みつかる たんご: ${unacquired.length}こ`
                    : `${activeLevelLabel}の未取得単語: ${unacquired.length}語`)
                : (isBaby
                    ? `あてはまる たんご: ${matchCount}こ`
                    : `該当する単語: ${matchCount}語`)}
            </p>
          </div>
        </div>
      )}

      {/* ── チケット不足 ─────────────────────────────────────── */}
      {phase === "no-ticket" && (
        <div className={`mx-4 rounded-2xl p-6 border ${t.card} ${t.border} text-center space-y-4`}>
          <div className="text-6xl">😢</div>
          <p className={`text-lg font-black ${t.titleText}`}>
            {isBaby ? "チケットが ないよ！" : "チケットが足りません"}
          </p>
          <p className={`text-sm ${t.bodyText}`}>
            {isBaby ? "ミッションをクリアして\nチケットをもらおう！" : "ミッションをクリアしてチケットを入手しましょう。"}
          </p>
          <button onClick={() => router.push("/")} className={`w-full py-3 rounded-2xl font-bold ${t.startBtn} ${t.startText}`}>
            🏠 {isBaby ? "ホームへ" : "ホームへ戻る"}
          </button>
        </div>
      )}

      {/* ── 全単語クリア ─────────────────────────────────────── */}
      {phase === "all-done" && (
        <div className={`mx-4 rounded-2xl p-6 border ${t.card} ${t.border} text-center space-y-4`}>
          <div className="text-6xl">🏆</div>
          <p className={`text-lg font-black ${t.titleText}`}>
            {isBaby ? "ぜんぶ おぼえたよ！" : "全単語取得済み！"}
          </p>
          <button onClick={() => router.push("/")} className={`w-full py-3 rounded-2xl font-bold ${t.startBtn} ${t.startText}`}>
            🏠 {isBaby ? "ホームへ" : "ホームへ戻る"}
          </button>
        </div>
      )}

      {/* ── 完成後カード ─────────────────────────────────────── */}
      {phase === "complete" && completedEntry && (
        <div className="px-4 flex flex-col gap-3 mt-2">
          <div className={`rounded-2xl p-6 border ${t.card} ${t.border} text-center space-y-3`}>
            <div className="text-7xl">{emoji}</div>
            <p className={`text-4xl font-black ${t.accent} tracking-widest`}>
              {completedEntry.word.toUpperCase()}
            </p>
            <p className={`text-2xl font-bold ${t.titleText}`}>{completedEntry.meaning}</p>
          </div>
          <button
            onClick={nextWord}
            disabled={tickets <= 0 && unacquired.length > 1}
            className={`w-full py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all
              ${tickets > 0 || unacquired.length <= 1
                ? `${t.startBtn} ${t.startText}`
                : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            {tickets > 0
              ? (isBaby ? `🔍 つぎを さがす！（🎫${tickets}まい）` : `🔍 次の単語を探す（🎫${tickets}枚）`)
              : (isBaby ? "😢 チケットが ないよ" : "😢 チケットが足りません")}
          </button>
          <button
            onClick={() => router.push("/")}
            className={`w-full py-3 rounded-2xl font-bold border ${t.innerCard} ${t.border} ${t.bodyText} active:scale-95 transition-all`}
          >
            🏠 {isBaby ? "ホームへ" : "ホームへ戻る"}
          </button>
        </div>
      )}

      {/* ── 文字選択グリッド ──────────────────────────────────── */}
      {(phase === "browsing" || phase === "building") && (
        <div className="px-4 pb-6 flex-1">
          <p className={`text-sm font-bold mb-3 ${t.subText}`}>
            {phase === "browsing"
              ? (tickets > 0
                  ? (isBaby ? "🎫 もじを タップしてね！" : "🎫 頭文字をタップしてください")
                  : (isBaby ? "😢 チケットが ないよ…"   : "😢 チケットが足りません"))
              : (isBaby ? "つぎの もじを えらぼう！" : "次の文字を選んでください")}
          </p>

          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))" }}
          >
            {displayCandidates.map((letter) => {
              const isDummy    = letter === dummyLetter;
              const isDisabled = (phase === "browsing" && tickets <= 0) || (isDummy && dummyUsed);
              const isShaking  = isDummy && shakingDummy;

              return (
                <button
                  key={letter}
                  onClick={() => !isDisabled && handleTap(letter)}
                  disabled={isDisabled}
                  className={`
                    aspect-square rounded-2xl font-black text-3xl
                    flex items-center justify-center
                    transition-all select-none
                    ${isDisabled
                      ? "opacity-25 cursor-not-allowed bg-gray-200 text-gray-400"
                      : `${t.card} border-2 ${t.border} ${t.titleText} shadow-md
                         hover:scale-105 active:scale-90 active:shadow-sm`}
                  `}
                  style={{
                    boxShadow: isDisabled ? undefined : "0 3px 0 rgba(0,0,0,0.12)",
                    animation: isShaking ? "dummy-wrong 0.6s ease" : undefined,
                  }}
                >
                  {letter.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* チケット0バナー */}
          {phase === "browsing" && tickets <= 0 && (
            <div className={`mt-4 rounded-2xl p-4 border-2 border-dashed ${t.border} text-center space-y-2`}>
              <p className={`font-bold text-sm ${t.bodyText}`}>
                {isBaby ? "ミッションをクリアしてチケットをもらおう！" : "ミッションをクリアしてチケットを入手しよう！"}
              </p>
              <button onClick={() => router.push("/")}
                className={`px-6 py-2 rounded-xl font-bold text-sm ${t.startBtn} ${t.startText}`}>
                🏠 {isBaby ? "ホームへ" : "ホームへ戻る"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
